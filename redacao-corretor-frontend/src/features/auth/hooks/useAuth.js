import useAuthStore from '../store/authStore';

/**
 * Hook para acessar o AuthStore
 * Fornece acesso a todo o estado e ações de autenticação
 */
export const useAuth = () => {
  return useAuthStore();
};
