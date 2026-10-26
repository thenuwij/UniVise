import { supabase } from "@/shared/lib/supabase";

const savedItems = () => supabase.from("user_saved_items");

export const listSavedItems = (userId) =>
  savedItems().select("*").eq("user_id", userId).order("saved_at", { ascending: false });

export const savedItemIds = (userId, itemType) =>
  savedItems().select("item_id").eq("user_id", userId).eq("item_type", itemType);

export const findSavedItem = (userId, itemTypes, itemId) =>
  savedItems().select("id").eq("user_id", userId).in("item_type", itemTypes).eq("item_id", String(itemId)).limit(1);

export const saveItem = (userId, { itemType, itemId, itemName, itemData }) =>
  savedItems().insert({ user_id: userId, item_type: itemType, item_id: String(itemId), item_name: itemName, item_data: itemData });

export const unsaveItem = (userId, itemTypes, itemId) =>
  savedItems().delete().eq("user_id", userId).in("item_type", itemTypes).eq("item_id", String(itemId));

export const updateSavedItem = (userId, id, changes) =>
  savedItems().update(changes).eq("user_id", userId).eq("id", id).select("*").single();

export const removeSavedItem = (userId, id) => savedItems().delete().eq("user_id", userId).eq("id", id);
