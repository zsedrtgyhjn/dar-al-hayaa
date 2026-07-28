const express = require('express');
const cors = require('cors');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialisation de la base de données LowDB (JSON)
const dbFile = path.join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, {
  users: [],
  categories: [],
  products: [],
  orders: [],
  order_items: [],
  order_tracking: [],
  coupons: []
});

// Initialiser la base de données
async function initializeDatabase() {
  await db.read();
  
  // S'assurer que toutes les tables existent
  if (!db.data) {
    db.data = {};
  }
  
  db.data.users = db.data.users || [];
  db.data.categories = db.data.categories || [];
  db.data.products = db.data.products || [];
  db.data.orders = db.data.orders || [];
  db.data.order_items = db.data.order_items || [];
  db.data.order_tracking = db.data.order_tracking || [];
  db.data.coupons = db.data.coupons || [];
  db.data.favorites = db.data.favorites || [];
  db.data.reviews = db.data.reviews || [];
  db.data.addresses = db.data.addresses || [];
  db.data.notifications = db.data.notifications || [];
  db.data.payments = db.data.payments || [];
  
  await db.write();
}

// Middleware pour s'assurer que la base de données est initialisée
app.use(async (req, res, next) => {
  if (!db.data || !db.data.favorites) {
    await initializeDatabase();
  }
  next();
});

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected (lowdb)' });
});

// Categories
app.get('/api/categories', (req, res) => {
  res.json(db.data.categories);
});

app.post('/api/categories', (req, res) => {
  const category = req.body;
  db.data.categories.push(category);
  db.write();
  res.json({ success: true, id: category.id });
});

// Products
app.get('/api/products', (req, res) => {
  const { category, search, limit } = req.query;
  let products = db.data.products;

  if (category) {
    products = products.filter(p => p.category === category);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(searchLower)))
    );
  }

  if (limit) {
    products = products.slice(0, parseInt(limit));
  }

  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = db.data.products.find(p => p.id === req.params.id);
  
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  res.json(product);
});

app.post('/api/products', (req, res) => {
  const product = req.body;
  db.data.products.push(product);
  db.write();
  res.json({ success: true, id: product.id });
});

