/**
 * Constantes de rotas da aplicação
 * Centralizadas para facilitar manutenção
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  CLASSES: '/classes',
  CLASS_DETAIL: '/classes/:id',
  TASKS: '/classes/:classId/tasks',
  TASK_DETAIL: '/classes/:classId/tasks/:taskId',
  ESSAYS: '/classes/:classId/tasks/:taskId/essays',
  ESSAY_DETAIL: '/classes/:classId/tasks/:taskId/essays/:essayId',
  PROFILE: '/profile',
};

/**
 * Helper para construir URLs dinâmicas
 * Exemplo: buildRoute(ROUTES.CLASS_DETAIL, { id: '123' }) => '/classes/123'
 */
export const buildRoute = (route, params = {}) => {
  let builtRoute = route;
  Object.entries(params).forEach(([key, value]) => {
    builtRoute = builtRoute.replace(`:${key}`, value);
  });
  return builtRoute;
};
