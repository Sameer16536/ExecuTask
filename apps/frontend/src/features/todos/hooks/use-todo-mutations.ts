import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useApiClient } from '@/api';

export interface CreateTodoInput {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    status?: 'draft' | 'active';
    dueDate?: string;
    categoryId?: string;
}

export function useCreateTodo() {
    const apiClient = useApiClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateTodoInput) => {
            const response = await apiClient.v1.todos.createTodo({
                body: data,
            });

            if (response.status === 201) {
                return response.body;
            }

            throw new Error('Failed to create todo');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['todos'] });
            queryClient.invalidateQueries({ queryKey: ['todo-stats'] });
            toast.success('Todo created successfully!');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to create todo');
        },
    });
}

export function useUpdateTodo() {
    const apiClient = useApiClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<CreateTodoInput> }) => {
            const response = await apiClient.v1.todos.updateTodo({
                params: { id },
                body: data,
            });

            if (response.status === 200) {
                return response.body;
            }

            throw new Error('Failed to update todo');
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['todos'] });
            queryClient.invalidateQueries({ queryKey: ['todo', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['todo-stats'] });
            toast.success('Todo updated successfully!');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to update todo');
        },
    });
}

export function useDeleteTodo() {
    const apiClient = useApiClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.v1.todos.deleteTodo({
                params: { id },
            });

            if (response.status === 204) {
                return true;
            }

            throw new Error('Failed to delete todo');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['todos'] });
            queryClient.invalidateQueries({ queryKey: ['todo-stats'] });
            toast.success('Todo deleted successfully!');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to delete todo');
        },
    });
}
