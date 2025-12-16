import { useState, useCallback } from 'react';

/**
 * Hook para detectar tipo de input (caneta, dedo, mouse)
 *
 * PointerEvent.pointerType retorna:
 * - 'pen' = Stylus/Caneta de tablet
 * - 'touch' = Dedo
 * - 'mouse' = Mouse
 *
 * Uso:
 * - Caneta (pen) → desenha
 * - Dedo (touch) → move imagem (pan)
 * - Mouse → desenha (fallback para desktop)
 */
export function useStylus() {
  const [currentPointerType, setCurrentPointerType] = useState(null);
  const [isPenActive, setIsPenActive] = useState(false);

  /**
   * Detecta o tipo de pointer e decide se deve desenhar
   * @param {PointerEvent} event
   * @returns {boolean} - true se deve desenhar, false se deve fazer pan
   */
  const handlePointerDown = useCallback((event) => {
    const pointerType = event.pointerType;
    setCurrentPointerType(pointerType);

    // Desenha com caneta (pen) ou mouse
    // Move com dedo (touch)
    const shouldDraw = pointerType === 'pen' || pointerType === 'mouse';
    setIsPenActive(shouldDraw);

    return shouldDraw;
  }, []);

  const handlePointerUp = useCallback(() => {
    setIsPenActive(false);
  }, []);

  /**
   * Verifica se o evento atual é de caneta
   */
  const isStylus = useCallback((event) => {
    return event.pointerType === 'pen';
  }, []);

  /**
   * Verifica se o evento atual é de toque (dedo)
   */
  const isTouch = useCallback((event) => {
    return event.pointerType === 'touch';
  }, []);

  /**
   * Verifica se o evento atual é de mouse
   */
  const isMouse = useCallback((event) => {
    return event.pointerType === 'mouse';
  }, []);

  return {
    currentPointerType,
    isPenActive,
    handlePointerDown,
    handlePointerUp,
    isStylus,
    isTouch,
    isMouse,
  };
}
