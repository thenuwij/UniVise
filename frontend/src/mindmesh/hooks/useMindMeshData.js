import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import { Graph } from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";

export default function useMindMeshData({ isProgramView, session, programCode }) {
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [debugInfo, setDebugInfo] = useState(null);
  const [programCourses, setProgramCourses] = useState([]);
  const [programMeta, setProgramMeta] = useState(null);

  const fetchGraph = useCallback(async () => {
    // -------- PROGRAM VIEW --------
    if (isProgramView) {
      // Fetch program metadata
      if (programCode) {
        try {
          const { data: progData, error: progError } = await supabase
            .from("unsw_degrees_final")
            .select("degree_code, program_name, faculty, uac_code, cricos_code, duration, source_url")
            .eq("degree_code", programCode)
            .maybeSingle();

          if (progError) throw progError;
          setProgramMeta(progData || null);
        } catch (err) {
          console.error("Failed to load program metadata:", err);
          setProgramMeta(null);
        }
      }

      // Load course codes
      const stored = localStorage.getItem("programCourses");
      if (!stored) return;
      const programCoursesCodes = JSON.parse(stored)?.filter(Boolean) || [];
      if (!programCoursesCodes.length) return;

      const allowed = new Set(programCoursesCodes);

      // ✅ Fetch course metadata
      try {
        const { data: courseData, error: courseError } = await supabase
          .from("unsw_courses")
          .select("code, title, uoc, faculty, school")
          .in("code", programCoursesCodes);

        if (courseError) throw courseError;

        const formattedCourses = (courseData || []).map((c) => ({
          code: c.code,
          name: c.title || c.code,
          faculty: c.faculty || "Unknown",
          school: c.school || null,
          uoc:
            typeof c.uoc === "string"
              ? parseInt(c.uoc) || 0
              : Number(c.uoc) || 0,
        }));
        setProgramCourses(formattedCourses);
      } catch (err) {
        console.error("Failed to load programCourses metadata:", err);
        setProgramCourses([]);
      }

      // ✅ Fetch edges with comprehensive debugging
      console.log("=== MINDMESH EDGES DEBUG START ===");
      console.log("1. Program courses:", programCoursesCodes);
      console.log("2. Allowed courses set size:", allowed.size);

      const [{ data: edgesFrom }, { data: edgesTo }] = await Promise.all([
        supabase
          .from("mindmesh_edges_global")
          .select("from_key,to_key,edge_type,confidence,logic_type,group_id")
          .in("from_key", programCoursesCodes),
        supabase
          .from("mindmesh_edges_global")
          .select("from_key,to_key,edge_type,confidence,logic_type,group_id")
          .in("to_key", programCoursesCodes),
      ]);

      console.log("3. Edges fetched from DB:");
      console.log("   - edgesFrom count:", edgesFrom?.length || 0);
      console.log("   - edgesTo count:", edgesTo?.length || 0);
      console.log("   - Sample edgesFrom:", edgesFrom?.slice(0, 3));
      console.log("   - Sample edgesTo:", edgesTo?.slice(0, 3));

      const allEdges = [...(edgesFrom || []), ...(edgesTo || [])];
      console.log("4. Combined edges before filter:", allEdges.length);
      console.log("   - Sample combined:", allEdges.slice(0, 5));

      const edges = allEdges.filter(
        (e) => allowed.has(e.from_key) && allowed.has(e.to_key)
      );
      console.log("5. Edges after filter (both nodes in program):", edges.length);
      console.log("   - Sample filtered edges:", edges.slice(0, 5));

      // ✅ Fetch nodes
      const { data: nodesData } = await supabase
        .from("mindmesh_nodes_global")
        .select("key,label,uoc,faculty,school,level")
        .in("key", programCoursesCodes);

      console.log("6. Nodes fetched from DB:", nodesData?.length || 0);
      console.log("   - Sample nodes:", nodesData?.slice(0, 3));

      const nodes = (nodesData || [])
        .filter((n) => allowed.has(n.key))
        .map((n) => ({
          id: n.key,
          label: n.label || n.key,
          type: "course",
          metadata: {
            uoc: n.uoc,
            faculty: n.faculty,
            school: n.school,
            level: n.level,
          },
        }));

      console.log("7. Nodes after mapping:", nodes.length);
      console.log("   - Node IDs:", nodes.map(n => n.id).slice(0, 10));

      const builtGraph = {
        nodes,
        links: edges.map((e) => ({
          source: e.from_key,
          target: e.to_key,
          type: e.edge_type,
          confidence: e.confidence,
          logic_type: e.logic_type || "and",
          group_id: e.group_id || null,
        })),
      };

      console.log("8. Built graph BEFORE layout:");
      console.log("   - Nodes:", builtGraph.nodes.length);
      console.log("   - Links:", builtGraph.links.length);
      console.log("   - Sample links:", builtGraph.links.slice(0, 5));

      try {
        const G = new Graph({ type: "undirected", allowSelfLoops: false });
        
        builtGraph.nodes.forEach((n) => !G.hasNode(n.id) && G.addNode(n.id));
        
        console.log("9. Adding edges to graphology Graph:");
        let edgesAdded = 0;
        let edgesSkipped = 0;
        const validLinks = []; 
        
        builtGraph.links.forEach((l) => {
          const s = String(l.source),
            t = String(l.target);
          if (G.hasNode(s) && G.hasNode(t) && s !== t && !G.hasEdge(s, t)) {
            G.addEdge(s, t);
            validLinks.push(l); 
            edgesAdded++;
          } else {
            edgesSkipped++;
          }
        });
        
        console.log(`   - Edges added to Graph: ${edgesAdded}`);
        console.log(`   - Edges skipped: ${edgesSkipped}`);
        console.log(`   - Total edges in Graph: ${G.edges().length}`);

        builtGraph.nodes.forEach((n) => {
          const labelLength = (n.label || n.id).length;
          G.setNodeAttribute(n.id, "size", 10 + labelLength * 0.8);
        });

        forceAtlas2.assign(G, {
          iterations: 250,
          settings: {
            gravity: 0.02,
            scalingRatio: 15,
            adjustSizes: true,
            slowDown: 1.2,
          },
        });

        const laidOutNodes = builtGraph.nodes.map((n) => ({
          ...n,
          x: G.getNodeAttribute(n.id, "x") ?? Math.random() * 500,
          y: G.getNodeAttribute(n.id, "y") ?? Math.random() * 500,
        }));

        console.log("10. Final graph being set:");
        console.log("    - Nodes:", laidOutNodes.length);
        console.log("    - Links:", validLinks.length); 
        console.log("=== MINDMESH EDGES DEBUG END ===");

        setGraph({ 
          nodes: laidOutNodes, 
          links: validLinks  
        });
      } catch (err) {
        console.error("ForceAtlas2 layout failed:", err);
        setGraph(builtGraph);
      }

      setDebugInfo({ programCourses: programCoursesCodes, nodes, edges });
      return;
    }

    // -------- USER MINDMESH VIEW --------
    const userId = session?.user?.id;
    if (!userId) return;
    // (rest unchanged)
  }, [isProgramView, session?.user?.id, programCode]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  return { graph, setGraph, debugInfo, refetch: fetchGraph, programCourses, programMeta };
}
