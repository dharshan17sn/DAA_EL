export interface Node {
  id: string;
  x: number;
  y: number;
  selected: boolean;
  label: string;
  isSource?: boolean;
}

export interface Edge {
  from: string;
  to: string;
  cost: number;
  isInPath?: boolean;
  isActive?: boolean;
}

export interface PartialSolution {
  id: string;
  path: string[];
  visited: Set<string>;
  cost: number;
  lowerBound: number;
  level: number;
  isComplete: boolean;
  isPruned: boolean;
  parentId?: string;
}

export interface AlgorithmState {
  isRunning: boolean;
  isComplete: boolean;
  currentStep: number;
  totalSteps: number;
  bestSolution: PartialSolution | null;
  currentSolutions: PartialSolution[];
  exploredSolutions: PartialSolution[];
  currentBestCost: number;
  matrix: number[][];
  nodeMap: Map<string, number>;
  speedMs: number;
  sourceNode: string | null;
  showMatrix: boolean;
  isSimulating: boolean;
  simulationStep: number;
}

export interface BranchingStep {
  solution: PartialSolution;
  action: 'explore' | 'prune' | 'complete' | 'bound';
  message: string;
  timestamp: number;
}