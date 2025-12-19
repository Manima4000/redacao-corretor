import { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Line } from 'react-konva';
import getStroke from 'perfect-freehand';
import { useStylus } from '../hooks/useStylus';
import { useCanvasZoom } from '../hooks/useCanvasZoom';
import { useAnnotations } from '../hooks/useAnnotations';
import { ToolbarAnnotation } from './ToolbarAnnotation';
import { getStrokeOptions } from '../utils/freehandHelper';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ConfirmationModal } from '@/shared/components/ui/ConfirmationModal';

/**
 * Componente de anotação de redação (produção)
 *
 * Features:
 * - Carrega imagem da redação
 * - Desenho com stylus/caneta (suporte a pressure)
 * - Pan com dedo (apenas em zoom)
 * - Zoom in/out/pinch
 * - Borracha (toggle ou botão da caneta)
 * - Desfazer/Limpar
 * - Auto-save a cada 5s
 * - Salvar manual
 * - Finalizar correção
 *
 * @param {Object} props
 * @param {string} props.essayId - ID da redação
 * @param {string} props.imageUrl - URL da imagem da redação
 * @param {number} [props.pageNumber=1] - Número da página (para PDFs)
 * @param {boolean} [props.readOnly=false] - Se true, apenas visualiza (sem edição)
 * @param {Function} [props.onFinish] - Callback ao finalizar correção
 */
