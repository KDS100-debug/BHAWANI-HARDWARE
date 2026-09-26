import Link from "next/link";
import { getPublicCategories, getPublicProducts } from "@/lib/catalogue";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalogue = await loadCategory(slug);
  if (!catalogue) return <main className="centered-page shell"><section className="empty-state"><h1>Catalogue unavailable</h1><p>Please check back shortly.</p></section></main>;
  const category = catalogue.categories.find((item) => item.slug === slug);

  if (!category) return <main className="centered-page shell"><section className="empty-state"><h1>Category not found</h1><Link className="button button-primary" href="/categories">View catalogue</Link></section></main>;

  return <main className="catalogue-page shell"><header className="catalogue-header"><div><p className="eyebrow">Category</p><h1>{category.name}</h1></div><Link className="button button-secondary" href="/categories">All products</Link></header><section className="product-grid">{catalogue.products.length === 0 ? <p className="empty-copy">No active products in this category yet.</p> : catalogue.products.map((product) => <article className="product-card" key={product.id}><div className="product-image" aria-hidden="true">{product.name.slice(0, 1)}</div><h2>{product.name}</h2><p className="product-price">₹{product.selling_price.toFixed(2)} <span>/ {product.unit}</span></p><button className="button button-primary" type="button" disabled>Add to cart</button></article>)}</section></main>;
}

async function loadCategory(slug: string) {
  try {
    const [categories, products] = await Promise.all([getPublicCategories(), getPublicProducts(slug)]);
    return { categories, products };
  } catch {
    return null;
  }
}