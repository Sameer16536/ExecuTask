import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Clock, MoreVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useDeleteTodo, useUpdateTodo } from '../hooks/use-todo-mutations';
import { Todo } from '../hooks/use-todos';
import { cardHoverVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface TodoItemProps {
    todo: Todo;
}

const priorityColors = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const statusColors = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    active: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

export function TodoItem({ todo }: TodoItemProps) {
    const [showActions, setShowActions] = useState(false);
    const updateTodo = useUpdateTodo();
    const deleteTodo = useDeleteTodo();

    const handleToggleComplete = async () => {
        const newStatus = todo.status === 'completed' ? 'active' : 'completed';
        await updateTodo.mutateAsync({
            id: todo.id,
            data: { status: newStatus },
        });
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this todo?')) {
            await deleteTodo.mutateAsync(todo.id);
        }
    };

    const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && todo.status !== 'completed';

    return (
        <motion.div
            variants={cardHoverVariants}
            initial="rest"
            whileHover="hover"
            onHoverStart={() => setShowActions(true)}
            onHoverEnd={() => setShowActions(false)}
        >
            <Card className="p-4">
                <div className="flex items-start gap-3">
                    <button
                        onClick={handleToggleComplete}
                        className="mt-1 flex-shrink-0"
                    >
                        {todo.status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300 hover:border-indigo-600" />
                        )}
                    </button>

                    <div className="flex-1 min-w-0">
                        <h3
                            className={cn(
                                'text-sm font-medium text-gray-900 dark:text-white',
                                todo.status === 'completed' && 'line-through text-gray-500'
                            )}
                        >
                            {todo.title}
                        </h3>
                        {todo.description && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {todo.description}
                            </p>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge className={priorityColors[todo.priority]}>
                                {todo.priority}
                            </Badge>
                            <Badge className={statusColors[todo.status]}>
                                {todo.status}
                            </Badge>
                            {todo.dueDate && (
                                <div className={cn(
                                    'flex items-center gap-1 text-xs',
                                    isOverdue ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'
                                )}>
                                    <Calendar className="h-3 w-3" />
                                    {new Date(todo.dueDate).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    </div>

                    {showActions && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex gap-1"
                        >
                            <button
                                onClick={handleDelete}
                                className="rounded p-1 hover:bg-red-100 dark:hover:bg-red-900"
                            >
                                <Trash2 className="h-4 w-4 text-red-600" />
                            </button>
                        </motion.div>
                    )}
                </div>
            </Card>
        </motion.div>
    );
}
