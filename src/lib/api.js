// =====================================================================
// Couche d'accès aux données — Supabase
// Remplace intégralement l'ancien serveur Express (http://localhost:3001)
// qui ne pouvait pas fonctionner sur Vercel.
// =====================================================================
import { supabase } from './supabase';

// ---------------------------------------------------------------------
// Helpers de conversion BDD (snake_case) <-> Application (camelCase)
// ---------------------------------------------------------------------
const asArray = (v) => (Array.isArray(v) ? v : []);

export function mapProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory,
    price: Number(row.price) || 0,
    originalPrice: row.original_price != null ? Number(row.original_price) : null,
    discount: row.discount ?? 0,
    rating: Number(row.rating) || 0,
    reviews: row.reviews_count ?? 0,
    stock: row.stock ?? 0,
    isNew: row.is_new ?? false,
    isBestseller: row.is_bestseller ?? false,
    featured: row.featured ?? false,
    colors: asArray(row.colors),
    sizes: asArray(row.sizes),
    images: asArray(row.images),
    tags: asArray(row.tags),
    description: row.description ?? '',
  };
}

export function unmapProduct(p) {
  const out = {};
  if (p.id !== undefined) out.id = p.id;
  if (p.name !== undefined) out.name = p.name;
  if (p.category !== undefined) out.category = p.category;
  if (p.subcategory !== undefined) out.subcategory = p.subcategory;
  if (p.price !== undefined) out.price = Number(p.price) || 0;
  if (p.originalPrice !== undefined) out.original_price = p.originalPrice;
  if (p.discount !== undefined) out.discount = p.discount;
  if (p.stock !== undefined) out.stock = Number(p.stock) || 0;
  if (p.isNew !== undefined) out.is_new = p.isNew;
  if (p.isBestseller !== undefined) out.is_bestseller = p.isBestseller;
  if (p.featured !== undefined) out.featured = p.featured;
  if (p.colors !== undefined) out.colors = asArray(p.colors);
  if (p.sizes !== undefined) out.sizes = asArray(p.sizes);
  if (p.images !== undefined) out.images = asArray(p.images);
  if (p.tags !== undefined) out.tags = asArray(p.tags);
  if (p.description !== undefined) out.description = p.description;
  return out;
}

export function mapProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    email: row.email,
    phone: row.phone ?? '',
    role: row.role ?? 'client',
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  };
}

// Transforme une erreur Supabase en message lisible en français.
function humanError(error, fallback = 'Une erreur est survenue') {
  if (!error) return fallback;
  const msg = error.message || '';
  const table = {
    'Invalid login credentials': 'Email ou mot de passe incorrect',
    'Email not confirmed': 'Veuillez confirmer votre email avant de vous connecter',
    'User already registered': 'Un compte existe déjà avec cet email',
    'Password should be at least 6 characters':
      'Le mot de passe doit contenir au moins 6 caractères',
  };
  if (table[msg]) return table[msg];
  if (msg.includes('duplicate key')) return 'Cet enregistrement existe déjà';
  if (msg.includes('row-level security') || msg.includes('violates row-level'))
    return "Vous n'avez pas les droits nécessaires pour cette action";
  if (msg.includes('Failed to fetch'))
    return 'Impossible de joindre le serveur. Vérifiez votre connexion.';
  return msg || fallback;
}

