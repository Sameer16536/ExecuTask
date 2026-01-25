# ExecuTask Frontend - Architecture Documentation

## Overview

Modern React frontend for ExecuTask built with TypeScript, TanStack Query, and shadcn/ui components. Features smooth animations, responsive design, and optimized performance.

## Technology Stack

### Core Framework
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server

### State Management & Data Fetching
- **TanStack Query v5** - Server state management
- **React Hook Form** - Form state management
- **Zod** - Schema validation

### UI & Styling
- **Tailwind CSS v4** - Utility-first CSS
- **shadcn/ui** - Accessible component library (New York style)
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

### Authentication & API
- **Clerk** - Authentication and user management
- **ts-rest** - Type-safe API client
- **Axios** - HTTP client

### Developer Experience
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Sonner** - Toast notifications

---

## Project Structure

```
apps/frontend/src/
├── api/                    # API client configuration
│   ├── index.ts           # ts-rest client setup
│   ├── types.ts           # API type definitions
│   └── utils.ts           # API utilities
│
├── components/            # Shared components
│   ├── layout/           # Layout components
│   │   ├── app-layout.tsx
│   │   └── sidebar.tsx
│   └── ui/               # shadcn/ui components
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       └── ...
│
├── config/               # Configuration
│   ├── env.ts           # Environment variables
│   └── query-client.ts  # TanStack Query config
│
├── features/            # Feature-based modules
│   ├── auth/           # Authentication
│   │   └── pages/
│   │       ├── sign-in-page.tsx
│   │       └── sign-up-page.tsx
│   │
│   ├── dashboard/      # Dashboard
│   │   └── pages/
│   │       └── dashboard-page.tsx
│   │
│   ├── todos/          # Todo management
│   │   ├── components/
│   │   │   ├── todo-form.tsx
│   │   │   ├── todo-item.tsx
│   │   │   └── todo-list.tsx
│   │   ├── hooks/
│   │   │   ├── use-todos.ts
│   │   │   └── use-todo-mutations.ts
│   │   └── pages/
│   │       └── todos-page.tsx
│   │
│   └── categories/     # Category management
│       ├── hooks/
│       │   └── use-categories.ts
│       └── pages/
│           └── categories-page.tsx
│
├── hooks/              # Global custom hooks
│
├── lib/                # Utility libraries
│   ├── animations.ts   # Framer Motion variants
│   └── utils.ts        # Helper functions
│
├── providers/          # Context providers
│   └── app-provider.tsx
│
├── App.tsx             # Root component
├── main.tsx            # Application entry
└── index.css           # Global styles
```

---

## Architecture Patterns

### 1. Feature-Based Organization

Each feature is self-contained with its own components, hooks, and pages:

```
features/todos/
├── components/    # Todo-specific components
├── hooks/         # Todo-specific hooks
└── pages/         # Todo pages
```

**Benefits:**
- ✅ Easy to find related code
- ✅ Scalable as features grow
- ✅ Clear boundaries between features

### 2. Component Composition

Components are built using composition over inheritance:

```tsx
// Page composes smaller components
<TodosPage>
  <TodoFilters />
  <TodoList>
    <TodoItem />
  </TodoList>
  <CreateTodoDialog>
    <TodoForm />
  </CreateTodoDialog>
</TodosPage>
```

### 3. Custom Hooks for Data Fetching

All API calls are abstracted into custom hooks:

```tsx
// features/todos/hooks/use-todos.ts
export function useTodos(params: TodosQueryParams) {
  const apiClient = useApiClient();
  
  return useQuery({
    queryKey: ['todos', params],
    queryFn: async () => {
      const response = await apiClient.v1.todos.getTodos({ query: params });
      return response.body;
    },
  });
}

// Usage in component
const { data, isLoading } = useTodos({ status: 'active' });
```

**Benefits:**
- ✅ Reusable across components
- ✅ Automatic caching and refetching
- ✅ Type-safe API calls

---

## State Management

### Server State (TanStack Query)

