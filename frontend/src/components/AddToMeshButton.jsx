// src/components/AddToMeshButton.jsx
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

export default function AddToMeshButton({
  itemType,         // 'degree' | 'specialisation' | 'course'
  itemKey,          // unique code, e.g. '425800' or 'COMP2511'
  title,            // display name
  sourceTable,      // e.g. 'unsw_degrees'
  sourceId,         // e.g. row id
  tags = [],        // ['cs','hardware']
  metadata = {},    // {uoc:6, level:2}
  className = "",
}) {
  const { session } = UserAuth();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [meshId, setMeshId] = useState(null);

  // Bootstrap: ensure default mesh, then check if this item already exists
  useEffect(() => {
    let alive = true;
    if (!session?.user?.id || !itemKey || !itemType) return;

    (async () => {
      try {
        // 1) Ensure a default mesh
        const { data: mesh, error: mErr } = await supabase
          .from("mindmeshes")
          .select("id")
          .eq("user_id", session.user.id)
          .limit(1)
          .maybeSingle();
        if (mErr) console.error(mErr);

        let id = mesh?.id;
        if (!id) {
          const { data: created, error: cErr } = await supabase
            .from("mindmeshes")
            .insert({ user_id: session.user.id, name: "Default" })
            .select("id")
            .single();
          if (cErr) throw cErr;
          id = created?.id;
        }
        if (!alive) return;
        setMeshId(id);

        // 2) Check if already added
        if (id) {
          const { data: existing, error: eErr } = await supabase
            .from("mindmesh_items")
            .select("id")
            .eq("user_id", session.user.id)
            .eq("mesh_id", id)
            .eq("item_type", itemType)
            .eq("item_key", itemKey)
            .maybeSingle();
          if (eErr && eErr.code !== "PGRST116") console.error(eErr); // ignore no-row
          if (!alive) return;
          setAdded(!!existing);
        }
      } catch (err) {
        console.error("MindMesh init error:", err);
        window.dispatchEvent(
          new CustomEvent("mindmesh:error", {
            detail: { message: String(err?.message || err) },
          })
        );
      }
    })();

    return () => {
      alive = false;
    };
  }, [session, itemKey, itemType]);

  const toggle = useCallback(async () => {
    if (!session?.user?.id || !meshId || !itemKey || loading) return;

    setLoading(true);
    try {
      if (added) {
        // Remove from mesh
        const { error } = await supabase
          .from("mindmesh_items")
          .delete()
          .eq("user_id", session.user.id)
          .eq("mesh_id", meshId)
          .eq("item_type", itemType)
          .eq("item_key", itemKey);
        if (error) throw error;

        setAdded(false);
        window.dispatchEvent(
          new CustomEvent("mindmesh:changed", {
            detail: { itemType, itemKey, added: false, meshId },
          })
        );
      } else {
        // Add to mesh
        const row = {
          user_id: session.user.id,
          mesh_id: meshId,
          item_type: itemType,
          item_key: itemKey,
          title,
          source_table: sourceTable,
          source_id: sourceId,
          tags,
          metadata,
        };

        const { error } = await supabase
          .from("mindmesh_items")
          .upsert([row], {
            onConflict: "user_id,mesh_id,item_type,item_key",
          });
        if (error) throw error;

        // Call AI linking endpoint (non-blocking)
        try {
          const res = await fetch("http://localhost:8000/mindmesh/infer", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              mesh_id: meshId,
              mode: "full",                // enable LLM non-prereq pass
              max_edges_per_new: 3,    
              allow_cross_faculty: false,  
              items: [{
                item_key: itemKey,
                item_type: itemType,
                title,
                metadata,
                source_table: sourceTable, // <-- important for enrichment
                source_id: sourceId,       // <-- important for enrichment
              }],
            }),
          });

          let info = null;
          try { info = await res.json(); } catch {}
          console.info("infer(full) result:", { status: res.status, info });

        } catch (e) {
          console.warn("AI infer failed (non-blocking):", e);
        }

        setAdded(true);
        window.dispatchEvent(
          new CustomEvent("mindmesh:changed", {
            detail: { itemType, itemKey, added: true, meshId },
          })
        );
      }
    } catch (err) {
      console.error("MindMesh toggle error:", err);
      window.dispatchEvent(
        new CustomEvent("mindmesh:error", {
          detail: { message: String(err?.message || err) },
        })
      );
    } finally {
      setLoading(false);
    }
  }, [
    session,
    meshId,
    itemKey,
    itemType,
    title,
    sourceTable,
    sourceId,
    tags,
    metadata,
    added,
    loading,
  ]);

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!session || !itemKey || loading}
      aria-busy={loading ? "true" : "false"}
      aria-pressed={added ? "true" : "false"}
      title={added ? "Remove from MindMesh" : "Add to MindMesh"}
      className={`px-4 py-2 rounded-xl font-semibold transition-all border shadow-sm ${
        added
          ? "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700"
          : "bg-gradient-to-br from-purple-600 to-blue-500 text-white hover:bg-gradient-to-bl border-transparent"
      } disabled:opacity-60 ${className}`}
    >
      {loading ? "…" : added ? "Added ✓" : "Add to MindMesh"}
    </button>
  );
}
