import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/shared/constants/routes';
import { PrivateRoute } from './PrivateRoute';

// Pages (serão criadas)
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { ClassesPage } from '@/features/classes/pages/ClassesPage';

// Layout
import { MainLayout } from '@/shared/components/layout/MainLayout';

/**
 * Configuração de rotas da aplicação
 * Usa React Router v7
 */
export const AppRouter = () => {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path={ROUTES.LOGIN}
          element={
            isAuthenticated ? <Navigate to={ROUTES.DASHBOARD} replace /> : <LoginPage />
          }
        />

        {/* Private routes - Com Layout */}
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <PrivateRoute>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path={ROUTES.CLASSES}
          element={
            <PrivateRoute>
              <MainLayout>
                <ClassesPage />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* Root redirect */}
        <Route
          path={ROUTES.HOME}
          element={
            <Navigate to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN} replace />
          }
        />

        {/* 404 - Not Found */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-800">404</h1>
                <p className="text-xl text-gray-600 mt-4">Página não encontrada</p>
                <a href="/" className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Voltar ao início
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};
