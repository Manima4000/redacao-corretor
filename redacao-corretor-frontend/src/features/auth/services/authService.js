import api from '@/shared/services/api';

/**
 * Serviço de autenticação
 * Todas as requisições para /api/auth
 * Tokens são gerenciados automaticamente via cookies httpOnly
 */
export const authService = {
  /**
   * Login
   * Tokens são definidos em cookies httpOnly pelo backend
   * Retorna apenas dados do usuário
   */
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data.data.user; // Retorna apenas user
  },

  /**
   * Registro
   * Tokens são definidos em cookies httpOnly pelo backend
   * Retorna apenas dados do usuário
   */
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data.data.user; // Retorna apenas user
  },

  /**
   * Refresh Token
   * refreshToken é lido do cookie pelo backend
   * Novo accessToken é definido em cookie pelo backend
   * Retorna apenas dados do usuário
   */
  async refreshToken() {
    const response = await api.post('/auth/refresh');
    return response.data.data.user; // Retorna apenas user
  },

  /**
   * Obter usuário autenticado
   * accessToken é enviado automaticamente via cookie
   */
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data.data; // user
  },

  /**
   * Logout
   * Limpa cookies no backend
   */
  async logout() {
    await api.post('/auth/logout');
  },
};
