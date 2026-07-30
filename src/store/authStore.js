// Store Auth — Zustand + Supabase Auth
// L'API publique du store est inchangée pour ne rien casser dans les pages.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../lib/api';
import { supabase } from '../lib/supabase';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,

      // -------------------------------------------------------------
      // Connexion
      // -------------------------------------------------------------
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        const res = await authApi.login({ email, password });

        if (res.success) {
          set({
            user: res.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return { success: true, user: res.user };
        }
        set({ isLoading: false, error: res.error });
        return { success: false, error: res.error };
      },

      // -------------------------------------------------------------
      // Inscription
      // -------------------------------------------------------------
      register: async (firstName, lastName, email, phone, password, confirmPassword) => {
        if (confirmPassword !== undefined && password !== confirmPassword) {
          const error = 'Les mots de passe ne correspondent pas';
          set({ error, isLoading: false });
          return { success: false, error };
        }

        set({ isLoading: true, error: null });
        const res = await authApi.register({ firstName, lastName, email, phone, password });

        if (res.success) {
          // Si la confirmation email est désactivée, la session est déjà ouverte.
          if (!res.needsConfirmation) {
            const session = await authApi.getSession();
            if (session) {
              const profile = await authApi.fetchProfile(session.user.id);
              set({ user: profile, isAuthenticated: true });
            }
          }
          set({ isLoading: false, error: null });
          return { success: true, message: res.message, needsConfirmation: res.needsConfirmation };
        }
        set({ isLoading: false, error: res.error });
        return { success: false, error: res.error };
      },

      // -------------------------------------------------------------
      // Déconnexion
      // -------------------------------------------------------------
      logout: async () => {
        await authApi.logout();
        set({ user: null, isAuthenticated: false, error: null });
      },

      // -------------------------------------------------------------
      // Restaure la session au chargement de l'application
      // -------------------------------------------------------------
      checkAuth: async () => {
        const session = await authApi.getSession();
        if (!session) {
          set({ user: null, isAuthenticated: false, isInitialized: true });
          return false;
        }

        const profile = await authApi.fetchProfile(session.user.id);
        if (!profile || profile.isActive === false) {
          await authApi.logout();
          set({ user: null, isAuthenticated: false, isInitialized: true });
          return false;
        }

        set({ user: profile, isAuthenticated: true, isInitialized: true });
        return true;
      },

      // Écoute les changements de session (autre onglet, expiration du token…).
      initAuthListener: () => {
        return supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_OUT' || !session) {
            set({ user: null, isAuthenticated: false });
            return;
          }
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            const profile = await authApi.fetchProfile(session.user.id);
            if (profile) set({ user: profile, isAuthenticated: true });
          }
        });
      },

      // -------------------------------------------------------------
      // Mots de passe
      // -------------------------------------------------------------
      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        const res = await authApi.forgotPassword(email);
        set({ isLoading: false, error: res.success ? null : res.error });
        return res;
      },

      resetPassword: async (_token, password, confirmPassword) => {
        if (confirmPassword !== undefined && password !== confirmPassword) {
          return { success: false, error: 'Les mots de passe ne correspondent pas' };
        }
        set({ isLoading: true, error: null });
        const res = await authApi.resetPassword(password);
        set({ isLoading: false, error: res.success ? null : res.error });
        return res;
      },

      changePassword: async (currentPassword, newPassword, confirmPassword) => {
        if (confirmPassword !== undefined && newPassword !== confirmPassword) {
          return { success: false, error: 'Les mots de passe ne correspondent pas' };
        }
        set({ isLoading: true, error: null });
        const res = await authApi.changePassword(currentPassword, newPassword);
        set({ isLoading: false, error: res.success ? null : res.error });
        return res;
      },

      // -------------------------------------------------------------
      // Profil
      // -------------------------------------------------------------
      updateProfile: async (firstName, lastName, phone) => {
        const { user } = get();
        if (!user) return { success: false, error: 'Vous devez être connecté' };

        set({ isLoading: true, error: null });
        const res = await authApi.updateProfile(user.id, { firstName, lastName, phone });

        if (res.success) {
          set({ user: res.user, isLoading: false });
          return { success: true, user: res.user };
        }
        set({ isLoading: false, error: res.error });
        return { success: false, error: res.error };
      },

      // -------------------------------------------------------------
      // Helpers
      // -------------------------------------------------------------
      isAdmin: () => {
        const { user } = get();
        return !!user && (user.role === 'admin' || user.role === 'manager');
      },

      isClient: () => {
        const { user } = get();
        return !!user && user.role === 'client';
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'daralhayaa-auth',
      // La session est gérée par Supabase : on ne persiste que l'affichage
      // pour éviter un écran vide au rechargement.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
