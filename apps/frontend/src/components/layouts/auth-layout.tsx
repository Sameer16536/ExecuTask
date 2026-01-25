import { useLocation } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { useTheme } from "@/components/theme-provider";

export function AuthLayout() {
  const { theme } = useTheme();
  const location = useLocation();
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const isSignIn = location.pathname.includes("/sign-in");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        {isSignIn ? (
          <SignIn
            routing="path"
            path="/auth/sign-in"
            redirectUrl="/dashboard"
            appearance={{
              baseTheme: isDark ? dark : undefined,
              elements: {
                card: "shadow-lg border-border",
                rootBox: "w-full",
              },
            }}
          />
        ) : (
          <SignUp
            routing="path"
            path="/auth/sign-up"
            redirectUrl="/dashboard"
            appearance={{
              baseTheme: isDark ? dark : undefined,
              elements: {
                card: "shadow-lg border-border",
                rootBox: "w-full",
              },
            }}
          />
        )}
      </div>
    </div>
  );
}