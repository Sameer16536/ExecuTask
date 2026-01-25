# ExecuTask Backend - Detailed Code Explanation Guide

## Table of Contents
1. [Application Initialization (main.go)](#application-initialization-maingo)
2. [Repository Layer Examples](#repository-layer-examples)
3. [Service Layer Examples](#service-layer-examples)
4. [Handler Layer Examples](#handler-layer-examples)
5. [Middleware Examples](#middleware-examples)
6. [Cron Job Examples](#cron-job-examples)
7. [Job Queue Examples](#job-queue-examples)
8. [Common Go Idioms](#common-go-idioms)

---

## Application Initialization (main.go)

### Complete Breakdown

```go
package main

import (
    "context"
    "errors"
    "net/http"
    "os"
    "os/signal"
    "time"

    "github.com/Sameer16536/ExecuTask/internal/config"
    "github.com/Sameer16536/ExecuTask/internal/database"
    "github.com/Sameer16536/ExecuTask/internal/handler"
    "github.com/Sameer16536/ExecuTask/internal/logger"
    "github.com/Sameer16536/ExecuTask/internal/repository"
    "github.com/Sameer16536/ExecuTask/internal/router"
    "github.com/Sameer16536/ExecuTask/internal/server"
    "github.com/Sameer16536/ExecuTask/internal/service"
)

const DefaultContextTimeout = 30

func main() {
    // STEP 1: Load configuration from environment variables
    cfg, err := config.LoadConfig()
    if err != nil {
        panic("failed to load config: " + err.Error())
    }
    // cfg now contains all environment variables mapped to struct fields

    // STEP 2: Initialize logging with New Relic integration
    loggerService := logger.NewLoggerService(cfg.Observability)
    defer loggerService.Shutdown()  // Ensure cleanup on exit
    
    log := logger.NewLoggerWithService(cfg.Observability, loggerService)

    // STEP 3: Run database migrations (only in non-local environments)
    if cfg.Primary.Env != "local" {
        if err := database.Migrate(context.Background(), &log, cfg); err != nil {
            log.Fatal().Err(err).Msg("failed to migrate database")
        }
    }

    // STEP 4: Initialize server (DB, Redis, Job queue)
    srv, err := server.New(cfg, &log, loggerService)
    if err != nil {
        log.Fatal().Err(err).Msg("failed to initialize server")
    }

    // STEP 5: Dependency injection chain
    repos := repository.NewRepositories(srv)
    // repos.Todo, repos.Comment, repos.Category are now initialized

    services, serviceErr := service.NewServices(srv, repos)
    if serviceErr != nil {
        log.Fatal().Err(serviceErr).Msg("could not create services")
    }
    // services.Todo, services.Comment, services.Category, services.Auth

    handlers := handler.NewHandlers(srv, services)
    // handlers.Todo, handlers.Comment, handlers.Category, handlers.Health

    // STEP 6: Setup router with all routes and middleware
    r := router.NewRouter(srv, handlers, services)

    // STEP 7: Configure HTTP server
    srv.SetupHTTPServer(r)

    // STEP 8: Setup graceful shutdown
    ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
    // ctx will be cancelled when SIGINT (Ctrl+C) is received

    // STEP 9: Start server in goroutine (non-blocking)
    go func() {
        if err = srv.Start(); err != nil && !errors.Is(err, http.ErrServerClosed) {
            log.Fatal().Err(err).Msg("failed to start server")
        }
    }()

    // STEP 10: Wait for interrupt signal
    <-ctx.Done()  // Blocks until SIGINT received
    
    // STEP 11: Graceful shutdown with timeout
    ctx, cancel := context.WithTimeout(context.Background(), DefaultContextTimeout*time.Second)
    
    if err = srv.Shutdown(ctx); err != nil {
        log.Fatal().Err(err).Msg("server forced to shutdown")
    }
    
    stop()    // Release signal notification
    cancel()  // Release context resources

    log.Info().Msg("server exited properly")
}
```

**Key Concepts:**
- **`defer`**: Schedules function to run when surrounding function returns
- **`go func()`**: Starts goroutine (concurrent execution)
- **`<-ctx.Done()`**: Blocks until context is cancelled
- **`signal.NotifyContext`**: Creates context that cancels on OS signal

---

## Repository Layer Examples

### Example 1: CreateTodo

```go
func (r *TodoRepository) CreateTodo(
    ctx context.Context,
    userID string,
    payload *todo.CreateTodoPayload,
) (*todo.Todo, error) {
    // SQL query with RETURNING clause (PostgreSQL-specific)
    query := `
        INSERT INTO todos (
            user_id, title, description, priority, status,
            due_date, parent_todo_id, category_id, metadata, sort_order
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, created_at, updated_at
    `

    var t todo.Todo
    
    // Execute query and scan result into struct
    err := r.server.DB.Pool.QueryRow(
        ctx,
        query,
        userID,
        payload.Title,
        payload.Description,
        payload.Priority,
        payload.Status,
        payload.DueDate,
        payload.ParentTodoID,
        payload.CategoryID,
        payload.Metadata,
        payload.SortOrder,
    ).Scan(&t.ID, &t.CreatedAt, &t.UpdatedAt)

    if err != nil {
        return nil, err
    }

    // Populate remaining fields from payload
    t.UserID = userID
    t.Title = payload.Title
    t.Description = payload.Description
    t.Priority = payload.Priority
    t.Status = payload.Status
    t.DueDate = payload.DueDate
    t.ParentTodoID = payload.ParentTodoID
    t.CategoryID = payload.CategoryID
    t.Metadata = payload.Metadata
    t.SortOrder = payload.SortOrder

    return &t, nil
}
```

**Explanation:**
- **`QueryRow`**: Executes query expecting single row
- **`Scan`**: Maps columns to struct fields
- **`$1, $2, ...`**: PostgreSQL parameter placeholders (prevents SQL injection)
- **`RETURNING`**: Returns generated values (ID, timestamps)

### Example 2: GetTodoByID with Joins

```go
func (r *TodoRepository) GetTodoByID(
    ctx context.Context,
    userID string,
    todoID uuid.UUID,
) (*todo.PopulatedTodo, error) {
    // Complex query with LEFT JOINs for related data
    query := `
        SELECT 
            t.*,
            c.id, c.name, c.color, c.icon, c.created_at, c.updated_at,
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object(
                        'id', ch.id,
                        'title', ch.title,
                        'status', ch.status
                    )
                ) FILTER (WHERE ch.id IS NOT NULL),
                '[]'
            ) as children,
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object(
                        'id', co.id,
                        'content', co.content,
                        'userId', co.user_id
                    )
                ) FILTER (WHERE co.id IS NOT NULL),
                '[]'
            ) as comments
        FROM todos t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN todos ch ON ch.parent_todo_id = t.id
        LEFT JOIN comments co ON co.todo_id = t.id
        WHERE t.id = $1 AND t.user_id = $2
        GROUP BY t.id, c.id
    `

    var pt todo.PopulatedTodo
    var category *category.Category
    var childrenJSON, commentsJSON []byte

    err := r.server.DB.Pool.QueryRow(ctx, query, todoID, userID).Scan(
        // Todo fields
        &pt.ID, &pt.UserID, &pt.Title, &pt.Description,
        &pt.Priority, &pt.Status, &pt.DueDate, &pt.CompletedAt,
        &pt.ParentTodoID, &pt.CategoryID, &pt.Metadata,
        &pt.SortOrder, &pt.CreatedAt, &pt.UpdatedAt,
        
        // Category fields (nullable)
        &category.ID, &category.Name, &category.Color,
        &category.Icon, &category.CreatedAt, &category.UpdatedAt,
        
        // JSON aggregates
        &childrenJSON,
        &commentsJSON,
    )

    if err != nil {
        if errors.Is(err, pgx.ErrNoRows) {
            return nil, errs.NewNotFoundError("Todo not found")
        }
        return nil, err
    }

    // Unmarshal JSON arrays
    json.Unmarshal(childrenJSON, &pt.Children)
    json.Unmarshal(commentsJSON, &pt.Comments)
    
    pt.Category = category

    return &pt, nil
}
```

**Key Techniques:**
- **`json_agg`**: Aggregates rows into JSON array
- **`COALESCE`**: Returns first non-null value
- **`FILTER (WHERE ...)`**: Excludes nulls from aggregation
- **`GROUP BY`**: Required when using aggregates

---

## Service Layer Examples

### Example 1: CreateTodo with Validation

```go
func (s *TodoService) CreateTodo(
    ctx echo.Context,
    userID string,
    payload *todo.CreateTodoPayload,
) (*todo.Todo, error) {
    // STEP 1: Validate category exists (if provided)
    if payload.CategoryID != nil {
        _, err := s.categoryRepo.GetCategoryByID(
            ctx.Request().Context(),
            userID,
            *payload.CategoryID,
        )
        if err != nil {
            return nil, errs.NewBadRequestError(
                "Category not found",
                false, nil, nil, nil,
            )
        }
    }

    // STEP 2: Validate parent todo (if subtask)
    if payload.ParentTodoID != nil {
        parent, err := s.todoRepo.CheckTodoExists(
            ctx.Request().Context(),
            userID,
            *payload.ParentTodoID,
        )
        if err != nil {
            return nil, errs.NewBadRequestError(
                "Parent todo not found",
                false, nil, nil, nil,
            )
        }

        // Business rule: Cannot create subtask of subtask
        if !parent.CanHaveChildren() {
            return nil, errs.NewBadRequestError(
                "Cannot create subtask of a subtask",
                false, nil, nil, nil,
            )
        }
    }

    // STEP 3: Set default status if not provided
    if payload.Status == "" {
        payload.Status = todo.StatusActive
    }

    // STEP 4: Create todo via repository
    createdTodo, err := s.todoRepo.CreateTodo(
        ctx.Request().Context(),
        userID,
        payload,
    )
    if err != nil {
        return nil, err
    }

    return createdTodo, nil
}
```

**Service Layer Responsibilities:**
1. **Validate business rules** (category exists, parent is valid)
2. **Enforce constraints** (no nested subtasks)
3. **Set defaults** (status)
4. **Delegate to repository** (actual database operation)

### Example 2: UploadTodoAttachment (AWS Integration)

```go
func (s *TodoService) UploadTodoAttachment(
    ctx echo.Context,
    userID string,
    todoID uuid.UUID,
    file *multipart.FileHeader,
) (*todo.TodoAttachment, error) {
    // STEP 1: Verify todo exists and belongs to user
    _, err := s.todoRepo.CheckTodoExists(
        ctx.Request().Context(),
        userID,
        todoID,
    )
    if err != nil {
        return nil, errs.NewNotFoundError("Todo not found")
    }

    // STEP 2: Open uploaded file
    src, err := file.Open()
    if err != nil {
        return nil, errs.NewBadRequestError(
            "Failed to open file",
            false, nil, nil, nil,
        )
    }
    defer src.Close()

    // STEP 3: Generate unique S3 key
    s3Key := fmt.Sprintf(
        "attachments/%s/%s/%s",
        userID,
        todoID.String(),
        uuid.New().String(),
    )

    // STEP 4: Upload to S3
    err = s.awsClient.S3.UploadFile(
        ctx.Request().Context(),
        s3Key,
        src,
        file.Header.Get("Content-Type"),
    )
    if err != nil {
        return nil, errors.Wrap(err, "failed to upload file to S3")
    }

    // STEP 5: Save metadata to database
    attachment, err := s.todoRepo.UploadTodoAttachment(
        ctx.Request().Context(),
        todoID,
        userID,
        s3Key,
        file.Filename,
        file.Size,
        file.Header.Get("Content-Type"),
    )
    if err != nil {
        // Rollback: Delete from S3 if DB insert fails
        s.awsClient.S3.DeleteFile(ctx.Request().Context(), s3Key)
        return nil, err
    }

    return attachment, nil
}
```

**Key Patterns:**
- **Validation first**: Check todo exists before processing
- **Resource cleanup**: `defer src.Close()`
- **Transaction-like behavior**: Rollback S3 upload if DB fails
- **Error wrapping**: `errors.Wrap(err, "context")`

---

## Handler Layer Examples

### Example: Generic Handler Pattern

```go
func (h *TodoHandler) CreateTodo(c echo.Context) error {
    return Handle(
        h.Handler,
        func(c echo.Context, payload *todo.CreateTodoPayload) (*todo.Todo, error) {
            userID := middleware.GetUserID(c)
            return h.todoService.CreateTodo(c, userID, payload)
        },
        http.StatusCreated,
        &todo.CreateTodoPayload{},
    )(c)
}
```

**Breaking Down the `Handle` Function:**

```go
// Generic handler function (from base.go)
func Handle[TPayload any, TResponse any](
    h Handler,
    fn func(c echo.Context, payload *TPayload) (*TResponse, error),
    statusCode int,
    payload *TPayload,
) echo.HandlerFunc {
    return func(c echo.Context) error {
        // STEP 1: Bind request to payload struct
        if err := c.Bind(payload); err != nil {
            return errs.NewBadRequestError("Invalid request", false, nil, nil, nil)
        }

        // STEP 2: Validate payload using struct tags
        if err := c.Validate(payload); err != nil {
            return errs.NewBadRequestError("Validation failed", false, nil, nil, nil)
        }

        // STEP 3: Call service function
        response, err := fn(c, payload)
        if err != nil {
            return err  // Error middleware handles this
        }

        // STEP 4: Return JSON response
        return c.JSON(statusCode, response)
    }
}
```

**Benefits:**
- **DRY**: No repetitive binding/validation code
- **Type-safe**: Generics ensure correct types
- **Consistent**: All handlers follow same pattern

---

## Middleware Examples

### Authentication Middleware

```go
func (auth *AuthMiddleware) RequireAuth(next echo.HandlerFunc) echo.HandlerFunc {
    return echo.WrapMiddleware(
        clerkhttp.WithHeaderAuthorization(
            clerkhttp.AuthorizationFailureHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
                // STEP 1: Handle authentication failure
                start := time.Now()

                w.Header().Set("Content-Type", "application/json")
                w.WriteHeader(http.StatusUnauthorized)

                response := map[string]string{
                    "code":     "UNAUTHORIZED",
                    "message":  "Unauthorized",
                    "override": "false",
                    "status":   "401",
                }

                if err := json.NewEncoder(w).Encode(response); err != nil {
                    auth.server.Logger.Error().Err(err).Msg("failed to write JSON response")
                }
            }))))(func(c echo.Context) error {
        // STEP 2: Extract session claims from Clerk
        start := time.Now()
        claims, ok := clerk.SessionClaimsFromContext(c.Request().Context())

        if !ok {
            auth.server.Logger.Error().Msg("could not get session claims")
            return errs.NewUnauthorizedError("Unauthorized", false)
        }

        // STEP 3: Store user info in Echo context
        c.Set("user_id", claims.Subject)
        c.Set("user_role", claims.ActiveOrganizationRole)
        c.Set("permissions", claims.ActiveOrganizationPermissions)

        auth.server.Logger.Info().
            Str("user_id", claims.Subject).
            Dur("duration", time.Since(start)).
            Msg("user authenticated successfully")

        // STEP 4: Call next handler
        return next(c)
    })
}
```

**Flow:**
1. Clerk SDK validates JWT token
2. Extract user claims (ID, role, permissions)
3. Store in context for downstream handlers
4. Call next middleware/handler

---

## Cron Job Examples

### DueDateRemindersJob

```go
type DueDateRemindersJob struct{}

func (j *DueDateRemindersJob) Name() string {
    return "due-date-reminders"
}

func (j *DueDateRemindersJob) Description() string {
    return "Enqueue email reminders for todos due soon"
}

func (j *DueDateRemindersJob) Run(ctx context.Context, jobCtx *JobContext) error {
    // STEP 1: Fetch todos due in next 24 hours
    todos, err := jobCtx.Repositories.Todo.GetTodosDueInHours(
        ctx,
        jobCtx.Config.Cron.ReminderHours,  // 24
        jobCtx.Config.Cron.BatchSize,      // 100
    )
    if err != nil {
        return err
    }

    jobCtx.Server.Logger.Info().
        Int("todo_count", len(todos)).
        Msg("Found todos due soon")

    // STEP 2: Group todos by user (for logging)
    userTodos := make(map[string][]string)
    enqueuedCount := 0

    // STEP 3: Enqueue email task for each todo
    for _, todo := range todos {
        if len(userTodos[todo.UserID]) < jobCtx.Config.Cron.MaxTodosPerUserNotification {
            userTodos[todo.UserID] = append(userTodos[todo.UserID], todo.Title)
        }

        reminderTask := &job.ReminderEmailTask{
            UserID:    todo.UserID,
            TodoID:    todo.ID,
            TodoTitle: todo.Title,
            DueDate:   *todo.DueDate,
            TaskType:  "due_date_reminder",
        }

        // Enqueue to Asynq (async task queue)
        err := job.EnqueueReminderEmail(jobCtx.JobClient, reminderTask)
        if err != nil {
            jobCtx.Server.Logger.Error().
                Err(err).
                Str("todo_id", todo.ID.String()).
                Msg("Failed to enqueue reminder email")
            continue  // Don't fail entire job for one error
        }

        enqueuedCount++
    }

    // STEP 4: Log summary
    jobCtx.Server.Logger.Info().
        Int("enqueued_count", enqueuedCount).
        Int("total_todos", len(todos)).
        Msg("Due date reminder emails enqueued")

    return nil
}
```

**Key Points:**
- **Batch processing**: Limit to 100 todos per run
- **Error resilience**: Continue on individual failures
- **Async execution**: Enqueue tasks, don't send emails directly
- **Observability**: Comprehensive logging

---

## Job Queue Examples

### Enqueuing a Task

```go
func EnqueueReminderEmail(client *asynq.Client, task *ReminderEmailTask) error {
    // STEP 1: Serialize task to JSON
    payload, err := json.Marshal(task)
    if err != nil {
        return err
    }

    // STEP 2: Create Asynq task
    asynqTask := asynq.NewTask(TaskReminderEmail, payload)

    // STEP 3: Enqueue with options
    _, err = client.Enqueue(
        asynqTask,
        asynq.Queue("critical"),           // High-priority queue
        asynq.MaxRetry(3),                 // Retry up to 3 times
        asynq.Timeout(5*time.Minute),      // Task timeout
        asynq.ProcessIn(10*time.Second),   // Delay before processing
    )

    return err
}
```

### Processing a Task

```go
func (j *JobService) handleReminderEmailTask(ctx context.Context, t *asynq.Task) error {
    // STEP 1: Deserialize task payload
    var task ReminderEmailTask
    if err := json.Unmarshal(t.Payload(), &task); err != nil {
        return err
    }

    // STEP 2: Fetch user email from Clerk
    userEmail, err := j.authService.GetUserEmail(ctx, task.UserID)
    if err != nil {
        return err
    }

    // STEP 3: Render email template
    emailData := map[string]interface{}{
        "TodoTitle": task.TodoTitle,
        "DueDate":   task.DueDate.Format("Jan 2, 2006 at 3:04 PM"),
        "TaskType":  task.TaskType,
    }

    htmlBody, err := j.emailClient.RenderTemplate("reminder", emailData)
    if err != nil {
        return err
    }

    // STEP 4: Send email via Resend
    err = j.emailClient.SendEmail(ctx, &email.Email{
        To:      []string{userEmail},
        Subject: "Reminder: " + task.TodoTitle,
        HTML:    htmlBody,
    })

    if err != nil {
        j.logger.Error().Err(err).Msg("Failed to send reminder email")
        return err  // Asynq will retry
    }

    j.logger.Info().
        Str("user_id", task.UserID).
        Str("todo_id", task.TodoID.String()).
        Msg("Reminder email sent successfully")

    return nil
}
```

---

## Common Go Idioms

### 1. Error Handling Pattern

```go
// Check error immediately after function call
result, err := someFunction()
if err != nil {
    return nil, err  // Propagate error
}

// Use result
fmt.Println(result)
```

### 2. Defer for Cleanup

```go
file, err := os.Open("file.txt")
if err != nil {
    return err
}
defer file.Close()  // Guaranteed to run when function exits

// Work with file
```

### 3. Pointer vs Value

```go
// Value receiver (read-only)
func (t Todo) IsOverdue() bool {
    return t.DueDate != nil && t.DueDate.Before(time.Now())
}

// Pointer receiver (can modify)
func (t *Todo) MarkComplete() {
    now := time.Now()
    t.CompletedAt = &now
    t.Status = StatusCompleted
}
```

### 4. Nil Checks for Pointers

```go
if todo.DueDate != nil {
    fmt.Println("Due:", *todo.DueDate)  // Dereference
} else {
    fmt.Println("No due date")
}
```

### 5. Struct Initialization

```go
// Named fields (recommended)
todo := Todo{
    Title:  "Buy milk",
    Status: StatusActive,
}

// Pointer initialization
todo := &Todo{
    Title: "Buy milk",
}
```

### 6. Context Propagation

```go
func ParentFunction(ctx context.Context) error {
    // Pass context to child functions
    return ChildFunction(ctx)
}

func ChildFunction(ctx context.Context) error {
    // Check if context is cancelled
    select {
    case <-ctx.Done():
        return ctx.Err()
    default:
        // Continue processing
    }
}
```

### 7. Goroutines and Channels

```go
// Start goroutine
go func() {
    // Runs concurrently
    doSomething()
}()

// Channel communication
ch := make(chan string)
go func() {
    ch <- "message"  // Send
}()
msg := <-ch  // Receive (blocks until message available)
```

---

## Summary

This guide covered:

✅ **Application initialization** with dependency injection  
✅ **Repository layer** with SQL queries and error handling  
✅ **Service layer** with business logic and validation  
✅ **Handler layer** with generic request processing  
✅ **Middleware** for authentication and request processing  
✅ **Cron jobs** for scheduled tasks  
✅ **Job queue** for async task processing  
✅ **Common Go idioms** used throughout the codebase  

Each layer has clear responsibilities, making the code maintainable and testable.
