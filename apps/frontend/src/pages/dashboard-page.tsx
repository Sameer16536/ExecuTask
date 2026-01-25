import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetTodoStats, useGetAllTodos } from "@/api/hooks/use-todo-query";
import { useGetAllCategories } from "@/api/hooks/use-category-query";
import { TodoCard } from "@/components/todos/todo-card";
import { TodoCreateForm } from "@/components/todos/todo-create-form";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Archive,
  Plus,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { staggerContainer, listItem } from "@/lib/enhanced-animations";
import { cn } from "@/lib/utils";

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetTodoStats();
  const { data: recentTodos, isLoading: todosLoading } = useGetAllTodos({
    query: { page: 1, limit: 5, sort: "updated_at", order: "desc" },
  });
  const { data: categories, isLoading: categoriesLoading } = useGetAllCategories({
    query: { page: 1, limit: 10 },
  });

  const statCards = [
    {
      title: "Total Tasks",
      value: stats?.total || 0,
      icon: CheckCircle,
      gradient: "from-blue-500 to-cyan-500",
      lightBg: "bg-blue-50",
      darkBg: "dark:bg-blue-950/20",
    },
    {
      title: "Active",
      value: stats?.active || 0,
      icon: Clock,
      gradient: "from-emerald-500 to-teal-500",
      lightBg: "bg-emerald-50",
      darkBg: "dark:bg-emerald-950/20",
    },
    {
      title: "Overdue",
      value: stats?.overdue || 0,
      icon: AlertTriangle,
      gradient: "from-red-500 to-rose-500",
      lightBg: "bg-red-50",
      darkBg: "dark:bg-red-950/20",
    },
    {
      title: "Completed",
      value: stats?.completed || 0,
      icon: Archive,
      gradient: "from-purple-500 to-pink-500",
      lightBg: "bg-purple-50",
      darkBg: "dark:bg-purple-950/20",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview of your tasks and productivity
          </p>
        </div>
        <TodoCreateForm>
          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 hover:shadow-lg hover:shadow-purple-500/50 transition-all">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </TodoCreateForm>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              variants={listItem}
              whileHover="hover"
              initial="rest"
            >
              <Card className={cn(
                "relative overflow-hidden border-0 shadow-lg transition-all duration-300",
                stat.lightBg,
                stat.darkBg,
                "hover:shadow-xl hover:-translate-y-1"
              )}>
                {/* Gradient overlay */}
                <div className={cn(
                  "absolute inset-0 opacity-10 bg-gradient-to-br",
                  stat.gradient
                )} />

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-foreground/80">
                    {stat.title}
                  </CardTitle>
                  <div className={cn(
                    "p-2 rounded-lg bg-gradient-to-br",
                    stat.gradient
                  )}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold">
                    {statsLoading ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        {stat.value}
                      </motion.span>
                    )}
                  </div>
                  {!statsLoading && stat.value > 0 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-xs text-muted-foreground mt-1 flex items-center gap-1"
                    >
                      <TrendingUp className="h-3 w-3" />
                      <span>Active</span>
                    </motion.p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid gap-6 lg:grid-cols-3"
      >
        {/* Recent Tasks */}
        <Card className="lg:col-span-2 border-border/50 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50">
            <CardTitle className="text-xl">Recent Tasks</CardTitle>
            <Link to="/todos">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-6">
            {todosLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                ))}
              </div>
            ) : recentTodos?.data?.length ? (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-3"
              >
                {recentTodos.data.slice(0, 5).map((todo) => (
                  <motion.div key={todo.id} variants={listItem}>
                    <TodoCard todo={todo} compact />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground mb-4">No tasks yet. Create your first task to get started!</p>
                <TodoCreateForm>
                  <Button variant="outline" className="hover:bg-primary/10">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </Button>
                </TodoCreateForm>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50">
            <CardTitle className="text-xl">Categories</CardTitle>
            <Link to="/categories">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                Manage
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-6">
            {categoriesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : categories?.data?.length ? (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-2"
              >
                {categories.data.slice(0, 6).map((category) => (
                  <motion.div
                    key={category.id}
                    variants={listItem}
                    whileHover={{ scale: 1.02, x: 4 }}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:bg-accent/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-medium">
                        {category.name}
                      </span>
                    </div>
                  </motion.div>
                ))}
                {categories.data.length > 6 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{categories.data.length - 6} more categories
                  </p>
                )}
              </motion.div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">No categories yet</p>
                <Link to="/categories">
                  <Button variant="outline" size="sm" className="hover:bg-primary/10">
                    Create Category
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}