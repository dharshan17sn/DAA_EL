import { Node, Edge } from '../types/tsp';

export const generateNodes = (count: number): Node[] => {
  const nodes: Node[] = [];
  const radius = 300;
  const centerX = 400;
  const centerY = 300;

  // Create nodes in a more natural distribution
  for (let i = 0; i < count; i++) {
    // Use golden angle for spiral distribution
    const angle = i * 2.399963;
    const r = Math.sqrt(i) * 30;
    
    const x = centerX + r * Math.cos(angle) + (Math.random() - 0.5) * 40;
    const y = centerY + r * Math.sin(angle) + (Math.random() - 0.5) * 40;

    nodes.push({
      id: `node-${i}`,
      x: Math.max(50, Math.min(750, x)),
      y: Math.max(50, Math.min(550, y)),
      selected: false,
      label: String.fromCharCode(65 + i) // A, B, C, etc.
    });
  }

  return nodes;
};

export const calculateDistance = (node1: Node, node2: Node): number => {
  const dx = node1.x - node2.x;
  const dy = node1.y - node2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const generateEdges = (nodes: Node[]): Edge[] => {
  const edges: Edge[] = [];
  const selectedNodes = nodes.filter(n => n.selected);

  for (let i = 0; i < selectedNodes.length; i++) {
    for (let j = i + 1; j < selectedNodes.length; j++) {
      const cost = calculateDistance(selectedNodes[i], selectedNodes[j]);
      edges.push({
        from: selectedNodes[i].id,
        to: selectedNodes[j].id,
        cost: Math.round(cost)
      });
    }
  }

  return edges;
};

export const createCostMatrix = (nodes: Node[]): { matrix: number[][], nodeMap: Map<string, number> } => {
  const selectedNodes = nodes.filter(n => n.selected);
  const n = selectedNodes.length;
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(Infinity));
  const nodeMap = new Map<string, number>();

  // Create node to index mapping
  selectedNodes.forEach((node, index) => {
    nodeMap.set(node.id, index);
  });

  // Fill matrix with distances
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = Infinity; // No self-loops
      } else {
        const distance = calculateDistance(selectedNodes[i], selectedNodes[j]);
        matrix[i][j] = Math.round(distance);
      }
    }
  }

  return { matrix, nodeMap };
};