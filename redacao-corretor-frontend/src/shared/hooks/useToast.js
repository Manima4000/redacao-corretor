import { create } from 'zustand';

/**
 * Store global de toasts usando Zustand
 * SRP: Apenas gerencia estado de toasts
 */
const useToastStore = create((set) => ({
  toasts: [],

  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id: Date.now() + Math.random(), // ID único
          type: toast.type || 'info',
          message: toast.message,
          duration: toast.duration || 3000,
        },
      ],
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));

/**
 * Hook para gerenciar toasts
 *
 * @returns {Object} Métodos para manipular toasts
 * @returns {Function} success - Exibe toast de sucesso
 * @returns {Function} error - Exibe toast de erro
 * @returns {Function} warning - Exibe toast de aviso
 * @returns {Function} info - Exibe toast de informação
 */
export const useToast = () => {
  const { addToast } = useToastStore();

  return {
    success: (message, duration) => addToast({ type: 'success', message, duration }),
    error: (message, duration) => addToast({ type: 'error', message, duration }),
    warning: (message, duration) => addToast({ type: 'warning', message, duration }),
    info: (message, duration) => addToast({ type: 'info', message, duration }),
  };
};

/**
 * Hook para acessar lista de toasts (usado pelo ToastContainer)
 */
export const useToastList = () => {
  const { toasts, removeToast } = useToastStore();
  return { toasts, removeToast };
};
