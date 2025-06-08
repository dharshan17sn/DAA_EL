import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PartialSolution } from '../types/tsp';
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || solutions.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Build tree structure
    const root = buildTree(solutions);
    if (!root) return;

    // Set up dimensions
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    // Create tree layout
    const treeLayout = d3.tree<TreeNode>()
      .size([width - margin.left - margin.right, height - margin.top - margin.bottom]);

    const hierarchy = d3.hierarchy(root);
    const treeData = treeLayout(hierarchy);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Draw links
    g.selectAll(".link")
      .data(treeData.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", d3.linkVertical<any, TreeNode>()
        .x(d => d.x!)
        .y(d => d.y!)
      )
      .attr("fill", "none")
      .attr("stroke", "#64748B")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.6);

    // Draw nodes
    const nodes = g.selectAll(".node")
      .data(treeData.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.x},${d.y})`);

    // Node circles
    nodes.append("circle")
      .attr("r", 8)
      .attr("fill", d => {
        if (d.data.solution.isPruned) return "#EF4444";
        if (d.data.solution.isComplete && bestSolution?.id === d.data.solution.id) return "#10B981";
        if (d.data.solution.isComplete) return "#3B82F6";
        return "#64748B";
      })
      .attr("stroke", "#1E293B")
      .attr("stroke-width", 2);

    // Node labels
    nodes.append("text")
      .attr("dy", -12)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#E2E8F0")
      .text(d => {
        const path = d.data.solution.path;
        return path.length > 0 ? path[path.length - 1] : "Root";
      });

    // Cost labels
    nodes.append("text")
      .attr("dy", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "8px")
      .attr("fill", "#94A3B8")
      .text(d => {
        if (d.data.solution.isPruned) return "✂️";
        return `${d.data.solution.lowerBound.toFixed(0)}`;
      });

  }, [solutions, bestSolution, currentStep]);

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

  return (
    <div ref={containerRef} className="h-full">
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-2">State Space Tree</h3>
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
      
      <div className="overflow-auto h-96">
        <svg
          ref={svgRef}
          width="800"
          height="400"
          className="w-full"
        />
      </div>
    </div>
  );
};