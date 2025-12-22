import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Auth Store usando Zustand
 * ⚠️ NÃO armazena tokens (estão em cookies httpOnly)
 * Apenas armazena dados do usuário (não sensíveis)
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => {
        set({
          user,
          isAuthenticated: true,
          error: null,
        });
      },

      updateUser: (updatedUser) => {
        set({
          user: updatedUser,
        });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      // Helpers
      isTeacher: () => {
        const state = get();
        return state.user?.type === 'teacher';
      },

      isStudent: () => {
        const state = get();
        return state.user?.type === 'student';
      },
    }),
    {
      name: 'auth-storage', // Nome no localStorage
      partialize: (state) => ({
        // Persiste apenas user e isAuthenticated
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
