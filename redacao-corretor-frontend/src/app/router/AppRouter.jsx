import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/shared/constants/routes';
import { PrivateRoute } from './PrivateRoute';
import { RequireTeacher } from '@/features/auth/components/RequireTeacher';

// Pages
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';
import { ClassesPage } from '@/features/classes/pages/ClassesPage';
import { ClassTasksPage } from '@/features/classes/pages/ClassTasksPage';
import { TaskStudentsPage } from '@/features/tasks/pages/TaskStudentsPage';
import { StudentHomePage } from '@/features/students/pages/StudentHomePage';
import { TaskDetailPage } from '@/features/students/pages/TaskDetailPage';
import { EssayCorrectPage } from '@/features/essays/pages/EssayCorrectPage';
import { EssayViewPage } from '@/features/essays/pages/EssayViewPage';
import { NotFoundPage } from '@/shared/pages/NotFoundPage';

// Layout
import { MainLayout } from '@/shared/components/layout/MainLayout';

/**
 * Wrapper para adicionar location.key às rotas que precisam remontar
 * Usa location.pathname + location.key para garantir remontagem completa
 */
const RouteWithLocation = ({ children }) => {
  const location = useLocation();
  // Força remontagem quando a rota muda usando pathname + key único
  // location.key muda a cada navegação, garantindo remontagem
  return <div key={`${location.pathname}-${location.key}`}>{children}</div>;
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

        {/* Profile - Both Student and Teacher */}
        <Route
          path={ROUTES.PROFILE}
          element={
            <PrivateRoute>
              <MainLayout>
                <ProfilePage />
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
              <RouteWithLocation>
                <EssayViewPage />
              </RouteWithLocation>
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
                <RouteWithLocation>
                  <EssayCorrectPage />
                </RouteWithLocation>
              </RequireTeacher>
            </PrivateRoute>
          }
        />

        {/* 404 - Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};
