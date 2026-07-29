// Store Auth — Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = 'http://localhost:3001/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Connexion
      login: async (email, password, rememberMe = false) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, rememberMe }),
          });

          const data = await response.json();

          if (data.success) {
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return { success: true, user: data.user };
          } else {
            set({
              isLoading: false,
              error: data.error || 'Erreur lors de la connexion',
            });
            return { success: false, error: data.error };
          }
        } catch (error) {
          set({
            isLoading: false,
            error: 'Erreur de connexion au serveur',
          });
          return { success: false, error: 'Erreur de connexion au serveur' };
        }
      },

      // Inscription
      register: async (firstName, lastName, email, phone, password, confirmPassword) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName, lastName, email, phone, password, confirmPassword }),
          });

          const data = await response.json();

          if (data.success) {
            set({
              isLoading: false,
              error: null,
            });
            return { success: true, message: data.message };
          } else {
            set({
              isLoading: false,
              error: data.error || 'Erreur lors de l\'inscription',
            });
            return { success: false, error: data.error };
          }
        } catch (error) {
          set({
            isLoading: false,
            error: 'Erreur de connexion au serveur',
          });
          return { success: false, error: 'Erreur de connexion au serveur' };
        }
      },

      // Déconnexion
      logout: async () => {
        try {
          const { token } = get();
          if (token) {
            await fetch(`${API_URL}/auth/logout`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
            });
          }
        } catch (error) {
          console.error('Erreur logout:', error);
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      // Vérifier le token
      checkAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return false;
        }

        try {
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (data.success) {
            set({ user: data.user, isAuthenticated: true });
            return true;
          } else {
            set({ user: null, token: null, isAuthenticated: false });
            return false;
          }
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false });
          return false;
        }
      },

      // Mot de passe oublié
      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });

          const data = await response.json();

          set({ isLoading: false });
          return { success: data.success, message: data.message };
        } catch (error) {
          set({ isLoading: false, error: 'Erreur de connexion au serveur' });
          return { success: false, error: 'Erreur de connexion au serveur' };
        }
      },

      // Réinitialiser le mot de passe
      resetPassword: async (token, password, confirmPassword) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password, confirmPassword }),
          });

          const data = await response.json();

          set({ isLoading: false });
          return { success: data.success, message: data.message };
        } catch (error) {
          set({ isLoading: false, error: 'Erreur de connexion au serveur' });
          return { success: false, error: 'Erreur de connexion au serveur' };
        }
      },

      // Changer le mot de passe
      changePassword: async (currentPassword, newPassword, confirmPassword) => {
        set({ isLoading: true, error: null });
        try {
          const { token } = get();
          const response = await fetch(`${API_URL}/auth/change-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
          });

          const data = await response.json();

          set({ isLoading: false });
          return { success: data.success, message: data.message };
        } catch (error) {
          set({ isLoading: false, error: 'Erreur de connexion au serveur' });
          return { success: false, error: 'Erreur de connexion au serveur' };
        }
      },

      // Mettre à jour le profil
      updateProfile: async (firstName, lastName, phone) => {
        set({ isLoading: true, error: null });
        try {
          const { token, user } = get();
          const response = await fetch(`${API_URL}/users/${user.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ firstName, lastName, phone }),
          });

          const data = await response.json();

          if (data.success) {
            set({
              user: data.user,
              isLoading: false,
            });
            return { success: true, user: data.user };
          } else {
            set({
              isLoading: false,
              error: data.error,
            });
            return { success: false, error: data.error };
          }
        } catch (error) {
          set({
            isLoading: false,
            error: 'Erreur de connexion au serveur',
          });
          return { success: false, error: 'Erreur de connexion au serveur' };
        }
      },

      // Helpers
      isAdmin: () => {
        const { user } = get();
        return user && (user.role === 'admin' || user.role === 'manager');
      },

      isClient: () => {
        const { user } = get();
        return user && user.role === 'client';
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'daralhayaa-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
