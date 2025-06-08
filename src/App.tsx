import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraphCanvas } from './components/GraphCanvas';
import { BoundingPanel } from './components/BoundingPanel';
import { ControlPanel } from './components/ControlPanel';
import { AdjacencyMatrix } from './components/AdjacencyMatrix';
import { SourceSelector } from './components/SourceSelector';
import { generateNodes } from './utils/graphUtils';
import { useTSPSolver } from './hooks/useTSPSolver';
import { Node } from './types/tsp';
import { Compass, Github, Star } from 'lucide-react';

const INITIAL_NODES = generateNodes(25);

function App() {
  const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [showWeights, setShowWeights] = useState(false);
  const [adjacencyMatrix, setAdjacencyMatrix] = useState<number[][]>([]);
  
  const { 
    algorithmState, 
    recentSteps, 
    currentSolution, 
    solve, 
    simulate,
    reset,
    calculateComplexity,
    setSourceNode,
    toggleMatrix
  } = useTSPSolver(nodes, animationSpeed);

  const handleNodeSelect = useCallback((nodeId: string) => {
    if (algorithmState.isRunning || algorithmState.isSimulating) return;
    
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, selected: !node.selected, isSource: false }
        : node
    ));
  }, [algorithmState.isRunning, algorithmState.isSimulating]);

  const handleSourceSelect = useCallback((nodeId: string) => {
    setNodes(prev => prev.map(node => ({
      ...node,
      isSource: node.id === nodeId
    })));
    setSourceNode(nodeId);
  }, [setSourceNode]);

  const handleReset = useCallback(() => {
    reset();
    setNodes(prev => prev.map(node => ({ 
      ...node, 
      selected: false, 
      isSource: false 
    })));
    setShowWeights(false);
  }, [reset]);

  const handleSpeedChange = useCallback((speed: number) => {
    setAnimationSpeed(speed);
  }, []);

  const handleToggleWeights = useCallback(() => {
    setShowWeights(prev => !prev);
  }, []);

  const handleUpdateMatrix = (newMatrix: number[][]) => {
    setAdjacencyMatrix(newMatrix);
    // You may want to trigger a tree update here if needed
  };

  const selectedNodes = nodes.filter(n => n.selected);
  const sourceNode = nodes.find(n => n.isSource);
  const canSolve = selectedNodes.length >= 4 && !algorithmState.isRunning && !!sourceNode;
  const complexity = calculateComplexity(selectedNodes.length);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm"
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Compass className="w-8 h-8 text-blue-400" />
                <div>
                  <h1 className="text-xl font-bold text-white">TSP Universe</h1>
                  <p className="text-sm text-slate-400">Branch & Bound Algorithm Explorer</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Star className="w-4 h-4" />
                <span>Interactive Algorithm Visualization</span>
              </div>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-sm"
              >
                <Github className="w-4 h-4" />
                <span>Source</span>
              </a>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Graph Canvas */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 p-4"
        >
          <GraphCanvas
            nodes={nodes}
            edges={[]}
            onNodeSelect={handleNodeSelect}
            currentSolution={currentSolution}
            animationSpeed={animationSpeed}
            showWeights={showWeights}
            isSimulating={algorithmState.isSimulating}
            simulationStep={algorithmState.simulationStep}
          />
        </motion.div>

        {/* Right Panel */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="w-96 flex flex-col"
        >
          {/* Source Selector */}
          <div className="p-4">
            <SourceSelector
              nodes={nodes}
              selectedSource={sourceNode?.id || null}
              onSourceSelect={handleSourceSelect}
              isVisible={selectedNodes.length >= 4 && !algorithmState.isRunning && !algorithmState.isComplete}
            />
          </div>

          {/* Bounding Panel */}
          <div className="flex-1">
            <BoundingPanel
              currentSolutions={algorithmState.currentSolutions}
              exploredSolutions={algorithmState.exploredSolutions}
              bestSolution={algorithmState.bestSolution}
              recentSteps={recentSteps}
              currentStep={algorithmState.currentStep}
              totalSteps={algorithmState.totalSteps}
            />
          </div>
        </motion.div>
      </div>

      {/* Control Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <ControlPanel
          selectedCount={selectedNodes.length}
          isRunning={algorithmState.isRunning}
          isComplete={algorithmState.isComplete}
          canSolve={canSolve}
          animationSpeed={animationSpeed}
          onSolve={solve}
          onReset={handleReset}
          onSpeedChange={handleSpeedChange}
          onShowMatrix={toggleMatrix}
          onToggleWeights={handleToggleWeights}
          onSimulate={simulate}
          showWeights={showWeights}
          hasSource={!!sourceNode}
          isSimulating={algorithmState.isSimulating}
          complexity={complexity}
        />
      </motion.div>

      {/* Adjacency Matrix Modal */}
      <AnimatePresence>
        {algorithmState.showMatrix && (
          <AdjacencyMatrix
            nodes={nodes}
            isVisible={algorithmState.showMatrix}
            onClose={toggleMatrix}
            onUpdateMatrix={handleUpdateMatrix}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;