const genId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// =====================================================================
// AUTHENTIFICATION (Supabase Auth natif)
// =====================================================================
export const authApi = {
  async register({ firstName, lastName, email, phone, password }) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, phone },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) return { success: false, error: humanError(error) };

    const needsConfirmation = !data.session;
    return {
      success: true,
      needsConfirmation,
      message: needsConfirmation
        ? 'Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse.'
        : 'Compte créé avec succès.',
    };
  },

  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) return { success: false, error: humanError(error) };

    const profile = await authApi.fetchProfile(data.user.id);
    if (profile && profile.isActive === false) {
      await supabase.auth.signOut();
      return { success: false, error: 'Votre compte a été désactivé' };
    }

    // Trace la dernière connexion (échec silencieux, non bloquant).
    supabase
      .from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.user.id)
      .then(() => {});

    return { success: true, user: profile };
  },

  async logout() {
    await supabase.auth.signOut();
    return { success: true };
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session ?? null;
  },

  async fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('[api] fetchProfile', error.message);
      return null;
    }
    return mapProfile(data);
  },

  async updateProfile(userId, { firstName, lastName, phone }) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ first_name: firstName, last_name: lastName, phone })
      .eq('id', userId)
      .select()
      .single();
    if (error) return { success: false, error: humanError(error) };
    return { success: true, user: mapProfile(data) };
  },

  async forgotPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/reset-password` }
    );
    if (error) return { success: false, error: humanError(error) };
    return {
      success: true,
      message: 'Un email de réinitialisation vous a été envoyé.',
    };
  },

  // Après avoir cliqué sur le lien reçu par email, la session est déjà active :
  // il suffit de définir le nouveau mot de passe.
  async resetPassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: humanError(error) };
    return { success: true, message: 'Mot de passe mis à jour.' };
  },

  async changePassword(currentPassword, newPassword) {
    const session = await authApi.getSession();
    if (!session) return { success: false, error: 'Vous devez être connecté' };

    // Re-vérifie le mot de passe actuel.
    const { error: checkError } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: currentPassword,
    });
    if (checkError)
      return { success: false, error: 'Mot de passe actuel incorrect' };

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: humanError(error) };
    return { success: true, message: 'Mot de passe modifié avec succès.' };
  },

  onAuthStateChange(callback) {
    const { data } = supabase.auth.onAuthStateChange((event, session) =>
      callback(event, session)
    );
    return () => data.subscription.unsubscribe();
  },
};

// =====================================================================
// CATALOGUE
// =====================================================================
export const catalogApi = {
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (error) throw new Error(humanError(error));
    return data ?? [];
  },

  async getProducts({ category, subcategory, featured, search, limit } = {}) {
    let query = supabase.from('products').select('*');
    if (category) query = query.eq('category', category);
    if (subcategory) query = query.eq('subcategory', subcategory);
    if (featured != null) query = query.eq('featured', featured);
    if (search) query = query.ilike('name', `%${search}%`);
    query = query.order('created_at', { ascending: false });
    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw new Error(humanError(error));
    return (data ?? []).map(mapProduct);
  },

  async getProduct(id) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(humanError(error));
    return mapProduct(data);
  },

  async upsertProduct(product) {
    const payload = unmapProduct(product);
    if (!payload.id) payload.id = genId('P').toLowerCase();
    const { data, error } = await supabase
      .from('products')
      .upsert(payload)
      .select()
      .single();
    if (error) return { success: false, error: humanError(error) };
    return { success: true, product: mapProduct(data) };
  },

  async updateStock(productId, stock) {
    const { error } = await supabase
      .from('products')
      .update({ stock: Number(stock) || 0 })
      .eq('id', productId);
    if (error) return { success: false, error: humanError(error) };
    return { success: true };
  },

  async deleteProduct(productId) {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) return { success: false, error: humanError(error) };
    return { success: true };
  },
};

// =====================================================================
// CODES PROMO
// =====================================================================
export const couponsApi = {
  async validate(code, subtotal = 0) {
    const { data, error } = await supabase.rpc('validate_coupon', {
      p_code: code,
      p_subtotal: subtotal,
    });
    if (error) return { success: false, message: humanError(error) };
    return data;
  },

  async list() {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(humanError(error));
    return data ?? [];
  },

  async upsert(coupon) {
    const { data, error } = await supabase
      .from('coupons')
      .upsert({
        code: String(coupon.code).toUpperCase().trim(),
        discount: Number(coupon.discount) || 0,
        min_purchase: Number(coupon.min_purchase) || 0,
        max_uses: coupon.max_uses ?? null,
        is_active: coupon.is_active ?? true,
      })
      .select()
      .single();
    if (error) return { success: false, error: humanError(error) };
    return { success: true, coupon: data };
  },

  async setActive(code, isActive) {
    const { error } = await supabase
      .from('coupons')
      .update({ is_active: isActive })
      .eq('code', code);
    if (error) return { success: false, error: humanError(error) };
    return { success: true };
  },

  async remove(code) {
    const { error } = await supabase.from('coupons').delete().eq('code', code);
    if (error) return { success: false, error: humanError(error) };
    return { success: true };
  },
};

// =====================================================================
// COMMANDES
// =====================================================================
const TRACKING_STEPS = [
  'Commande validée',
  'Paiement confirmé',
  'En préparation',
  'Expédiée',
  'Livrée',
];

export const ordersApi = {
  async create({
    userId,
    items,
    total,
    subtotal,
    shipping,
    discount,
    couponCode,
    paymentMethod,
    shippingAddress,
    phone,
    email,
  }) {
    const orderId = `ORD-${Date.now()}`;
    const trackingNumber = `TRK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

    const { error: orderError } = await supabase.from('orders').insert({
      id: orderId,
      user_id: userId,
      status: 'pending',
      total,
      subtotal,
      shipping,
      discount: discount ?? 0,
      coupon_code: couponCode ?? null,
      payment_method: paymentMethod,
      shipping_address: shippingAddress,
      phone,
      email,
      tracking_number: trackingNumber,
    });
    if (orderError) return { success: false, error: humanError(orderError) };

    const lines = items.map((item, i) => ({
      id: `ITEM-${Date.now()}-${i}`,
      order_id: orderId,
      product_id: item.id,
      name: item.name,
      image: item.images?.[0] ?? null,
      quantity: item.quantity,
      price: item.price,
      color: item.selectedColor ?? null,
      size: item.selectedSize ?? null,
    }));
    const { error: itemsError } = await supabase.from('order_items').insert(lines);
    if (itemsError) return { success: false, error: humanError(itemsError) };

    const steps = TRACKING_STEPS.map((label, i) => ({
      id: `TRACK-${Date.now()}-${i}`,
      order_id: orderId,
      step_label: label,
      is_done: i === 0,
      step_date: i === 0 ? new Date().toISOString() : null,
    }));
    await supabase.from('order_tracking').insert(steps);

    return { success: true, orderId, trackingNumber };
  },

  async listMine(userId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(humanError(error));
    return data ?? [];
  },

  // Admin : toutes les commandes.
  async listAll() {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });
    if (error) throw new Error(humanError(error));
    return data ?? [];
  },

  async get(orderId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), order_tracking(*)')
      .eq('id', orderId)
      .maybeSingle();
    if (error) throw new Error(humanError(error));
    return data;
  },

  async getByTracking(trackingNumber) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), order_tracking(*)')
      .eq('tracking_number', trackingNumber.trim().toUpperCase())
      .maybeSingle();
    if (error) throw new Error(humanError(error));
    return data;
  },

  async setStatus(orderId, status) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    if (error) return { success: false, error: humanError(error) };

    // Coche les étapes de suivi correspondantes.
    const stepIndex = { pending: 0, confirmed: 1, preparing: 2, shipped: 3, delivered: 4 }[status];
    if (stepIndex != null) {
      const labels = TRACKING_STEPS.slice(0, stepIndex + 1);
      await supabase
        .from('order_tracking')
        .update({ is_done: true, step_date: new Date().toISOString() })
        .eq('order_id', orderId)
        .in('step_label', labels);
    }
    return { success: true };
  },
};

