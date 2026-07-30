// Store Catalogue — charge produits & catégories depuis Supabase.
// Les données statiques de src/data/products.js servent de secours
// tant que Supabase n'a pas répondu (ou si la table est vide).
import { create } from 'zustand';
import { catalogApi } from '../lib/api';
import {
  PRODUCTS as STATIC_PRODUCTS,
  CATEGORIES as STATIC_CATEGORIES,
} from '../data/products';

export const useCatalogStore = create((set, get) => ({
  products: STATIC_PRODUCTS,
  categories: STATIC_CATEGORIES,
  isLoading: false,
  isLoaded: false,
  error: null,
  source: 'static',

  load: async ({ force = false } = {}) => {
    if (!force && (get().isLoaded || get().isLoading)) return;
    set({ isLoading: true, error: null });

    try {
      const [products, categories] = await Promise.all([
        catalogApi.getProducts(),
        catalogApi.getCategories(),
      ]);

      set({
        products: products.length ? products : STATIC_PRODUCTS,
        categories: categories.length ? categories : STATIC_CATEGORIES,
        source: products.length ? 'supabase' : 'static',
        isLoading: false,
        isLoaded: true,
        error: null,
      });
    } catch (error) {
      console.error('[catalog] chargement Supabase impossible:', error.message);
      set({
        isLoading: false,
        isLoaded: true,
        error: error.message,
        source: 'static',
      });
    }
  },

  getProduct: (id) => get().products.find((p) => p.id === id) ?? null,

  // Met à jour un produit localement après une action admin.
  upsertLocal: (product) => {
    const products = get().products;
    const i = products.findIndex((p) => p.id === product.id);
    set({
      products:
        i >= 0
          ? products.map((p) => (p.id === product.id ? product : p))
          : [product, ...products],
    });
  },

  removeLocal: (productId) =>
    set({ products: get().products.filter((p) => p.id !== productId) }),
}));
