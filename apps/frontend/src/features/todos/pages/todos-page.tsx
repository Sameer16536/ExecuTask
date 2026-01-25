import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTodos } from '../hooks/use-todos';
import { TodoForm } from '../components/todo-form';
import { TodoList } from '../components/todo-list';

export function TodosPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        search: '',
    });

    const { data, isLoading } = useTodos(filters);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Todos
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Manage all your tasks in one place
                    </p>
                </div>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                >
                    <Plus className="h-5 w-5" />
                    New Todo
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                </select>

                <select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                    <option value="">All Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>

                <input
                    type="search"
                    placeholder="Search todos..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
            </div>

            {/* Todo List */}
            <TodoList todos={data?.data || []} isLoading={isLoading} />

            {/* Create Todo Dialog */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Create New Todo</DialogTitle>
                    </DialogHeader>
                    <TodoForm onSuccess={() => setIsCreateModalOpen(false)} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
