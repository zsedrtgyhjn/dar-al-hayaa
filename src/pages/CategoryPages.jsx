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

// Pages sous-catégories pour Femmes
export const AbayasPage = () => <Shop categoryFilter="femmes" subcategoryFilter="abayas" title="Abayas" />;
export const HijabsPage = () => <Shop categoryFilter="femmes" subcategoryFilter="hijab" title="Hijabs" />;
export const JilbabsPage = () => <Shop categoryFilter="femmes" subcategoryFilter="jilbab" title="Jilbabs" />;
export const RobesPage = () => <Shop categoryFilter="femmes" subcategoryFilter="robes" title="Robes" />;
export const KhimarsPage = () => <Shop categoryFilter="femmes" subcategoryFilter="khima" title="Khimars" />;
export const AccessoiresFemmePage = () => <Shop categoryFilter="femmes" subcategoryFilter="acessoire" title="Accessoires Femme" />;

// Pages sous-catégories pour Hommes
export const QamisPage = () => <Shop categoryFilter="hommes" subcategoryFilter="qamis" title="Qamis" />;
export const SarouelsPage = () => <Shop categoryFilter="hommes" subcategoryFilter="saroussel" title="Sarouels" />;

// Pages sous-catégories pour Beauté
export const CheveuxPage = () => <Shop categoryFilter="beaute" subcategoryFilter="cheveux" title="Soins Cheveux" />;

// Pages sous-catégories pour Accessoires
export const ChaussettesPage = () => <Shop categoryFilter="accessoires" subcategoryFilter="chaussettes" title="Chaussettes" />;
export const GantsPage = () => <Shop categoryFilter="accessoires" subcategoryFilter="gant" title="Gants" />;
