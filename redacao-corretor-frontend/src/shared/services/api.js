import axios from 'axios';
import useAuthStore from '@/features/auth/store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Instância configurada do Axios
 * - withCredentials: true → Envia cookies automaticamente
 * - Interceptors para tratamento de erros e refresh token
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ⚠️ IMPORTANTE: Envia cookies httpOnly
});

/**
 * Request Interceptor
 * Não precisa adicionar Authorization header - cookies são enviados automaticamente
 */
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor
 * Trata erros globalmente e tenta refresh token em caso de 401
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Token expirado (401) - tenta refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Não tenta refresh se a requisição original já é de login/refresh
      const isAuthEndpoint =
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/refresh');

      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        console.log('[API] Token expirado, tentando refresh...');

        // Tenta refresh - refreshToken está no cookie httpOnly
        await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        console.log('[API] Refresh bem-sucedido, retentando requisição original');

        // Refresh bem-sucedido, tenta requisição original novamente
        return api(originalRequest);
      } catch (refreshError) {
        console.error('[API] Refresh falhou, deslogando usuário:', refreshError);

        // Refresh falhou - limpa estado e redireciona
        // Usa getState() para acessar o store fora de um componente React
        const { logout } = useAuthStore.getState();
        logout();

        // Limpa localStorage para garantir
        localStorage.removeItem('auth-storage');

        // Redireciona para login
        // Verifica se já não está na página de login para evitar loop
        if (!window.location.pathname.includes('/login')) {
          console.log('[API] Redirecionando para /login');
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
