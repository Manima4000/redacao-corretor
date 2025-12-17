import { useState, useRef } from 'react';
import { essayService } from '@/features/essays/services/essayService';
import { Button } from '@/shared/components/ui/Button';
import { useToast } from '@/shared/hooks/useToast';

/**
 * Componente de upload de redação
 * SRP: Apenas gerencia seleção e upload de arquivo
 *
 * @param {Object} props
 * @param {string} props.taskId - ID da tarefa
 * @param {Function} props.onUploadSuccess - Callback quando upload for bem-sucedido
 */
export const UploadEssayForm = ({ taskId, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const toast = useToast();

  // Configurações de validação
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  /**
   * Valida arquivo selecionado
   * @param {File} file - Arquivo a ser validado
   * @returns {string|null} Mensagem de erro ou null se válido
   */
  const validateFile = (file) => {
    if (!file) {
      return 'Nenhum arquivo selecionado';
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Formato inválido. Use apenas JPEG, PNG ou PDF.';
    }

    if (file.size > MAX_SIZE) {
      return 'Arquivo muito grande. Tamanho máximo: 10MB.';
    }

    return null;
  };

  /**
   * Manipula seleção de arquivo
   */
  const handleFileSelect = (event) => {
    const file = event.target.files[0];

    if (!file) {
      setSelectedFile(null);
      setError(null);
      return;
    }

    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  /**
   * Faz upload do arquivo
   */
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Selecione um arquivo primeiro');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      await essayService.uploadEssay(taskId, selectedFile);

      // Sucesso
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Toast de sucesso
      toast.success('Redação enviada com sucesso! Aguarde a correção.');

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      const errorMessage =
        err.response?.data?.error || 'Erro ao fazer upload. Tente novamente.';

      // Mostra erro no componente E no toast
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Abre seletor de arquivo
   */
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /**
   * Formata tamanho do arquivo
   */
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Instruções */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Instruções:</strong> Envie sua redação em formato de imagem (JPEG, PNG) ou PDF. Tamanho máximo: 10MB.
        </p>
      </div>

      {/* Input de arquivo (oculto) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Arquivo selecionado */}
      {selectedFile && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {selectedFile.type.startsWith('image/') ? '🖼️' : '📄'}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                setError(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Remover
            </button>
          </div>
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-3">
        {!selectedFile ? (
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={handleButtonClick}
          >
            📎 Selecionar arquivo
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={handleUpload}
            isLoading={isUploading}
            disabled={isUploading}
          >
            {isUploading ? 'Enviando...' : '📤 Enviar redação'}
          </Button>
        )}
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Formatos aceitos */}
      <p className="text-xs text-gray-500 text-center">
        Formatos aceitos: .jpg, .jpeg, .png, .pdf (máximo 10MB)
      </p>
    </div>
  );
};
