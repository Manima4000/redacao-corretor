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
      {/* Input de arquivo (oculto) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Área de Seleção / Preview */}
      {!selectedFile ? (
        <div 
            onClick={handleButtonClick}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer group"
        >
            <div className="text-4xl text-gray-300 group-hover:text-blue-500 mb-2">
                <i className="bi bi-cloud-arrow-up"></i>
            </div>
            <p className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                Clique para selecionar o arquivo
            </p>
            <p className="text-xs text-gray-400 mt-1">
                PDF, JPG ou PNG (máx. 10MB)
            </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm relative">
            <button
              onClick={() => {
                setSelectedFile(null);
                setError(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-600 p-1"
              title="Remover arquivo"
            >
              <i className="bi bi-x-lg"></i>
            </button>

          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${selectedFile.type.startsWith('image/') ? 'bg-purple-100 text-purple-600' : 'bg-red-100 text-red-600'}`}>
                {selectedFile.type.startsWith('image/') ? <i className="bi bi-file-image text-2xl" /> : <i className="bi bi-file-pdf text-2xl" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botão de Envio */}
      {selectedFile && (
          <Button
            variant="primary"
            size="lg"
            className="w-full justify-center py-3"
            onClick={handleUpload}
            isLoading={isUploading}
            disabled={isUploading}
          >
            {isUploading ? 'Enviando...' : <><i className="bi bi-cloud-upload-fill mr-2" /> Enviar Redação</>}
          </Button>
      )}

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <i className="bi bi-exclamation-circle-fill text-red-500 mt-0.5"></i>
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Instruções Rodapé */}
      <div className="text-center pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Formatos aceitos: .jpg, .jpeg, .png, .pdf
          </p>
      </div>
    </div>
  );
};
