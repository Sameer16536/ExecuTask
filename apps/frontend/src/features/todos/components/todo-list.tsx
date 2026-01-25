import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { TodoItem } from './todo-item';
import { Todo } from '../hooks/use-todos';
import { listContainerVariants, listItemVariants } from '@/lib/animations';

interface TodoListProps {
    todos: Todo[];
    isLoading?: boolean;
}

export function TodoList({ todos, isLoading }: TodoListProps) {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-start gap-3">
                            <Skeleton className="h-5 w-5 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-full" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-5 w-16" />
                                    <Skeleton className="h-5 w-16" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (todos.length === 0) {
        return (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
                <p className="text-gray-600 dark:text-gray-400">
                    No todos found. Create your first todo to get started!
                </p>
            </div>
        );
    }

    return (
        <motion.div
            variants={listContainerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3"
        >
            {todos.map((todo) => (
                <motion.div key={todo.id} variants={listItemVariants}>
                    <TodoItem todo={todo} />
                </motion.div>
            ))}
        </motion.div>
    );
}
