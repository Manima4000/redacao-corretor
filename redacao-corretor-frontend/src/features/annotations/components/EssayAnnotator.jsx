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
/**
 * Componente de anotação de redação (REFATORADO)
 *
 * @param {Object} props
 * @param {string} props.essayId - ID da redação
 * @param {string} props.imageUrl - URL da imagem da redação
 * @param {boolean} [props.readOnly=false] - Se true, apenas visualiza
 * @param {Function} [props.onFinish] - Callback ao finalizar correção
 * @param {string} [props.className=''] - Classes CSS adicionais
 */
export const EssayAnnotator = ({
  essayId,
  imageUrl,
  readOnly = false,
  onFinish,
  className = ''
}) => {
  return (
    <AnnotationProvider essayId={essayId} readOnly={readOnly}>
      <EssayAnnotatorContent
        imageUrl={imageUrl}
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
const EssayAnnotatorContent = ({ imageUrl, onFinish, readOnly, className }) => {
  const {
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
      if (hasUnsavedChanges) {
        await saveAnnotations();
      }
      if (onFinish) onFinish();
    } catch (error) {
      console.error('Erro ao salvar anotações:', error);
    }
  };

  /**
   * Abre modal de confirmação para limpar
   */
  const handleClear = () => {
    setShowClearModal(true);
  };

  /**
   * Confirma e limpa todas as anotações
   */
  const confirmClear = () => {
    clearAnnotations();
    setShowClearModal(false);
  };

  return (
    <div className={`flex flex-col h-full bg-gray-100 ${className}`}>
      {/* Toolbar - Fixa no topo */}
      {!readOnly && (
        <ToolbarAnnotation
          onFinish={handleFinish}
          onClear={handleClear}
        />
      )}

      {/* Canvas Container - Ocupa o resto e permite scroll interno se necessário */}
      <div className="flex-1 relative bg-gray-300 overflow-hidden">
        {/* Canvas com imagem + anotações - Aqui dentro temos o scroll real */}
        <AnnotationCanvas
          imageUrl={imageUrl}
          onZoomChange={handleZoomChange}
        />

        {/* Controles de zoom - Posicionados de forma fixa em relação ao container */}
        {zoomControls && (
          <div className="absolute bottom-8 right-8 z-50">
            <ZoomControls
              onZoomIn={zoomControls.zoomIn}
              onZoomOut={zoomControls.zoomOut}
              onResetZoom={zoomControls.resetZoom}
              scale={zoomControls.scale}
            />
          </div>
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
