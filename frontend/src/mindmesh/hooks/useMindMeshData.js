import { Graph } from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function useMindMeshData({ isProgramView, session, programCode }) {
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [debugInfo, setDebugInfo] = useState(null);
  const [programCourses, setProgramCourses] = useState([]);
  const [programMeta, setProgramMeta] = useState(null);

  const fetchGraph = useCallback(async () => {
    // Program view
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

      // Fetch course metadata
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

      const allEdges = [...(edgesFrom || []), ...(edgesTo || [])];

      const edges = allEdges.filter(
        (e) => allowed.has(e.from_key) && allowed.has(e.to_key)
      );

      // Fetch nodes
      const { data: nodesData } = await supabase
        .from("mindmesh_nodes_global")
        .select("key,label,uoc,faculty,school,level")
        .in("key", programCoursesCodes);

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

      try {
        const G = new Graph({ type: "undirected", allowSelfLoops: false });
        
        builtGraph.nodes.forEach((n) => !G.hasNode(n.id) && G.addNode(n.id));
        
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
    
    const userId = session?.user?.id;
    if (!userId) return;
  }, [isProgramView, session?.user?.id, programCode]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  return { graph, setGraph, debugInfo, refetch: fetchGraph, programCourses, programMeta };
}
