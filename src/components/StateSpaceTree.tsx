import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PartialSolution } from '../types/tsp';
import { Maximize2, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import * as d3 from 'd3';

interface StateSpaceTreeProps {
  solutions: PartialSolution[];
  bestSolution: PartialSolution | null;
  currentStep: number;
}

interface TreeNode {
  id: string;
  solution: PartialSolution;
  children: TreeNode[];
  x?: number;
  y?: number;
  depth: number;
}

export const StateSpaceTree: React.FC<StateSpaceTreeProps> = ({
  solutions,
  bestSolution,
  currentStep
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const fullscreenSvgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  const buildTree = (solutions: PartialSolution[]): TreeNode | null => {
    if (solutions.length === 0) return null;

    const nodeMap = new Map<string, TreeNode>();
    
    // Create all nodes
    solutions.forEach(solution => {
      nodeMap.set(solution.id, {
        id: solution.id,
        solution,
        children: [],
        depth: solution.level
      });
    });

    // Build parent-child relationships
    let root: TreeNode | null = null;
    
    solutions.forEach(solution => {
      const node = nodeMap.get(solution.id)!;
      
      if (solution.parentId) {
        const parent = nodeMap.get(solution.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        root = node;
      }
    });

    return root;
  };

  const drawTree = (svgElement: SVGSVGElement, isFullscreenMode = false) => {
    if (!svgElement || solutions.length === 0) return;

    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();

    const root = buildTree(solutions);
    if (!root) return;

    // Set up dimensions based on mode
    const width = isFullscreenMode ? window.innerWidth - 100 : 760;
    const height = isFullscreenMode ? window.innerHeight - 200 : 350;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };

    // Create tree layout
    const treeLayout = d3.tree<TreeNode>()
      .size([width - margin.left - margin.right, height - margin.top - margin.bottom])
      .separation((a, b) => {
        return a.parent === b.parent ? 1.2 : 1.5;
      });

    const hierarchy = d3.hierarchy(root);
    const treeData = treeLayout(hierarchy);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top}) scale(${isFullscreenMode ? zoom : 1})`);

    // Add zoom behavior for fullscreen mode
    if (isFullscreenMode) {
      const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 3])
        .on("zoom", (event) => {
          g.attr("transform", `translate(${margin.left + event.transform.x},${margin.top + event.transform.y}) scale(${event.transform.k})`);
          setZoom(event.transform.k);
        });

      svg.call(zoomBehavior);
    }

    // Draw links with curved paths
    g.selectAll(".link")
      .data(treeData.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", d3.linkVertical<any, TreeNode>()
        .x(d => d.x!)
        .y(d => d.y!)
        .curve(d3.curveBumpY)
      )
      .attr("fill", "none")
      .attr("stroke", "#475569")
      .attr("stroke-width", d => {
        const target = d.target as any;
        if (target.data.solution.isPruned) return 1;
        if (target.data.solution.isComplete && bestSolution?.id === target.data.solution.id) return 3;
        return 2;
      })
      .attr("stroke-dasharray", d => {
        const target = d.target as any;
        return target.data.solution.isPruned ? "5,5" : "none";
      })
      .attr("opacity", 0.8);

    // Draw nodes
    const nodes = g.selectAll(".node")
      .data(treeData.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .style("cursor", isFullscreenMode ? "pointer" : "default");

    // Node circles with enhanced styling
    nodes.append("circle")
      .attr("r", d => {
        if (isFullscreenMode) return d.data.solution.isComplete ? 12 : 10;
        return d.data.solution.isComplete ? 10 : 8;
      })
      .attr("fill", d => {
        if (d.data.solution.isPruned) return "#DC2626";
        if (d.data.solution.isComplete && bestSolution?.id === d.data.solution.id) return "#059669";
        if (d.data.solution.isComplete) return "#2563EB";
        return "#64748B";
      })
      .attr("stroke", d => {
        if (d.data.solution.isPruned) return "#B91C1C";
        if (d.data.solution.isComplete && bestSolution?.id === d.data.solution.id) return "#047857";
        if (d.data.solution.isComplete) return "#1D4ED8";
        return "#475569";
      })
      .attr("stroke-width", 2)
      .attr("filter", isFullscreenMode ? "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" : "none");

    // Add glow effect for best solution
    if (isFullscreenMode) {
      nodes.filter(d => d.data.solution.isComplete && bestSolution?.id === d.data.solution.id)
        .append("circle")
        .attr("r", 16)
        .attr("fill", "none")
        .attr("stroke", "#10B981")
        .attr("stroke-width", 2)
        .attr("opacity", 0.6)
        .attr("stroke-dasharray", "4,4")
        .append("animateTransform")
        .attr("attributeName", "transform")
        .attr("type", "rotate")
        .attr("values", "0;360")
        .attr("dur", "3s")
        .attr("repeatCount", "indefinite");
    }

    // Node labels (path)
    nodes.append("text")
      .attr("dy", isFullscreenMode ? -16 : -12)
      .attr("text-anchor", "middle")
      .attr("font-size", isFullscreenMode ? "12px" : "10px")
      .attr("font-weight", "600")
      .attr("fill", "#F1F5F9")
      .attr("stroke", "#1E293B")
      .attr("stroke-width", "0.5")
      .text(d => {
        const path = d.data.solution.path;
        if (isFullscreenMode && path.length > 1) {
          return path.join('→');
        }
        return path.length > 0 ? path[path.length - 1] : "Root";
      });

    // Cost/bound labels
    nodes.append("text")
      .attr("dy", isFullscreenMode ? 25 : 20)
      .attr("text-anchor", "middle")
      .attr("font-size", isFullscreenMode ? "10px" : "8px")
      .attr("fill", d => {
        if (d.data.solution.isPruned) return "#FCA5A5";
        if (d.data.solution.isComplete && bestSolution?.id === d.data.solution.id) return "#6EE7B7";
        return "#CBD5E1";
      })
      .text(d => {
        if (d.data.solution.isPruned) return "✂️ Pruned";
        if (d.data.solution.isComplete) return `Cost: ${d.data.solution.cost.toFixed(1)}`;
        return `Bound: ${d.data.solution.lowerBound.toFixed(1)}`;
      });

    // Add click handlers for fullscreen mode
    if (isFullscreenMode) {
      nodes.on("click", function(event, d) {
        setSelectedNode(d.data);
        
        // Highlight selected node
        nodes.selectAll("circle").attr("stroke-width", 2);
        d3.select(this).select("circle").attr("stroke-width", 4);
      });
    }
  };

  useEffect(() => {
    if (svgRef.current) {
      drawTree(svgRef.current, false);
    }
  }, [solutions, bestSolution, currentStep]);

  useEffect(() => {
    if (isFullscreen && fullscreenSvgRef.current) {
      drawTree(fullscreenSvgRef.current, true);
    }
  }, [isFullscreen, solutions, bestSolution, currentStep, zoom]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.1));
  const handleResetZoom = () => setZoom(1);

  return (
    <>
      {/* Compact Tree View */}
      <div ref={containerRef} className="h-full">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white">State Space Tree</h3>
            <motion.button
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Maximize2 className="w-4 h-4" />
              Expand
            </motion.button>
          </div>
          
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-500"></div>
              <span className="text-slate-300">Exploring</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-slate-300">Pruned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-slate-300">Complete</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-slate-300">Best</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-hidden h-96 cursor-pointer" onClick={() => setIsFullscreen(true)}>
          <svg
            ref={svgRef}
            width="760"
            height="350"
            className="w-full hover:bg-slate-800/50 transition-colors rounded-lg"
          />
        </div>
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col"
          >
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">State Space Tree - Full View</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Interactive visualization of Branch & Bound algorithm exploration
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-2">
                    <button
                      onClick={handleZoomOut}
                      className="p-1.5 hover:bg-slate-700 rounded text-white transition-colors"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-slate-300 min-w-[60px] text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      onClick={handleZoomIn}
                      className="p-1.5 hover:bg-slate-700 rounded text-white transition-colors"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleResetZoom}
                      className="p-1.5 hover:bg-slate-700 rounded text-white transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setIsFullscreen(false)}
                    className="p-2 hover:bg-slate-800 rounded-lg text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex">
              {/* Tree Visualization */}
              <div className="flex-1 overflow-hidden bg-slate-900">
                <svg
                  ref={fullscreenSvgRef}
                  width="100%"
                  height="100%"
                  className="w-full h-full"
                />
              </div>

              {/* Side Panel */}
              {selectedNode && (
                <motion.div
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="w-80 bg-slate-800 border-l border-slate-700 p-6"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">Node Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-400">Path</label>
                      <div className="text-white font-mono bg-slate-900 p-2 rounded mt-1">
                        {selectedNode.solution.path.join(' → ') || 'Root'}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-slate-400">Level</label>
                        <div className="text-white font-semibold">{selectedNode.solution.level}</div>
                      </div>
                      <div>
                        <label className="text-sm text-slate-400">Status</label>
                        <div className={`font-semibold ${
                          selectedNode.solution.isPruned ? 'text-red-400' :
                          selectedNode.solution.isComplete ? 'text-emerald-400' : 'text-blue-400'
                        }`}>
                          {selectedNode.solution.isPruned ? 'Pruned' :
                           selectedNode.solution.isComplete ? 'Complete' : 'Exploring'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-slate-400">Current Cost</label>
                        <div className="text-amber-300 font-semibold">{selectedNode.solution.cost.toFixed(1)}</div>
                      </div>
                      <div>
                        <label className="text-sm text-slate-400">Lower Bound</label>
                        <div className="text-blue-300 font-semibold">{selectedNode.solution.lowerBound.toFixed(1)}</div>
                      </div>
                    </div>
                    
                    {selectedNode.solution.isComplete && bestSolution?.id === selectedNode.solution.id && (
                      <div className="bg-emerald-900/30 border border-emerald-600 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-emerald-300">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                          <span className="font-semibold">Optimal Solution</span>
                        </div>
                        <p className="text-sm text-emerald-200 mt-1">
                          This is the best solution found by the algorithm.
                        </p>
                      </div>
                    )}
                    
                    {selectedNode.solution.isPruned && (
                      <div className="bg-red-900/30 border border-red-600 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-red-300">
                          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                          <span className="font-semibold">Pruned Branch</span>
                        </div>
                        <p className="text-sm text-red-200 mt-1">
                          This branch was pruned because its lower bound exceeded the current best solution.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-900 border-t border-slate-700 p-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-6 text-slate-400">
                  <span>Total Nodes: {solutions.length}</span>
                  <span>Pruned: {solutions.filter(s => s.isPruned).length}</span>
                  <span>Complete: {solutions.filter(s => s.isComplete).length}</span>
                </div>
                <div className="text-slate-400">
                  💡 Click on nodes to see details • Drag to pan • Use zoom controls
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};