// Store Panier — Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { couponsApi } from '../lib/api';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      couponCode: '',
      discount: 0,

      // Ouvrir / Fermer le drawer panier
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      // Ajouter un produit
      addItem: (product, quantity = 1, color = null, size = null) => {
        const items = get().items;
        const key = `${product.id}-${color}-${size}`;
        const existing = items.find((i) => i.key === key);

        if (existing) {
          set({
            items: items.map((i) =>
              i.key === key ? { ...i, quantity: i.quantity + quantity } : i
            ),
          });
        } else {
          set({
            items: [...items, { ...product, key, quantity, selectedColor: color, selectedSize: size }],
          });
        }
      },

      // Supprimer un produit
      removeItem: (key) => {
        set({ items: get().items.filter((i) => i.key !== key) });
      },

      // Modifier la quantité
      updateQuantity: (key, quantity) => {
        if (quantity <= 0) {
          get().removeItem(key);
          return;
        }
        set({
          items: get().items.map((i) => (i.key === key ? { ...i, quantity } : i)),
        });
      },

      // Vider le panier
      clearCart: () => set({ items: [], couponCode: '', discount: 0 }),

      // Appliquer un coupon (validé côté Supabase)
      applyCoupon: async (code) => {
        if (!code || !code.trim()) {
          return { success: false, message: 'Veuillez saisir un code promo' };
        }

        const data = await couponsApi.validate(code.trim(), get().getSubtotal());

        if (data?.success) {
          set({ couponCode: code.trim().toUpperCase(), discount: data.discount });
          return { success: true, message: data.message };
        }
        return { success: false, message: data?.message || 'Code promo invalide' };
      },

      // Retirer le coupon
      removeCoupon: () => set({ couponCode: '', discount: 0 }),

      // Totaux calculés
      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },
      getDiscount: () => {
        const subtotal = get().getSubtotal();
        return (subtotal * get().discount) / 100;
      },
      getShipping: () => {
        const subtotal = get().getSubtotal();
        return subtotal >= 80 ? 0 : 5.99;
      },
      getTotal: () => {
        return get().getSubtotal() - get().getDiscount() + get().getShipping();
      },
      getCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    { name: 'daralhayaa-cart' }
  )
);
