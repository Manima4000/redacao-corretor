import { useState } from 'react';
import { AnnotationProvider, useAnnotationContext } from './AnnotationProvider';
import { AnnotationCanvas } from './AnnotationCanvas';
import { ZoomControls } from './ZoomControls';
import { ToolbarAnnotation } from './ToolbarAnnotation';
import { ConfirmationModal } from '@/shared/components/ui/ConfirmationModal';

/**
 * Componente de anotação de redação (REFATORADO)
 *
 * Responsabilidades:
 * - Orquestrar componentes filhos (ImageCanvas, AnnotationCanvas, Toolbar, Zoom)
 * - Gerenciar modal de confirmação de limpeza
 * - Fornecer dimensões do canvas
 *
 * Segue SOLID:
 * - SRP: Apenas composição (não tem lógica de desenho, fetch, etc.)
 * - OCP: Extensível via componentes filhos
 * - Componentes filhos acessam estado via AnnotationProvider (Context)
 *
 * ANTES: 547 linhas com múltiplas responsabilidades
 * DEPOIS: ~150 linhas apenas com composição
 *
 * @param {Object} props
 * @param {string} props.essayId - ID da redação
 * @param {string} props.imageUrl - URL da imagem da redação
 * @param {number} [props.pageNumber=1] - Número da página (para PDFs)
 * @param {boolean} [props.readOnly=false] - Se true, apenas visualiza
 * @param {Function} [props.onFinish] - Callback ao finalizar correção
 * @param {string} [props.className=''] - Classes CSS adicionais
 */
export const EssayAnnotator = ({
  essayId,
  imageUrl,
  pageNumber = 1,
  readOnly = false,
  onFinish,
  className = ''
}) => {
  return (
    <AnnotationProvider essayId={essayId} pageNumber={pageNumber} readOnly={readOnly}>
      <EssayAnnotatorContent
        imageUrl={imageUrl}
        pageNumber={pageNumber}
        onFinish={onFinish}
        readOnly={readOnly}
        className={className}
      />
    </AnnotationProvider>
  );
};

/**
 * Conteúdo do EssayAnnotator (separado para usar useAnnotationContext)
 */
const EssayAnnotatorContent = ({ imageUrl, pageNumber, onFinish, readOnly, className }) => {
  // Context de anotações
  const {
    lines,
    isLoading,
    saveAnnotations,
    clearAnnotations,
    hasUnsavedChanges,
  } = useAnnotationContext();

  // Estado local
  const [showClearModal, setShowClearModal] = useState(false);
  const [zoomControls, setZoomControls] = useState(null);

  /**
   * Callback quando zoom muda (vem do AnnotationCanvas)
   */
  const handleZoomChange = (controls) => {
    setZoomControls(controls);
  };

  /**
   * Prepara para finalizar correção
   */
  const handleFinish = async () => {
    try {
      // Salva anotações se houver mudanças não salvas
      if (hasUnsavedChanges) {
        await saveAnnotations();
      }

      // Chama callback (abre modal de finalização)
      if (onFinish) onFinish();
    } catch (error) {
      console.error('Erro ao salvar anotações:', error);
    }
  };

  /**
   * Abre modal de confirmação para limpar
   */
  const handleClear = () => {
    if (lines.length === 0) return;
    setShowClearModal(true);
  };

  /**
   * Confirma e limpa todas as anotações
   */
  const confirmClear = () => {
    clearAnnotations();
    setShowClearModal(false);
  };

  // Loading (delegado ao ImageCanvas)
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-100 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando anotações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-gray-100 ${className}`}>
      {/* Toolbar */}
      {!readOnly && (
        <ToolbarAnnotation
          onFinish={handleFinish}
          onClear={handleClear}
        />
      )}

      {/* Canvas Container */}
      <div className="flex-1 relative overflow-hidden bg-gray-200">
        {/* Canvas com imagem + anotações */}
        <AnnotationCanvas
          imageUrl={imageUrl}
          pageNumber={pageNumber}
          onZoomChange={handleZoomChange}
        />

        {/* Controles de zoom */}
        {zoomControls && (
          <ZoomControls
            onZoomIn={zoomControls.zoomIn}
            onZoomOut={zoomControls.zoomOut}
            onResetZoom={zoomControls.resetZoom}
            scale={zoomControls.scale}
          />
        )}
      </div>

      {/* Modal de Confirmação de Limpeza */}
      <ConfirmationModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={confirmClear}
        title="Limpar Anotações"
        message="Tem certeza que deseja limpar todas as anotações? Esta ação não pode ser desfeita."
        confirmText="Limpar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};
