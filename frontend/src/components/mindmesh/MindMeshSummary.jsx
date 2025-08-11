// src/components/mindmesh/MindMeshSummary.jsx  (your file)
import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { UserAuth } from "../../context/AuthContext";
import ManageMeshItems from "./ManageMeshItems";

export default function MindMeshSummary() {
  const { session } = UserAuth();
  const [items, setItems] = useState([]);
  const [meshId, setMeshId] = useState(null);
  const [manageOpen, setManageOpen] = useState(false);

  const uid = session?.user?.id;

  async function load() {
    if (!uid) return;
    const { data: mesh } = await supabase
      .from("mindmeshes")
      .select("id")
      .eq("user_id", uid)
      .limit(1)
      .maybeSingle();
    const id = mesh?.id;
    setMeshId(id);
    if (!id) return;
    const { data } = await supabase
      .from("mindmesh_items")
      .select("item_type,item_key,title,tags,created_at")
      .eq("user_id", uid)
      .eq("mesh_id", id)
      .order("created_at", { ascending: false })
      .limit(24);
    setItems(data ?? []);
  }

  useEffect(() => {
    if (!session) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const counts = items.reduce((acc, it) => {
    acc[it.item_type] = (acc[it.item_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <div className="rounded-3xl p-6 bg-white shadow-md border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-bold text-slate-900">MindMesh</h2>
          <div className="text-sm text-slate-600">
            {counts.degree || 0} degrees · {counts.specialisation || 0} specs · {counts.course || 0} courses
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {items.length === 0 ? (
            <span className="text-sm text-slate-500">Nothing yet — add items from any details page.</span>
          ) : (
            items.map((it) => (
              <span
                key={`${it.item_type}:${it.item_key}`}
                className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 text-sm"
              >
                {it.title}
              </span>
            ))
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => (window.location.href = "/planner/mindmesh")}
            className="flex-1 px-6 py-3 text-white font-semibold rounded-2xl shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:ring-blue-300"
          >
            Create MindMesh
          </button>
          <button
            onClick={() => setManageOpen(true)}
            className="px-6 py-3 font-semibold rounded-2xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
            title="Manage items in your mesh"
          >
            Manage Items
          </button>
        </div>
      </div>

      <ManageMeshItems
        isOpen={manageOpen}
        onClose={() => setManageOpen(false)}
        meshId={meshId}
        onChanged={load}
      />
    </>
  );
}
