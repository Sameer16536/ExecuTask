import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/app-layout';
import { SignInPage } from './features/auth/pages/sign-in-page';
import { SignUpPage } from './features/auth/pages/sign-up-page';
import { DashboardPage } from './features/dashboard/pages/dashboard-page';
import { TodosPage } from './features/todos/pages/todos-page';
import { CategoriesPage } from './features/categories/pages/categories-page';
import './index.css';

function App() {
  return (
    <>
      <SignedOut>
        <Routes>
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="*" element={<SignInPage />} />
        </Routes>
      </SignedOut>

      <SignedIn>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/todos" element={<TodosPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
          </Route>
        </Routes>
      </SignedIn>
    </>
  );
}

export default App;
