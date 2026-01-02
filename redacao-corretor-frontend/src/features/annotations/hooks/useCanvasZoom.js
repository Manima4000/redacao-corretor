import { useState, useCallback } from 'react';

/**
 * Hook simplificado para gerenciar zoom do canvas
 * O Pan agora é feito via scroll nativo do browser
 */
export function useCanvasZoom({
  minZoom = 0.5,
  maxZoom = 3,
  zoomStep = 0.2,
} = {}) {
  const [scale, setScale] = useState(1);

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
    setScale((prev) => Math.max(prev - zoomStep, minZoom));
  }, [minZoom, zoomStep]);

  /**
   * Resetar zoom
   */
  const resetZoom = useCallback(() => {
    setScale(1);
  }, []);

  return {
    scale,
    zoomIn,
    zoomOut,
    resetZoom,
    isZoomed: scale > 1,
  };
}
