import Shop from './Shop';

// Pages catégories qui réutilisent Shop avec filtre de catégorie
export const WomenPage = () => <Shop categoryFilter="femmes" title="Mode Femmes" />;
export const MenPage = () => <Shop categoryFilter="hommes" title="Mode Hommes" />;
export const BeautyPage = () => <Shop categoryFilter="beaute" title="Beauté & Parfums" />;
export const ElectronicsPage = () => <Shop categoryFilter="electronique" title="Électronique" />;
export const AccessoriesPage = () => <Shop categoryFilter="accessoires" title="Accessoires Islamiques" />;
export const PromotionsPage = () => {
  const { PRODUCTS } = require('../data/products');
  return <Shop title="Promotions" />;
};
export const NewArrivalsPage = () => <Shop title="Nouveautés" />;
