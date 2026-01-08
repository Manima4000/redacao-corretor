import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Image as KonvaImage, Rect, Text } from 'react-konva';
import { useStylus } from '../hooks/useStylus';
import { useCanvasZoom } from '../hooks/useCanvasZoom';
import { getStrokeOptions } from '../utils/freehandHelper';
import getStroke from 'perfect-freehand';

export function AnnotationDemo() {
  const containerRef = useRef(null);
  const [lines, setLines] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

  // Hooks customizados
  const stylus = useStylus();
  const zoom = useCanvasZoom({ minZoom: 0.5, maxZoom: 4, zoomStep: 0.2 });

  // Ajustar tamanho do stage ao container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setStageSize({ width: clientWidth, height: clientHeight });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Prevenir zoom nativo do navegador (pinch zoom)
  useEffect(() => {
    const preventZoom = (e) => {
      // Prevenir zoom com pinch (dois dedos)
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }

      // Prevenir zoom com Ctrl+Scroll (desktop)
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    const preventWheel = (e) => {
      // Prevenir zoom com Ctrl+Scroll
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    // Adicionar listeners ao container e ao documento
    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', preventZoom, { passive: false });
      container.addEventListener('touchmove', preventZoom, { passive: false });
    }

    document.addEventListener('wheel', preventWheel, { passive: false });
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('gesturechange', (e) => e.preventDefault());
    document.addEventListener('gestureend', (e) => e.preventDefault());

    return () => {
      if (container) {
        container.removeEventListener('touchstart', preventZoom);
        container.removeEventListener('touchmove', preventZoom);
      }
      document.removeEventListener('wheel', preventWheel);
      document.removeEventListener('gesturestart', (e) => e.preventDefault());
      document.removeEventListener('gesturechange', (e) => e.preventDefault());
      document.removeEventListener('gestureend', (e) => e.preventDefault());
    };
  }, []);

  // Handler: Pointer Down (início do desenho ou pan)
  const handlePointerDown = (e) => {
    const event = e.evt;
    const shouldDraw = stylus.handlePointerDown(event);

    if (shouldDraw) {
      // Desenhar com caneta/mouse
      const stage = e.target.getStage();
      const point = stage.getPointerPosition();
      const pressure = event.pressure || 0.5;

      // Ajustar coordenadas considerando zoom e pan
      const transformedPoint = {
        x: (point.x - zoom.position.x) / zoom.scale,
        y: (point.y - zoom.position.y) / zoom.scale,
      };

      setCurrentLine({
        points: [[transformedPoint.x, transformedPoint.y, pressure]],
        color: '#FF0000',
        size: 4,
      });
    } else {
      // Pan com dedo (apenas se estiver com zoom)
      if (zoom.isZoomed) {
        zoom.handlePanStart(event);
      }
    }
  };

  // Handler: Pointer Move (desenhar ou mover)
  const handlePointerMove = (e) => {
    const event = e.evt;

    if (stylus.isPenActive && currentLine) {
      // Continuar desenhando
      const stage = e.target.getStage();
      const point = stage.getPointerPosition();
      const pressure = event.pressure || 0.5;

      // Ajustar coordenadas considerando zoom e pan
      const transformedPoint = {
        x: (point.x - zoom.position.x) / zoom.scale,
        y: (point.y - zoom.position.y) / zoom.scale,
      };

      setCurrentLine({
        ...currentLine,
        points: [...currentLine.points, [transformedPoint.x, transformedPoint.y, pressure]],
      });
    } else if (zoom.isDragging && zoom.isZoomed) {
      // Continuar pan
      zoom.handlePanMove(event);
    }
  };

  // Handler: Pointer Up (finalizar desenho ou pan)
  const handlePointerUp = () => {
    if (stylus.isPenActive && currentLine) {
      // Finalizar linha
      setLines([...lines, currentLine]);
      setCurrentLine(null);
    }

    stylus.handlePointerUp();
    zoom.handlePanEnd();
  };

  // Renderizar linha com perfect-freehand
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
      />
    );
  };

  // Limpar todas as linhas
  const handleClear = () => {
    setLines([]);
    setCurrentLine(null);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div
        style={{
          padding: '16px',
          background: '#f5f5f5',
          borderBottom: '2px solid #ddd',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#333' }}>
            <i className="bi bi-palette-fill" /> Teste de Anotações
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#666' }}>
            Use <strong>Caneta/Mouse</strong> para desenhar | Use <strong>Dedo</strong> para mover
          </p>
        </div>

        {/* Info do pointer atual */}
        <div
          style={{
            padding: '8px 16px',
            background: stylus.isPenActive ? '#4CAF50' : '#2196F3',
            color: 'white',
            borderRadius: '8px',
            fontWeight: 'bold',
          }}
        >
          {stylus.currentPointerType === 'pen' && <><i className="bi bi-pencil-fill" /> Caneta</>}
          {stylus.currentPointerType === 'touch' && <><i className="bi bi-hand-index-thumb-fill" /> Dedo</>}
          {stylus.currentPointerType === 'mouse' && <><i className="bi bi-mouse-fill" /> Mouse</>}
          {!stylus.currentPointerType && <><i className="bi bi-pause-circle-fill" /> Aguardando...</>}
        </div>

        {/* Zoom info */}
        <div
          style={{
            padding: '8px 16px',
            background: '#607D8B',
            color: 'white',
            borderRadius: '8px',
            fontWeight: 'bold',
          }}
        >
          <i className="bi bi-zoom-in" /> Zoom: {(zoom.scale * 100).toFixed(0)}%
        </div>

        {/* Zoom controls */}
        <button
          onClick={zoom.zoomOut}
          style={{
            padding: '8px 16px',
            background: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          <i className="bi bi-dash-lg" /> Zoom Out
        </button>
        <button
          onClick={zoom.zoomIn}
          style={{
            padding: '8px 16px',
            background: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          <i className="bi bi-plus-lg" /> Zoom In
        </button>
        <button
          onClick={zoom.resetZoom}
          style={{
            padding: '8px 16px',
            background: '#9E9E9E',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          <i className="bi bi-arrow-counterclockwise" /> Reset
        </button>

        {/* Clear button */}
        <button
          onClick={handleClear}
          style={{
            padding: '8px 16px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          <i className="bi bi-trash-fill" /> Limpar
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          background: '#fafafa',
          overflow: 'hidden',
          position: 'relative',
          touchAction: 'none', // IMPORTANTE: Previne gestos padrão do browser
        }}
      >
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          scaleX={zoom.scale}
          scaleY={zoom.scale}
          x={zoom.position.x}
          y={zoom.position.y}
          style={{ cursor: zoom.isZoomed && !stylus.isPenActive ? 'grab' : 'crosshair' }}
        >
          <Layer>
            {/* Background */}
            <Rect
              x={0}
              y={0}
              width={stageSize.width / zoom.scale}
              height={stageSize.height / zoom.scale}
              fill="white"
            />

            {/* Grid (para referência) */}
            {[...Array(20)].map((_, i) => (
              <Line
                key={`v-${i}`}
                points={[
                  (i * stageSize.width) / 20 / zoom.scale,
                  0,
                  (i * stageSize.width) / 20 / zoom.scale,
                  stageSize.height / zoom.scale,
                ]}
                stroke="#e0e0e0"
                strokeWidth={1 / zoom.scale}
              />
            ))}
            {[...Array(20)].map((_, i) => (
              <Line
                key={`h-${i}`}
                points={[
                  0,
                  (i * stageSize.height) / 20 / zoom.scale,
                  stageSize.width / zoom.scale,
                  (i * stageSize.height) / 20 / zoom.scale,
                ]}
                stroke="#e0e0e0"
                strokeWidth={1 / zoom.scale}
              />
            ))}

            {/* Instruções no centro */}
            <Text
              x={stageSize.width / 2 / zoom.scale - 200}
              y={stageSize.height / 2 / zoom.scale - 50}
              text="Use CANETA/MOUSE para desenhar"
              fontSize={24 / zoom.scale}
              fill="#999"
              align="center"
            />
            <Text
              x={stageSize.width / 2 / zoom.scale - 200}
              y={stageSize.height / 2 / zoom.scale}
              text="Use DEDO para mover (quando em zoom)"
              fontSize={24 / zoom.scale}
              fill="#999"
              align="center"
            />

            {/* Linhas finalizadas */}
            {lines.map((line, i) => renderLine(line, i))}

            {/* Linha atual (sendo desenhada) */}
            {currentLine && renderLine(currentLine, 'current')}
          </Layer>
        </Stage>

        {/* Contador de linhas */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            padding: '8px 16px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            borderRadius: '8px',
            fontWeight: 'bold',
          }}
        >
          <i className="bi bi-pencil-square" /> Linhas: {lines.length}
        </div>
      </div>
    </div>
  );
}
