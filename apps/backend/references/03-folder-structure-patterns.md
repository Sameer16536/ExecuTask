# ExecuTask Backend - Folder Structure & Architectural Patterns

## Table of Contents
1. [Directory Structure](#directory-structure)
2. [Architectural Patterns](#architectural-patterns)
3. [Layer Responsibilities](#layer-responsibilities)
4. [Package Organization](#package-organization)

---

## Directory Structure

```
apps/backend/
│
├── cmd/
│   └── executask/
│       └── main.go                    # Application entry point
│
├── internal/                          # Private application code
│   │
│   ├── config/                        # Configuration Management
│   │   ├── config.go                  # Config struct & loading
│   │   └── observability.go           # New Relic config
│   │
│   ├── cron/                          # Scheduled Jobs
│   │   ├── base.go                    # Job interface & context
│   │   ├── jobs.go                    # Job implementations
│   │   └── registry.go                # Job scheduler registration
│   │
│   ├── database/                      # Database Layer
│   │   ├── database.go                # Connection pool setup
│   │   └── migrator.go                # Migration runner
│   │
│   ├── errs/                          # Error Handling
│   │   ├── http.go                    # HTTP error responses
│   │   └── types.go                   # Custom error types
│   │
│   ├── handler/                       # HTTP Handlers (Controllers)
│   │   ├── base.go                    # Base handler & generic functions
│   │   ├── handlers.go                # Handler registry
│   │   ├── health.go                  # Health check endpoint
│   │   ├── openapi.go                 # OpenAPI spec endpoint
│   │   ├── todo.go                    # Todo endpoints
│   │   ├── comment.go                 # Comment endpoints
│   │   └── category.go                # Category endpoints
│   │
│   ├── lib/                           # Shared Libraries
│   │   ├── aws/                       # AWS Integration
│   │   │   ├── aws.go                 # AWS client initialization
│   │   │   └── s3.go                  # S3 operations
│   │   │
│   │   ├── email/                     # Email Service
│   │   │   ├── client.go              # Resend client
│   │   │   ├── emails.go              # Email sending functions
│   │   │   ├── preview.go             # Dev email preview
│   │   │   └── templates.go           # Template rendering
│   │   │
│   │   ├── job/                       # Background Jobs
│   │   │   ├── job.go                 # Asynq service
│   │   │   ├── handlers.go            # Task handlers
│   │   │   └── email_tasks.go         # Email task definitions
│   │   │
│   │   └── utils/                     # Utility Functions
│   │       └── utils.go
│   │
│   ├── logger/                        # Logging Infrastructure
│   │   └── logger.go                  # Zerolog + New Relic integration
│   │
│   ├── middleware/                    # HTTP Middleware
│   │   ├── middlewares.go             # Middleware registry
│   │   ├── auth.go                    # Authentication (Clerk)
│   │   ├── context.go                 # Context helpers
│   │   ├── global.go                  # CORS, recovery, logging
│   │   ├── rate_limit.go              # Rate limiting
│   │   ├── request_id.go              # Request ID generation
│   │   └── tracing.go                 # Distributed tracing
│   │
│   ├── model/                         # Domain Models & DTOs
│   │   ├── base.go                    # Base model structs
│   │   │
│   │   ├── category/                  # Category domain
│   │   │   ├── category.go            # Category entity
│   │   │   └── dto.go                 # Request/response DTOs
│   │   │
│   │   ├── comment/                   # Comment domain
│   │   │   ├── comment.go             # Comment entity
│   │   │   └── dto.go                 # Request/response DTOs
│   │   │
│   │   └── todo/                      # Todo domain
│   │       ├── todo.go                # Todo entity
│   │       ├── attachment.go          # Attachment entity
│   │       └── dto.go                 # Request/response DTOs
│   │
│   ├── repository/                    # Data Access Layer
│   │   ├── repositories.go            # Repository registry
│   │   ├── todo.go                    # Todo repository
│   │   ├── comment.go                 # Comment repository
│   │   └── category.go                # Category repository
│   │
│   ├── router/                        # Route Configuration
│   │   ├── router.go                  # Main router setup
│   │   ├── system.go                  # System routes (health, openapi)
│   │   │
│   │   └── v1/                        # API v1 routes
│   │       ├── category.go            # Category routes
│   │       ├── comment.go             # Comment routes
│   │       └── todo.go                # Todo routes
│   │
│   ├── server/                        # Server Initialization
│   │   └── server.go                  # Server struct & lifecycle
│   │
│   ├── service/                       # Business Logic Layer
│   │   ├── services.go                # Service registry
│   │   ├── auth.go                    # Auth service (Clerk)
│   │   ├── todo.go                    # Todo service
│   │   ├── comment.go                 # Comment service
│   │   └── category.go                # Category service
│   │
│   ├── sqlerr/                        # SQL Error Handling
│   │   └── sqlerr.go                  # PostgreSQL error mapping
│   │
│   ├── testing/                       # Test Utilities
│   │   └── ...                        # Test helpers
│   │
│   └── validation/                    # Input Validation
│       └── validation.go              # Custom validators
│
├── static/                            # Static Files
│   └── openapi.yaml                   # OpenAPI specification
│
├── templates/                         # Email Templates
│   ├── welcome.html                   # Welcome email
│   ├── reminder.html                  # Reminder email
│   └── weekly_report.html             # Weekly report email
│
├── .env                               # Environment variables
├── .env.sample                        # Environment template
├── go.mod                             # Go module definition
├── go.sum                             # Dependency checksums
├── Taskfile.yml                       # Task runner config
└── README.md                          # Project documentation
```

---

## Architectural Patterns

### 1. Clean Architecture (Layered Architecture)

The codebase follows **Clean Architecture** principles with clear separation of concerns:

```
┌──────────────────────────────────────────┐
│         Presentation Layer               │
│  (Handlers, Router, Middleware)          │
│  • HTTP request/response handling        │
│  • Input validation                      │
│  • Authentication/authorization          │
└──────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────┐
│         Business Logic Layer             │
│  (Services)                              │
│  • Domain rules enforcement              │
│  • Orchestration of operations           │
│  • External service integration          │
└──────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────┐
│         Data Access Layer                │
│  (Repositories)                          │
│  • Database queries                      │
│  • Data mapping                          │
│  • Transaction management                │
└──────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────┐
│         Infrastructure Layer             │
│  (Database, Redis, AWS, Email)           │
│  • External dependencies                 │
│  • Third-party integrations              │
└──────────────────────────────────────────┘
```

**Key Principles:**
- **Dependency Rule**: Inner layers don't depend on outer layers
- **Separation of Concerns**: Each layer has a single responsibility
- **Testability**: Layers can be tested independently
- **Flexibility**: Easy to swap implementations (e.g., change database)

---

### 2. Repository Pattern

**Purpose**: Abstract data access logic from business logic.

**Structure:**
```
internal/repository/
├── repositories.go        # Central registry
├── todo.go               # Todo data access
├── comment.go            # Comment data access
└── category.go           # Category data access
```

**Pattern Implementation:**
```go
// repositories.go - Registry
type Repositories struct {
    Todo     *TodoRepository
    Comment  *CommentRepository
    Category *CategoryRepository
}

func NewRepositories(s *server.Server) *Repositories {
    return &Repositories{
        Todo:     NewTodoRepository(s),
        Comment:  NewCommentRepository(s),
        Category: NewCategoryRepository(s),
    }
}

// todo.go - Concrete repository
type TodoRepository struct {
    server *server.Server
}

func NewTodoRepository(server *server.Server) *TodoRepository {
    return &TodoRepository{server: server}
}

func (r *TodoRepository) CreateTodo(...) (*todo.Todo, error) {
    // SQL query execution
}
```

**Benefits:**
- ✅ Centralized data access logic
- ✅ Easy to mock for testing
- ✅ Database-agnostic business logic
- ✅ Consistent error handling

---

### 3. Service Layer Pattern

**Purpose**: Encapsulate business logic and orchestrate operations.

**Structure:**
```
internal/service/
├── services.go           # Central registry
├── auth.go              # Authentication logic
├── todo.go              # Todo business logic
├── comment.go           # Comment business logic
└── category.go          # Category business logic
```

**Pattern Implementation:**
```go
// services.go - Registry
type Services struct {
    Auth     *AuthService
    Todo     *TodoService
    Comment  *CommentService
    Category *CategoryService
}

func NewServices(s *server.Server, repos *repository.Repositories) (*Services, error) {
    authService := NewAuthService(s)
    awsClient, err := aws.NewAWS(s)
    
    return &Services{
        Auth:     authService,
        Todo:     NewTodoService(s, repos.Todo, repos.Category, awsClient),
        Comment:  NewCommentService(s, repos.Comment, repos.Todo),
        Category: NewCategoryService(s, repos.Category),
    }, nil
}

// todo.go - Concrete service
type TodoService struct {
    server       *server.Server
    todoRepo     *repository.TodoRepository
    categoryRepo *repository.CategoryRepository
    awsClient    *aws.AWS
}

func (s *TodoService) CreateTodo(...) (*todo.Todo, error) {
    // 1. Validate business rules
    // 2. Call repository
    // 3. Handle external services (AWS, email)
}
```

**Responsibilities:**
- Validate business rules
- Coordinate multiple repositories
- Integrate external services (AWS S3, email)
- Transaction management
- Error transformation

---

### 4. Dependency Injection Pattern

**Purpose**: Provide dependencies from outside rather than creating them internally.

**Implementation:**
```go
// main.go - Dependency wiring
func main() {
    cfg, _ := config.LoadConfig()
    log := logger.NewLogger(cfg)
    
    // 1. Root dependency
    srv, _ := server.New(cfg, &log, loggerService)
    
    // 2. Inject server into repositories
    repos := repository.NewRepositories(srv)
    
    // 3. Inject server + repos into services
    services, _ := service.NewServices(srv, repos)
    
    // 4. Inject server + services into handlers
    handlers := handler.NewHandlers(srv, services)
    
    // 5. Inject everything into router
    r := router.NewRouter(srv, handlers, services)
}
```

**Benefits:**
- ✅ Loose coupling
- ✅ Easy testing (inject mocks)
- ✅ Centralized configuration
- ✅ Clear dependency graph

---

### 5. Middleware Chain Pattern

**Purpose**: Process requests through a pipeline of middleware functions.

**Structure:**
```
internal/middleware/
├── middlewares.go        # Middleware registry
├── global.go            # CORS, recovery, logging
├── auth.go              # Authentication
├── rate_limit.go        # Rate limiting
├── request_id.go        # Request ID
├── tracing.go           # Distributed tracing
└── context.go           # Context helpers
```

**Pattern Implementation:**
```go
// middlewares.go
type Middlewares struct {
    Auth      *AuthMiddleware
    RateLimit *RateLimitMiddleware
}

func NewMiddlewares(s *server.Server) *Middlewares {
    return &Middlewares{
        Auth:      NewAuthMiddleware(s),
        RateLimit: NewRateLimitMiddleware(s),
    }
}

// router.go - Applying middleware
func NewRouter(s *server.Server, h *handler.Handlers, svc *service.Services) *echo.Echo {
    e := echo.New()
    
    // Global middleware (all routes)
    e.Use(middleware.RequestID())
    e.Use(middleware.Logger())
    e.Use(middleware.Recover())
    e.Use(middleware.CORS())
    
    // Route-specific middleware
    api := e.Group("/api/v1")
    api.Use(middlewares.Auth.RequireAuth)  // Protected routes
    api.Use(middlewares.RateLimit.Limit)
}
```

**Middleware Flow:**
```
Request → RequestID → Logger → Recover → CORS → Auth → RateLimit → Handler
```

---

### 6. Job Queue Architecture

**Purpose**: Asynchronous task processing with priority queues.

**Structure:**
```
internal/lib/job/
├── job.go               # Asynq service
├── handlers.go          # Task handlers
└── email_tasks.go       # Task definitions

internal/cron/
├── base.go              # Job interface
├── jobs.go              # Cron job implementations
└── registry.go          # Scheduler registration
```

**Pattern Implementation:**

**Asynq (Async Queue):**
```go
// job.go
type JobService struct {
    Client *asynq.Client  // Enqueues tasks
    server *asynq.Server  // Processes tasks
}

// Enqueue task
func EnqueueReminderEmail(client *asynq.Client, task *ReminderEmailTask) error {
    payload, _ := json.Marshal(task)
    return client.Enqueue(
        asynq.NewTask(TaskReminderEmail, payload),
        asynq.Queue("critical"),
    )
}

// Process task
func (j *JobService) handleReminderEmailTask(ctx context.Context, t *asynq.Task) error {
    var task ReminderEmailTask
    json.Unmarshal(t.Payload(), &task)
    // Send email
}
```

**Cron (Scheduled Jobs):**
```go
// base.go
type Job interface {
    Name() string
    Description() string
    Run(ctx context.Context, jobCtx *JobContext) error
}

// jobs.go
type DueDateRemindersJob struct{}

func (j *DueDateRemindersJob) Run(ctx context.Context, jobCtx *JobContext) error {
    todos, _ := jobCtx.Repositories.Todo.GetTodosDueInHours(ctx, 24, 100)
    for _, todo := range todos {
        job.EnqueueReminderEmail(jobCtx.JobClient, &task)
    }
}

// registry.go
func RegisterJobs(scheduler *gocron.Scheduler, jobCtx *JobContext) {
    scheduler.Every(1).Hour().Do(runJob, &DueDateRemindersJob{}, jobCtx)
}
```

---

### 7. Configuration Management

**Purpose**: Centralized configuration from environment variables.

**Structure:**
```
internal/config/
├── config.go            # Config struct & loading
└── observability.go     # New Relic config
```

**Pattern Implementation:**
```go
// config.go
type Config struct {
    Primary       PrimaryConfig
    Server        ServerConfig
    Database      DatabaseConfig
    Redis         RedisConfig
    AWS           AWSConfig
    Email         EmailConfig
    Cron          CronConfig
    Observability ObservabilityConfig
}

func LoadConfig() (*Config, error) {
    k := koanf.New(".")
    k.Load(env.Provider("", ".", func(s string) string {
        return strings.ToLower(s)
    }), nil)
    
    var cfg Config
    k.Unmarshal("", &cfg)
    return &cfg, nil
}
```

**Usage:**
```go
// Access config anywhere via server
func (r *TodoRepository) CreateTodo(...) error {
    timeout := r.server.Config.Database.QueryTimeout
    // ...
}
```

---

## Layer Responsibilities

### Handler Layer
- ✅ Parse HTTP requests
- ✅ Validate input (struct tags + custom validators)
- ✅ Extract user context (from middleware)
- ✅ Call service methods
- ✅ Format HTTP responses
- ❌ NO business logic
- ❌ NO database queries

### Service Layer
- ✅ Enforce business rules
- ✅ Orchestrate multiple repositories
- ✅ Integrate external services (AWS, email)
- ✅ Transaction coordination
- ✅ Error transformation
- ❌ NO HTTP concerns
- ❌ NO direct database queries

### Repository Layer
- ✅ Execute SQL queries
- ✅ Map database rows to structs
- ✅ Handle database errors
- ✅ Transaction management
- ❌ NO business logic
- ❌ NO external service calls

---

## Package Organization

### Domain-Driven Packages

Each domain entity has its own package:
```
internal/model/todo/
├── todo.go          # Entity definition
├── attachment.go    # Related entity
└── dto.go           # Request/response DTOs
```

**Benefits:**
- Clear domain boundaries
- Easy to find related code
- Prevents circular dependencies

### Shared Packages

Common functionality in `internal/lib/`:
```
internal/lib/
├── aws/         # AWS integration
├── email/       # Email service
├── job/         # Background jobs
└── utils/       # Utility functions
```

---

## Summary

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Clean Architecture** | Entire codebase | Separation of concerns |
| **Repository Pattern** | `internal/repository/` | Data access abstraction |
| **Service Layer** | `internal/service/` | Business logic encapsulation |
| **Dependency Injection** | `cmd/executask/main.go` | Loose coupling |
| **Middleware Chain** | `internal/middleware/` | Request processing pipeline |
| **Job Queue** | `internal/lib/job/`, `internal/cron/` | Async task processing |
| **Configuration** | `internal/config/` | Centralized config management |

This architecture ensures the codebase is **maintainable, testable, and scalable**.
