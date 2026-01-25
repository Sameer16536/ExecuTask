import { UserButton } from '@clerk/clerk-react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';

export function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Main content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 lg:hidden"
                        >
                            <Menu className="h-6 w-6" />
                        </button>

                        <div className="flex items-center gap-4">
                            <Link
                                to="/"
                                className="text-xl font-bold text-gray-900 dark:text-white lg:hidden"
                            >
                                ExecuTask
                            </Link>
                        </div>

                        <div className="flex items-center gap-4">
                            <UserButton
                                appearance={{
                                    elements: {
                                        avatarBox: 'h-10 w-10',
                                    },
                                }}
                            />
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
