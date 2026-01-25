import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { CheckCircle, Users, Zap, Shield, ArrowRight, Sparkles } from "lucide-react";
import { fadeInUp, staggerContainer, listItem, scaleOnHover, floating } from "@/lib/enhanced-animations";
import { gradients, glassEffect, hoverEffects } from "@/lib/gradients";
import { cn } from "@/lib/utils";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="border-b backdrop-blur-sm bg-background/80 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Sparkles className="h-6 w-6 text-primary" />
            </motion.div>
            <h1 className={cn("text-2xl font-bold", gradients.textPrimary)}>
              ExecuTask
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link to="/auth/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth/sign-up">
              <Button className={cn(gradients.primary, "text-white border-0")}>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero Section with Gradient Background */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />

        <div className="container mx-auto text-center relative z-10">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-6"
          >
            <motion.div variants={fadeInUp}>
              <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                ✨ Your productivity companion
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
            >
              Your Personal
              <br />
              <span className={cn(gradients.textPrimary, "inline-block")}>
                Task Manager
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              Organize your life with ExecuTask - a powerful, intuitive task management
              app that helps you stay productive and focused on what matters most.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/auth/sign-up">
                <Button
                  size="lg"
                  className={cn(
                    gradients.primary,
                    "text-lg px-8 py-6 text-white border-0 group",
                    hoverEffects.lift
                  )}
                >
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/auth/sign-in">
                <Button
                  variant="outline"
                  size="lg"
                  className={cn("text-lg px-8 py-6", hoverEffects.lift)}
                >
                  Sign In
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section with Glassmorphism */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-center mb-4">
              Everything you need to stay organized
            </h2>
            <p className="text-center text-muted-foreground mb-12 text-lg">
              Powerful features to boost your productivity
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              {
                icon: CheckCircle,
                title: "Smart Organization",
                description: "Organize tasks with categories, priorities, and due dates",
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                icon: Users,
                title: "Collaboration",
                description: "Add comments and collaborate on tasks with your team",
                gradient: "from-purple-500 to-pink-500",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Quick actions and keyboard shortcuts for power users",
                gradient: "from-amber-500 to-orange-500",
              },
              {
                icon: Shield,
                title: "Secure & Private",
                description: "Your data is encrypted and securely stored",
                gradient: "from-emerald-500 to-teal-500",
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={listItem}
                  whileHover="hover"
                  initial="rest"
                  className={cn(
                    "relative group p-6 rounded-2xl",
                    "bg-card border border-border",
                    "hover:border-primary/50 transition-all duration-300",
                    hoverEffects.lift
                  )}
                >
                  <div className={cn(
                    "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity",
                    `bg-gradient-to-br ${feature.gradient}`
                  )} />

                  <div className={cn(
                    "w-12 h-12 rounded-xl mb-4 flex items-center justify-center",
                    `bg-gradient-to-br ${feature.gradient}`
                  )}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="container mx-auto text-center relative z-10"
        >
          <h2 className="text-4xl font-bold mb-6">
            Ready to get organized?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of users who have transformed their productivity with ExecuTask.
          </p>
          <Link to="/auth/sign-up">
            <Button
              size="lg"
              className={cn(
                gradients.primary,
                "text-lg px-8 py-6 text-white border-0",
                hoverEffects.lift
              )}
            >
              Start Your Free Account
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground">
            © 2025 ExecuTask. Built with care for productivity enthusiasts.
          </p>
        </div>
      </footer>
    </div>
  );
}