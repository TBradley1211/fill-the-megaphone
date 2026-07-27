import { supabase } from "./supabase";

export async function getActiveWishlistItems() {
  const { data, error } = await supabase
    .from("wishlist_items")
    .select(`
      id,
      category_id,
      item_name,
      item_description,
      estimated_price,
      quantity_needed,
      quantity_purchased,
      amazon_url,
      is_active,
      created_at,
      updated_at
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getAllWishlistItems() {
  const { data, error } = await supabase
    .from("wishlist_items")
    .select(`
      id,
      category_id,
      item_name,
      item_description,
      estimated_price,
      quantity_needed,
      quantity_purchased,
      amazon_url,
      is_active,
      created_at,
      updated_at
    `)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createWishlistItem({
  categoryId,
  itemName,
  itemDescription,
  estimatedPrice,
  quantityNeeded,
  amazonUrl,
}) {
  const { data, error } = await supabase
    .from("wishlist_items")
    .insert({
      category_id: Number(categoryId),
      item_name: itemName.trim(),
      item_description: itemDescription.trim() || null,
      estimated_price:
        estimatedPrice === "" ? null : Number(estimatedPrice),
      quantity_needed: Number(quantityNeeded),
      quantity_purchased: 0,
      amazon_url: amazonUrl.trim() || null,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateWishlistItem(
  itemId,
  {
    categoryId,
    itemName,
    itemDescription,
    estimatedPrice,
    quantityNeeded,
    quantityPurchased,
    amazonUrl,
    isActive,
  }
) {
  const needed = Math.max(Number(quantityNeeded), 1);

  const purchased = Math.min(
    Math.max(Number(quantityPurchased), 0),
    needed
  );

  const { data, error } = await supabase
    .from("wishlist_items")
    .update({
      category_id: Number(categoryId),
      item_name: itemName.trim(),
      item_description: itemDescription.trim() || null,
      estimated_price:
        estimatedPrice === "" ? null : Number(estimatedPrice),
      quantity_needed: needed,
      quantity_purchased: purchased,
      amazon_url: amazonUrl.trim() || null,
      is_active: Boolean(isActive),
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateWishlistPurchaseCount(
  itemId,
  quantityPurchased,
  quantityNeeded
) {
  const needed = Math.max(Number(quantityNeeded), 1);

  const purchased = Math.min(
    Math.max(Number(quantityPurchased), 0),
    needed
  );

  const { data, error } = await supabase
    .from("wishlist_items")
    .update({
      quantity_purchased: purchased,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function setWishlistItemActive(itemId, isActive) {
  const { data, error } = await supabase
    .from("wishlist_items")
    .update({
      is_active: Boolean(isActive),
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteWishlistItem(itemId) {
  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    throw new Error(error.message);
  }
}