**Configuration:**
```tsx
// config/query-client.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 minutes
      gcTime: 1000 * 60 * 10,     // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

**Query Keys:**
```tsx
['todos']                    // All todos
['todos', { status: 'active' }]  // Filtered todos
['todo', id]                 // Single todo
['todo-stats']               // Todo statistics
['categories']               // All categories
```

**Mutations with Optimistic Updates:**
```tsx
export function useCreateTodo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.v1.todos.createTodo({ body: data });
      return response.body;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['todo-stats'] });
      toast.success('Todo created!');
    },
  });
}
```

### Form State (React Hook Form + Zod)

```tsx
const todoSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000),
  priority: z.enum(['low', 'medium', 'high']),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(todoSchema),
});
```

---

## Routing

### Route Structure

```tsx
// App.tsx
<Routes>
  {/* Public routes */}
  <Route path="/sign-in/*" element={<SignInPage />} />
  <Route path="/sign-up/*" element={<SignUpPage />} />
  
  {/* Protected routes */}
  <Route element={<AppLayout />}>
    <Route path="/" element={<DashboardPage />} />
    <Route path="/todos" element={<TodosPage />} />
    <Route path="/categories" element={<CategoriesPage />} />
  </Route>
</Routes>
```

### Protected Routes with Clerk

```tsx
<SignedOut>
  {/* Show sign-in page */}
</SignedOut>

<SignedIn>
  {/* Show app content */}
</SignedIn>
```

---

## Authentication

### Clerk Integration

**Setup:**
```tsx
// providers/app-provider.tsx
<ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </QueryClientProvider>
</ClerkProvider>
```

**API Client with Auth:**
```tsx
// api/index.ts
export const useApiClient = () => {
  const { getToken } = useAuth();
  
  return initClient(apiContract, {
    api: async ({ path, method, headers, body }) => {
      const token = await getToken({ template: 'custom' });
      
      const result = await axios.request({
        url: `${API_URL}/api${path}`,
        headers: {
          ...headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        data: body,
      });
      
      return { status: result.status, body: result.data };
    },
  });
};
```

---

## Styling

### Tailwind CSS

**Configuration:**
- Base color: Neutral
- CSS variables for theming
- Dark mode support (class-based)

**Common Patterns:**
```tsx
// Card with hover effect
<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-700 dark:bg-gray-800">

// Button
<button className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">

// Input
<input className="rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800">
```

### shadcn/ui Components

Pre-built accessible components:
- Button, Dialog, Input, Label
- Select, Textarea, Badge
- Card, Skeleton
- All customizable with Tailwind

---

## Animations

### Framer Motion Variants

```tsx
// lib/animations.ts
export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

// Usage
<motion.div
  variants={pageVariants}
  initial="initial"
  animate="animate"
  exit="exit"
>
  {content}
</motion.div>
```

---

## Key Features

### 1. Real-time Data Sync
- TanStack Query automatically refetches on window focus
- Mutations invalidate related queries
- Optimistic updates for instant feedback

### 2. Loading States
- Skeleton loaders for better UX
- Loading indicators on buttons
- Graceful error handling

### 3. Form Validation
- Zod schema validation
- Real-time error messages
- Type-safe form data

### 4. Responsive Design
- Mobile-first approach
- Collapsible sidebar on mobile
- Responsive grid layouts

### 5. Accessibility
- shadcn/ui components are ARIA-compliant
- Keyboard navigation support
- Focus management in dialogs

---

## Performance Optimizations

1. **Code Splitting**: Automatic route-based splitting with Vite
2. **Query Caching**: 5-minute stale time, 10-minute garbage collection
3. **Lazy Loading**: Components loaded on demand
4. **Optimistic Updates**: Instant UI feedback
5. **Debounced Search**: Prevents excessive API calls

---

## Development Workflow

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build

# Run linter
bun run lint

# Format code
bun run format
```

---

## Environment Variables

```env
VITE_API_URL=http://localhost:8080
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

---

## Summary

The ExecuTask frontend is built with modern best practices:

✅ **Type-safe** - TypeScript throughout  
✅ **Performant** - Optimized caching and lazy loading  
✅ **Accessible** - ARIA-compliant components  
✅ **Responsive** - Mobile-first design  
✅ **Animated** - Smooth transitions with Framer Motion  
✅ **Maintainable** - Feature-based organization  
✅ **Scalable** - Easy to add new features  
