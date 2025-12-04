// src/components/mindmesh/ManageMeshItems.jsx
import { useEffect, useMemo, useState } from "react";
import { UserAuth } from "../../context/AuthContext";
import { supabase } from "../../supabaseClient";

export default function ManageMeshItems({ isOpen, onClose, meshId, onChanged }) {
  const { session } = UserAuth();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all"); 
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(new Set());
  const uid = session?.user?.id;

  useEffect(() => {
    if (!isOpen || !uid || !meshId) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("mindmesh_items")
        .select("item_type,item_key,title,created_at,metadata")
        .eq("user_id", uid)
        .eq("mesh_id", meshId)
        .order("created_at", { ascending: false })
        .limit(500);
      if (!error) setItems(data ?? []);
      setLoading(false);
    })();
  }, [isOpen, uid, meshId]);

  const filtered = useMemo(() => {
    let list = items;
    if (typeFilter !== "all") list = list.filter((it) => it.item_type === typeFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (it) =>
          it.title?.toLowerCase().includes(q) ||
          it.item_key?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, typeFilter, query]);

  const toggle = (key) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
  };

  const allKeysOnScreen = filtered.map((it) => `${it.item_type}:${it.item_key}`);
  const allSelectedOnScreen = allKeysOnScreen.every((k) => selected.has(k));

  const toggleSelectAll = () => {
    const next = new Set(selected);
    if (allSelectedOnScreen) {
      allKeysOnScreen.forEach((k) => next.delete(k));
    } else {
      allKeysOnScreen.forEach((k) => next.add(k));
    }
    setSelected(next);
  };

  const deleteSelected = async () => {
    if (!uid || !meshId || selected.size === 0) return;
    setLoading(true);

    const selItems = items.filter((it) => selected.has(`${it.item_type}:${it.item_key}`));
    const keys = selItems.map((it) => it.item_key);

    // delete edges touching selected keys
    await supabase
      .from("mindmesh_edges")
      .delete()
      .eq("user_id", uid)
      .eq("mesh_id", meshId)
      .or(`from_key.in.(${keys.map(k=>`"${k}"`).join(",")}),to_key.in.(${keys.map(k=>`"${k}"`).join(",")})`);

    // delete items
    const { error } = await supabase
      .from("mindmesh_items")
      .delete()
      .eq("user_id", uid)
      .eq("mesh_id", meshId)
      .in("item_key", keys);

    if (!error) {
      const setSel = new Set(selected);
      setItems((prev) => prev.filter((it) => !setSel.has(`${it.item_type}:${it.item_key}`)));
      setSelected(new Set());
      onChanged?.();
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900">Manage Mesh Items</h3>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        {/* controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or code…"
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-200"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2"
          >
            <option value="all">All types</option>
            <option value="degree">Degrees</option>
            <option value="specialisation">Specialisations</option>
            <option value="course">Courses</option>
          </select>
          <button
            onClick={toggleSelectAll}
            className="rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50"
          >
            {allSelectedOnScreen ? "Unselect all" : "Select all (visible)"}
          </button>
          <button
            onClick={deleteSelected}
            disabled={loading || selected.size === 0}
            className="rounded-xl px-4 py-2 bg-rose-600 text-white font-semibold disabled:opacity-60"
            title={selected.size === 0 ? "Select items to delete" : "Delete selected items"}
          >
            {loading ? "Deleting…" : `Delete (${selected.size})`}
          </button>
        </div>

        {/* list */}
        <div className="space-y-2">
          {loading && items.length === 0 ? (
            <div className="text-slate-500">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-slate-500">No items match.</div>
          ) : (
            filtered.map((it) => (
              <label
                key={`${it.item_type}:${it.item_key}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={selected.has(`${it.item_type}:${it.item_key}`)}
                  onChange={() => toggle(`${it.item_type}:${it.item_key}`)}
                />
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{it.title}</div>
                  <div className="text-xs text-slate-600">
                    {it.item_type} • {it.item_key}
                    {it?.metadata?.auto_added ? <span className="ml-2 text-rose-600">(auto added)</span> : null}
                  </div>
                </div>
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
