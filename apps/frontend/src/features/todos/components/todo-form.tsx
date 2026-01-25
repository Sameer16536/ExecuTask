import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTodo, useUpdateTodo } from '../hooks/use-todo-mutations';
import { useCategories } from '@/features/categories/hooks/use-categories';

const todoSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().max(5000),
    priority: z.enum(['low', 'medium', 'high']),
    status: z.enum(['draft', 'active']).optional(),
    dueDate: z.string().optional(),
    categoryId: z.string().optional(),
});

type TodoFormData = z.infer<typeof todoSchema>;

interface TodoFormProps {
    initialData?: Partial<TodoFormData>;
    todoId?: string;
    onSuccess?: () => void;
}

export function TodoForm({ initialData, todoId, onSuccess }: TodoFormProps) {
    const createTodo = useCreateTodo();
    const updateTodo = useUpdateTodo();
    const { data: categories } = useCategories();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<TodoFormData>({
        resolver: zodResolver(todoSchema),
        defaultValues: {
            priority: 'medium',
            status: 'active',
            ...initialData,
        },
    });

    const onSubmit = async (data: TodoFormData) => {
        try {
            if (todoId) {
                await updateTodo.mutateAsync({ id: todoId, data });
            } else {
                await createTodo.mutateAsync(data);
            }
            onSuccess?.();
        } catch (error) {
            // Error is handled by the mutation hook
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                    id="title"
                    {...register('title')}
                    placeholder="Enter todo title"
                    className="mt-1"
                />
                {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
            </div>

            <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Enter todo description"
                    rows={4}
                    className="mt-1"
                />
                {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="priority">Priority *</Label>
                    <select
                        id="priority"
                        {...register('priority')}
                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>

                <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                        id="status"
                        {...register('status')}
                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
                    >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                        id="dueDate"
                        type="datetime-local"
                        {...register('dueDate')}
                        className="mt-1"
                    />
                </div>

                <div>
                    <Label htmlFor="categoryId">Category</Label>
                    <select
                        id="categoryId"
                        {...register('categoryId')}
                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
                    >
                        <option value="">No category</option>
                        {categories?.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-700"
                >
                    {isSubmitting ? 'Saving...' : todoId ? 'Update Todo' : 'Create Todo'}
                </Button>
            </div>
        </form>
    );
}
