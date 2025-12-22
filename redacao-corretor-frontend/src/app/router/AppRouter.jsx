import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/shared/constants/routes';
import { PrivateRoute } from './PrivateRoute';
import { RequireTeacher } from '@/features/auth/components/RequireTeacher';

// Pages
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { ClassesPage } from '@/features/classes/pages/ClassesPage';
import { ClassTasksPage } from '@/features/classes/pages/ClassTasksPage';
import { TaskStudentsPage } from '@/features/tasks/pages/TaskStudentsPage';
import { StudentHomePage } from '@/features/students/pages/StudentHomePage';
import { TaskDetailPage } from '@/features/students/pages/TaskDetailPage';
import { EssayCorrectPage } from '@/features/essays/pages/EssayCorrectPage';
import { EssayViewPage } from '@/features/essays/pages/EssayViewPage';

// Layout
import { MainLayout } from '@/shared/components/layout/MainLayout';

/**
 * Wrapper para adicionar location.key às rotas que precisam remontar
 */
const RouteWithLocation = ({ children }) => {
  const location = useLocation();
  // Força remontagem quando a rota muda usando location.pathname como key
  return <div key={location.pathname}>{children}</div>;
};

/**
 * Configuração de rotas da aplicação
 * SRP: Apenas define as rotas e proteções
 */
export const AppRouter = () => {
  const { isAuthenticated, isTeacher } = useAuth();

  /**
   * Determina rota de redirecionamento baseado no tipo de usuário
   */
  const getDefaultRoute = () => {
    if (!isAuthenticated) return ROUTES.LOGIN;
    return isTeacher() ? ROUTES.DASHBOARD : ROUTES.HOME;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path={ROUTES.LOGIN}
          element={
            isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <LoginPage />
          }
        />

        {/* Private routes - Student */}
        <Route
          path={ROUTES.HOME}
          element={
            <PrivateRoute>
              <MainLayout>
                <StudentHomePage />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/tasks/:taskId"
          element={
            <PrivateRoute>
              <MainLayout>
                <RouteWithLocation>
                  <TaskDetailPage />
                </RouteWithLocation>
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* Essay View - Student (fullscreen, no layout) */}
        <Route
          path="/essays/:essayId/view"
          element={
            <PrivateRoute>
              <EssayViewPage />
            </PrivateRoute>
          }
        />

        {/* Private routes - Teacher Only */}
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <PrivateRoute>
              <RequireTeacher>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </RequireTeacher>
            </PrivateRoute>
          }
        />

        <Route
          path={ROUTES.CLASSES}
          element={
            <PrivateRoute>
              <RequireTeacher>
                <MainLayout>
                  <ClassesPage />
                </MainLayout>
              </RequireTeacher>
            </PrivateRoute>
          }
        />

        <Route
          path={ROUTES.CLASS_DETAIL}
          element={
            <PrivateRoute>
              <RequireTeacher>
                <MainLayout>
                  <RouteWithLocation>
                    <ClassTasksPage />
                  </RouteWithLocation>
                </MainLayout>
              </RequireTeacher>
            </PrivateRoute>
          }
        />

        <Route
          path={ROUTES.TASK_DETAIL}
          element={
            <PrivateRoute>
              <RequireTeacher>
                <MainLayout>
                  <RouteWithLocation>
                    <TaskStudentsPage />
                  </RouteWithLocation>
                </MainLayout>
              </RequireTeacher>
            </PrivateRoute>
          }
        />

        {/* Essay Correction - Teacher Only (fullscreen, no layout) */}
        <Route
          path="/essays/:essayId/correct"
          element={
            <PrivateRoute>
              <RequireTeacher>
                <EssayCorrectPage />
              </RequireTeacher>
            </PrivateRoute>
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
