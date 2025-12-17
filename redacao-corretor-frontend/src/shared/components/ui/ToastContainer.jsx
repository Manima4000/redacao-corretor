import { useToastList } from '@/shared/hooks/useToast';
import { Toast } from './Toast';

/**
 * Container global de toasts
 * SRP: Apenas renderiza lista de toasts ativos
 *
 * Posicionado no canto superior direito da tela
 * Toasts são empilhados verticalmente
 */
export const ToastContainer = () => {
  const { toasts, removeToast } = useToastList();

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            onClose={removeToast}
          />
        </div>
      ))}
    </div>
  );
};