// =====================================================================
// PAIEMENTS
// =====================================================================
export const paymentsApi = {
  async create({ orderId, method, amount, status = 'completed', transactionId, phone }) {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        id: `PAY-${Date.now()}`,
        order_id: orderId,
        method,
        amount,
        status,
        transaction_id: transactionId ?? `TXN-${Date.now()}`,
        phone,
      })
      .select()
      .single();
    if (error) return { success: false, error: humanError(error) };
    return { success: true, payment: data };
  },

  async listForOrder(orderId) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId);
    if (error) throw new Error(humanError(error));
    return data ?? [];
  },
};

// =====================================================================
// FAVORIS
// =====================================================================
export const favoritesApi = {
  async list(userId) {
    const { data, error } = await supabase
      .from('favorites')
      .select('id, product_id, products(*)')
      .eq('user_id', userId);
    if (error) throw new Error(humanError(error));
    return (data ?? [])
      .filter((f) => f.products)
      .map((f) => ({ ...mapProduct(f.products), favoriteId: f.id }));
  },

  async add(userId, productId) {
    const { data, error } = await supabase
      .from('favorites')
      .upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id' })
      .select()
      .single();
    if (error) return { success: false, error: humanError(error) };
    return { success: true, favorite: data };
  },

  async remove(userId, productId) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
    if (error) return { success: false, error: humanError(error) };
    return { success: true };
  },
};

