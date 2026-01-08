import { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Line } from 'react-konva';
import { Page } from 'react-pdf';
import getStroke from 'perfect-freehand';
import { useStylus } from '../hooks/useStylus';
import { useAnnotations } from '../hooks/useAnnotations';
import { useAnnotationContext } from './AnnotationProvider';
import { getStrokeOptions } from '../utils/freehandHelper';

/**
 * Componente que renderiza uma única página (Imagem ou PDF) com sua camada de anotação
 */
export const AnnotationPage = ({ 
  essayId, 
  pageNumber, 
  fileType, 
  fileUrl, 
  image, 
  scale, 
  readOnly,
  onLoadSuccess 
}) => {
  const { 
    color, 
    size, 
    currentTool, 
    isEraser, 
    registerPage, 
    notifyPageUpdate 
  } = useAnnotationContext();
  
  // Hook de anotações específico para esta página
  const {
    lines,
    updateLines,
    isLoading,
    saveAnnotations, // Método de salvar específico desta página
    clearAnnotations,
    undo,
    hasUnsavedChanges,
    isSaving
  } = useAnnotations(essayId, pageNumber, readOnly);

  // Registrar página no Provider (Orquestrador)
  useEffect(() => {
    // Define os métodos e estados que o Provider pode acessar
    const pageMethods = {
      save: saveAnnotations,
      clear: clearAnnotations,
      undo: undo,
      hasUnsavedChanges: hasUnsavedChanges,
      isSaving: isSaving,
      lineCount: lines.length
    };

    // Registra e recebe cleanup
    const unregister = registerPage(pageNumber, pageMethods);

    // Notifica atualização inicial
    notifyPageUpdate(pageNumber, pageMethods);

    return unregister;
  }, [
    pageNumber, 
    registerPage, 
    notifyPageUpdate, 
    saveAnnotations, 
    clearAnnotations, 
    undo, 
    hasUnsavedChanges, 
    isSaving, 
    lines.length
  ]);

  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [currentLine, setCurrentLine] = useState(null);
  
  const stageRef = useRef(null);
  const isDrawingRef = useRef(false);

  const {
    currentPointerType,
    isPenActive,
    handlePointerDown: handleStylusDown,
    handlePointerUp: handleStylusUp,
  } = useStylus();

  // Callback para quando a página do PDF carrega
  const onPdfLoadSuccess = ({ width, height }) => {
    setPageSize({ width, height });
    if (onLoadSuccess) onLoadSuccess(pageNumber, { width, height });
  };

  // Se for imagem, define o tamanho baseado no objeto Image
  useEffect(() => {
    if (fileType === 'image' && image) {
      const width = image.width;
      const height = image.height;
      setPageSize({ width, height });
      if (onLoadSuccess) onLoadSuccess(pageNumber, { width, height });
    }
  }, [fileType, image, pageNumber, onLoadSuccess]);

  const getRelativePointerPosition = useCallback((stage) => {
    const pointerPosition = stage.getPointerPosition();
    const stageAttrs = stage.attrs;
    // IMPORTANTE: Aqui não usamos position.x/y porque o scroll é nativo do browser
    const x = pointerPosition.x / stageAttrs.scaleX;
    const y = pointerPosition.y / stageAttrs.scaleY;
    return { x, y };
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (readOnly) return;
    const stage = e.target.getStage();
    const shouldDraw = handleStylusDown(e.evt);
    if (currentPointerType === 'touch' || !shouldDraw) return;

    isDrawingRef.current = true;
    const pos = getRelativePointerPosition(stage);
    const pressure = e.evt.pressure || 0.5;

    setCurrentLine({
      points: [[pos.x, pos.y, pressure]],
      color: isEraser ? '#FFFFFF' : color,
      size: isEraser ? size * 2 : size,
      tool: isEraser ? 'eraser' : currentTool,
    });
  }, [readOnly, handleStylusDown, currentPointerType, getRelativePointerPosition, color, size, currentTool, isEraser]);

  const handleMouseMove = useCallback((e) => {
    if (!isDrawingRef.current || !currentLine) return;
    const stage = e.target.getStage();
    const pos = getRelativePointerPosition(stage);
    const pressure = e.evt.pressure || 0.5;
    setCurrentLine((prev) => ({
      ...prev,
      points: [...prev.points, [pos.x, pos.y, pressure]],
    }));
  }, [currentLine, getRelativePointerPosition]);

  const handleMouseUp = useCallback((e) => {
    handleStylusUp(e.evt);
    if (!isDrawingRef.current || !currentLine) return;
    isDrawingRef.current = false;
    if (currentLine.points.length > 1) {
      updateLines([...lines, currentLine]);
    }
    setCurrentLine(null);
  }, [handleStylusUp, currentLine, lines, updateLines]);

  const renderLine = (line, index) => {
    if (!line.points || line.points.length < 2) return null;
    const strokeOptions = getStrokeOptions({ size: line.size });
    const stroke = getStroke(line.points, strokeOptions);
    if (stroke.length === 0) return null;
    const points = stroke.reduce((acc, [x, y]) => { acc.push(x, y); return acc; }, []);
    
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

  if (pageSize.width === 0) {
    return (
      <div className="bg-white shadow-md mb-8 flex items-center justify-center" style={{ width: 800, height: 1100 }}>
        {fileType === 'pdf' ? (
          <Page 
            pageNumber={pageNumber} 
            onLoadSuccess={onPdfLoadSuccess}
            width={800}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        ) : (
          <div className="animate-pulse bg-gray-200 w-full h-full" />
        )}
      </div>
    );
  }

  return (
    <div 
      className="relative shadow-xl bg-white mb-12 mx-auto"
      style={{ 
        width: pageSize.width * scale, 
        height: pageSize.height * scale,
        transition: 'width 0.2s, height 0.2s'
      }}
    >
      {/* Background Layer (PDF) */}
      {fileType === 'pdf' && (
        <div className="absolute top-0 left-0 z-0 pointer-events-none origin-top-left" style={{ transform: `scale(${scale})` }}>
          <Page 
            pageNumber={pageNumber} 
            width={pageSize.width}
            scale={1}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </div>
      )}

      {/* Konva Stage */}
      <Stage
        ref={stageRef}
        width={pageSize.width * scale}
        height={pageSize.height * scale}
        scaleX={scale}
        scaleY={scale}
        onPointerDown={handleMouseDown}
        onPointerMove={handleMouseMove}
        onPointerUp={handleMouseUp}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 10,
          cursor: isPenActive ? 'crosshair' : 'default',
          backgroundColor: fileType === 'image' ? 'transparent' : 'transparent',
          touchAction: 'none' // Permite scroll vertical com dedo, bloqueia outros gestos
        }}
      >
        {fileType === 'image' && image && (
          <Layer>
            <KonvaImage image={image} width={pageSize.width} height={pageSize.height} />
          </Layer>
        )}
        <Layer>
          {lines.map((line, i) => renderLine(line, i))}
          {currentLine && renderLine(currentLine, 'current')}
        </Layer>
      </Stage>
    </div>
  );
};
