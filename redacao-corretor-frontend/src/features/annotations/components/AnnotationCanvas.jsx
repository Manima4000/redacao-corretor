import { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Line } from 'react-konva';
import getStroke from 'perfect-freehand';
import { useStylus } from '../hooks/useStylus';
import { useCanvasZoom } from '../hooks/useCanvasZoom';
import { useAnnotationContext } from './AnnotationProvider';
import { getStrokeOptions } from '../utils/freehandHelper';
import { Spinner } from '@/shared/components/ui/Spinner';

/**
 * Canvas de Anotações com Konva (REFATORADO)
 *
 * Responsabilidades:
 * - Carregar imagem da redação
 * - Gerenciar desenho com stylus/caneta
 * - Renderizar linhas com perfect-freehand
 * - Zoom e pan
 *
 * Segue SOLID:
 * - SRP: Canvas completo (imagem + anotações)
 * - Usa Context para estado
 *
 * NOTA: Imagem e anotações DEVEM estar no mesmo Stage para coordenadas corretas
 *
 * @param {Object} props
 * @param {string} props.imageUrl - URL da imagem
 * @param {Function} props.onZoomChange - Callback quando zoom muda
 */
export const AnnotationCanvas = ({ imageUrl, onZoomChange }) => {
  // Context de anotações
  const {
    lines,
    updateLines,
    color,
    size,
    currentTool,
    isEraser,
    readOnly,
  } = useAnnotationContext();

  // Estado local
  const [image, setImage] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [currentLine, setCurrentLine] = useState(null);

  // Refs
  const stageRef = useRef(null);
  const isDrawingRef = useRef(false);

  // Hooks customizados
  const {
    currentPointerType,
    isPenActive,
    handlePointerDown: handleStylusDown,
    handlePointerUp: handleStylusUp,
  } = useStylus();

  const {
    scale,
    position,
    isDragging,
    zoomIn,
    zoomOut,
    resetZoom,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
  } = useCanvasZoom({ minZoom: 0.5, maxZoom: 4, zoomStep: 0.2 });

  /**
   * Carrega imagem da redação via fetch
   */
  useEffect(() => {
    if (!imageUrl) return;

    const loadImage = async () => {
      try {
        // Faz requisição com credenciais (cookies)
        const response = await fetch(imageUrl, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Converte resposta em blob
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        // Cria elemento de imagem
        const img = new window.Image();

        img.onload = () => {
          setImage(img);
          setImageLoaded(true);
          // Usa dimensões naturais da imagem
          setCanvasSize({ width: img.width, height: img.height });
        };

        img.onerror = (error) => {
          console.error('Erro ao carregar imagem:', error);
          setImageError('Erro ao carregar imagem');
          setImageLoaded(false);
        };

        img.src = blobUrl;
      } catch (error) {
        console.error('Erro ao fazer fetch da imagem:', error);
        setImageError(`Erro ao carregar imagem: ${error.message}`);
        setImageLoaded(false);
      }
    };

    loadImage();

    // Cleanup: revoga blob URL
    return () => {
      if (image && image.src.startsWith('blob:')) {
        URL.revokeObjectURL(image.src);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  /**
   * Notifica mudanças de zoom
   */
  useEffect(() => {
    if (onZoomChange) {
      onZoomChange({ scale, zoomIn, zoomOut, resetZoom });
    }
  }, [scale, zoomIn, zoomOut, resetZoom, onZoomChange]);

  /**
   * Pega posição do ponteiro relativa ao stage
   */
  const getRelativePointerPosition = useCallback((stage) => {
    const pointerPosition = stage.getPointerPosition();
    const stageAttrs = stage.attrs;

    const x = (pointerPosition.x - stageAttrs.x) / stageAttrs.scaleX;
    const y = (pointerPosition.y - stageAttrs.y) / stageAttrs.scaleY;

    return { x, y };
  }, []);

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

      // Se não deve desenhar, retorna
      if (!shouldDraw) return;

      isDrawingRef.current = true;

      const pos = getRelativePointerPosition(stage);
      const pressure = e.evt.pressure || 0.5;

      setCurrentLine({
        points: [[pos.x, pos.y, pressure]],
        color: isEraser ? '#FFFFFF' : color,
        size: isEraser ? size * 2 : size,
        tool: isEraser ? 'eraser' : currentTool,
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
   * Renderiza linha usando perfect-freehand
   */
  const renderLine = (line, index) => {
    if (!line.points || line.points.length < 2) return null;

    const strokeOptions = getStrokeOptions({ size: line.size });
    const stroke = getStroke(line.points, strokeOptions);

    if (stroke.length === 0) return null;

    // Converter pontos do perfect-freehand para flat array
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

    const tool = line.tool || 'pen';
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

  // Loading
  if (!imageLoaded && !imageError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Carregando imagem da redação...</p>
        </div>
      </div>
    );
  }

  // Erro
  if (imageError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center max-w-2xl px-6">
          <div className="text-6xl mb-4">🖼️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erro ao Carregar Imagem</h2>
          <p className="text-gray-600 mb-4">{imageError}</p>
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

  return (
    <div
      className="w-full h-full flex items-center justify-center bg-gray-200 overflow-hidden"
      style={{ touchAction: 'none' }}
    >
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
  );
};
