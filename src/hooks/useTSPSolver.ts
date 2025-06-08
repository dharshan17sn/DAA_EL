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
    const timeComplexity = n <= 1 ? 'O(1)' : `O(n²·2ⁿ) ≈ O(${n}²·2^${n})`;
    const spaceComplexity = n <= 1 ? 'O(1)' : `O(n·2ⁿ) ≈ O(${n}·2^${n})`;
    const estimatedOps = n > 0 ? Math.pow(n, 2) * Math.pow(2, Math.min(n, 15)) : 0;
    
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
      simulationStep: 0
    }));
    setRecentSteps([]);
    setCurrentSolution(null);

    try {
      const { matrix, nodeMap } = createCostMatrix(nodes);
      const solver = new TSPBranchAndBound(matrix, nodeMap, sourceNode.id);
      
      const result = await solver.solve();
      
      // Animate through the steps
      let stepIndex = 0;
      const animateStep = () => {
        if (stepIndex < result.steps.length) {
          const step = result.steps[stepIndex];
          
          setRecentSteps(prev => [...prev, step]);
          setCurrentSolution(step.solution);
          
          setAlgorithmState(prev => ({
            ...prev,
            currentStep: stepIndex + 1,
            totalSteps: result.steps.length,
            bestSolution: result.bestSolution,
            currentBestCost: result.bestSolution?.cost || Infinity
          }));

          stepIndex++;
          timeoutRef.current = setTimeout(animateStep, 1000 / animationSpeed);
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
        simulationTimeoutRef.current = setTimeout(animateSimulation, 1500 / animationSpeed);
      } else {
        // Simulation complete
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