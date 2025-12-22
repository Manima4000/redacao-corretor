import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { ProfileInfoCard } from '../components/ProfileInfoCard';
import { SecurityCard } from '../components/SecurityCard';
import { ClassesListCard } from '../components/ClassesListCard';
import { EditProfileModal } from '../components/EditProfileModal';
import { ChangePasswordModal } from '../components/ChangePasswordModal';

/**
 * ProfilePage
 * Responsabilidade: Composição da página de perfil
 * Orquestra os componentes e modais
 */
export const ProfilePage = () => {
  const { isTeacher, updateUser } = useAuth();
  const { profile, loading, updateProfileData } = useProfile();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleProfileUpdated = (updatedUser) => {
    updateProfileData(updatedUser);
    updateUser(updatedUser); // Atualiza no contexto de auth
    setShowEditModal(false);
  };

  const handlePasswordChanged = () => {
    setShowPasswordModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <i className="bi bi-arrow-repeat animate-spin text-4xl text-blue-600"></i>
          <p className="text-gray-600 mt-2">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">
            <i className="bi bi-exclamation-triangle-fill mr-2"></i>
            Erro ao carregar perfil. Tente novamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-600 mt-2">
          Gerencie suas informações pessoais e configurações
        </p>
      </div>

      {/* Informações Pessoais */}
      <ProfileInfoCard
        user={profile.user}
        isTeacher={isTeacher()}
        onEdit={() => setShowEditModal(true)}
      />

      {/* Segurança */}
      <SecurityCard onChangePassword={() => setShowPasswordModal(true)} />

      {/* Turmas */}
      <ClassesListCard classes={profile.classes} isTeacher={isTeacher()} />

      {/* Modals */}
      {showEditModal && (
        <EditProfileModal
          user={profile.user}
          onClose={() => setShowEditModal(false)}
          onProfileUpdated={handleProfileUpdated}
        />
      )}

      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          onPasswordChanged={handlePasswordChanged}
        />
      )}
    </div>
  );
};
