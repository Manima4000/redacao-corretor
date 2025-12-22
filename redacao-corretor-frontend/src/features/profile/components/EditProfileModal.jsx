import { useState } from 'react';
import { profileService } from '../services/profileService';

/**
 * EditProfileModal
 * Responsabilidade: Formulário para editar informações do perfil
 */
export const EditProfileModal = ({ user, onClose, onProfileUpdated }) => {
  const [formData, setFormData] = useState({
    email: user.email || '',
    fullName: user.fullName || '',
    enrollmentNumber: user.enrollmentNumber || '',
    specialization: user.specialization || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isTeacher = user.type === 'teacher';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Email inválido');
      return;
    }

    if (!formData.fullName.trim()) {
      setError('Nome completo é obrigatório');
      return;
    }

    if (formData.fullName.trim().length < 3) {
      setError('Nome completo deve ter pelo menos 3 caracteres');
      return;
    }

    try {
      setIsLoading(true);

      // Preparar dados para atualização
      const updateData = {
        email: formData.email.trim(),
        fullName: formData.fullName.trim(),
      };

      if (isTeacher) {
        updateData.specialization = formData.specialization.trim();
      } else {
        updateData.enrollmentNumber = formData.enrollmentNumber.trim();
      }

      const updatedUser = await profileService.updateProfile(updateData);
      onProfileUpdated(updatedUser);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao atualizar perfil');
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
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Editar Perfil</h2>
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

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="seu@email.com"
              disabled={isLoading}
              required
            />
          </div>

          {/* Nome Completo */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Seu Nome Completo"
              disabled={isLoading}
              required
            />
          </div>

          {/* Matrícula (Aluno) ou Especialização (Professor) */}
          {isTeacher ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Especialização
              </label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Redação ENEM"
                disabled={isLoading}
              />
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Matrícula
              </label>
              <input
                type="text"
                name="enrollmentNumber"
                value={formData.enrollmentNumber}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 2024001"
                disabled={isLoading}
              />
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
            >
              {isLoading ? (
                <>
                  <i className="bi bi-arrow-repeat animate-spin mr-2"></i>
                  Salvando...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg mr-2"></i>
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
