"use client";

import { Search, ShoppingCart, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import type { PublicCategory, PublicProduct } from "@/lib/catalogue";

type ProductGroup = { name: string; category: string; categorySlug: string; products: PublicProduct[] };
const cartKey = "bhawani-cart";
const cartChangeEvent = "bhawani-cart-change";
const emptyCartSnapshot = "{}";

function getCartSnapshot() {
  try { return window.localStorage.getItem(cartKey) ?? emptyCartSnapshot; }
  catch { return emptyCartSnapshot; }
}

function subscribeToCart(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(cartChangeEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(cartChangeEvent, callback);
  };
}

function parseCart(snapshot: string): Record<string, number> {
  try {
    const parsed: unknown = JSON.parse(snapshot);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, count]) => typeof count === "number" && Number.isInteger(count) && count > 0));
  } catch { return {}; }
}

export function CatalogueBrowser({ categories, products }: { categories: PublicCategory[]; products: PublicProduct[] }) {
  const { isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const cartSnapshot = useSyncExternalStore(subscribeToCart, getCartSnapshot, () => emptyCartSnapshot);
  const cart = useMemo(() => parseCart(cartSnapshot), [cartSnapshot]);

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const grouped = new Map<string, ProductGroup>();
    products.filter((product) => {
      const category = product.category?.name ?? "Hardware";
      const matchesCategory = selectedCategory === "all" || product.category?.slug === selectedCategory;
      return matchesCategory && (!query || `${product.name} ${product.sku} ${category}`.toLowerCase().includes(query));
    }).forEach((product) => {
      const key = product.name.trim().toLowerCase();
      const existing = grouped.get(key);
      if (existing) existing.products.push(product);
      else grouped.set(key, { name: product.name, category: product.category?.name ?? "Hardware", categorySlug: product.category?.slug ?? "", products: [product] });
    });
    return [...grouped.values()].map((group) => ({ ...group, products: [...group.products].sort((a, b) => b.selling_price - a.selling_price) }));
  }, [products, search, selectedCategory]);

  const cartCount = Object.values(cart).reduce((total, count) => total + count, 0);
  const selectCategory = (slug: string) => { setSelectedCategory(slug); };
  const addToCart = (id: string) => {
    try {
      window.localStorage.setItem(cartKey, JSON.stringify({ ...cart, [id]: (cart[id] ?? 0) + 1 }));
      window.dispatchEvent(new Event(cartChangeEvent));
    } catch { /* Storage may be unavailable in a restricted browser context. */ }
  };

  return <div className="storefront">
    <header className="store-header"><div className="store-brand"><span className="brand-mark" aria-hidden="true">BH</span><div><strong><b>BHAWANI</b> HARDWARE</strong><span>Build Better Homes</span></div></div><div className="store-actions"><Link className="icon-button" href={isAuthenticated ? "/account/security" : "/login"} aria-label={isAuthenticated ? "Account security" : "Sign in"}><UserRound size={23} /></Link><button className="icon-button cart-button" type="button" aria-label={`${cartCount} items in cart`}><ShoppingCart size={23} />{cartCount > 0 && <span>{cartCount}</span>}</button></div></header>
    <div className="catalogue-search"><Search size={20} aria-hidden="true" /><input aria-label="Search products" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products, item ID or category..." />{search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")}><X size={18} /></button>}</div>
    <div className="catalogue-layout"><aside className="category-sidebar" aria-label="Product categories">{categories.map((category) => <button className={`category-item ${selectedCategory === category.slug ? "selected" : ""}`} type="button" key={category.id} onClick={() => selectCategory(category.slug)}><span className="category-icon">{category.image_url ? <span className="category-photo" style={{ backgroundImage: `url(${category.image_url})` }} aria-label={`${category.name} category image`} role="img" /> : category.name.slice(0, 1)}</span><span>{category.name}</span></button>)}</aside><main className="product-area">{groups.length ? groups.map((group) => <ProductRow group={group} onAdd={addToCart} key={`${group.categorySlug}-${group.name}`} />) : <div className="empty-state catalogue-empty"><p className="eyebrow">No matches</p><h2>Nothing found for that search</h2><p>Try a product name, item ID, SKU or category.</p></div>}</main></div>
  </div>;
}

function ProductRow({ group, onAdd }: { group: ProductGroup; onAdd: (id: string) => void }) {
  return <section className="product-row" aria-labelledby={`group-${group.name}`}><div className="product-row-heading"><div><span>{group.category}</span><h2 id={`group-${group.name}`}>{group.name}</h2></div><span className="row-count">{group.products.length} variants</span></div><div className="variant-scroller">{group.products.map((product) => <article className="variant-card" key={product.id}><div className="variant-image">{product.image_url ? <div className="variant-photo" style={{ backgroundImage: `url(${product.image_url})` }} aria-label={`${product.name} image`} role="img" /> : <span>{product.name.slice(0, 1)}</span>}</div><div className="variant-meta"><strong>₹{product.selling_price.toFixed(0)}</strong><div className="variant-detail"><span className="unit-label">Unit: {product.unit}</span><span className="stock-status">In Stock</span></div><button className="add-button" type="button" onClick={() => onAdd(product.id)}><ShoppingCart size={15} /> Add</button></div></article>)}</div></section>;
}
