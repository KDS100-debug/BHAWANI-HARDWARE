import Link from "next/link";
import { getPublicCategories, getPublicProducts } from "@/lib/catalogue";

export const metadata = { title: "Catalogue" };

export default async function CategoriesPage() {
  const catalogue = await loadCatalogue();
  if (!catalogue) return <CatalogueUnavailable />;
  const [categories, products] = catalogue;

  return (
      <main className="catalogue-page shell">
        <header className="catalogue-header">
          <div>
            <p className="eyebrow">Bhawani Hardware</p>
            <h1>Browse the catalogue</h1>
            <p className="hero-copy">Practical hardware, clearly priced and ready for delivery.</p>
          </div>
          <Link className="button button-secondary" href="/">Back home</Link>
        </header>
        <nav className="category-nav" aria-label="Product categories">
          {categories.map((category) => <Link key={category.id} href={`/category/${category.slug}`}>{category.name}</Link>)}
        </nav>
        <ProductGrid products={products} />
      </main>
    );
}

async function loadCatalogue() {
  try {
    return await Promise.all([getPublicCategories(), getPublicProducts()]);
  } catch {
    return null;
  }
}

function ProductGrid({ products }: { products: Awaited<ReturnType<typeof getPublicProducts>> }) {
  if (products.length === 0) return <CatalogueUnavailable title="Catalogue coming online" />;
  return <section className="product-grid" aria-label="Products">{products.map((product) => (
    <article className="product-card" key={product.id}>
      <div className="product-image" aria-hidden="true">{product.name.slice(0, 1)}</div>
      <p className="product-category">{product.category?.name ?? "Hardware"}</p>
      <h2>{product.name}</h2>
      <p className="product-price">₹{product.selling_price.toFixed(2)} <span>/ {product.unit}</span></p>
      <button className="button button-primary" type="button" disabled>Add to cart</button>
    </article>
  ))}</section>;
}

function CatalogueUnavailable({ title = "Catalogue unavailable" }: { title?: string }) {
  return <section className="empty-state catalogue-empty"><p className="eyebrow">Bhawani Hardware</p><h2>{title}</h2><p>Products will appear here once the catalogue is connected. Please check back shortly.</p></section>;
}