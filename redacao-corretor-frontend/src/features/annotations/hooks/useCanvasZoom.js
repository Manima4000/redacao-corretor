import { useState, useCallback, useRef } from 'react';

/**
 * Hook para gerenciar zoom e pan do canvas
 *
 * Features:
 * - Zoom in/out com botões
 * - Pinch zoom (dois dedos no touch)
 * - Pan (arrastar com dedo quando em zoom)
 * - Limites de zoom (min/max)
 */
export function useCanvasZoom({
  minZoom = 0.5,
  maxZoom = 4,
  zoomStep = 0.2,
} = {}) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastTouchDistance = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  /**
   * Zoom in (aumentar)
   */
  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + zoomStep, maxZoom));
  }, [maxZoom, zoomStep]);

  /**
   * Zoom out (diminuir)
   */
  const zoomOut = useCallback(() => {
    setScale((prev) => {
      const newScale = Math.max(prev - zoomStep, minZoom);
      // Se voltou para escala 1, resetar posição
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  }, [minZoom, zoomStep]);

  /**
   * Resetar zoom e posição
   */
  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  /**
   * Calcular distância entre dois toques (pinch zoom)
   */
  const getTouchDistance = useCallback((touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  /**
   * Iniciar pan (arrastar)
   */
  const handlePanStart = useCallback(
    (event) => {
      // Só permite pan se estiver com zoom
      if (scale <= 1) return;

      setIsDragging(true);
      const point =
        event.touches?.[0] || event.changedTouches?.[0] || event;
      dragStartPos.current = {
        x: point.clientX - position.x,
        y: point.clientY - position.y,
      };
    },
    [scale, position]
  );

  /**
   * Mover durante o pan
   */
  const handlePanMove = useCallback(
    (event) => {
      if (!isDragging || scale <= 1) return;

      const point =
        event.touches?.[0] || event.changedTouches?.[0] || event;
      setPosition({
        x: point.clientX - dragStartPos.current.x,
        y: point.clientY - dragStartPos.current.y,
      });
    },
    [isDragging, scale]
  );

  /**
   * Finalizar pan
   */
  const handlePanEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Pinch zoom (dois dedos)
   */
  const handlePinch = useCallback(
    (event) => {
      if (event.touches.length !== 2) {
        lastTouchDistance.current = null;
        return;
      }

      const currentDistance = getTouchDistance(event.touches);

      if (lastTouchDistance.current !== null) {
        const delta = currentDistance - lastTouchDistance.current;
        const zoomDelta = delta * 0.01;

        setScale((prev) => {
          const newScale = prev + zoomDelta;
          return Math.max(minZoom, Math.min(newScale, maxZoom));
        });
      }

      lastTouchDistance.current = currentDistance;
    },
    [getTouchDistance, minZoom, maxZoom]
  );

  /**
   * Zoom para um ponto específico (zoom centrado)
   */
  const zoomToPoint = useCallback(
    (point, zoomDelta) => {
      setScale((prevScale) => {
        const newScale = Math.max(
          minZoom,
          Math.min(prevScale + zoomDelta, maxZoom)
        );
        const scaleChange = newScale - prevScale;

        // Ajustar posição para zoom centrado no ponto
        setPosition((prevPos) => ({
          x: prevPos.x - point.x * scaleChange,
          y: prevPos.y - point.y * scaleChange,
        }));

        return newScale;
      });
    },
    [minZoom, maxZoom]
  );

  return {
    scale,
    position,
    isDragging,
    zoomIn,
    zoomOut,
    resetZoom,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    handlePinch,
    zoomToPoint,
    isZoomed: scale > 1,
  };
}
