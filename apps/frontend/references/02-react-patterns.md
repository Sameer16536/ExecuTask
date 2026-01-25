# ExecuTask Frontend - React Patterns & Concepts

## Table of Contents
1. [React Hooks](#react-hooks)
2. [Component Composition](#component-composition)
3. [Custom Hooks](#custom-hooks)
4. [Form Handling](#form-handling)
5. [TypeScript Patterns](#typescript-patterns)
6. [Animation Patterns](#animation-patterns)
7. [API Integration](#api-integration)

---

## React Hooks

### useState - Local Component State

```tsx
const [isOpen, setIsOpen] = useState(false);
const [filters, setFilters] = useState({
  status: '',
  priority: '',
  search: '',
});

// Update object state
setFilters({ ...filters, status: 'active' });
```

### useEffect - Side Effects

```tsx
useEffect(() => {
  // Run on mount
  fetchData();
  
  // Cleanup on unmount
  return () => {
    cleanup();
  };
}, [dependency]); // Re-run when dependency changes
```

### Custom Hooks - Reusable Logic

```tsx
// features/todos/hooks/use-todos.ts
export function useTodos(params: TodosQueryParams) {
  const apiClient = useApiClient();
  
  return useQuery({
    queryKey: ['todos', params],
    queryFn: async () => {
      const response = await apiClient.v1.todos.getTodos({ query: params });
      if (response.status === 200) {
        return response.body;
      }
      throw new Error('Failed to fetch todos');
    },
  });
}

// Usage in component
const { data, isLoading, error } = useTodos({ status: 'active' });
```

---

## Component Composition

### Container/Presentational Pattern

**Container Component** (Smart - handles logic):
```tsx
// features/todos/pages/todos-page.tsx
export function TodosPage() {
  const [filters, setFilters] = useState({});
  const { data, isLoading } = useTodos(filters);
  
  return (
    <div>
      <TodoFilters filters={filters} onChange={setFilters} />
      <TodoList todos={data?.data || []} isLoading={isLoading} />
    </div>
  );
}
```

**Presentational Component** (Dumb - just renders):
```tsx
// features/todos/components/todo-list.tsx
interface TodoListProps {
  todos: Todo[];
  isLoading?: boolean;
}

export function TodoList({ todos, isLoading }: TodoListProps) {
  if (isLoading) return <LoadingSkeleton />;
  if (todos.length === 0) return <EmptyState />;
  
  return (
    <div>
      {todos.map(todo => <TodoItem key={todo.id} todo={todo} />)}
    </div>
  );
}
```

### Compound Components

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create Todo</DialogTitle>
    </DialogHeader>
    <TodoForm onSuccess={() => setIsOpen(false)} />
  </DialogContent>
</Dialog>
```

---

## Custom Hooks

### Data Fetching Hook

```tsx
// features/todos/hooks/use-todos.ts
export function useTodos(params: TodosQueryParams = {}) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: ['todos', params],
    queryFn: async () => {
      const response = await apiClient.v1.todos.getTodos({ query: params });
      return response.body;
    },
  });
}
```

**Why use custom hooks?**
- ✅ Reusable across components
- ✅ Encapsulates complex logic
- ✅ Easy to test
- ✅ Automatic caching with TanStack Query

### Mutation Hook

```tsx
// features/todos/hooks/use-todo-mutations.ts
export function useCreateTodo() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTodoInput) => {
      const response = await apiClient.v1.todos.createTodo({ body: data });
      return response.body;
    },
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['todo-stats'] });
      toast.success('Todo created!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Usage
const createTodo = useCreateTodo();
await createTodo.mutateAsync(formData);
```

---

## Form Handling

### React Hook Form + Zod

**Schema Definition:**
```tsx
import { z } from 'zod';

const todoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(5000),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().optional(),
});

