import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { CLERK_PUBLISHABLE_KEY } from '@/config/env';
import { queryClient } from '@/config/query-client';

interface AppProviderProps {
    children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
    return (
        <ClerkProvider
            publishableKey={CLERK_PUBLISHABLE_KEY}
            afterSignOutUrl="/sign-in"
        >
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    {children}
                    <Toaster position="top-right" richColors />
                </BrowserRouter>
                <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
        </ClerkProvider>
    );
}