// Orders
app.post('/api/orders', (req, res) => {
  const { user_id, items, total, subtotal, shipping, discount, coupon_code, payment_method, shipping_address, phone, email } = req.body;
  const order_id = `ORD-${Date.now()}`;
  const tracking_number = `TRK-${Date.now().toString(36).toUpperCase()}`;

  // Create order
  const order = {
    id: order_id,
    user_id: user_id || null,
    status: 'pending',
    total,
    subtotal,
    shipping,
    discount: discount || 0,
    coupon_code: coupon_code || null,
    payment_method,
    shipping_address,
    phone,
    email,
    tracking_number,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.data.orders.push(order);

  // Create order items
  items.forEach(item => {
    const order_item = {
      id: `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order_id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
      color: item.selectedColor || null,
      size: item.selectedSize || null,
      created_at: new Date().toISOString()
    };
    db.data.order_items.push(order_item);
  });

  // Create tracking steps
  const steps = [
    { label: 'Commande validée', done: true, date: new Date().toISOString() },
    { label: 'En préparation', done: false, date: null },
    { label: 'Expédié', done: false, date: null },
    { label: 'En transit', done: false, date: null },
    { label: 'Livré', done: false, date: null },
  ];

  steps.forEach((step, index) => {
    const tracking = {
      id: `TRACK-${Date.now()}-${index}`,
      order_id,
      step_label: step.label,
      is_done: step.done,
      step_date: step.date,
      created_at: new Date().toISOString()
    };
    db.data.order_tracking.push(tracking);
  });

  db.write();
  res.json({ success: true, order_id, tracking_number });
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.data.orders.find(o => o.id === req.params.id);
  
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  const items = db.data.order_items.filter(oi => oi.order_id === req.params.id);
  const tracking = db.data.order_tracking.filter(t => t.order_id === req.params.id).sort((a, b) => 
    new Date(a.created_at) - new Date(b.created_at)
  );

  res.json({
    ...order,
    items,
    tracking: tracking.map(t => ({
      label: t.step_label,
      done: t.is_done,
      date: t.step_date
    }))
  });
});

app.get('/api/orders/tracking/:trackingId', (req, res) => {
  const order = db.data.orders.find(o => o.tracking_number === req.params.trackingId || o.id === req.params.trackingId);
  
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  const tracking = db.data.order_tracking.filter(t => t.order_id === order.id).sort((a, b) => 
    new Date(a.created_at) - new Date(b.created_at)
  );

  res.json({
    id: order.id,
    status: order.status,
    tracking_number: order.tracking_number,
    steps: tracking.map(t => ({
      label: t.step_label,
      done: t.is_done,
      date: t.step_date || 'En attente'
    }))
  });
});

// Coupons
app.post('/api/coupons/validate', (req, res) => {
  const { code } = req.body;
  const coupon = db.data.coupons.find(c => c.code === code.toUpperCase() && c.is_active);

  if (!coupon) {
    return res.json({ success: false, message: 'Code promo invalide' });
  }

  // Check expiration
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return res.json({ success: false, message: 'Code promo expiré' });
  }

  // Check max uses
  if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
    return res.json({ success: false, message: 'Code promo épuisé' });
  }

  res.json({ success: true, discount: coupon.discount, message: `Code promo appliqué : -${coupon.discount}%` });
});

// Seed initial data
app.post('/api/seed', (req, res) => {
  try {
    // Seed categories
    const categories = [
      {
        id: 'femmes',
        name: 'Femmes',
        name_ar: 'نساء',
        icon: '👗',
        description: 'Vêtements pudiques et élégants pour femmes',
        count: 245,
        color: '#8B4B62',
        image: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4057?w=400&q=80',
        subcategories: ['Hijabs', 'Khimars', 'Abayas', 'Jilbabs', 'Robes', 'Voiles', 'Gants', 'Chaussettes', 'Accessoires']
      },
      {
        id: 'hommes',
        name: 'Hommes',
        name_ar: 'رجال',
        icon: '👘',
        description: 'Tenues islamiques raffinées pour hommes',
        count: 178,
        color: '#1A2E4A',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
        subcategories: ['Qamis', 'Sarouels', 'Ensembles', 'Bonnets', 'Keffieh', 'Sandales', 'Ceintures', 'Parfums']
      },
      {
        id: 'beaute',
        name: 'Beauté',
        name_ar: 'جمال',
        icon: '✨',
        description: 'Cosmétiques et parfums halal premium',
        count: 134,
        color: '#C9A84C',
        image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&q=80',
        subcategories: ['Musc', 'Oud', 'Huiles parfumées', 'Savons', 'Crèmes', 'Cosmétiques', 'Soins', 'Coffrets']
      },
      {
        id: 'electronique',
        name: 'Électronique',
        name_ar: 'إلكترونيات',
        icon: '📱',
        description: 'Technologie et gadgets de qualité',
        count: 209,
        color: '#243B55',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
        subcategories: ['Casques', 'Écouteurs', 'Chargeurs', 'Montres', 'Power Banks', 'Claviers', 'Souris', 'Lampes LED']
      },
      {
        id: 'accessoires',
        name: 'Accessoires Islamiques',
        name_ar: 'مستلزمات إسلامية',
        icon: '📿',
        description: 'Objets islamiques et cadeaux spirituels',
        count: 96,
        color: '#5A3A2A',
        image: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=400&q=80',
        subcategories: ['Corans', 'Tapis de prière', 'Chapelets', 'Livres', 'Boussoles Qibla', 'Cadeaux']
      }
    ];

    db.data.categories = categories;

    // Seed coupons
    const coupons = [
      { code: 'NOUR10', discount: 10, min_purchase: 0, max_uses: null, uses_count: 0, is_active: true },
      { code: 'RAMADAN20', discount: 20, min_purchase: 50, max_uses: null, uses_count: 0, is_active: true },
      { code: 'BIENVENUE15', discount: 15, min_purchase: 0, max_uses: null, uses_count: 0, is_active: true }
    ];

    db.data.coupons = coupons;

    db.write();
    res.json({ success: true, message: 'Database seeded successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Seed products from the existing data
app.post('/api/seed-products', (req, res) => {
  const { products } = req.body;
  
  try {
    db.data.products = products;
    db.write();
    res.json({ success: true, message: `${products.length} products seeded successfully` });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ── FAVORIS ──
app.get('/api/favorites/:userId', (req, res) => {
  const favorites = db.data.favorites.filter(f => f.user_id === req.params.userId);
  res.json(favorites);
});

app.post('/api/favorites', (req, res) => {
  const { user_id, product_id } = req.body;
  
  // Vérifier si déjà dans les favoris
  const existing = db.data.favorites.find(f => f.user_id === user_id && f.product_id === product_id);
  if (existing) {
    return res.json({ success: false, message: 'Déjà dans les favoris' });
  }
  
  const favorite = {
    id: `FAV-${Date.now()}`,
    user_id,
    product_id,
    created_at: new Date().toISOString()
  };
  
  db.data.favorites.push(favorite);
  db.write();
  res.json({ success: true, favorite });
});

app.delete('/api/favorites/:id', (req, res) => {
  db.data.favorites = db.data.favorites.filter(f => f.id !== req.params.id);
  db.write();
  res.json({ success: true });
});

// ── AVIS ──
app.get('/api/reviews/product/:productId', (req, res) => {
  const reviews = db.data.reviews.filter(r => r.product_id === req.params.productId);
  res.json(reviews);
});

app.get('/api/reviews/user/:userId', (req, res) => {
  const reviews = db.data.reviews.filter(r => r.user_id === req.params.userId);
  res.json(reviews);
});

app.post('/api/reviews', (req, res) => {
  const { user_id, product_id, rating, comment, verified } = req.body;
  
  const review = {
    id: `REV-${Date.now()}`,
    user_id,
    product_id,
    rating,
    comment,
    verified: verified || false,
    created_at: new Date().toISOString()
  };
  
  db.data.reviews.push(review);
  db.write();
  res.json({ success: true, review });
});

// ── ADRESSES ──
app.get('/api/addresses/:userId', (req, res) => {
  const addresses = db.data.addresses.filter(a => a.user_id === req.params.userId);
  res.json(addresses);
});

app.post('/api/addresses', (req, res) => {
  const { user_id, type, firstName, lastName, address, postalCode, city, country, phone, isDefault } = req.body;
  
  const addressData = {
    id: `ADDR-${Date.now()}`,
    user_id,
    type: type || 'delivery',
    firstName,
    lastName,
    address,
    postalCode,
    city,
    country: country || 'Côte d\'Ivoire',
    phone,
    isDefault: isDefault || false,
    created_at: new Date().toISOString()
  };
  
  db.data.addresses.push(addressData);
  db.write();
  res.json({ success: true, address: addressData });
});

app.put('/api/addresses/:id', (req, res) => {
  const index = db.data.addresses.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Address not found' });
  }
  
  db.data.addresses[index] = { ...db.data.addresses[index], ...req.body };
  db.write();
  res.json({ success: true, address: db.data.addresses[index] });
});

app.delete('/api/addresses/:id', (req, res) => {
  db.data.addresses = db.data.addresses.filter(a => a.id !== req.params.id);
  db.write();
  res.json({ success: true });
});

// ── NOTIFICATIONS ──
app.get('/api/notifications/:userId', (req, res) => {
  const notifications = db.data.notifications.filter(n => n.user_id === req.params.userId);
  res.json(notifications);
});

app.post('/api/notifications', (req, res) => {
  const { user_id, type, title, message, link } = req.body;
  
  const notification = {
    id: `NOTIF-${Date.now()}`,
    user_id,
    type,
    title,
    message,
    link,
    read: false,
    created_at: new Date().toISOString()
  };
  
  db.data.notifications.push(notification);
  db.write();
  res.json({ success: true, notification });
});

app.put('/api/notifications/:id/read', (req, res) => {
  const index = db.data.notifications.findIndex(n => n.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Notification not found' });
  }
  
  db.data.notifications[index].read = true;
  db.write();
  res.json({ success: true });
});

// ── PAIEMENTS ──
app.post('/api/payments', (req, res) => {
  const { order_id, method, amount, status, transaction_id, phone } = req.body;
  
  const payment = {
    id: `PAY-${Date.now()}`,
    order_id,
    method,
    amount,
    status: status || 'pending',
    transaction_id,
    phone,
    created_at: new Date().toISOString()
  };
  
  db.data.payments.push(payment);
  db.write();
  res.json({ success: true, payment });
});

app.get('/api/payments/order/:orderId', (req, res) => {
  const payments = db.data.payments.filter(p => p.order_id === req.params.orderId);
  res.json(payments);
});

app.put('/api/payments/:id', (req, res) => {
  const index = db.data.payments.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Payment not found' });
  }
  
  db.data.payments[index] = { ...db.data.payments[index], ...req.body };
  db.write();
  res.json({ success: true, payment: db.data.payments[index] });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Database: db.json (lowdb)`);
});
