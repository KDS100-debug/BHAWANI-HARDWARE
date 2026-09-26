import { CatalogueBrowser } from "@/components/catalogue/catalogue-browser";
import { getPublicCategories, getPublicProducts } from "@/lib/catalogue";

export const metadata = { title: "Shop hardware" };

export default async function HomePage() {
  const catalogue = await loadCatalogue();
  if (!catalogue) return <main className="centered-page shell"><section className="empty-state"><p className="eyebrow">Bhawani Hardware</p><h1>Catalogue unavailable</h1><p>Products will appear here once the catalogue is connected. Please check back shortly.</p></section></main>;
  const [categories, products] = catalogue;
  return <main className="customer-home"><CatalogueBrowser categories={categories} products={products} /></main>;
}

async function loadCatalogue() {
  try { return await Promise.all([getPublicCategories(), getPublicProducts()]); } catch { return null; }
}
