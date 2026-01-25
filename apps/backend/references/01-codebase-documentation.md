# ExecuTask Backend - Comprehensive Codebase Documentation

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Application Architecture](#application-architecture)
4. [Core Components](#core-components)
5. [Data Flow](#data-flow)
6. [Key Features](#key-features)

---

## Overview

**ExecuTask** is a task management backend application built with Go, following clean architecture principles. It provides a RESTful API for managing todos, categories, and comments with features like file attachments, automated reminders, and weekly reports.

### Project Structure
```
apps/backend/
├── cmd/executask/          # Application entry point
├── internal/               # Private application code
│   ├── config/            # Configuration management
│   ├── cron/              # Scheduled jobs
│   ├── database/          # Database connection & migrations
│   ├── errs/              # Custom error types
│   ├── handler/           # HTTP handlers (controllers)
│   ├── lib/               # Shared libraries (AWS, email, jobs)
│   ├── logger/            # Logging infrastructure
│   ├── middleware/        # HTTP middleware
│   ├── model/             # Domain models & DTOs
│   ├── repository/        # Data access layer
│   ├── router/            # Route definitions
│   ├── server/            # Server initialization
│   ├── service/           # Business logic layer
│   ├── sqlerr/            # SQL error handling
│   ├── testing/           # Test utilities
│   └── validation/        # Input validation
├── static/                # Static files
├── templates/             # Email templates
└── go.mod                 # Go module definition
```

---

## Technology Stack

### Core Framework & Language
- **Go 1.24.5**: Primary programming language
- **Echo v4**: High-performance HTTP web framework

### Database & Caching
- **PostgreSQL** (via `pgx/v5`): Primary relational database
- **Redis** (via `go-redis/v9`): Caching and job queue backend

### Background Jobs
- **Asynq**: Distributed task queue for background job processing
- **Cron Jobs**: Scheduled tasks for reminders, reports, and archiving

### External Services
- **Clerk SDK**: Authentication and user management
- **AWS S3**: File storage for todo attachments
- **Resend**: Email delivery service
- **New Relic**: Application performance monitoring (APM) and observability

### Key Libraries
- **zerolog**: Structured logging
- **validator/v10**: Request validation
- **tern**: Database migrations
- **koanf**: Configuration management
- **testcontainers**: Integration testing

---

## Application Architecture

### Clean Architecture Layers

The application follows **Clean Architecture** (also known as Hexagonal Architecture or Ports & Adapters):

```
┌─────────────────────────────────────────────────┐
│              HTTP Layer (Echo)                   │
│                 ↓ Middleware                     │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│           Handlers (Controllers)                 │
│  • Parse HTTP requests                           │
│  • Validate input                                │
│  • Call services                                 │
│  • Format responses                              │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│              Services (Business Logic)           │
│  • Orchestrate operations                        │
│  • Enforce business rules                        │
│  • Coordinate repositories                       │
│  • Handle transactions                           │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│           Repositories (Data Access)             │
│  • Database queries                              │
│  • Data mapping                                  │
│  • SQL operations                                │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│              Database (PostgreSQL)               │
└─────────────────────────────────────────────────┘
```

### Dependency Injection Flow

```go
main.go
  ↓
Server (config, logger, db, redis, job service)
  ↓
Repositories (server) → Data access layer
  ↓
Services (server, repositories, AWS) → Business logic
  ↓
Handlers (server, services) → HTTP handlers
  ↓
Router (server, handlers, services) → Route configuration
```

---

## Core Components

### 1. Server (`internal/server/server.go`)

The **Server** struct is the central dependency container:

```go
type Server struct {
    Config        *config.Config
    Logger        *zerolog.Logger
    LoggerService *loggerPkg.LoggerService
    DB            *database.Database
    Redis         *redis.Client
    httpServer    *http.Server
    Job           *job.JobService
}
```

**Responsibilities:**
- Initialize database connections
- Setup Redis client with New Relic hooks
- Configure background job service
- Manage HTTP server lifecycle
- Graceful shutdown coordination

### 2. Repositories (`internal/repository/`)

Repositories handle **data persistence** and database operations.

**Pattern:** Repository Pattern
- Each domain entity has its own repository
- Repositories are injected with the `Server` instance
- All database queries are centralized here

**Example: TodoRepository**
```go
type TodoRepository struct {
    server *server.Server
}

func NewTodoRepository(server *server.Server) *TodoRepository {
    return &TodoRepository{server: server}
}

func (r *TodoRepository) CreateTodo(ctx context.Context, userID string, payload *todo.CreateTodoPayload) (*todo.Todo, error) {
    // Database operations
}
```

**Key Methods:**
- CRUD operations: `Create`, `GetByID`, `Update`, `Delete`
- Query operations: `GetTodos` (with filtering, pagination)
- Statistics: `GetTodoStats`
- Cron-specific queries: `GetTodosDueInHours`, `GetOverdueTodos`
- Attachment management: `UploadTodoAttachment`, `DeleteTodoAttachment`

### 3. Services (`internal/service/`)

Services contain **business logic** and orchestrate operations across repositories.

**Pattern:** Service Layer Pattern
- Services depend on repositories
- Enforce business rules and validation
- Coordinate multiple repository calls
- Handle external service integration (AWS, email)

**Example: TodoService**
```go
type TodoService struct {
    server       *server.Server
    todoRepo     *repository.TodoRepository
    categoryRepo *repository.CategoryRepository
    awsClient    *aws.AWS
}

func (s *TodoService) CreateTodo(ctx echo.Context, userID string, payload *todo.CreateTodoPayload) (*todo.Todo, error) {
    // 1. Validate category exists
    // 2. Create todo via repository
    // 3. Return result
}
```

**Key Responsibilities:**
- Validate business rules (e.g., category exists before creating todo)
- Coordinate file uploads with AWS S3
- Manage todo lifecycle (create, update, complete, archive)
- Generate presigned URLs for file downloads

### 4. Handlers (`internal/handler/`)

Handlers are **HTTP controllers** that process web requests.

**Pattern:** Handler Pattern (similar to MVC Controllers)
- Parse and validate HTTP requests
- Extract user context from middleware
- Call appropriate service methods
- Format and return HTTP responses

**Example: TodoHandler**
```go
type TodoHandler struct {
    Handler
    todoService *service.TodoService
}

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

**Generic Handler Functions:**
- `Handle`: For operations returning data
- `HandleNoContent`: For operations with no response body (e.g., DELETE)

### 5. Models (`internal/model/`)

Models define **domain entities** and **data transfer objects (DTOs)**.

**Base Model:**
```go
type Base struct {
    BaseWithId        // ID uuid.UUID
    BaseWithCreatedAt // CreatedAt time.Time
    BaseWithUpdatedAt // UpdatedAt time.Time
}
```

**Domain Model Example:**
```go
type Todo struct {
    model.Base
    UserID       string
    Title        string
    Description  string
    Priority     Priority   // Enum: low, medium, high
    Status       Status     // Enum: draft, active, completed, archived
    DueDate      *time.Time // Nullable
    CompletedAt  *time.Time
    ParentTodoID *uuid.UUID
    CategoryID   *uuid.UUID
    Metadata     *Metadata
    SortOrder    int
}
```

**Populated Models:**
- Include related entities (e.g., `PopulatedTodo` includes category, children, comments, attachments)
- Used for API responses with nested data

### 6. Middleware (`internal/middleware/`)

Middleware functions process requests **before they reach handlers**.

**Key Middleware:**

**Authentication (`auth.go`):**
```go
func (auth *AuthMiddleware) RequireAuth(next echo.HandlerFunc) echo.HandlerFunc {
    // 1. Verify Clerk session token
    // 2. Extract user claims
    // 3. Set user_id, user_role, permissions in context
    // 4. Call next handler
}
```

**Other Middleware:**
- **Request ID**: Assigns unique ID to each request for tracing
- **Rate Limiting**: Prevents abuse
- **Tracing**: New Relic distributed tracing
- **Context**: Custom context management
- **Global**: CORS, logging, recovery

### 7. Cron Jobs (`internal/cron/`)

Scheduled background jobs for automated tasks.

**Job Interface:**
```go
type Job interface {
    Name() string
    Description() string
    Run(ctx context.Context, jobCtx *JobContext) error
}
```

**Implemented Jobs:**

1. **DueDateRemindersJob**: Sends email reminders for todos due soon
2. **OverdueNotificationsJob**: Notifies users about overdue todos
3. **WeeklyReportsJob**: Generates weekly productivity reports
4. **AutoArchiveJob**: Archives old completed todos

**Job Scheduling (`registry.go`):**
```go
func RegisterJobs(scheduler *gocron.Scheduler, jobCtx *JobContext) {
    scheduler.Every(1).Hour().Do(runJob, &DueDateRemindersJob{}, jobCtx)
    scheduler.Every(6).Hours().Do(runJob, &OverdueNotificationsJob{}, jobCtx)
    scheduler.Every(1).Week().Do(runJob, &WeeklyReportsJob{}, jobCtx)
    scheduler.Every(1).Day().Do(runJob, &AutoArchiveJob{}, jobCtx)
}
```

### 8. Job Queue (`internal/lib/job/`)

Asynchronous task processing using **Asynq** (Redis-backed queue).

**JobService:**
```go
type JobService struct {
    Client      *asynq.Client  // Enqueues tasks
    server      *asynq.Server  // Processes tasks
    logger      *zerolog.Logger
    authService AuthServiceInterface
    emailClient *email.Client
}
```

**Task Types:**
- `TaskWelcome`: Welcome email for new users
- `TaskReminderEmail`: Due date and overdue reminders
- `TaskWeeklyReportEmail`: Weekly productivity reports

**Queue Priorities:**
- `critical`: 6 (important emails)
- `default`: 3 (most emails)
- `low`: 1 (non-urgent emails)

### 9. Email Service (`internal/lib/email/`)

Email delivery using **Resend API**.

**Features:**
- HTML email templates (using Go templates)
- Email preview in development
- Template rendering with dynamic data
- Support for multiple email types (welcome, reminder, weekly report)

---

## Data Flow

### Example: Creating a Todo

```
1. HTTP POST /api/v1/todos
   ↓
2. Router → TodoHandler.CreateTodo
   ↓
3. Middleware: RequireAuth (extract userID)
   ↓
4. Handler: Parse & validate CreateTodoPayload
   ↓
5. TodoService.CreateTodo
   ↓
6. Service: Validate category exists (if provided)
   ↓
7. TodoRepository.CreateTodo
   ↓
8. Repository: Execute SQL INSERT
   ↓
9. Return Todo entity up the stack
   ↓
10. Handler: Format JSON response (201 Created)
```

### Example: Cron Job Flow

```
1. Cron Scheduler triggers DueDateRemindersJob
   ↓
2. Job.Run(ctx, jobCtx)
   ↓
3. TodoRepository.GetTodosDueInHours(24)
   ↓
4. For each todo:
   a. Create ReminderEmailTask
   b. EnqueueReminderEmail (Asynq)
   ↓
5. Asynq worker picks up task
   ↓
6. handleReminderEmailTask
   ↓
7. Fetch user email from Clerk
   ↓
8. Render email template
   ↓
9. Send via Resend API
```

---

## Key Features

### 1. Authentication & Authorization
- **Clerk SDK** for user management
- Session-based authentication
- User ID extraction from JWT claims
- Role-based access control (stored in context)

### 2. File Attachments
- Upload files to **AWS S3**
- Store metadata in PostgreSQL
- Generate presigned URLs for secure downloads
- Support for multiple file types

### 3. Automated Notifications
- **Due date reminders**: Sent 24 hours before due date
- **Overdue notifications**: Daily checks for overdue todos
- **Weekly reports**: Summary of completed/active/overdue todos

### 4. Data Pagination & Filtering
- Generic `PaginatedResponse[T]` type
- Filter by status, priority, category, due date
- Search by title/description
- Sorting support

### 5. Observability
- **New Relic APM**: Performance monitoring
- **Structured logging** with zerolog
- Request tracing with unique request IDs
- Database query instrumentation

### 6. Background Job Processing
- **Asynq** for async task execution
- Priority-based queues
- Retry mechanisms
- Job monitoring and metrics

### 7. Database Migrations
- **Tern** migration tool
- Version-controlled schema changes
- Automatic migration on startup (non-local environments)

---

## Summary

The ExecuTask backend is a well-architected Go application that demonstrates:

✅ **Clean Architecture**: Clear separation of concerns across layers  
✅ **Dependency Injection**: Centralized dependency management via Server struct  
✅ **Repository Pattern**: Abstracted data access layer  
✅ **Service Layer**: Business logic isolation  
✅ **Background Jobs**: Cron scheduling + async task queue  
✅ **Observability**: Comprehensive logging and monitoring  
✅ **Type Safety**: Strong typing with Go's type system  
✅ **Scalability**: Redis-backed job queue, connection pooling  

This architecture makes the codebase maintainable, testable, and easy to extend with new features.
