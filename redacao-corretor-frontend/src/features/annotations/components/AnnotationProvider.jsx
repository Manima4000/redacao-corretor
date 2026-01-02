import { createContext, useContext, useState, useCallback, useRef } from 'react';

/**
 * Context de Anotações
 * Centraliza estado de anotações e ferramentas para evitar prop drilling
 */
const AnnotationContext = createContext(null);

/**
 * Provider de Anotações e Orquestrador de Páginas
 * 
 * Responsabilidades:
 * - Centralizar estado global de ferramentas (color, size, tool, eraser)
 * - Orquestrar ações de múltiplas páginas (salvar todas, limpar todas, desfazer)
 * - Fornecer estado agregado para componentes filhos via Context API
 *
 * Segue SOLID:
 * - SRP: Gerencia estado global e coordena páginas
 * - Evita prop drilling (componentes acessam via useAnnotationContext)
 *
 * @param {Object} props
 * @param {string} props.essayId - ID da redação
 * @param {boolean} [props.readOnly=false] - Se true, desabilita edição
 * @param {React.ReactNode} props.children - Componentes filhos
 */
export const AnnotationProvider = ({ essayId, readOnly = false, children }) => {
  // --- Estado de Ferramentas (Compartilhado) ---
  const [color, setColor] = useState('#EF4444');
  const [size, setSize] = useState(4);
  const [currentTool, setCurrentTool] = useState('pen');
  const [isEraser, setIsEraser] = useState(false);

  // --- Estado de Orquestração de Páginas ---
  // Map<pageNumber, pageMethods>
  const pagesRef = useRef(new Map());
  const [globalState, setGlobalState] = useState({
    hasUnsavedChanges: false,
    isSaving: false,
    totalLines: 0 // Usado para habilitar/desabilitar Undo/Clear
  });

  /**
   * Atualiza o estado global agregado verificando todas as páginas
   */
  const updateGlobalState = useCallback(() => {
    let hasUnsaved = false;
    let isSaving = false;
    let totalLines = 0;

    pagesRef.current.forEach((methods) => {
      if (methods.hasUnsavedChanges) hasUnsaved = true;
      if (methods.isSaving) isSaving = true;
      totalLines += methods.lineCount || 0;
    });

    setGlobalState({ hasUnsavedChanges: hasUnsaved, isSaving, totalLines });
  }, []);

  /**
   * Registra uma página para ser gerenciada
   */
  const registerPage = useCallback((pageNumber, methods) => {
    pagesRef.current.set(pageNumber, methods);
    updateGlobalState();
    
    // Retorna função de cleanup
    return () => {
      pagesRef.current.delete(pageNumber);
      updateGlobalState();
    };
  }, [updateGlobalState]);

  /**
   * Notifica que o estado de uma página mudou (ex: desenhou algo)
   */
  const notifyPageUpdate = useCallback((pageNumber, newState) => {
    const methods = pagesRef.current.get(pageNumber);
    if (methods) {
      // Atualiza os dados armazenados
      pagesRef.current.set(pageNumber, { ...methods, ...newState });
      updateGlobalState();
    }
  }, [updateGlobalState]);

  // --- Ações Globais ---

  const handleColorChange = (newColor) => {
    setColor(newColor);
    setIsEraser(false);
  };

  const handleToolChange = (newTool) => {
    setCurrentTool(newTool);
    setIsEraser(false);
  };

  const toggleEraser = () => setIsEraser(!isEraser);

  /**
   * Salva anotações de TODAS as páginas que têm mudanças
   */
  const saveAnnotations = async () => {
    const promises = [];
    pagesRef.current.forEach((methods) => {
      if (methods.hasUnsavedChanges) {
        promises.push(methods.save());
      }
    });

    if (promises.length > 0) {
      await Promise.all(promises);
      updateGlobalState();
    }
  };

  /**
   * Limpa anotações de TODAS as páginas
   */
  const clearAnnotations = () => {
    pagesRef.current.forEach((methods) => {
      methods.clear();
    });
    updateGlobalState();
  };

  /**
   * Desfazer global (Simplificado: tenta desfazer na última página com linhas)
   */
  const undo = () => {
    const sortedPages = Array.from(pagesRef.current.entries())
      .sort((a, b) => b[0] - a[0]);

    for (const [_, methods] of sortedPages) {
      if (methods.lineCount > 0) {
        methods.undo();
        updateGlobalState();
        return;
      }
    }
  };

  const value = {
    // Ferramentas
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

    // Estado Global Agregado
    lines: Array(globalState.totalLines).fill(null),
    isLoading: false,
    isSaving: globalState.isSaving,
    hasUnsavedChanges: globalState.hasUnsavedChanges,

    // Ações Globais
    saveAnnotations,
    clearAnnotations,
    undo,

    // Métodos Internos para Páginas
    registerPage,
    notifyPageUpdate
  };

  return <AnnotationContext.Provider value={value}>{children}</AnnotationContext.Provider>;
};

/**
 * Hook para consumir o context de anotações
 */
export const useAnnotationContext = () => {
  const context = useContext(AnnotationContext);
  if (!context) {
    throw new Error('useAnnotationContext must be used within AnnotationProvider');
  }
  return context;
};