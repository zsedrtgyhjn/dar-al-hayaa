// Store Auth — Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isAdmin: false,

      // Connexion simulée
      login: (email, password) => {
        // Admin mock
        if (email === 'admin@daralhayaa.com' && password === 'admin123') {
          const adminUser = {
            id: 'admin-001',
            name: 'Administrateur',
            email,
            role: 'admin',
            avatar: 'AD',
          };
          set({ user: adminUser, isAuthenticated: true, isAdmin: true });
          return { success: true, user: adminUser };
        }
        // User mock
        if (email && password.length >= 6) {
          const user = {
            id: 'user-001',
            name: email.split('@')[0],
            email,
            role: 'customer',
            avatar: email.charAt(0).toUpperCase(),
            addresses: [],
            orders: [],
          };
          set({ user, isAuthenticated: true, isAdmin: false });
          return { success: true, user };
        }
        return { success: false, message: 'Identifiants incorrects' };
      },

      // Inscription simulée
      register: (name, email, password) => {
        const user = {
          id: `user-${Date.now()}`,
          name,
          email,
          role: 'customer',
          avatar: name.charAt(0).toUpperCase(),
          addresses: [],
          orders: [],
        };
        set({ user, isAuthenticated: true, isAdmin: false });
        return { success: true, user };
      },

      logout: () => set({ user: null, isAuthenticated: false, isAdmin: false }),

      updateUser: (data) => set({ user: { ...get().user, ...data } }),
    }),
    { name: 'daralhayaa-auth' }
  )
);
