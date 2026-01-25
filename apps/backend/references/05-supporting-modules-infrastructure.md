# ExecuTask Backend - Supporting Modules & Infrastructure

## Table of Contents
1. [Database Module](#database-module)
2. [Configuration Module](#configuration-module)
3. [Logger Module](#logger-module)
4. [Error Handling](#error-handling)
5. [Router Module](#router-module)
6. [AWS Module](#aws-module)
7. [Email Module](#email-module)
8. [Validation Module](#validation-module)
9. [SQL Error Handling](#sql-error-handling)
10. [Middleware Details](#middleware-details)

---

## Database Module

### Location: `internal/database/`

### 1. Database Connection (`database.go`)

**Purpose**: Manages PostgreSQL connection pooling with pgx driver and observability.

#### Key Components

```go
type Database struct {
    Pool *pgxpool.Pool      // Connection pool
    log  *zerolog.Logger    // Logger instance
}
```

#### Connection Setup Process

```go
func New(cfg *config.Config, logger *zerolog.Logger, loggerService *loggerConfig.LoggerService) (*Database, error) {
    // STEP 1: Build connection string (DSN)
    hostPort := net.JoinHostPort(cfg.Database.Host, strconv.Itoa(cfg.Database.Port))
    encodedPassword := url.QueryEscape(cfg.Database.Password)  // URL-encode password
    
    dsn := fmt.Sprintf("postgres://%s:%s@%s/%s?sslmode=%s",
        cfg.Database.User,
        encodedPassword,
        hostPort,
        cfg.Database.Name,
        cfg.Database.SSLMode,
    )
    
    // STEP 2: Parse connection pool config
    pgxPoolConfig, err := pgxpool.ParseConfig(dsn)
    
    // STEP 3: Add New Relic instrumentation (production)
    if loggerService != nil && loggerService.GetApplication() != nil {
        pgxPoolConfig.ConnConfig.Tracer = nrpgx5.NewTracer()
    }
    
    // STEP 4: Add local logging (development)
    if cfg.Primary.Env == "local" {
        // Chain multiple tracers using multiTracer
        localTracer := &tracelog.TraceLog{
            Logger:   pgxzero.NewLogger(pgxLogger),
            LogLevel: tracelog.LogLevel(loggerConfig.GetPgxTraceLogLevel(globalLevel)),
        }
        
        // Combine New Relic + local logging
        pgxPoolConfig.ConnConfig.Tracer = &multiTracer{
            tracers: []any{pgxPoolConfig.ConnConfig.Tracer, localTracer},
        }
    }
    
    // STEP 5: Create connection pool
    pool, err := pgxpool.NewWithConfig(context.Background(), pgxPoolConfig)
    
    // STEP 6: Test connection
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    if err = pool.Ping(ctx); err != nil {
        return nil, fmt.Errorf("failed to ping database: %w", err)
    }
    
    return &Database{Pool: pool, log: logger}, nil
}
```

#### Multi-Tracer Pattern

**Problem**: Need both New Relic APM tracing AND local SQL logging.

**Solution**: Custom `multiTracer` that chains multiple tracers.

```go
type multiTracer struct {
    tracers []any
}

func (mt *multiTracer) TraceQueryStart(ctx context.Context, conn *pgx.Conn, data pgx.TraceQueryStartData) context.Context {
    // Call all tracers in sequence
    for _, tracer := range mt.tracers {
        if t, ok := tracer.(interface {
            TraceQueryStart(context.Context, *pgx.Conn, pgx.TraceQueryStartData) context.Context
        }); ok {
            ctx = t.TraceQueryStart(ctx, conn, data)
        }
    }
    return ctx
}

func (mt *multiTracer) TraceQueryEnd(ctx context.Context, conn *pgx.Conn, data pgx.TraceQueryEndData) {
    // Call all tracers in sequence
    for _, tracer := range mt.tracers {
        if t, ok := tracer.(interface {
            TraceQueryEnd(context.Context, *pgx.Conn, pgx.TraceQueryEndData)
        }); ok {
            t.TraceQueryEnd(ctx, conn, data)
        }
    }
}
```

**Benefits:**
- ✅ Production: New Relic APM tracks all queries
- ✅ Development: Console logs show SQL for debugging
- ✅ No code duplication

---

### 2. Database Migrations (`migrator.go`)

**Purpose**: Automated schema versioning using Tern migration tool.

#### Embedded Migrations

```go
//go:embed migrations/*.sql
var migrations embed.FS
```

**Explanation:**
- `//go:embed` directive embeds SQL files into binary at compile time
- No need to deploy separate migration files
- Migrations are always available with the binary

#### Migration Process

```go
func Migrate(ctx context.Context, logger *zerolog.Logger, cfg *config.Config) error {
    // STEP 1: Connect to database
    conn, err := pgx.Connect(ctx, dsn)
    defer conn.Close(ctx)
    
    // STEP 2: Create migrator (tracks version in 'schema_version' table)
    m, err := tern.NewMigrator(ctx, conn, "schema_version")
    
    // STEP 3: Load embedded migrations
    subtree, err := fs.Sub(migrations, "migrations")
    if err := m.LoadMigrations(subtree); err != nil {
        return fmt.Errorf("loading database migrations: %w", err)
    }
    
    // STEP 4: Get current version
    from, err := m.GetCurrentVersion(ctx)
    
    // STEP 5: Run migrations
    if err := m.Migrate(ctx); err != nil {
        return err
    }
    
    // STEP 6: Log result
    if from == int32(len(m.Migrations)) {
        logger.Info().Msgf("database schema up to date, version %d", len(m.Migrations))
    } else {
        logger.Info().Msgf("migrated database schema, from %d to %d", from, len(m.Migrations))
    }
    
    return nil
}
```

**Migration Files Structure:**
```
internal/database/migrations/
├── 001_create_users.sql
├── 002_create_todos.sql
├── 003_create_categories.sql
└── 004_add_attachments.sql
```

**Tern tracks:**
- Which migrations have run
- Current schema version
- Prevents re-running migrations

---

## Configuration Module

### Location: `internal/config/`

### Configuration Structure

```go
type Config struct {
    Primary       Primary              `koanf:"primary" validate:"required"`
    Server        ServerConfig         `koanf:"server" validate:"required"`
    Database      DatabaseConfig       `koanf:"database" validate:"required"`
    Auth          AuthConfig           `koanf:"auth" validate:"required"`
    Redis         RedisConfig          `koanf:"redis" validate:"required"`
    Integration   IntegrationConfig    `koanf:"integration" validate:"required"`
    Observability *ObservabilityConfig `koanf:"observability"`
    AWS           AWSConfig            `koanf:"aws" validate:"required"`
    Cron          *CronConfig          `koanf:"cron"`
}
```

### Environment Variable Mapping

**Koanf** library maps environment variables to struct fields.

```go
func LoadConfig() (*Config, error) {
    k := koanf.New(".")
    
    // Load environment variables with prefix "EXECUTASK_"
    err := k.Load(env.Provider("EXECUTASK_", ".", func(s string) string {
        return strings.ToLower(strings.TrimPrefix(s, "EXECUTASK_"))
    }), nil)
    
    // Example mapping:
    // EXECUTASK_DATABASE_HOST → database.host
    // EXECUTASK_SERVER_PORT → server.port
    // EXECUTASK_AWS_REGION → aws.region
    
    mainConfig := &Config{}
    err = k.Unmarshal("", mainConfig)
    
    // Validate config using struct tags
    validate := validator.New()
    err = validate.Struct(mainConfig)
    
    return mainConfig, nil
}
```

### Configuration Examples

**Database Config:**
```go
type DatabaseConfig struct {
    Host            string `koanf:"host" validate:"required"`
    Port            int    `koanf:"port" validate:"required"`
    User            string `koanf:"user" validate:"required"`
    Password        string `koanf:"password"`
    Name            string `koanf:"name" validate:"required"`
    SSLMode         string `koanf:"ssl_mode" validate:"required"`
    MaxOpenConns    int    `koanf:"max_open_conns" validate:"required"`
    MaxIdleConns    int    `koanf:"max_idle_conns" validate:"required"`
    ConnMaxLifetime int    `koanf:"conn_max_lifetime" validate:"required"`
    ConnMaxIdleTime int    `koanf:"conn_max_idle_time" validate:"required"`
}
```

**Environment variables:**
```bash
EXECUTASK_DATABASE_HOST=localhost
EXECUTASK_DATABASE_PORT=5432
EXECUTASK_DATABASE_USER=postgres
EXECUTASK_DATABASE_PASSWORD=secret
EXECUTASK_DATABASE_NAME=executask
EXECUTASK_DATABASE_SSL_MODE=disable
```

### Default Values

```go
func DefaultCronConfig() *CronConfig {
    return &CronConfig{
        ArchiveDaysThreshold:        30,   // Archive after 30 days
        BatchSize:                   100,  // Process 100 items per batch
        ReminderHours:               24,   // Remind 24 hours before due
        MaxTodosPerUserNotification: 10,   // Max 10 todos per email
    }
}
```

---

## Logger Module

### Location: `internal/logger/`

### Logger Service

**Purpose**: Centralized logging with New Relic integration.

```go
type LoggerService struct {
    nrApp *newrelic.Application
}

func NewLoggerService(cfg *config.ObservabilityConfig) *LoggerService {
    service := &LoggerService{}
    
    if cfg.NewRelic.LicenseKey == "" {
        return service  // No New Relic
    }
    
    configOptions := []newrelic.ConfigOption{
        newrelic.ConfigAppName(cfg.ServiceName),
        newrelic.ConfigLicense(cfg.NewRelic.LicenseKey),
        newrelic.ConfigAppLogForwardingEnabled(cfg.NewRelic.AppLogForwardingEnabled),
        newrelic.ConfigDistributedTracerEnabled(cfg.NewRelic.DistributedTracingEnabled),
    }
    
    app, err := newrelic.NewApplication(configOptions...)
    if err != nil {
        return service
    }
    
    service.nrApp = app
    return service
}
```

### Logger Creation

```go
func NewLoggerWithService(cfg *config.ObservabilityConfig, loggerService *LoggerService) zerolog.Logger {
    // STEP 1: Determine log level
    var logLevel zerolog.Level
    switch cfg.GetLogLevel() {
    case "debug":
        logLevel = zerolog.DebugLevel
    case "info":
        logLevel = zerolog.InfoLevel
    case "warn":
        logLevel = zerolog.WarnLevel
    case "error":
        logLevel = zerolog.ErrorLevel
    default:
        logLevel = zerolog.InfoLevel
    }
    
    // STEP 2: Configure time format and error stack traces
    zerolog.TimeFieldFormat = "2006-01-02 15:04:05"
    zerolog.ErrorStackMarshaler = pkgerrors.MarshalStack
    
    // STEP 3: Setup writer (production vs development)
    var writer io.Writer
    
    if cfg.IsProduction() && cfg.Logging.Format == "json" {
        // Production: JSON logs to stdout
        baseWriter := os.Stdout
        
        // Wrap with New Relic for log forwarding
        if loggerService != nil && loggerService.nrApp != nil {
            writer = zerologWriter.New(baseWriter, loggerService.nrApp)
        } else {
            writer = baseWriter
        }
    } else {
        // Development: Pretty console output
        writer = zerolog.ConsoleWriter{
            Out:        os.Stdout,
            TimeFormat: "2006-01-02 15:04:05",
        }
    }
    
    // STEP 4: Create logger with context
    logger := zerolog.New(writer).
        Level(logLevel).
        With().
        Timestamp().
        Str("service", cfg.ServiceName).
        Str("environment", cfg.Environment).
        Logger()
    
    // STEP 5: Add stack traces in development
    if !cfg.IsProduction() {
        logger = logger.With().Stack().Logger()
    }
    
    return logger
}
```

### Log Levels

| Level | Usage |
|-------|-------|
| **Debug** | Detailed diagnostic information |
| **Info** | General informational messages |
| **Warn** | Warning messages (non-critical issues) |
| **Error** | Error messages (failures) |
| **Fatal** | Fatal errors (application exits) |

### Usage Examples

```go
// Info log
logger.Info().
    Str("user_id", userID).
    Msg("User authenticated successfully")

// Error log with stack trace
logger.Error().
    Err(err).
    Str("function", "CreateTodo").
    Msg("Failed to create todo")

// Structured logging
logger.Debug().
    Int("count", len(todos)).
    Dur("duration", time.Since(start)).
    Msg("Fetched todos")
```

---

## Error Handling

### Location: `internal/errs/`

### Custom HTTP Error Type

```go
type HTTPError struct {
    Code     string        `json:"code"`       // Error code (e.g., "NOT_FOUND")
    Message  string        `json:"message"`    // Human-readable message
    Status   int           `json:"status"`     // HTTP status code
    Override bool          `json:"override"`   // Whether to override default error
    Errors   []FieldError  `json:"errors"`     // Field-level validation errors
    Action   *Action       `json:"action"`     // Action to take (e.g., redirect)
}

type FieldError struct {
    Field string `json:"field"`
    Error string `json:"error"`
}

type Action struct {
    Type    ActionType `json:"type"`     // "redirect"
    Message string     `json:"message"`
    Value   string     `json:"value"`    // URL for redirect
}
```

### Error Constructors

```go
// 400 Bad Request
func NewBadRequestError(message string, override bool, code *string, errors []FieldError, action *Action) *HTTPError {
    formattedCode := "BAD_REQUEST"
    if code != nil {
        formattedCode = *code
    }
    
    return &HTTPError{
        Code:     formattedCode,
        Message:  message,
        Status:   http.StatusBadRequest,
        Override: override,
        Errors:   errors,
        Action:   action,
    }
}

// 401 Unauthorized
func NewUnauthorizedError(message string, override bool) *HTTPError {
    return &HTTPError{
        Code:     "UNAUTHORIZED",
        Message:  message,
        Status:   http.StatusUnauthorized,
        Override: override,
    }
}

// 403 Forbidden
func NewForbiddenError(message string, override bool) *HTTPError {
    return &HTTPError{
        Code:     "FORBIDDEN",
        Message:  message,
        Status:   http.StatusForbidden,
        Override: override,
    }
}

// 404 Not Found
func NewNotFoundError(message string, override bool, code *string) *HTTPError {
    formattedCode := "NOT_FOUND"
    if code != nil {
        formattedCode = *code
    }
    
    return &HTTPError{
        Code:     formattedCode,
        Message:  message,
        Status:   http.StatusNotFound,
        Override: override,
    }
}

// 500 Internal Server Error
func NewInternalServerError() *HTTPError {
    return &HTTPError{
        Code:     "INTERNAL_SERVER_ERROR",
        Message:  "Internal Server Error",
        Status:   http.StatusInternalServerError,
        Override: false,
    }
}
```

### Usage in Code

```go
// Not found
if err == pgx.ErrNoRows {
    return nil, errs.NewNotFoundError("Todo not found", false, nil)
}

// Validation error
if payload.Title == "" {
    return nil, errs.NewBadRequestError(
        "Title is required",
        false,
        nil,
        []errs.FieldError{{Field: "title", Error: "required"}},
        nil,
    )
}

// Unauthorized
if !isAuthenticated {
    return errs.NewUnauthorizedError("Please log in", false)
}
```

### Error Response Format

```json
{
  "code": "NOT_FOUND",
  "message": "Todo not found",
  "status": 404,
  "override": false
}
```

**With field errors:**
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "status": 400,
  "override": false,
  "errors": [
    {"field": "title", "error": "required"},
    {"field": "priority", "error": "must be low, medium, or high"}
  ]
}
```

---

## Router Module

### Location: `internal/router/`

### Router Setup

```go
func NewRouter(s *server.Server, h *handler.Handlers, services *service.Services) *echo.Echo {
    middlewares := middleware.NewMiddlewares(s)
    router := echo.New()
    
    // STEP 1: Set custom error handler
    router.HTTPErrorHandler = middlewares.Global.GlobalErrorHandler
    
    // STEP 2: Apply global middleware (in order)
    router.Use(
        // Rate limiting (20 requests per second)
        echoMiddleware.RateLimiterWithConfig(echoMiddleware.RateLimiterConfig{
            Store: echoMiddleware.NewRateLimiterMemoryStore(rate.Limit(20)),
            DenyHandler: func(c echo.Context, identifier string, err error) error {
                middlewares.RateLimit.RecordRateLimitHit(c.Path())
                return echo.NewHTTPError(http.StatusTooManyRequests, "Rate limit exceeded")
            },
        }),
        
        // CORS
        middlewares.Global.CORS(),
        
        // Security headers
        middlewares.Global.Secure(),
        
        // Request ID generation
        middleware.RequestID(),
        
        // New Relic tracing
        middlewares.Tracing.NewRelicMiddleware(),
        middlewares.Tracing.EnhanceTracing(),
        
        // Context enhancement
        middlewares.ContextEnhancer.EnhanceContext(),
        
        // Request logging
        middlewares.Global.RequestLogger(),
        
        // Panic recovery
        middlewares.Global.Recover(),
    )
    
    // STEP 3: Register system routes (health, openapi)
    registerSystemRoutes(router, h)
    
    // STEP 4: Register versioned API routes
    v1Router := router.Group("/api/v1")
    v1.RegisterV1Routes(v1Router, h, middlewares)
    
    return router
}
```

### Middleware Order Matters!

```
Request
  ↓
Rate Limiter (reject if too many requests)
  ↓
CORS (handle preflight, set headers)
  ↓
Security (set security headers)
  ↓
Request ID (generate unique ID)
  ↓
New Relic Tracing (start transaction)
  ↓
Context Enhancement (add metadata)
  ↓
Request Logger (log request details)
  ↓
Recover (catch panics)
  ↓
Handler (process request)
```

### Route Groups

```go
// System routes (no auth)
/health
/openapi.yaml

// API v1 routes (with auth)
/api/v1/todos
/api/v1/categories
/api/v1/comments
```

---

## AWS Module

### Location: `internal/lib/aws/`

### AWS Client Initialization

```go
type AWS struct {
    S3 *S3Client
}

func NewAWS(server *server.Server) (*AWS, error) {
    awsConfig := server.Config.AWS
    
    configOptions := []func(*config.LoadOptions) error{
        config.WithRegion(awsConfig.Region),
        config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
            awsConfig.AccessKeyID,
            awsConfig.SecretAccessKey,
            "",
        )),
    }
    
    // Support for S3-compatible services (e.g., Sevalla, MinIO)
    if awsConfig.EndpointURL != "" {
        configOptions = append(configOptions, config.WithEndpointResolverWithOptions(
            aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
                return aws.Endpoint{
                    URL:           awsConfig.EndpointURL,
                    SigningRegion: awsConfig.Region,
                }, nil
            }),
        ))
    }
    
    cfg, err := config.LoadDefaultConfig(context.TODO(), configOptions...)
    
    return &AWS{
        S3: NewS3Client(server, cfg),
    }, nil
}
```

### S3 Operations

**Upload File:**
```go
func (s *S3Client) UploadFile(ctx context.Context, bucket string, fileName string, file io.Reader) (string, error) {
    // Generate unique key
    fileKey := fmt.Sprintf("%s_%d", fileName, time.Now().Unix())
    
    // Read file into buffer
    var buffer bytes.Buffer
    _, err := io.Copy(&buffer, file)
    
    // Upload to S3
    _, err = s.client.PutObject(ctx, &s3.PutObjectInput{
        Bucket:      aws.String(bucket),
        Key:         aws.String(fileKey),
        Body:        bytes.NewReader(buffer.Bytes()),
        ContentType: aws.String(http.DetectContentType(buffer.Bytes())),
    })
    
    return fileKey, nil
}
```

**Generate Presigned URL:**
```go
func (s *S3Client) CreatePresignedUrl(ctx context.Context, bucket string, objectKey string) (string, error) {
    presignClient := s3.NewPresignClient(s.client)
    
    expiration := time.Minute * 60  // 1 hour
    
    presignedUrl, err := presignClient.PresignGetObject(ctx,
        &s3.GetObjectInput{
            Bucket: aws.String(bucket),
            Key:    aws.String(objectKey),
        },
        s3.WithPresignExpires(expiration))
    
    return presignedUrl.URL, nil
}
```

**Delete Object:**
```go
func (s *S3Client) DeleteObject(ctx context.Context, bucket string, key string) error {
    _, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
        Bucket: aws.String(bucket),
        Key:    aws.String(key),
    })
    
    return err
}
```

---

## Email Module

### Location: `internal/lib/email/`

### Email Client

```go
type Client struct {
    client *resend.Client
    logger *zerolog.Logger
}

func NewClient(cfg *config.Config, logger *zerolog.Logger) *Client {
    return &Client{
        client: resend.NewClient(cfg.Integration.ResendAPIKey),
        logger: logger,
    }
}
```

### Sending Emails

```go
func (c *Client) SendEmail(to, subject string, templateName Template, data map[string]any) error {
    // STEP 1: Load template
    tmplPath := fmt.Sprintf("%s/%s.html", "templates/emails", templateName)
    tmpl, err := template.ParseFiles(tmplPath)
    
    // STEP 2: Render template with data
    var body bytes.Buffer
    if err := tmpl.Execute(&body, data); err != nil {
        return errors.Wrapf(err, "failed to execute email template %s", templateName)
    }
    
    // STEP 3: Send via Resend
    params := &resend.SendEmailRequest{
        From:    "ExecuTask <onboarding@resend.dev>",
        To:      []string{to},
        Subject: subject,
        Html:    body.String(),
    }
    
    _, err = c.client.Emails.Send(params)
    return err
}
```

### Email Templates

**Template Structure:**
```
templates/emails/
├── welcome.html
├── reminder.html
├── overdue.html
└── weekly_report.html
```

**Example Template (`reminder.html`):**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Todo Reminder</title>
</head>
<body>
    <h1>Reminder: {{.TodoTitle}}</h1>
    <p>Your todo is due on {{.DueDate}}</p>
    <a href="{{.TodoURL}}">View Todo</a>
</body>
</html>
```

**Usage:**
```go
data := map[string]any{
    "TodoTitle": "Buy milk",
    "DueDate":   "Jan 25, 2026",
    "TodoURL":   "https://app.executask.com/todos/123",
}

err := emailClient.SendEmail(
    "user@example.com",
    "Reminder: Buy milk",
    "reminder",
    data,
)
```

---

## Validation Module

### Location: `internal/validation/`

**Note**: The validation module uses Go's built-in `validator` package with struct tags.

### Validation Tags

```go
type CreateTodoPayload struct {
    Title       string     `json:"title" validate:"required,min=1,max=255"`
    Description string     `json:"description" validate:"max=5000"`
    Priority    Priority   `json:"priority" validate:"required,oneof=low medium high"`
    Status      Status     `json:"status" validate:"omitempty,oneof=draft active completed archived"`
    DueDate     *time.Time `json:"dueDate" validate:"omitempty"`
    CategoryID  *uuid.UUID `json:"categoryId" validate:"omitempty,uuid"`
}
```

### Common Validation Tags

| Tag | Meaning |
|-----|---------|
| `required` | Field must be present |
| `omitempty` | Skip validation if empty |
| `min=1` | Minimum length/value |
| `max=255` | Maximum length/value |
| `oneof=a b c` | Must be one of the values |
| `uuid` | Must be valid UUID |
| `email` | Must be valid email |
| `url` | Must be valid URL |

---

## SQL Error Handling

### Location: `internal/sqlerr/`

**Purpose**: Convert PostgreSQL errors to user-friendly HTTP errors.

```go
func HandleSQLError(err error) error {
    var pgErr *pgconn.PgError
    if errors.As(err, &pgErr) {
        switch pgErr.Code {
        case "23505": // unique_violation
            return errs.NewBadRequestError("Record already exists", false, nil, nil, nil)
        case "23503": // foreign_key_violation
            return errs.NewBadRequestError("Referenced record not found", false, nil, nil, nil)
        case "23502": // not_null_violation
            return errs.NewBadRequestError("Required field missing", false, nil, nil, nil)
        }
    }
    
    if errors.Is(err, pgx.ErrNoRows) {
        return errs.NewNotFoundError("Record not found", false, nil)
    }
    
    return errs.NewInternalServerError()
}
```

---

## Middleware Details

### 1. Request ID Middleware

```go
func RequestID() echo.MiddlewareFunc {
    return func(next echo.HandlerFunc) echo.HandlerFunc {
        return func(c echo.Context) error {
            requestID := uuid.New().String()
            c.Set("request_id", requestID)
            c.Response().Header().Set("X-Request-ID", requestID)
            return next(c)
        }
    }
}
```

### 2. CORS Middleware

```go
func (m *GlobalMiddleware) CORS() echo.MiddlewareFunc {
    return echoMiddleware.CORSWithConfig(echoMiddleware.CORSConfig{
        AllowOrigins: m.server.Config.Server.CORSAllowedOrigins,
        AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete},
        AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAuthorization},
    })
}
```

### 3. New Relic Middleware

```go
func (m *TracingMiddleware) NewRelicMiddleware() echo.MiddlewareFunc {
    return func(next echo.HandlerFunc) echo.HandlerFunc {
        return func(c echo.Context) error {
            txn := m.loggerService.GetApplication().StartTransaction(c.Request().URL.Path)
            defer txn.End()
            
            c.Set("newrelic_txn", txn)
            txn.SetWebRequestHTTP(c.Request())
            
            err := next(c)
            
            txn.SetWebResponse(c.Response().Writer)
            return err
        }
    }
}
```

---

## Summary

This document covered all supporting infrastructure modules:

✅ **Database**: Connection pooling, migrations, multi-tracer pattern  
✅ **Config**: Koanf-based environment variable mapping  
✅ **Logger**: Zerolog with New Relic integration  
✅ **Errors**: Custom HTTP error types with field-level validation  
✅ **Router**: Echo setup with middleware chain  
✅ **AWS**: S3 client with presigned URLs  
✅ **Email**: Resend integration with HTML templates  
✅ **Validation**: Struct tag-based validation  
✅ **SQL Errors**: PostgreSQL error to HTTP error mapping  
✅ **Middleware**: Request ID, CORS, tracing, rate limiting  

These modules form the foundation that the core application layers (handlers, services, repositories) depend on.
