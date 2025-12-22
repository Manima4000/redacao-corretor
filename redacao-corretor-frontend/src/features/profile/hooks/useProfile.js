import { useState, useEffect } from 'react';
import { profileService } from '../services/profileService';

/**
 * Hook customizado para gerenciar perfil do usuário
 * Responsabilidade: Buscar e atualizar dados do perfil
 */
export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await profileService.getMyProfile();
      setProfile(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar perfil');
      console.error('Erro ao carregar perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfileData = (updatedUser) => {
    setProfile({ ...profile, user: updatedUser });
  };

  return {
    profile,
    loading,
    error,
    loadProfile,
    updateProfileData,
  };
};
