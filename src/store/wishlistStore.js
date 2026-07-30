// Store Favoris — Zustand + Supabase
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { favoritesApi } from '../lib/api';

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      userId: null,

      setUserId: (userId) => set({ userId }),

      // Ajouter / Retirer des favoris (optimiste, puis synchro Supabase).
      toggleItem: async (product) => {
        const { items, userId } = get();
        const exists = items.find((i) => i.id === product.id);

        if (exists) {
          set({ items: items.filter((i) => i.id !== product.id) });
          if (userId) {
            const res = await favoritesApi.remove(userId, product.id);
            if (!res.success) {
              console.error('[wishlist] suppression:', res.error);
              set({ items: get().items.concat(exists) }); // rollback
              return true;
            }
          }
          return false; // retiré
        }

        set({ items: [...items, { ...product, favoriteId: null }] });
        if (userId) {
          const res = await favoritesApi.add(userId, product.id);
          if (res.success) {
            set({
              items: get().items.map((i) =>
                i.id === product.id ? { ...i, favoriteId: res.favorite.id } : i
              ),
            });
          } else {
            console.error('[wishlist] ajout:', res.error);
            set({ items: get().items.filter((i) => i.id !== product.id) }); // rollback
            return false;
          }
        }
        return true; // ajouté
      },

      isInWishlist: (productId) => get().items.some((i) => i.id === productId),

      removeItem: async (productId) => {
        const { items, userId } = get();
        set({ items: items.filter((i) => i.id !== productId) });
        if (userId) {
          const res = await favoritesApi.remove(userId, productId);
          if (!res.success) console.error('[wishlist] suppression:', res.error);
        }
      },

      clearWishlist: () => set({ items: [] }),

      getCount: () => get().items.length,

      // Charge les favoris depuis Supabase (avec les produits joints).
      loadFavorites: async (userId) => {
        if (!userId) {
          set({ userId: null });
          return;
        }
        try {
          const products = await favoritesApi.list(userId);
          set({ items: products, userId });
        } catch (error) {
          console.error('[wishlist] chargement:', error.message);
          set({ userId });
        }
      },
    }),
    { name: 'daralhayaa-wishlist' }
  )
);
