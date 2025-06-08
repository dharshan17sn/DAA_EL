import { useState, useCallback, useRef } from 'react';
import { Node, AlgorithmState, PartialSolution, BranchingStep } from '../types/tsp';
import { createCostMatrix } from '../utils/graphUtils';
import { TSPBranchAndBound } from '../algorithms/branchAndBound';

export const useTSPSolver = (nodes: Node[], animationSpeed: number) => {
  const [algorithmState, setAlgorithmState] = useState<AlgorithmState>({
    isRunning: false,
    isComplete: false,
    currentStep: 0,
    totalSteps: 0,
    bestSolution: null,
    currentSolutions: [],
    exploredSolutions: [],
    currentBestCost: Infinity,
    matrix: [],
    nodeMap: new Map(),
    speedMs: 1000,
    sourceNode: null,
    showMatrix: false,
    isSimulating: false,
    simulationStep: 0
  });

  const [recentSteps, setRecentSteps] = useState<BranchingStep[]>([]);
  const [currentSolution, setCurrentSolution] = useState<PartialSolution | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const simulationTimeoutRef = useRef<NodeJS.Timeout>();

  const calculateComplexity = useCallback((n: number) => {
    const timeComplexity = n <= 1 ? 'O(1)' : `O(n²·2ⁿ)`;
    const spaceComplexity = n <= 1 ? 'O(1)' : `O(n·2ⁿ)`;
    const estimatedOps = n > 0 ? Math.pow(n, 2) * Math.pow(2, Math.min(n, 12)) : 0;
    
    return { timeComplexity, spaceComplexity, estimatedOps };
  }, []);

  const setSourceNode = useCallback((nodeId: string) => {
    setAlgorithmState(prev => ({ ...prev, sourceNode: nodeId }));
  }, []);

  const solve = useCallback(async () => {
    const selectedNodes = nodes.filter(n => n.selected);
    const sourceNode = nodes.find(n => n.isSource);
    
    if (selectedNodes.length < 2 || !sourceNode) return;

    setAlgorithmState(prev => ({ 
      ...prev, 
      isRunning: true, 
      isComplete: false,
      isSimulating: false,
      simulationStep: 0,
      currentSolutions: [],
      exploredSolutions: []
    }));
    setRecentSteps([]);
    setCurrentSolution(null);

    try {
      const { matrix, nodeMap } = createCostMatrix(nodes);
      const solver = new TSPBranchAndBound(matrix, nodeMap, sourceNode.id);
      
      const result = await solver.solve();
      
      // Faster animation - process steps in batches
      let stepIndex = 0;
      const batchSize = Math.max(1, Math.floor(result.steps.length / 20)); // Process in batches
      
      const animateStep = () => {
        if (stepIndex < result.steps.length) {
          const endIndex = Math.min(stepIndex + batchSize, result.steps.length);
          const batchSteps = result.steps.slice(stepIndex, endIndex);
          
          // Process batch
          const currentSols: PartialSolution[] = [];
          const exploredSols: PartialSolution[] = [];
          
          batchSteps.forEach(step => {
            if (step.action === 'explore' && !step.solution.isComplete) {
              currentSols.push(step.solution);
            } else {
              exploredSols.push(step.solution);
            }
          });
          
          setRecentSteps(prev => [...prev, ...batchSteps]);
          setCurrentSolution(batchSteps[batchSteps.length - 1].solution);
          
          setAlgorithmState(prev => ({
            ...prev,
            currentStep: endIndex,
            totalSteps: result.steps.length,
            bestSolution: result.bestSolution,
            currentBestCost: result.bestSolution?.cost || Infinity,
            currentSolutions: [...prev.currentSolutions, ...currentSols],
            exploredSolutions: [...prev.exploredSolutions, ...exploredSols]
          }));

          stepIndex = endIndex;
          timeoutRef.current = setTimeout(animateStep, 200 / animationSpeed); // Faster animation
        } else {
          // Animation complete
          setAlgorithmState(prev => ({
            ...prev,
            isRunning: false,
            isComplete: true,
            bestSolution: result.bestSolution
          }));
          setCurrentSolution(result.bestSolution);
        }
      };

      animateStep();
    } catch (error) {
      console.error('Solver error:', error);
      setAlgorithmState(prev => ({ ...prev, isRunning: false }));
    }
  }, [nodes, animationSpeed]);

  const simulate = useCallback(() => {
    if (!algorithmState.bestSolution) return;

    setAlgorithmState(prev => ({ 
      ...prev, 
      isSimulating: true, 
      simulationStep: 0 
    }));

    const path = algorithmState.bestSolution.path;
    let step = 0;

    const animateSimulation = () => {
      if (step < path.length) {
        setAlgorithmState(prev => ({ 
          ...prev, 
          simulationStep: step 
        }));
        
        step++;
        simulationTimeoutRef.current = setTimeout(animateSimulation, 1000 / animationSpeed);
      } else {
        setAlgorithmState(prev => ({ 
          ...prev, 
          isSimulating: false,
          simulationStep: 0
        }));
      }
    };

    animateSimulation();
  }, [algorithmState.bestSolution, animationSpeed]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (simulationTimeoutRef.current) {
      clearTimeout(simulationTimeoutRef.current);
    }
    
    setAlgorithmState({
      isRunning: false,
      isComplete: false,
      currentStep: 0,
      totalSteps: 0,
      bestSolution: null,
      currentSolutions: [],
      exploredSolutions: [],
      currentBestCost: Infinity,
      matrix: [],
      nodeMap: new Map(),
      speedMs: 1000,
      sourceNode: null,
      showMatrix: false,
      isSimulating: false,
      simulationStep: 0
    });
    
    setRecentSteps([]);
    setCurrentSolution(null);
  }, []);

  const toggleMatrix = useCallback(() => {
    setAlgorithmState(prev => ({ ...prev, showMatrix: !prev.showMatrix }));
  }, []);

  return {
    algorithmState,
    recentSteps,
    currentSolution,
    solve,
    simulate,
    reset,
    calculateComplexity,
    setSourceNode,
    toggleMatrix
  };
};