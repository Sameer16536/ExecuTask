import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/api';

export interface Category {
    id: string;
    userId: string;
    name: string;
    color: string;
    icon?: string;
    createdAt: string;
    updatedAt: string;
}

export function useCategories() {
    const apiClient = useApiClient();

    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await apiClient.v1.categories.getCategories();

            if (response.status === 200) {
                return response.body;
            }

            throw new Error('Failed to fetch categories');
        },
    });
}
