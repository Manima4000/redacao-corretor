import { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Line } from 'react-konva';
import { Document, Page, pdfjs } from 'react-pdf';
import getStroke from 'perfect-freehand';
import { useStylus } from '../hooks/useStylus';
import { useCanvasZoom } from '../hooks/useCanvasZoom';
import { useAnnotationContext } from './AnnotationProvider';
import { getStrokeOptions } from '../utils/freehandHelper';
import { Spinner } from '@/shared/components/ui/Spinner';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configuração do Worker via CDN para evitar problemas de MIME type com Vite/ESM
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * Canvas de Anotações com Konva e Suporte a PDF
 *
 * @param {Object} props
 * @param {string} props.imageUrl - URL do arquivo (imagem ou PDF)
 * @param {number} props.pageNumber - Número da página (para PDF)
 * @param {Function} props.onZoomChange - Callback quando zoom muda
 */
export const AnnotationCanvas = ({ imageUrl, pageNumber = 1, onZoomChange }) => {
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
  const [fileType, setFileType] = useState(null); // 'image' | 'pdf'
  const [fileUrl, setFileUrl] = useState(null); // Blob URL
  const [image, setImage] = useState(null); // Objeto Image para Konva
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
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
   * Carrega arquivo (Imagem ou PDF) via fetch
   */
  useEffect(() => {
    if (!imageUrl) return;

    // Reset states
    setIsLoaded(false);
    setLoadError(null);
    setFileType(null);
    setImage(null);

    const loadFile = async () => {
      try {
        const response = await fetch(imageUrl, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setFileUrl(blobUrl);

        if (contentType?.includes('application/pdf')) {
          setFileType('pdf');
          // Carregamento do PDF é assíncrono via componente Document,
          // setIsLoaded será chamado no onLoadSuccess da Page
        } else {
          setFileType('image');
          // Processar imagem
          const img = new window.Image();
          img.onload = () => {
            setImage(img);
            setCanvasSize({ width: img.width, height: img.height });
            setIsLoaded(true);
          };
          img.onerror = () => {
            setLoadError('Erro ao processar imagem');
            setIsLoaded(false);
          };
          img.src = blobUrl;
        }

      } catch (error) {
        console.error('Erro ao carregar arquivo:', error);
        setLoadError(`Erro ao carregar arquivo: ${error.message}`);
        setIsLoaded(false);
      }
    };

    loadFile();

    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
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
   * Callback quando página do PDF carrega
   */
  const onPdfPageLoadSuccess = ({ width, height }) => {
    setCanvasSize({ width, height });
    setIsLoaded(true);
  };

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

      if (currentPointerType === 'touch') {
        handlePanStart(e.evt);
        return;
      }

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
    [readOnly, handleStylusDown, currentPointerType, handlePanStart, getRelativePointerPosition, color, size, currentTool, isEraser]
  );

  /**
   * Continua desenho
   */
  const handleMouseMove = useCallback(
    (e) => {
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

      if (isDragging) {
        handlePanEnd(e.evt);
        return;
      }

      if (!isDrawingRef.current || !currentLine) return;

      isDrawingRef.current = false;

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

    const points = stroke.reduce((acc, [x, y]) => {
      acc.push(x, y);
      return acc;
    }, []);

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

  // Erro
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center max-w-2xl px-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erro ao Carregar Arquivo</h2>
          <p className="text-gray-600 mb-4">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full flex items-center justify-center bg-gray-200 overflow-hidden relative"
      style={{ touchAction: 'none' }}
    >
      {/* Loading Spinner */}
      {!isLoaded && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-100 bg-opacity-80">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-600">
              {fileType === 'pdf' ? 'Renderizando PDF...' : 'Carregando Imagem...'}
            </p>
          </div>
        </div>
      )}

      {/* Container Relativo para Layers */}
      <div 
        className="relative shadow-lg bg-white"
        style={{ width: canvasSize.width, height: canvasSize.height }}
      >
        {/* Layer 1: PDF (HTML/Canvas) - Fica atrás do Konva */}
        {fileType === 'pdf' && fileUrl && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              zIndex: 0,
              pointerEvents: 'none', // Deixa eventos passarem para o Konva
            }}
          >
            <Document 
              file={fileUrl}
              loading={null}
              error={<div>Erro no PDF</div>}
            >
              <Page 
                pageNumber={pageNumber} 
                onLoadSuccess={onPdfPageLoadSuccess}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                width={canvasSize.width} // Define largura inicial base
                scale={1} // Mantém escala 1 para usar CSS transform (performance)
              />
            </Document>
          </div>
        )}

        {/* Layer 2: Konva Stage (Anotações + Imagem Raster) */}
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
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 10,
            cursor: isDragging ? 'grabbing' : isPenActive ? 'crosshair' : 'grab',
            // Se for PDF, o fundo do Stage é transparente para ver o PDF atrás
            backgroundColor: 'transparent' 
          }}
        >
          {/* Sub-Layer 2.1: Imagem Raster (se não for PDF) */}
          {fileType === 'image' && image && (
            <Layer>
              <KonvaImage image={image} width={canvasSize.width} height={canvasSize.height} />
            </Layer>
          )}

          {/* Sub-Layer 2.2: Anotações */}
          <Layer>
            {lines.map((line, i) => renderLine(line, i))}
            {currentLine && renderLine(currentLine, 'current')}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};
