// Store Favoris — Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],

      // Ajouter / Retirer des favoris
      toggleItem: (product) => {
        const items = get().items;
        const exists = items.find((i) => i.id === product.id);
        if (exists) {
          set({ items: items.filter((i) => i.id !== product.id) });
          return false; // retiré
        } else {
          set({ items: [...items, product] });
          return true; // ajouté
        }
      },

      isInWishlist: (productId) => {
        return get().items.some((i) => i.id === productId);
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.id !== productId) });
      },

      clearWishlist: () => set({ items: [] }),

      getCount: () => get().items.length,
    }),
    { name: 'daralhayaa-wishlist' }
  )
);
