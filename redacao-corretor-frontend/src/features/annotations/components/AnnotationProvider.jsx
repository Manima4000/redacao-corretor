import { createContext, useContext, useState } from 'react';
import { useAnnotations } from '../hooks/useAnnotations';

/**
 * Context de Anotações
 * Centraliza estado de anotações e ferramentas para evitar prop drilling
 */
const AnnotationContext = createContext(null);

/**
 * Provider de Anotações
 *
 * Responsabilidades:
 * - Centralizar estado de anotações (lines, isLoading, isSaving, etc.)
 * - Centralizar estado de ferramentas (color, size, tool, eraser)
 * - Fornecer estado para componentes filhos via Context API
 *
 * Segue SOLID:
 * - SRP: Apenas gerencia estado global de anotações
 * - Evita prop drilling (componentes acessam via useAnnotationContext)
 *
 * @param {Object} props
 * @param {string} props.essayId - ID da redação
 * @param {boolean} [props.readOnly=false] - Se true, desabilita edição
 * @param {React.ReactNode} props.children - Componentes filhos
 *
 * @example
 * <AnnotationProvider essayId={essayId} readOnly={false}>
 *   <Toolbar />
 *   <Canvas />
 * </AnnotationProvider>
 */
export const AnnotationProvider = ({ essayId, readOnly = false, children }) => {
  // Estado de anotações (via hook useAnnotations)
  const annotations = useAnnotations(essayId, 1, readOnly);

  // Estado de ferramentas (cor, tamanho, tool)
  const [color, setColor] = useState('#EF4444'); // Vermelho padrão
  const [size, setSize] = useState(4); // Médio padrão
  const [currentTool, setCurrentTool] = useState('pen'); // pen, highlighter, marker
  const [isEraser, setIsEraser] = useState(false);

  /**
   * Troca cor e desativa borracha
   */
  const handleColorChange = (newColor) => {
    setColor(newColor);
    setIsEraser(false);
  };

  /**
   * Troca ferramenta e desativa borracha
   */
  const handleToolChange = (newTool) => {
    setCurrentTool(newTool);
    setIsEraser(false);
  };

  /**
   * Toggle borracha
   */
  const toggleEraser = () => {
    setIsEraser(!isEraser);
  };

  // Valor do context (tudo que componentes filhos podem acessar)
  const value = {
    // Estado de anotações (do hook useAnnotations)
    lines: annotations.lines,
    isLoading: annotations.isLoading,
    isSaving: annotations.isSaving,
    lastSaved: annotations.lastSaved,
    hasUnsavedChanges: annotations.hasUnsavedChanges,
    updateLines: annotations.updateLines,
    saveAnnotations: annotations.saveAnnotations,
    clearAnnotations: annotations.clearAnnotations,
    undo: annotations.undo,
    reload: annotations.reload,

    // Estado de ferramentas
    color,
    setColor: handleColorChange,
    size,
    setSize,
    currentTool,
    setCurrentTool: handleToolChange,
    isEraser,
    setIsEraser,
    toggleEraser,

    // Metadados
    essayId,
    readOnly,
  };

  return <AnnotationContext.Provider value={value}>{children}</AnnotationContext.Provider>;
};

/**
 * Hook para consumir o context de anotações
 *
 * IMPORTANTE: Deve ser usado apenas dentro de <AnnotationProvider>
 *
 * @returns {Object} Estado e funções de anotações
 * @throws {Error} Se usado fora do AnnotationProvider
 *
 * @example
 * const { lines, color, saveAnnotations } = useAnnotationContext();
 */
export const useAnnotationContext = () => {
  const context = useContext(AnnotationContext);

  if (!context) {
    throw new Error('useAnnotationContext must be used within AnnotationProvider');
  }

  return context;
};
