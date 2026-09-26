import { createClient } from "@/lib/supabase/server";
import { getPublicEnv } from "@/lib/env";

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  image_path: string | null;
  image_url: string | null;
};

export type PublicProduct = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  selling_price: number;
  unit: string;
  image_path: string | null;
  image_url: string | null;
  category: { name: string; slug: string } | null;
};

export async function getPublicCategories(): Promise<PublicCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, image_path")
    .eq("is_active", true)
    .order("display_order")
    .order("name");

  if (error) throw new Error("Catalogue categories are temporarily unavailable");
  const env = getPublicEnv();
  return data.map((category) => ({
    ...category,
    image_url: category.image_path
      ? category.image_path.startsWith("http")
        ? category.image_path
        : `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${encodeURIComponent(category.image_path)}`
      : null,
  }));
}

export async function getPublicProducts(categorySlug?: string): Promise<PublicProduct[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("id, sku, name, slug, description, selling_price, unit, image_path, category:categories!inner(name, slug)")
    .eq("is_active", true)
    .eq("categories.is_active", true)
    .order("name");

  if (categorySlug) query = query.eq("categories.slug", categorySlug);

  const { data, error } = await query;
  if (error) throw new Error("Catalogue products are temporarily unavailable");
  const env = getPublicEnv();
  return (data as unknown as Omit<PublicProduct, "image_url">[]).map((product) => ({
    ...product,
    image_url: product.image_path
      ? product.image_path.startsWith("http")
        ? product.image_path
        : `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${encodeURIComponent(product.image_path)}`
      : null,
  }));
}