type TodoFormData = z.infer<typeof todoSchema>;
```

**Form Component:**
```tsx
export function TodoForm({ onSuccess }: TodoFormProps) {
  const createTodo = useCreateTodo();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TodoFormData>({
    resolver: zodResolver(todoSchema),
    defaultValues: {
      priority: 'medium',
    },
  });

  const onSubmit = async (data: TodoFormData) => {
    await createTodo.mutateAsync(data);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('title')} />
      {errors.title && <p>{errors.title.message}</p>}
      
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Create'}
      </Button>
    </form>
  );
}
```

**Key Concepts:**
- **`register`**: Connects input to form state
- **`handleSubmit`**: Validates and calls onSubmit
- **`formState.errors`**: Validation errors
- **`zodResolver`**: Integrates Zod validation

---

## TypeScript Patterns

### Type-Safe Props

```tsx
interface TodoItemProps {
  todo: Todo;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function TodoItem({ todo, onEdit, onDelete }: TodoItemProps) {
  // TypeScript ensures todo has correct shape
  return <div>{todo.title}</div>;
}
```

### Generic Components

```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <div>
      {items.map(item => (
        <div key={keyExtractor(item)}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}

// Usage
<List
  items={todos}
  renderItem={(todo) => <TodoItem todo={todo} />}
  keyExtractor={(todo) => todo.id}
/>
```

### Type Inference with Zod

```tsx
const todoSchema = z.object({
  title: z.string(),
  priority: z.enum(['low', 'medium', 'high']),
});

// TypeScript automatically infers type
type TodoFormData = z.infer<typeof todoSchema>;
// { title: string; priority: 'low' | 'medium' | 'high' }
```

---

## Animation Patterns

### Framer Motion Variants

**Define Reusable Variants:**
```tsx
// lib/animations.ts
export const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

export const listContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // Animate children one by one
    },
  },
};
```

**Use in Components:**
```tsx
<motion.div
  variants={listContainerVariants}
  initial="hidden"
  animate="show"
>
  {todos.map(todo => (
    <motion.div key={todo.id} variants={listItemVariants}>
      <TodoItem todo={todo} />
    </motion.div>
  ))}
</motion.div>
```

### Hover Animations

```tsx
const cardHoverVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.02 },
};

<motion.div
  variants={cardHoverVariants}
  initial="rest"
  whileHover="hover"
>
  <Card />
</motion.div>
```

### Conditional Animations

```tsx
{showActions && (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
  >
    <ActionButtons />
  </motion.div>
)}
```

---

## API Integration

### ts-rest Client

**Setup:**
```tsx
// api/index.ts
export const useApiClient = () => {
  const { getToken } = useAuth();
  
  return initClient(apiContract, {
    baseUrl: '',
    api: async ({ path, method, headers, body }) => {
      const token = await getToken({ template: 'custom' });
      
      const result = await axios.request({
        method: method as Method,
        url: `${API_URL}/api${path}`,
        headers: {
          ...headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        data: body,
      });
      
      return {
        status: result.status,
        body: result.data,
        headers: result.headers,
      };
    },
  });
};
```

**Usage:**
```tsx
const apiClient = useApiClient();

// Type-safe API call
const response = await apiClient.v1.todos.getTodos({
  query: {
    page: 1,
    limit: 20,
    status: 'active',
  },
});

// TypeScript knows the response shape
if (response.status === 200) {
  const todos = response.body; // Typed!
}
```

---

## Common Patterns

### Conditional Rendering

```tsx
{isLoading && <Skeleton />}
{error && <ErrorMessage error={error} />}
{data && <TodoList todos={data} />}
```

### List Rendering

```tsx
{todos.map(todo => (
  <TodoItem key={todo.id} todo={todo} />
))}
```

### Event Handlers

```tsx
const handleClick = (id: string) => {
  console.log('Clicked:', id);
};

<button onClick={() => handleClick(todo.id)}>
  Click me
</button>
```

### Controlled Components

```tsx
const [value, setValue] = useState('');

<input
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

---

## Summary

| Pattern | Purpose | Example |
|---------|---------|---------|
| **Custom Hooks** | Reusable logic | `useTodos()`, `useCreateTodo()` |
| **Component Composition** | Build complex UIs | `<Dialog><DialogContent /></Dialog>` |
| **React Hook Form** | Form management | `useForm()`, `register()` |
| **Zod** | Validation | `z.object({ title: z.string() })` |
| **Framer Motion** | Animations | `<motion.div variants={...} />` |
| **TypeScript** | Type safety | Interfaces, generics, type inference |
| **TanStack Query** | Data fetching | `useQuery()`, `useMutation()` |

These patterns make the codebase maintainable, type-safe, and performant.
