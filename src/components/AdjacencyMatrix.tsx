import React from 'react';
import { motion } from 'framer-motion';
import { Node } from '../types/tsp';
import { calculateDistance } from '../utils/graphUtils';

interface AdjacencyMatrixProps {
  nodes: Node[];
  isVisible: boolean;
  onClose: () => void;
}

export const AdjacencyMatrix: React.FC<AdjacencyMatrixProps> = ({
  nodes,
  isVisible,
  onClose
}) => {
  const selectedNodes = nodes.filter(n => n.selected);
  
  if (!isVisible || selectedNodes.length < 2) return null;

  const matrix = selectedNodes.map(nodeA => 
    selectedNodes.map(nodeB => {
      if (nodeA.id === nodeB.id) return 0;
      return Math.round(calculateDistance(nodeA, nodeB));
    })
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        className="bg-slate-800 rounded-xl border border-slate-600 p-6 max-w-4xl max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Adjacency Matrix</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-12 h-12 text-slate-400 text-sm"></th>
                {selectedNodes.map(node => (
                  <th key={node.id} className="w-16 h-12 text-center text-blue-300 font-medium text-sm">
                    {node.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {selectedNodes.map((nodeA, i) => (
                <tr key={nodeA.id}>
                  <td className="w-12 h-12 text-center text-blue-300 font-medium text-sm bg-slate-700/50">
                    {nodeA.label}
                  </td>
                  {selectedNodes.map((nodeB, j) => (
                    <td
                      key={nodeB.id}
                      className={`w-16 h-12 text-center text-sm border border-slate-600 ${
                        i === j 
                          ? 'bg-slate-700 text-slate-500' 
                          : 'bg-slate-800 text-white hover:bg-slate-700 transition-colors'
                      }`}
                    >
                      {matrix[i][j] === 0 ? '∞' : matrix[i][j]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-xs text-slate-400">
          <p>• Diagonal values represent no self-loops (∞)</p>
          <p>• Values represent Euclidean distances between nodes</p>
        </div>
      </motion.div>
    </motion.div>
  );
};