import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import ForceGraph2D from 'react-force-graph-2d';

export interface FamilyTreeEntry {
  id: string;
  name: string;
  relation: string;
  birthDate?: string;
  description?: string;
  children: FamilyTreeEntry[];
}

interface GraphNode {
  id: string;
  name: string;
  relation?: string;
}

interface GraphLink {
  source: string;
  target: string;
}

function treeToGraphData(tree: FamilyTreeEntry[]): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const seen = new Set<string>();

  function walk(entry: FamilyTreeEntry) {
    if (seen.has(entry.id)) return;
    seen.add(entry.id);
    nodes.push({ id: entry.id, name: entry.name, relation: entry.relation });
    for (const child of entry.children ?? []) {
      links.push({ source: entry.id, target: child.id });
      walk(child);
    }
  }
  tree.forEach(walk);
  return { nodes, links };
}

export default function FamilyGraph() {
  const [data, setData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 500 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.offsetWidth || 800;
      const h = el.offsetHeight || 500;
      setSize({ width: Math.max(300, w), height: Math.max(400, h) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    axios
      .get<{ tree: FamilyTreeEntry[]; error?: string }>('/brain/family/tree')
      .then((res) => {
        if (res.data.error) {
          setError(res.data.error);
          setData({ nodes: [], links: [] });
        } else {
          setError(null);
          setData(treeToGraphData(res.data.tree ?? []));
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : '가족 트리 로드 실패');
        setData({ nodes: [], links: [] });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="p-4">
      <h2 className="text-xl font-bold mb-2">Family Graph</h2>
      <p className="text-zinc-400 text-sm mb-4">가족 관계 시각화 (얼굴 태깅·가족 트리 기반)</p>

      {loading && <p className="text-zinc-500 text-sm py-4">가족 그래프 불러오는 중…</p>}
      {error && <p className="text-red-400 text-sm py-2">{error}</p>}
      {!loading && !error && data.nodes.length === 0 && (
        <p className="text-zinc-500 text-sm py-4">가족 구성원이 없습니다. POST /brain/family/persons 로 추가하세요.</p>
      )}

      {!loading && !error && data.nodes.length > 0 && (
        <div className="overflow-x-auto">
          <div
            ref={containerRef}
            className="w-full border border-zinc-700 rounded-lg overflow-hidden bg-zinc-900"
            style={{ minHeight: 400 }}
          >
            <ForceGraph2D
              graphData={data}
              nodeId="id"
              nodeLabel={(n) => `${(n as GraphNode).name} (${(n as GraphNode).relation ?? ''})`}
              nodeAutoColorBy="relation"
              linkDirectionalArrowLength={4}
              linkDirectionalArrowRelPos={1}
              width={size.width}
              height={size.height}
            />
          </div>
        </div>
      )}
    </section>
  );
}
