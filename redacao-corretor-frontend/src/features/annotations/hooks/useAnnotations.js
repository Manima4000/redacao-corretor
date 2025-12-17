import { useState, useEffect, useRef, useCallback } from 'react';
import { annotationService } from '../services/annotationService';
import { useToast } from '@/shared/hooks/useToast';

/**
 * Hook para gerenciar anotações de redação
 *
 * Features:
 * - Carrega anotações do backend
 * - Salva manualmente ou automaticamente (auto-save a cada 5s)
 * - Gerencia loading/saving states
 * - Atualiza status da redação
 *
 * @param {string} essayId - ID da redação
 * @param {number} pageNumber - Número da página (para PDFs)
 * @param {boolean} readOnly - Se true, desabilita auto-save e edição
 * @returns {Object} Estado e funções de anotações
 */
export const useAnnotations = (essayId, pageNumber = 1, readOnly = false) => {
  const [lines, setLines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { showToast } = useToast();
  const autoSaveTimerRef = useRef(null);
  const lastSavedDataRef = useRef(null);

  /**
   * Carrega anotações do backend
   */
  const loadAnnotations = useCallback(async () => {
    if (!essayId) return;

    try {
      setIsLoading(true);
      const data = await annotationService.getAnnotations(essayId, pageNumber);

      // Se não houver anotações, inicializa vazio
      const loadedLines = data?.annotationData?.lines || [];
      setLines(loadedLines);
      lastSavedDataRef.current = JSON.stringify(loadedLines);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Erro ao carregar anotações:', error);
      showToast('Erro ao carregar anotações', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [essayId, pageNumber, showToast]);

  /**
   * Salva anotações no backend
   */
  const saveAnnotations = useCallback(
    async (linesToSave = lines, showSuccessToast = true) => {
      if (!essayId || readOnly) return;

      try {
        setIsSaving(true);

        const annotationData = {
          version: '1.0',
          lines: linesToSave,
        };

        await annotationService.saveAnnotations(essayId, annotationData, pageNumber);

        lastSavedDataRef.current = JSON.stringify(linesToSave);
        setLastSaved(new Date());
        setHasUnsavedChanges(false);

        if (showSuccessToast) {
          showToast('Anotações salvas com sucesso', 'success');
        }
      } catch (error) {
        console.error('Erro ao salvar anotações:', error);
        showToast('Erro ao salvar anotações', 'error');
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [essayId, pageNumber, lines, readOnly, showToast]
  );

  /**
   * Auto-save: Salva automaticamente se houver mudanças
   */
  const autoSave = useCallback(() => {
    if (readOnly || !hasUnsavedChanges) return;

    console.log('[useAnnotations] Auto-save triggered');
    saveAnnotations(lines, false); // false = não mostra toast
  }, [lines, hasUnsavedChanges, readOnly, saveAnnotations]);

  /**
   * Atualiza linhas e marca como tendo mudanças não salvas
   */
  const updateLines = useCallback((newLines) => {
    setLines(newLines);

    // Verifica se houve mudança real comparando com última versão salva
    const currentData = JSON.stringify(newLines);
    const hasChanged = currentData !== lastSavedDataRef.current;
    setHasUnsavedChanges(hasChanged);
  }, []);

  /**
   * Atualiza status da redação
   */
  const updateStatus = useCallback(
    async (status) => {
      if (!essayId) return;

      try {
        await annotationService.updateEssayStatus(essayId, status);
        showToast('Status atualizado com sucesso', 'success');
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
        showToast('Erro ao atualizar status', 'error');
        throw error;
      }
    },
    [essayId, showToast]
  );

  /**
   * Salva e marca como corrigido
   */
  const saveAndFinish = useCallback(async () => {
    try {
      // Primeiro salva anotações
      await saveAnnotations(lines, false);

      // Depois atualiza status para 'corrected'
      await updateStatus('corrected');

      showToast('Correção finalizada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao finalizar correção:', error);
      throw error;
    }
  }, [lines, saveAnnotations, updateStatus, showToast]);

  /**
   * Limpa todas as anotações
   */
  const clearAnnotations = useCallback(() => {
    updateLines([]);
  }, [updateLines]);

  /**
   * Desfazer última linha
   */
  const undo = useCallback(() => {
    if (lines.length === 0) return;
    updateLines(lines.slice(0, -1));
  }, [lines, updateLines]);

  // Effect: Carrega anotações ao montar
  useEffect(() => {
    loadAnnotations();
  }, [loadAnnotations]);

  // Effect: Auto-save a cada 5 segundos (DESABILITADO)
  // useEffect(() => {
  //   if (readOnly) return;

  //   // Limpa timer anterior
  //   if (autoSaveTimerRef.current) {
  //     clearInterval(autoSaveTimerRef.current);
  //   }

  //   // Configura novo timer
  //   autoSaveTimerRef.current = setInterval(() => {
  //     autoSave();
  //   }, 5000); // 5 segundos

  //   // Cleanup
  //   return () => {
  //     if (autoSaveTimerRef.current) {
  //       clearInterval(autoSaveTimerRef.current);
  //     }
  //   };
  // }, [autoSave, readOnly]);

  // Effect: Salva antes de desmontar se houver mudanças não salvas (DESABILITADO)
  // useEffect(() => {
  //   return () => {
  //     if (hasUnsavedChanges && !readOnly) {
  //       // Salva de forma síncrona (Navigator.sendBeacon seria melhor, mas complexo)
  //       console.log('[useAnnotations] Salvando mudanças antes de desmontar');
  //       saveAnnotations(lines, false);
  //     }
  //   };
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [hasUnsavedChanges, readOnly]);

  return {
    // Estado
    lines,
    isLoading,
    isSaving,
    lastSaved,
    hasUnsavedChanges,

    // Ações
    updateLines,
    saveAnnotations: () => saveAnnotations(lines, true),
    updateStatus,
    saveAndFinish,
    clearAnnotations,
    undo,
    reload: loadAnnotations,
  };
};