// =====================================================================
// AVIS
// =====================================================================
export const reviewsApi = {
  async listForProduct(productId) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(first_name, last_name)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(humanError(error));
    return (data ?? []).map((r) => ({
      ...r,
      customer_name: r.profiles
        ? `${r.profiles.first_name} ${r.profiles.last_name}`.trim() || 'Client'
        : 'Client',
    }));
  },

  async listAll() {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(first_name, last_name), products(name)')
      .order('created_at', { ascending: false });
    if (error) throw new Error(humanError(error));
    return (data ?? []).map((r) => ({
      ...r,
      customer_name: r.profiles
        ? `${r.profiles.first_name} ${r.profiles.last_name}`.trim() || 'Client'
        : 'Client',
      product_name: r.products?.name ?? r.product_id,
    }));
  },

  async create({ userId, productId, rating, comment }) {
    if (!userId)
      return { success: false, error: 'Connectez-vous pour laisser un avis' };
    const { data, error } = await supabase
      .from('reviews')
      .insert({ user_id: userId, product_id: productId, rating, comment })
      .select('*, profiles(first_name, last_name)')
      .single();
    if (error) return { success: false, error: humanError(error) };
    return {
      success: true,
      review: {
        ...data,
        customer_name: data.profiles
          ? `${data.profiles.first_name} ${data.profiles.last_name}`.trim() || 'Vous'
          : 'Vous',
      },
    };
  },

  async setStatus(reviewId, status) {
    const { error } = await supabase
      .from('reviews')
      .update({ status })
      .eq('id', reviewId);
    if (error) return { success: false, error: humanError(error) };
    return { success: true };
  },

  async remove(reviewId) {
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (error) return { success: false, error: humanError(error) };
    return { success: true };
  },
};

// =====================================================================
// ADRESSES
// =====================================================================
export const addressesApi = {
  async list(userId) {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(humanError(error));
    return data ?? [];
  },

  async create(userId, address) {
    const { data, error } = await supabase
      .from('addresses')
      .insert({ ...address, user_id: userId })
      .select()
      .single();
    if (error) return { success: false, error: humanError(error) };
    return { success: true, address: data };
  },

  async update(id, patch) {
    const { error } = await supabase.from('addresses').update(patch).eq('id', id);
    if (error) return { success: false, error: humanError(error) };
    return { success: true };
  },

  async remove(id) {
    const { error } = await supabase.from('addresses').delete().eq('id', id);
    if (error) return { success: false, error: humanError(error) };
    return { success: true };
  },
};

// =====================================================================
// NOTIFICATIONS
// =====================================================================
export const notificationsApi = {
  async list(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(humanError(error));
    return data ?? [];
  },

  async markRead(id) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    if (error) return { success: false, error: humanError(error) };
    return { success: true };
  },
};

// =====================================================================
// ADMINISTRATION
// =====================================================================
export const adminApi = {
  async listUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(humanError(error));
    return (data ?? []).map(mapProfile);
  },

  async setRole(userId, role) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
    if (error) return { success: false, error: humanError(error) };
    return { success: true };
  },

  async setActive(userId, isActive) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', userId);
    if (error) return { success: false, error: humanError(error) };
    return { success: true };
  },

  async stats() {
    const { data, error } = await supabase.rpc('admin_stats');
    if (error) throw new Error(humanError(error));
    return data;
  },
};
