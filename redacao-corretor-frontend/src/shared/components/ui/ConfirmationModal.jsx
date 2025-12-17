import { useEffect } from 'react';
import { Button } from './Button';

/**
 * Modal de Confirmação Reutilizável
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Se o modal está visível
 * @param {Function} props.onClose - Função chamada ao cancelar/fechar
 * @param {Function} props.onConfirm - Função chamada ao confirmar
 * @param {string} props.title - Título do modal
 * @param {string} props.message - Mensagem principal
 * @param {string} props.confirmText - Texto do botão de confirmação (padrão: "Confirmar")
 * @param {string} props.cancelText - Texto do botão de cancelar (padrão: "Cancelar")
 * @param {string} props.variant - Variante do botão de confirmação ('danger', 'primary', 'success')
 * @param {boolean} props.isLoading - Se está carregando a ação de confirmação
 */
export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}) => {
  // Fecha ao pressionar ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop (Fundo escuro) */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <span className="text-2xl leading-none">&times;</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-gray-600 text-base leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <Button 
            variant="secondary" 
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button 
            variant={variant} 
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
