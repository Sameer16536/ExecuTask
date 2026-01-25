# ExecuTask Backend - Go Patterns & Concepts Explained

## Table of Contents
1. [Pointers in Go](#pointers-in-go)
2. [Receiver Functions](#receiver-functions)
3. [Struct Embedding](#struct-embedding)
4. [Interfaces](#interfaces)
5. [Dependency Injection](#dependency-injection)
6. [Generics](#generics)
7. [Enums (Type Aliases)](#enums-type-aliases)
8. [Error Handling](#error-handling)
9. [Context Usage](#context-usage)
10. [Functional Options](#functional-options)

---

## Pointers in Go

### What is a Pointer?

A pointer holds the **memory address** of a value, not the value itself.

```go
var x int = 42
var p *int = &x  // p points to x's memory address

fmt.Println(x)   // 42
fmt.Println(p)   // 0xc000012345 (memory address)
fmt.Println(*p)  // 42 (dereference to get value)
```

### Why Use Pointers?

#### 1. **Avoid Copying Large Structs**

```go
// ❌ BAD: Copies entire struct (expensive)
func UpdateTodo(todo Todo) {
    todo.Title = "Updated"  // Modifies copy, not original
}

// ✅ GOOD: Passes memory address (cheap)
func UpdateTodo(todo *Todo) {
    todo.Title = "Updated"  // Modifies original
}
```

**Example from codebase:**
```go
// internal/repository/todo.go
func (r *TodoRepository) CreateTodo(
    ctx context.Context, 
    userID string, 
    payload *todo.CreateTodoPayload,  // Pointer: avoid copying
) (*todo.Todo, error) {
    // ...
}
```

#### 2. **Nullable Fields**

Pointers can be `nil`, representing "no value" (like SQL NULL).

```go
type Todo struct {
    Title       string     // Required (cannot be nil)
    DueDate     *time.Time // Optional (can be nil)
    CategoryID  *uuid.UUID // Optional
}

// Usage
todo := Todo{
    Title:   "Buy milk",
    DueDate: nil,  // No due date set
}

if todo.DueDate != nil {
    fmt.Println("Due:", *todo.DueDate)
}
```

**From codebase:**
```go
// internal/model/todo/todo.go
type Todo struct {
    DueDate      *time.Time `json:"dueDate" db:"due_date"`
    CompletedAt  *time.Time `json:"completedAt" db:"completed_at"`
    ParentTodoID *uuid.UUID `json:"parentTodoId" db:"parent_todo_id"`
    CategoryID   *uuid.UUID `json:"categoryId" db:"category_id"`
    Metadata     *Metadata  `json:"metadata" db:"metadata"`
}
```

#### 3. **Mutability**

Pointers allow functions to modify the original value.

```go
func MarkComplete(todo *Todo) {
    now := time.Now()
    todo.CompletedAt = &now
    todo.Status = StatusCompleted
}
```

---

## Receiver Functions

### What are Receiver Functions?

Methods attached to a type (like class methods in OOP).

```go
type TodoRepository struct {
    server *server.Server
}

// Method with receiver
func (r *TodoRepository) CreateTodo(...) error {
    // r is the receiver (like 'this' or 'self')
}
```

### Value Receiver vs Pointer Receiver

#### **Value Receiver** (copies the struct)
```go
func (t Todo) IsOverdue() bool {
    return t.DueDate != nil && t.DueDate.Before(time.Now())
}
```
- **Use when:** Method doesn't modify the struct
- **Benefit:** Safe (cannot accidentally modify)

#### **Pointer Receiver** (references original)
```go
func (r *TodoRepository) CreateTodo(...) error {
    // Can access r.server
}
```
- **Use when:** 
  - Method modifies the struct
  - Struct is large (avoid copying)
  - Need consistency (if any method uses pointer, all should)

**From codebase:**
```go
// internal/model/todo/todo.go

// Value receiver: read-only check
func (t *Todo) IsOverdue() bool {
    return t.DueDate != nil && 
           t.DueDate.Before(time.Now()) && 
           t.Status != StatusCompleted
}

// Value receiver: read-only check
func (t *Todo) CanHaveChildren() bool {
    return t.ParentTodoID == nil
}
```

**Why pointer receiver for repositories?**
```go
// internal/repository/todo.go
type TodoRepository struct {
    server *server.Server  // Contains DB connection, logger, etc.
}

func (r *TodoRepository) CreateTodo(...) error {
    // r.server is accessible
    // Avoids copying the entire repository struct
}
```

---

## Struct Embedding

### What is Struct Embedding?

Embedding a struct inside another to **inherit** its fields and methods.

```go
type BaseWithId struct {
    ID uuid.UUID `json:"id"`
}

type BaseWithCreatedAt struct {
    CreatedAt time.Time `json:"createdAt"`
}

type Base struct {
    BaseWithId         // Embedded
    BaseWithCreatedAt  // Embedded
    BaseWithUpdatedAt
}

type Todo struct {
    model.Base  // Inherits ID, CreatedAt, UpdatedAt
    Title  string
    Status Status
}
```

**Usage:**
```go
todo := Todo{
    Base: model.Base{
        BaseWithId: model.BaseWithId{ID: uuid.New()},
    },
    Title: "Learn Go",
}

// Access embedded fields directly
fmt.Println(todo.ID)        // Not todo.Base.ID
fmt.Println(todo.CreatedAt)
```

**From codebase:**
```go
// internal/model/base.go
type Base struct {
    BaseWithId
    BaseWithCreatedAt
    BaseWithUpdatedAt
}

// internal/model/todo/todo.go
type Todo struct {
    model.Base  // Embedded
    UserID      string
    Title       string
    // ...
}

// internal/handler/todo.go
type TodoHandler struct {
    Handler  // Embedded (inherits server, logger, etc.)
    todoService *service.TodoService
}
```

---

## Interfaces

### What is an Interface?

A contract defining **what methods** a type must implement.

```go
type Job interface {
    Name() string
    Description() string
    Run(ctx context.Context, jobCtx *JobContext) error
}
```

Any type implementing these 3 methods satisfies the `Job` interface.

**Example Implementation:**
```go
type DueDateRemindersJob struct{}

func (j *DueDateRemindersJob) Name() string {
    return "due-date-reminders"
}

func (j *DueDateRemindersJob) Description() string {
    return "Enqueue email reminders for todos due soon"
}

func (j *DueDateRemindersJob) Run(ctx context.Context, jobCtx *JobContext) error {
    // Implementation
}
```

### Why Use Interfaces?

#### 1. **Polymorphism**
```go
func runJob(job Job, ctx *JobContext) {
    log.Info(job.Name())
    job.Run(context.Background(), ctx)
}

// Can pass ANY type implementing Job
runJob(&DueDateRemindersJob{}, ctx)
runJob(&WeeklyReportsJob{}, ctx)
```

#### 2. **Dependency Injection & Testing**
```go
// internal/lib/job/job.go
type AuthServiceInterface interface {
    GetUserEmail(ctx context.Context, userID string) (string, error)
}

type JobService struct {
    authService AuthServiceInterface  // Interface, not concrete type
}

// In tests, inject a mock
type MockAuthService struct{}
func (m *MockAuthService) GetUserEmail(...) (string, error) {
    return "test@example.com", nil
}
```

---

## Dependency Injection

### What is Dependency Injection?

Passing dependencies to a struct/function instead of creating them inside.

**❌ Without DI (tight coupling):**
```go
type TodoService struct{}

func NewTodoService() *TodoService {
    db := database.Connect()  // Hard-coded dependency
    return &TodoService{db: db}
}
```

**✅ With DI (loose coupling):**
```go
type TodoService struct {
    server   *server.Server
    todoRepo *repository.TodoRepository
}

func NewTodoService(server *server.Server, todoRepo *repository.TodoRepository) *TodoService {
    return &TodoService{
        server:   server,
        todoRepo: todoRepo,
    }
}
```

### DI in ExecuTask

**Dependency Flow:**
```go
// cmd/executask/main.go

// 1. Create server (root dependency)
srv, err := server.New(cfg, &log, loggerService)

// 2. Inject server into repositories
repos := repository.NewRepositories(srv)

// 3. Inject server + repos into services
services, err := service.NewServices(srv, repos)

// 4. Inject server + services into handlers
handlers := handler.NewHandlers(srv, services)

// 5. Inject everything into router
r := router.NewRouter(srv, handlers, services)
```

**Example:**
```go
// internal/service/services.go
func NewServices(s *server.Server, repos *repository.Repositories) (*Services, error) {
    authService := NewAuthService(s)
    awsClient, err := aws.NewAWS(s)
    
    return &Services{
        Auth:     authService,
        Category: NewCategoryService(s, repos.Category),
        Comment:  NewCommentService(s, repos.Comment, repos.Todo),
        Todo:     NewTodoService(s, repos.Todo, repos.Category, awsClient),
    }, nil
}
```

---

## Generics

### What are Generics?

Type parameters that allow writing reusable code for multiple types.

**Example from codebase:**
```go
// internal/model/base.go
type PaginatedResponse[T interface{}] struct {
    Data       []T `json:"data"`
    Page       int `json:"page"`
    Limit      int `json:"limit"`
    Total      int `json:"total"`
    TotalPages int `json:"totalPages"`
}
```

**Usage:**
```go
// Can use with any type
response1 := PaginatedResponse[todo.PopulatedTodo]{
    Data: []todo.PopulatedTodo{...},
    Page: 1,
}

response2 := PaginatedResponse[category.Category]{
    Data: []category.Category{...},
    Page: 1,
}
```

**Handler Example:**
```go
// internal/handler/todo.go
func (h *TodoHandler) GetTodos(c echo.Context) error {
    return Handle(
        h.Handler,
        func(c echo.Context, query *todo.GetTodosQuery) (*model.PaginatedResponse[todo.PopulatedTodo], error) {
            userID := middleware.GetUserID(c)
            return h.todoService.GetTodos(c, userID, query)
        },
        http.StatusOK,
        &todo.GetTodosQuery{},
    )(c)
}
```

---

## Enums (Type Aliases)

Go doesn't have native enums, but uses **type aliases + constants**.

```go
// internal/model/todo/todo.go

// Define custom type
type Status string

// Define allowed values
const (
    StatusDraft     Status = "draft"
    StatusActive    Status = "active"
    StatusCompleted Status = "completed"
    StatusArchived  Status = "archived"
)

type Priority string

const (
    PriorityLow    Priority = "low"
    PriorityMedium Priority = "medium"
    PriorityHigh   Priority = "high"
)
```

**Benefits:**
- **Type safety**: Cannot assign arbitrary strings
- **Autocomplete**: IDE suggests valid values
- **Documentation**: Clear allowed values

**Usage:**
```go
todo := Todo{
    Status:   StatusActive,  // ✅ Type-safe
    Priority: PriorityHigh,
}

// ❌ Compile error (if strict validation)
todo.Status = "invalid"
```

---

## Error Handling

### Go's Error Pattern

Go uses **explicit error returns** instead of exceptions.

```go
func (r *TodoRepository) GetTodoByID(ctx context.Context, id uuid.UUID) (*todo.Todo, error) {
    var t todo.Todo
    err := r.server.DB.Pool.QueryRow(ctx, query, id).Scan(&t)
    if err != nil {
        if errors.Is(err, pgx.ErrNoRows) {
            return nil, errs.NewNotFoundError("Todo not found")
        }
        return nil, err
    }
    return &t, nil
}
```

### Custom Error Types

```go
// internal/errs/types.go
func NewNotFoundError(message string) *HTTPError {
    return &HTTPError{
        Code:    "NOT_FOUND",
        Message: message,
        Status:  404,
    }
}

func NewBadRequestError(message string, override bool, ...) *HTTPError {
    return &HTTPError{
        Code:     "BAD_REQUEST",
        Message:  message,
        Status:   400,
        Override: override,
    }
}
```

### Error Wrapping

```go
// Add context to errors
if err != nil {
    return nil, fmt.Errorf("failed to create todo: %w", err)
}
```

---

## Context Usage

### What is Context?

A `context.Context` carries:
- **Deadlines**: Request timeouts
- **Cancellation signals**: Stop long-running operations
- **Request-scoped values**: User ID, request ID, etc.

**Example:**
```go
func (r *TodoRepository) CreateTodo(ctx context.Context, ...) error {
    // ctx passed to database query
    err := r.server.DB.Pool.QueryRow(ctx, query, args...).Scan(...)
    
    // If request is cancelled, query stops
}
```

**Middleware Setting Context Values:**
```go
// internal/middleware/auth.go
func (auth *AuthMiddleware) RequireAuth(next echo.HandlerFunc) echo.HandlerFunc {
    return func(c echo.Context) error {
        claims, ok := clerk.SessionClaimsFromContext(c.Request().Context())
        
        // Set values in Echo context
        c.Set("user_id", claims.Subject)
        c.Set("user_role", claims.ActiveOrganizationRole)
        
        return next(c)
    }
}
```

**Retrieving Context Values:**
```go
// internal/middleware/context.go
func GetUserID(c echo.Context) string {
    userID, ok := c.Get("user_id").(string)
    if !ok {
        return ""
    }
    return userID
}
```

---

## Functional Options

### Pattern for Flexible Initialization

**Example (not in codebase, but common pattern):**
```go
type ServerOptions struct {
    Port    int
    Timeout time.Duration
}

type ServerOption func(*ServerOptions)

func WithPort(port int) ServerOption {
    return func(opts *ServerOptions) {
        opts.Port = port
    }
}

func WithTimeout(timeout time.Duration) ServerOption {
    return func(opts *ServerOptions) {
        opts.Timeout = timeout
    }
}

func NewServer(options ...ServerOption) *Server {
    opts := &ServerOptions{
        Port:    8080,  // Defaults
        Timeout: 30 * time.Second,
    }
    
    for _, option := range options {
        option(opts)
    }
    
    return &Server{options: opts}
}

// Usage
server := NewServer(
    WithPort(3000),
    WithTimeout(60 * time.Second),
)
```

---

## Summary

| Pattern | Purpose | Example |
|---------|---------|---------|
| **Pointers** | Avoid copying, nullable fields, mutability | `*Todo`, `*time.Time` |
| **Receiver Functions** | Methods on types | `func (r *TodoRepository) CreateTodo()` |
| **Struct Embedding** | Composition/inheritance | `Todo` embeds `model.Base` |
| **Interfaces** | Polymorphism, testability | `Job` interface for cron jobs |
| **Dependency Injection** | Loose coupling | Passing `*server.Server` to constructors |
| **Generics** | Type-safe reusable code | `PaginatedResponse[T]` |
| **Enums** | Type-safe constants | `Status`, `Priority` |
| **Error Handling** | Explicit error returns | `return nil, err` |
| **Context** | Request lifecycle, cancellation | `ctx context.Context` |

These patterns make Go code **safe, maintainable, and performant**.
