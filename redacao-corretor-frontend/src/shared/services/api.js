import axios from 'axios';

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
      originalRequest._retry = true;

      try {
        // Tenta refresh - refreshToken está no cookie httpOnly
        await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // Refresh bem-sucedido, tenta requisição original novamente
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh falhou - redireciona para login
        // Limpa estado (será feito no AuthStore)
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
