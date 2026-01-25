export function CategoriesPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Categories
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Organize your todos with categories
                </p>
            </div>

            {/* Categories Grid */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <p className="text-center text-gray-600 dark:text-gray-400">
                    No categories found. Create your first category to get started!
                </p>
            </div>
        </div>
    );
}