export const EssayAnnotator = ({ essayId, imageUrl, pageNumber = 1, readOnly = false, onFinish, className = '' }) => {
  // Estados do canvas
  const [image, setImage] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Estados de desenho
  const [color, setColor] = useState('#EF4444'); // Vermelho padrão
  const [size, setSize] = useState(4); // Médio padrão
  const [currentTool, setCurrentTool] = useState('pen'); // pen, highlighter, marker
  const [isEraser, setIsEraser] = useState(false);
  const [currentLine, setCurrentLine] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);

  // Refs
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const isDrawingRef = useRef(false);

  // Hooks customizados
  const {
    currentPointerType,
    isPenActive,
    handlePointerDown: handleStylusDown,
    handlePointerUp: handleStylusUp,
  } = useStylus();

  const { scale, position, isDragging, zoomIn, zoomOut, resetZoom, handlePanStart, handlePanMove, handlePanEnd } =
    useCanvasZoom({ minZoom: 0.5, maxZoom: 4, zoomStep: 0.2 });

  const {
    lines,
    isLoading,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    updateLines,
    saveAnnotations,
    saveAndFinish,
    clearAnnotations,
    undo,
  } = useAnnotations(essayId, pageNumber, readOnly);

  /**
   * Carrega imagem da redação via fetch (para incluir cookies de autenticação)
   */
  useEffect(() => {
    if (!imageUrl) return;

    const loadImage = async () => {
      try {
        // Faz requisição com credenciais (cookies)
        const response = await fetch(imageUrl, {
          credentials: 'include', // Envia cookies httpOnly
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Converte resposta em blob
        const blob = await response.blob();

        // Cria URL local do blob
        const blobUrl = URL.createObjectURL(blob);

        // Cria elemento de imagem
        const img = new window.Image();

        img.onload = () => {
          setImage(img);
          setImageLoaded(true);

          // Usa dimensões naturais da imagem para evitar distorção
          setCanvasSize({ width: img.width, height: img.height });
        };

        img.onerror = (error) => {
          console.error('Erro ao carregar imagem do blob:', error);
          setImageError('Erro ao carregar imagem. Verifique se a URL está correta e se o arquivo está acessível.');
          setImageLoaded(false);
        };

        // Define a fonte da imagem como o blob URL
        img.src = blobUrl;
      } catch (error) {
        console.error('Erro ao fazer fetch da imagem:', imageUrl);
        console.error('Detalhes do erro:', error);
        setImageError(`Erro ao carregar imagem: ${error.message}`);
        setImageLoaded(false);
      }
    };

    loadImage();

    // Cleanup: revoga blob URL quando o componente desmontar
    return () => {
      if (image && image.src.startsWith('blob:')) {
        URL.revokeObjectURL(image.src);
      }
    };
  }, [imageUrl]);

  /**
   * Pega posição do ponteiro relativa ao stage
   */
  const getRelativePointerPosition = useCallback(
    (stage) => {
      const pointerPosition = stage.getPointerPosition();
      const stageAttrs = stage.attrs;

      const x = (pointerPosition.x - stageAttrs.x) / stageAttrs.scaleX;
      const y = (pointerPosition.y - stageAttrs.y) / stageAttrs.scaleY;

      return { x, y };
    },
    []
  );

  /**
   * Inicia desenho
   */
  const handleMouseDown = useCallback(
    (e) => {
      if (readOnly) return;

      const stage = e.target.getStage();
      const shouldDraw = handleStylusDown(e.evt);

      // Se é toque (dedo), inicia pan
      if (currentPointerType === 'touch') {
        handlePanStart(e.evt);
        return;
      }

      // Se não deve desenhar (ex: mouse sem clique), retorna
      if (!shouldDraw) return;

      isDrawingRef.current = true;

      const pos = getRelativePointerPosition(stage);
      const pressure = e.evt.pressure || 0.5;

      setCurrentLine({
        points: [[pos.x, pos.y, pressure]],
        color: isEraser ? '#FFFFFF' : color, // Branco para apagar
        size: isEraser ? size * 2 : size, // Borracha é maior
        tool: isEraser ? 'eraser' : currentTool, // Armazena ferramenta usada
      });
    },
    [
      readOnly,
      handleStylusDown,
      currentPointerType,
      handlePanStart,
      getRelativePointerPosition,
      color,
      size,
      currentTool,
      isEraser,
    ]
  );

  /**
   * Continua desenho
   */
  const handleMouseMove = useCallback(
    (e) => {
      // Se está arrastando (pan), continua pan
      if (isDragging) {
        handlePanMove(e.evt);
        return;
      }

      if (!isDrawingRef.current || !currentLine) return;

      const stage = e.target.getStage();
      const pos = getRelativePointerPosition(stage);
      const pressure = e.evt.pressure || 0.5;

      setCurrentLine((prev) => ({
        ...prev,
        points: [...prev.points, [pos.x, pos.y, pressure]],
      }));
    },
    [isDragging, handlePanMove, currentLine, getRelativePointerPosition]
  );

  /**
   * Finaliza desenho
   */
  const handleMouseUp = useCallback(
    (e) => {
      handleStylusUp(e.evt);

      // Se estava arrastando (pan), finaliza pan
      if (isDragging) {
        handlePanEnd(e.evt);
        return;
      }

      if (!isDrawingRef.current || !currentLine) return;

      isDrawingRef.current = false;

      // Adiciona linha finalizada às linhas
      if (currentLine.points.length > 1) {
        updateLines([...lines, currentLine]);
      }

      setCurrentLine(null);
    },
    [handleStylusUp, isDragging, handlePanEnd, currentLine, lines, updateLines]
  );

  /**
   * Detecta botão da caneta (eraser button)
   */
  useEffect(() => {
    const handlePointerDown = (e) => {
      // Se é caneta E tem botão pressionado (button === 5 ou buttons & 32)
      if (e.pointerType === 'pen' && (e.button === 5 || (e.buttons & 32) !== 0)) {
        setIsEraser(true);
      }
    };

    const handlePointerUp = (e) => {
      // Quando solta, volta para caneta normal
      if (e.pointerType === 'pen') {
        setIsEraser(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  /**
   * Atalhos de teclado
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (readOnly) return;

      // Ctrl+Z = Desfazer
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }

      // Ctrl+S = Salvar
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveAnnotations();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readOnly, undo, saveAnnotations]);

  /**
   * Renderiza linha usando perfect-freehand
   */
  const renderLine = (line, index) => {
    if (!line.points || line.points.length < 2) return null;

    const strokeOptions = getStrokeOptions({ size: line.size });
    const stroke = getStroke(line.points, strokeOptions);

    if (stroke.length === 0) return null;

    // Converter pontos do perfect-freehand para flat array [x, y, x, y, ...]
    const points = stroke.reduce((acc, [x, y]) => {
      acc.push(x, y);
      return acc;
    }, []);

    // Configurações de estilo por ferramenta
    const toolStyles = {
      pen: { opacity: 1.0 },
      highlighter: { opacity: 0.3 },
      marker: { opacity: 0.7 },
      eraser: { opacity: 1.0 },
    };

    const tool = line.tool || 'pen'; // Fallback para linhas antigas sem tool
    const style = toolStyles[tool] || toolStyles.pen;

    return (
      <Line
        key={index}
        points={points}
        stroke={line.color}
        strokeWidth={1}
        tension={0}
        lineCap="round"
        lineJoin="round"
        closed
        fill={line.color}
        opacity={style.opacity}
        globalCompositeOperation={line.color === '#FFFFFF' ? 'destination-out' : 'source-over'}
      />
    );
  };

  /**
   * Troca cor e volta para modo caneta
   */
  const handleColorChange = (newColor) => {
    setColor(newColor);
    setIsEraser(false);
  };

  /**
   * Troca ferramenta e volta para modo desenho
   */
  const handleToolChange = (newTool) => {
    setCurrentTool(newTool);
    setIsEraser(false);
  };

  /**
   * Prepara para finalizar correção
   * Salva anotações antes de abrir modal de finalização
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

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-100 ${className}`}>
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Carregando anotações...</p>
        </div>
      </div>
    );
  }

  if (imageError) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-100 ${className}`}>
        <div className="text-center max-w-2xl px-6">
          <div className="text-6xl mb-4">🖼️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erro ao Carregar Imagem</h2>
          <p className="text-gray-600 mb-4">{imageError}</p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-700 mb-2">
              <strong>URL da imagem:</strong>
            </p>
            <code className="text-xs bg-white px-2 py-1 rounded border border-gray-300 block overflow-x-auto">
              {imageUrl}
            </code>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  if (!imageLoaded) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-100 ${className}`}>
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Carregando imagem da redação...</p>
          <p className="mt-2 text-sm text-gray-500">Isso pode levar alguns segundos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-gray-100 ${className}`}>
      {/* Toolbar */}
      {!readOnly && (
        <ToolbarAnnotation
          color={color}
          onColorChange={handleColorChange}
          size={size}
          onSizeChange={setSize}
          currentTool={currentTool}
          onToolChange={handleToolChange}
          isEraser={isEraser}
          onEraserToggle={() => setIsEraser(!isEraser)}
          onUndo={undo}
          onClear={handleClear}
          onSave={saveAnnotations}
          onFinish={handleFinish}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          lastSaved={lastSaved}
          linesCount={lines.length}
          canUndo={lines.length > 0}
          pointerType={currentPointerType}
          scale={scale}
        />
      )}

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto relative bg-gray-200"
        style={{ touchAction: 'none' }} // Previne gestos padrão
      >
        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2">
          <button
            onClick={zoomIn}
            className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            title="Zoom In"
          >
            <span className="text-xl">+</span>
          </button>
          <button
            onClick={zoomOut}
            className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            title="Zoom Out"
          >
            <span className="text-xl">−</span>
          </button>
          <button
            onClick={resetZoom}
            className="w-10 h-10 flex items-center justify-center bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            title="Reset Zoom"
          >
            <span className="text-sm">1:1</span>
          </button>
        </div>

        {/* Canvas */}
        <div className="flex items-center justify-center h-full">
          <Stage
            ref={stageRef}
            width={canvasSize.width}
            height={canvasSize.height}
            scaleX={scale}
            scaleY={scale}
            x={position.x}
            y={position.y}
            onPointerDown={handleMouseDown}
            onPointerMove={handleMouseMove}
            onPointerUp={handleMouseUp}
            style={{ cursor: isDragging ? 'grabbing' : isPenActive ? 'crosshair' : 'grab' }}
          >
            {/* Camada da Imagem (Fundo) */}
            <Layer>
              {image && <KonvaImage image={image} width={canvasSize.width} height={canvasSize.height} />}
            </Layer>

            {/* Camada das Anotações (Frente) */}
            <Layer>
              {/* Linhas finalizadas */}
              {lines.map((line, i) => renderLine(line, i))}

              {/* Linha sendo desenhada */}
              {currentLine && renderLine(currentLine, 'current')}
            </Layer>
          </Stage>
        </div>
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
