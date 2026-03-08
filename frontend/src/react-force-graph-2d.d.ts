declare module 'react-force-graph-2d' {
  import type { ComponentType } from 'react';

  interface ForceGraph2DProps {
    graphData: { nodes: object[]; links: object[] };
    nodeId?: string;
    nodeLabel?: (node: object) => string;
    nodeAutoColorBy?: string;
    linkDirectionalArrowLength?: number;
    linkDirectionalArrowRelPos?: number;
    width?: number;
    height?: number;
  }

  const ForceGraph2D: ComponentType<ForceGraph2DProps>;
  export default ForceGraph2D;
}
