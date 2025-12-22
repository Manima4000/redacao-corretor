import api from '@/shared/services/api';

/**
 * Serviço de perfil de usuário
 * Todas as requisições para /api/profile
 */
export const profileService = {
  /**
   * Obter perfil completo do usuário logado
   * Retorna dados do usuário + turmas
   */
  async getMyProfile() {
    const response = await api.get('/profile');
    return response.data.data; // { user, classes }
  },

  /**
   * Atualizar informações do perfil
   * @param {Object} data - Dados a serem atualizados
   * @param {string} [data.email] - Novo email
   * @param {string} [data.fullName] - Novo nome completo
   * @param {string} [data.enrollmentNumber] - Nova matrícula (aluno)
   * @param {string} [data.specialization] - Nova especialização (professor)
   */
  async updateProfile(data) {
    const response = await api.put('/profile', data);
    return response.data.data.user;
  },

  /**
   * Alterar senha do usuário
   * @param {Object} passwords
   * @param {string} passwords.currentPassword - Senha atual
   * @param {string} passwords.newPassword - Nova senha
   */
  async changePassword(passwords) {
    const response = await api.put('/profile/password', passwords);
    return response.data.message;
  },
};
