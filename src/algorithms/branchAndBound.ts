import { PartialSolution, AlgorithmState, BranchingStep } from '../types/tsp';

export class TSPBranchAndBound {
  private matrix: number[][];
  private nodeMap: Map<string, number>;
  private reverseNodeMap: Map<number, string>;
  private n: number;
  private bestCost: number = Infinity;
  private bestPath: string[] = [];
  private steps: BranchingStep[] = [];
  private solutionCounter = 0;
  private sourceNodeId: string;

  constructor(matrix: number[][], nodeMap: Map<string, number>, sourceNodeId: string) {
    this.matrix = matrix;
    this.nodeMap = nodeMap;
    this.n = matrix.length;
    this.sourceNodeId = sourceNodeId;
    this.reverseNodeMap = new Map();
    
    // Create reverse mapping
    for (const [nodeId, index] of nodeMap) {
      this.reverseNodeMap.set(index, nodeId);
    }
  }

  private calculateLowerBound(path: number[], visited: Set<number>): number {
    if (path.length === 0) return 0;

    let cost = 0;
    
    // Add cost of current path
    for (let i = 0; i < path.length - 1; i++) {
      cost += this.matrix[path[i]][path[i + 1]];
    }

    // For incomplete paths, add minimum spanning tree estimate
    if (path.length < this.n) {
      const unvisited = Array.from({length: this.n}, (_, i) => i).filter(i => !visited.has(i));
      
      if (unvisited.length > 0) {
        // Add minimum edge from last node to any unvisited node
        const lastNode = path[path.length - 1];
        let minFromLast = Infinity;
        for (const node of unvisited) {
          minFromLast = Math.min(minFromLast, this.matrix[lastNode][node]);
        }
        if (minFromLast !== Infinity) cost += minFromLast;

        // Add MST cost for remaining unvisited nodes
        if (unvisited.length > 1) {
          cost += this.calculateMSTCost(unvisited);
        }

        // Add minimum edge back to start from any unvisited node
        let minToStart = Infinity;
        for (const node of unvisited) {
          minToStart = Math.min(minToStart, this.matrix[node][path[0]]);
        }
        if (minToStart !== Infinity) cost += minToStart;
      }
    } else {
      // Complete path - add return cost
      cost += this.matrix[path[path.length - 1]][path[0]];
    }

    return cost;
  }

  private calculateMSTCost(nodes: number[]): number {
    if (nodes.length <= 1) return 0;

    const visited = new Set<number>();
    const key: number[] = new Array(nodes.length).fill(Infinity);
    let mstCost = 0;

    key[0] = 0;

    for (let count = 0; count < nodes.length; count++) {
      let u = -1;
      for (let v = 0; v < nodes.length; v++) {
        if (!visited.has(v) && (u === -1 || key[v] < key[u])) {
          u = v;
        }
      }

      visited.add(u);
      mstCost += key[u];

      for (let v = 0; v < nodes.length; v++) {
        if (!visited.has(v)) {
          const weight = this.matrix[nodes[u]][nodes[v]];
          if (weight < key[v]) {
            key[v] = weight;
          }
        }
      }
    }

    return mstCost;
  }

  private createPartialSolution(
    path: number[], 
    cost: number, 
    level: number, 
    parentId?: string
  ): PartialSolution {
    const visited = new Set(path);
    const lowerBound = this.calculateLowerBound(path, visited);
    const pathIds = path.map(i => this.reverseNodeMap.get(i)!);
    
    return {
      id: `sol-${this.solutionCounter++}`,
      path: pathIds,
      visited: new Set(pathIds),
      cost,
      lowerBound,
      level,
      isComplete: path.length === this.n,
      isPruned: false,
      parentId
    };
  }

  public async solve(): Promise<{
    bestSolution: PartialSolution | null,
    steps: BranchingStep[],
    exploredCount: number
  }> {
    this.steps = [];
    this.bestCost = Infinity;
    this.bestPath = [];
    this.solutionCounter = 0;

    const queue: PartialSolution[] = [];
    const explored: PartialSolution[] = [];

    // Start from the specified source node
    const startNodeIndex = this.nodeMap.get(this.sourceNodeId);
    if (startNodeIndex === undefined) {
      throw new Error(`Source node ${this.sourceNodeId} not found`);
    }

    const initialSolution = this.createPartialSolution([startNodeIndex], 0, 1);
    queue.push(initialSolution);

    this.steps.push({
      solution: initialSolution,
      action: 'explore',
      message: `Starting from ${this.reverseNodeMap.get(startNodeIndex)}`,
      timestamp: Date.now()
    });

    while (queue.length > 0) {
      // Sort queue by lower bound (best-first search)
      queue.sort((a, b) => a.lowerBound - b.lowerBound);
      
      const current = queue.shift()!;
      explored.push(current);

      // Prune if lower bound >= current best
      if (current.lowerBound >= this.bestCost) {
        current.isPruned = true;
        this.steps.push({
          solution: current,
          action: 'prune',
          message: `Pruned: bound ${current.lowerBound.toFixed(1)} ≥ best ${this.bestCost.toFixed(1)}`,
          timestamp: Date.now()
        });
        continue;
      }

      const currentPath = current.path.map(id => this.nodeMap.get(id)!);

      // If complete path, check if it's better
      if (current.level === this.n) {
        const returnCost = this.matrix[currentPath[currentPath.length - 1]][currentPath[0]];
        const totalCost = current.cost + returnCost;

        if (totalCost < this.bestCost) {
          this.bestCost = totalCost;
          this.bestPath = [...current.path, current.path[0]];
          
          this.steps.push({
            solution: {
              ...current,
              path: this.bestPath,
              cost: totalCost,
              isComplete: true
            },
            action: 'complete',
            message: `New best: ${totalCost.toFixed(1)}`,
            timestamp: Date.now()
          });
        }
        continue;
      }

      // Generate child nodes
      for (let nextNodeIndex = 0; nextNodeIndex < this.n; nextNodeIndex++) {
        const nextNodeId = this.reverseNodeMap.get(nextNodeIndex)!;
        
        if (!current.visited.has(nextNodeId)) {
          const lastNodeIndex = this.nodeMap.get(current.path[current.path.length - 1])!;
          const edgeCost = this.matrix[lastNodeIndex][nextNodeIndex];
          const newCost = current.cost + edgeCost;
          const newPath = [...currentPath, nextNodeIndex];

          const childSolution = this.createPartialSolution(
            newPath,
            newCost,
            current.level + 1,
            current.id
          );

          if (childSolution.lowerBound < this.bestCost) {
            queue.push(childSolution);
            
            this.steps.push({
              solution: childSolution,
              action: 'explore',
              message: `Exploring ${childSolution.path.join('→')}, bound: ${childSolution.lowerBound.toFixed(1)}`,
              timestamp: Date.now()
            });
          } else {
            childSolution.isPruned = true;
            this.steps.push({
              solution: childSolution,
              action: 'prune',
              message: `Pruned ${childSolution.path.join('→')}: bound ${childSolution.lowerBound.toFixed(1)}`,
              timestamp: Date.now()
            });
          }
        }
      }
    }

    const bestSolution = this.bestPath.length > 0 ? {
      id: 'final-solution',
      path: this.bestPath,
      visited: new Set(this.bestPath.slice(0, -1)),
      cost: this.bestCost,
      lowerBound: this.bestCost,
      level: this.n,
      isComplete: true,
      isPruned: false
    } : null;

    return {
      bestSolution,
      steps: this.steps,
      exploredCount: explored.length
    };
  }
}