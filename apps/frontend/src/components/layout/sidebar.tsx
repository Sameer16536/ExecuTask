import { CheckSquare, FolderKanban, Home, Tag, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SidebarProps {
    onClose?: () => void;
}

const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Todos', href: '/todos', icon: CheckSquare },
    { name: 'Kanban', href: '/kanban', icon: FolderKanban },
    { name: 'Categories', href: '/categories', icon: Tag },
];

export function Sidebar({ onClose }: SidebarProps) {
    const location = useLocation();

    return (
        <div className="flex h-full flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            {/* Logo */}
            <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
                <Link to="/" className="flex items-center gap-2">
                    <CheckSquare className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                        ExecuTask
                    </span>
                </Link>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 lg:hidden"
                    >
                        <X className="h-6 w-6" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            onClick={onClose}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'
                                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    © 2026 ExecuTask
                </p>
            </div>
        </div>
    );
}
