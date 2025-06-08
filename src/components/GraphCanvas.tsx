import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Node, Edge, PartialSolution } from '../types/tsp';
import { generateEdges } from '../utils/graphUtils';

interface GraphCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodeSelect: (nodeId: string) => void;
  currentSolution?: PartialSolution | null;
  animationSpeed: number;
  showWeights: boolean;
  isSimulating: boolean;
  simulationStep: number;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  onNodeSelect,
  currentSolution,
  animationSpeed,
  showWeights,
  isSimulating,
  simulationStep
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  const selectedNodes = nodes.filter(n => n.selected);
  const allEdges = generateEdges(nodes);
  const pathEdges = currentSolution ? getPathEdges(currentSolution, allEdges) : [];
  const sourceNode = nodes.find(n => n.isSource);

  // Get current traveling salesman position during simulation
  const getCurrentTravelingPosition = () => {
    if (!isSimulating || !currentSolution || simulationStep >= currentSolution.path.length) {
      return null;
    }
    return currentSolution.path[simulationStep];
  };

  const currentTravelerPosition = getCurrentTravelingPosition();

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <svg
        ref={svgRef}
        width="800"
        height="600"
        className="relative z-10"
        viewBox="0 0 800 600"
      >
        {/* Background edges (dim) */}
        {allEdges.map((edge, index) => {
          const fromNode = nodes.find(n => n.id === edge.from);
          const toNode = nodes.find(n => n.id === edge.to);
          if (!fromNode || !toNode) return null;

          const isInPath = pathEdges.some(pe => 
            (pe.from === edge.from && pe.to === edge.to) ||
            (pe.from === edge.to && pe.to === edge.from)
          );

          const edgeId = `${edge.from}-${edge.to}`;
          const isHovered = hoveredEdge === edgeId;

          return (
            <g key={`edge-${index}`}>
              <line
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={isInPath ? "#3B82F6" : "#334155"}
                strokeWidth={isInPath ? "3" : isHovered ? "2" : "1"}
                opacity={isInPath ? "1" : isHovered ? "0.8" : "0.3"}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredEdge(edgeId)}
                onMouseLeave={() => setHoveredEdge(null)}
              />
              
              {/* Edge weight labels */}
              {showWeights && selectedNodes.length > 0 && (
                <text
                  x={(fromNode.x + toNode.x) / 2}
                  y={(fromNode.y + toNode.y) / 2}
                  textAnchor="middle"
                  className={`text-xs font-medium pointer-events-none ${
                    isInPath ? 'fill-blue-300' : 'fill-slate-400'
                  }`}
                  dy="4"
                >
                  <tspan
                    className="bg-slate-900 px-1 py-0.5 rounded"
                    style={{
                      background: 'rgba(15, 23, 42, 0.8)',
                      padding: '2px 4px',
                      borderRadius: '4px'
                    }}
                  >
                    {edge.cost}
                  </tspan>
                </text>
              )}
            </g>
          );
        })}

        {/* TSP Path edges with animation */}
        <AnimatePresence>
          {pathEdges.map((edge, index) => {
            const fromNode = nodes.find(n => n.id === edge.from);
            const toNode = nodes.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return null;

            const isActiveEdge = isSimulating && (
              (simulationStep > 0 && currentSolution?.path[simulationStep - 1] === edge.from && currentSolution?.path[simulationStep] === edge.to) ||
              (simulationStep > 0 && currentSolution?.path[simulationStep - 1] === edge.to && currentSolution?.path[simulationStep] === edge.from)
            );

            return (
              <motion.line
                key={`path-edge-${edge.from}-${edge.to}`}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={isActiveEdge ? "#10B981" : "#3B82F6"}
                strokeWidth={isActiveEdge ? "4" : "3"}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: 1,
                  stroke: isActiveEdge ? "#10B981" : "#3B82F6",
                  strokeWidth: isActiveEdge ? 4 : 3
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 0.8 / animationSpeed, 
                  delay: index * 0.2 / animationSpeed,
                  ease: "easeInOut" 
                }}
              />
            );
          })}
        </AnimatePresence>

        {/* All nodes */}
        {nodes.map((node) => (
          <g key={node.id}>
            {/* Node circle */}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.selected ? (node.isSource ? 20 : 16) : 8}
              fill={
                node.isSource ? "#10B981" :
                node.selected ? "#3B82F6" : "#64748B"
              }
              stroke={
                node.isSource ? "#059669" :
                node.selected ? "#1E40AF" : "#475569"
              }
              strokeWidth="2"
              className="cursor-pointer"
              onClick={() => onNodeSelect(node.id)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              animate={{
                fill: node.isSource ? "#10B981" : (node.selected ? "#3B82F6" : "#64748B"),
                r: node.selected ? (node.isSource ? 20 : 16) : (hoveredNode === node.id ? 10 : 8),
                stroke: node.isSource ? "#059669" : (node.selected ? "#1E40AF" : "#475569")
              }}
              transition={{ duration: 0.2 }}
            />
            
            {/* Node label */}
            {node.selected && (
              <motion.text
                x={node.x}
                y={node.y + 5}
                textAnchor="middle"
                className="fill-white text-sm font-semibold pointer-events-none"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                {node.label}
              </motion.text>
            )}

            {/* Source indicator */}
            {node.isSource && (
              <motion.text
                x={node.x}
                y={node.y - 30}
                textAnchor="middle"
                className="fill-emerald-300 text-xs font-bold pointer-events-none"
                initial={{ opacity: 0, y: node.y - 25 }}
                animate={{ opacity: 1, y: node.y - 30 }}
              >
                START
              </motion.text>
            )}
          </g>
        ))}

        {/* Traveling salesman indicator */}
        {isSimulating && currentTravelerPosition && (
          <motion.g>
            {/* Traveler circle */}
            <motion.circle
              cx={nodes.find(n => n.id === currentTravelerPosition)?.x || 0}
              cy={nodes.find(n => n.id === currentTravelerPosition)?.y || 0}
              r="12"
              fill="#F59E0B"
              stroke="#D97706"
              strokeWidth="3"
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
            
            {/* Traveler icon */}
            <motion.text
              x={nodes.find(n => n.id === currentTravelerPosition)?.x || 0}
              y={(nodes.find(n => n.id === currentTravelerPosition)?.y || 0) + 4}
              textAnchor="middle"
              className="fill-white text-xs font-bold pointer-events-none"
            >
              🚶
            </motion.text>
          </motion.g>
        )}

        {/* Current path indicator */}
        {currentSolution && currentSolution.path.length > 0 && !isSimulating && (
          <motion.circle
            cx={nodes.find(n => n.id === currentSolution.path[currentSolution.path.length - 1])?.x || 0}
            cy={nodes.find(n => n.id === currentSolution.path[currentSolution.path.length - 1])?.y || 0}
            r="24"
            fill="none"
            stroke="#10B981"
            strokeWidth="3"
            strokeDasharray="8,4"
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ 
              scale: { duration: 0.3 },
              rotate: { duration: 2, repeat: Infinity, ease: "linear" }
            }}
          />
        )}
      </svg>

      {/* Node count indicator */}
      <div className="absolute top-4 left-4 bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm">
        Selected: {selectedNodes.length} / {nodes.length}
        {sourceNode && (
          <div className="text-xs text-emerald-300 mt-1">
            Source: {sourceNode.label}
          </div>
        )}
      </div>

      {/* Current solution info */}
      {currentSolution && (
        <div className="absolute bottom-4 left-4 bg-slate-800/80 backdrop-blur-sm rounded-lg px-4 py-3 text-white max-w-sm">
          <div className="text-sm font-medium text-blue-300 mb-1">
            {isSimulating ? `Traveling... Step ${simulationStep + 1}/${currentSolution.path.length}` : 'Optimal Path'}
          </div>
          <div className="text-xs text-slate-300 mb-2">
            {currentSolution.path.join(' → ')}
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span>Total Cost: <span className="text-amber-300 font-medium">{currentSolution.cost.toFixed(1)}</span></span>
            {!isSimulating && (
              <span>Bound: <span className="text-emerald-300 font-medium">{currentSolution.lowerBound.toFixed(1)}</span></span>
            )}
          </div>
        </div>
      )}

      {/* Simulation controls */}
      {isSimulating && (
        <div className="absolute top-4 right-4 bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
            <span>Simulating Journey</span>
          </div>
        </div>
      )}
    </div>
  );
};

function getPathEdges(solution: PartialSolution, allEdges: Edge[]): Edge[] {
  const pathEdges: Edge[] = [];
  
  for (let i = 0; i < solution.path.length - 1; i++) {
    const from = solution.path[i];
    const to = solution.path[i + 1];
    
    const edge = allEdges.find(e => 
      (e.from === from && e.to === to) || (e.from === to && e.to === from)
    );
    
    if (edge) {
      pathEdges.push({
        from,
        to,
        cost: edge.cost,
        isInPath: true
      });
    }
  }
  
  return pathEdges;
}