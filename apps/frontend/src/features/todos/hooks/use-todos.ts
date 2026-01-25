import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/api';

export interface Todo {
    id: string;
    userId: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    status: 'draft' | 'active' | 'completed' | 'archived';
    dueDate?: string;
    completedAt?: string;
    categoryId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface TodosQueryParams {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    search?: string;
    categoryId?: string;
}

export function useTodos(params: TodosQueryParams = {}) {
    const apiClient = useApiClient();

    return useQuery({
        queryKey: ['todos', params],
        queryFn: async () => {
            const response = await apiClient.v1.todos.getTodos({
                query: {
                    page: params.page || 1,
                    limit: params.limit || 20,
                    ...(params.status && { status: params.status }),
                    ...(params.priority && { priority: params.priority }),
                    ...(params.search && { search: params.search }),
                    ...(params.categoryId && { categoryId: params.categoryId }),
                },
            });

            if (response.status === 200) {
                return response.body;
            }

            throw new Error('Failed to fetch todos');
        },
    });
}

export function useTodo(id: string) {
    const apiClient = useApiClient();

    return useQuery({
        queryKey: ['todo', id],
        queryFn: async () => {
            const response = await apiClient.v1.todos.getTodo({
                params: { id },
            });

            if (response.status === 200) {
                return response.body;
            }

            throw new Error('Failed to fetch todo');
        },
        enabled: !!id,
    });
}

export function useTodoStats() {
    const apiClient = useApiClient();

    return useQuery({
        queryKey: ['todo-stats'],
        queryFn: async () => {
            const response = await apiClient.v1.todos.getStats();

            if (response.status === 200) {
                return response.body;
            }

            throw new Error('Failed to fetch todo stats');
        },
    });
}
