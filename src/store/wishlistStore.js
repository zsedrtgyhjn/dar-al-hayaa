// Store Favoris — Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      userId: null, // Pour l'intégration avec l'authentification

      setUserId: (userId) => set({ userId }),

      // Ajouter / Retirer des favoris
      toggleItem: async (product) => {
        const items = get().items;
        const exists = items.find((i) => i.id === product.id);
        const userId = get().userId;

        if (exists) {
          // Retirer des favoris
          set({ items: items.filter((i) => i.id !== product.id) });
          
          // Si connecté, supprimer de la base de données
          if (userId) {
            try {
              await fetch(`http://localhost:3001/api/favorites/${exists.favoriteId}`, {
                method: 'DELETE'
              });
            } catch (error) {
              console.error('Erreur suppression favori:', error);
            }
          }
          
          return false; // retiré
        } else {
          // Ajouter aux favoris
          set({ items: [...items, { ...product, favoriteId: null }] });
          
          // Si connecté, ajouter à la base de données
          if (userId) {
            try {
              const response = await fetch('http://localhost:3001/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  user_id: userId,
                  product_id: product.id
                })
              });
              const data = await response.json();
              if (data.success) {
                // Mettre à jour l'ID du favori
                set({ 
                  items: get().items.map(i => 
                    i.id === product.id ? { ...i, favoriteId: data.favorite.id } : i
                  )
                });
              }
            } catch (error) {
              console.error('Erreur ajout favori:', error);
            }
          }
          
          return true; // ajouté
        }
      },

      isInWishlist: (productId) => {
        return get().items.some((i) => i.id === productId);
      },

      removeItem: async (productId) => {
        const items = get().items;
        const item = items.find((i) => i.id === productId);
        
        set({ items: items.filter((i) => i.id !== productId) });
        
        // Si connecté, supprimer de la base de données
        if (item?.favoriteId) {
          try {
            await fetch(`http://localhost:3001/api/favorites/${item.favoriteId}`, {
              method: 'DELETE'
            });
          } catch (error) {
            console.error('Erreur suppression favori:', error);
          }
        }
      },

      clearWishlist: () => set({ items: [] }),

      getCount: () => get().items.length,

      // Charger les favoris depuis la base de données
      loadFavorites: async (userId) => {
        if (!userId) return;
        
        try {
          const response = await fetch(`http://localhost:3001/api/favorites/${userId}`);
          const favorites = await response.json();
          
          // Récupérer les détails des produits
          const productIds = favorites.map(f => f.product_id);
          const productsResponse = await fetch('http://localhost:3001/api/products');
          const allProducts = await productsResponse.json();
          
          const wishlistProducts = allProducts.filter(p => productIds.includes(p.id)).map(p => ({
            ...p,
            favoriteId: favorites.find(f => f.product_id === p.id)?.id
          }));
          
          set({ items: wishlistProducts, userId });
        } catch (error) {
          console.error('Erreur chargement favoris:', error);
        }
      },
    }),
    { name: 'daralhayaa-wishlist' }
  )
);
