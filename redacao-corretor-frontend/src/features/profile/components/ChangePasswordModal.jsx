import { useState } from 'react';
import { profileService } from '../services/profileService';

/**
 * ChangePasswordModal
 * Responsabilidade: Formulário para alterar senha do usuário
 */
export const ChangePasswordModal = ({ onClose, onPasswordChanged }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validações
    if (!formData.currentPassword) {
      setError('Senha atual é obrigatória');
      return;
    }

    if (!formData.newPassword) {
      setError('Nova senha é obrigatória');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (formData.newPassword === formData.currentPassword) {
      setError('Nova senha deve ser diferente da senha atual');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('As senhas não conferem');
      return;
    }

    try {
      setIsLoading(true);

      await profileService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      setSuccess(true);

      // Fechar modal após 1.5s
      setTimeout(() => {
        onPasswordChanged();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao alterar senha');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Alterar Senha</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i className="bi bi-x-lg text-xl"></i>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <i className="bi bi-exclamation-triangle-fill mr-2"></i>
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            <i className="bi bi-check-circle-fill mr-2"></i>
            Senha alterada com sucesso!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Senha Atual */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha Atual <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite sua senha atual"
              disabled={isLoading || success}
              required
            />
          </div>

          {/* Nova Senha */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nova Senha <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite sua nova senha (mín. 6 caracteres)"
              disabled={isLoading || success}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Mínimo de 6 caracteres
            </p>
          </div>

          {/* Confirmar Nova Senha */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Nova Senha <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite novamente a nova senha"
              disabled={isLoading || success}
              required
            />
          </div>

          {/* Dica de Segurança */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <i className="bi bi-info-circle-fill mr-2"></i>
              <strong>Dica:</strong> Use uma senha forte com letras, números e símbolos.
            </p>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading || success}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || success}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
            >
              {isLoading ? (
                <>
                  <i className="bi bi-arrow-repeat animate-spin mr-2"></i>
                  Alterando...
                </>
              ) : success ? (
                <>
                  <i className="bi bi-check-lg mr-2"></i>
                  Senha Alterada!
                </>
              ) : (
                <>
                  <i className="bi bi-key-fill mr-2"></i>
                  Alterar Senha
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
