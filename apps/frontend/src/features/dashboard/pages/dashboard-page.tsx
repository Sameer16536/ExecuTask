import { BarChart3, CheckCircle2, Circle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTodoStats } from '@/features/todos/hooks/use-todos';

export function DashboardPage() {
    const { data: stats, isLoading } = useTodoStats();

    const statCards = [
        {
            name: 'Total Todos',
            value: stats?.total || 0,
            icon: Circle,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100 dark:bg-blue-900/50',
        },
        {
            name: 'Completed',
            value: stats?.completed || 0,
            icon: CheckCircle2,
            color: 'text-green-600',
            bgColor: 'bg-green-100 dark:bg-green-900/50',
        },
        {
            name: 'Active',
            value: stats?.active || 0,
            icon: Clock,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100 dark:bg-yellow-900/50',
        },
        {
            name: 'Overdue',
            value: stats?.overdue || 0,
            icon: BarChart3,
            color: 'text-red-600',
            bgColor: 'bg-red-100 dark:bg-red-900/50',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Dashboard
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Welcome back! Here's an overview of your tasks.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                    <div
                        key={stat.name}
                        className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                        {isLoading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-8 w-16" />
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        {stat.name}
                                    </p>
                                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                                        {stat.value}
                                    </p>
                                </div>
                                <div className={`rounded-full p-3 ${stat.bgColor}`}>
                                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Upcoming Todos */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Upcoming Todos
                </h2>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                    Your upcoming tasks will appear here.
                </p>
            </div>
        </div>
    );
}
