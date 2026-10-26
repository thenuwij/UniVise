import { supabase } from "@/shared/lib/supabase";

export const listConversations = (userId) =>
  supabase.from("conversations").select("*").eq("user_id", userId).order("created_at", { ascending: false });

export const createConversation = (conversation) => supabase.from("conversations").insert(conversation).select().single();

export async function removeConversation(id) {
  await supabase.from("conversation_messages").delete().eq("conversation_id", id);
  return supabase.from("conversations").delete().eq("id", id);
}

export const listMessages = (conversationId) =>
  supabase
    .from("conversation_messages")
    .select("sender, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

export const addUserMessage = (conversationId, content) =>
  supabase.from("conversation_messages").insert({ conversation_id: conversationId, sender: "user", content });
