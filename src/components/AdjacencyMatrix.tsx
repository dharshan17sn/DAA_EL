import React from 'react';
import { motion } from 'framer-motion';
import { Node } from '../types/tsp';
import { calculateDistance } from '../utils/graphUtils';

interface AdjacencyMatrixProps {
  nodes: Node[];
  isVisible: boolean;
  onClose: () => void;
  onUpdateMatrix: (matrix: number[][]) => void;
}

export const AdjacencyMatrix: React.FC<AdjacencyMatrixProps> = ({
  nodes,
  isVisible,
  onClose,
  onUpdateMatrix
}) => {
  const selectedNodes = nodes.filter(n => n.selected);
  
  if (!isVisible || selectedNodes.length < 2) return null;

  const initialMatrix = selectedNodes.map(nodeA => 
    selectedNodes.map(nodeB => {
      if (nodeA.id === nodeB.id) return 0;
      return Math.round(calculateDistance(nodeA, nodeB));
    })
  );
  const [matrix, setMatrix] = React.useState<number[][]>(initialMatrix);
  React.useEffect(() => {
    setMatrix(initialMatrix);
  }, [nodes, isVisible]);

  const handleInputChange = (i: number, j: number, value: string) => {
    const newMatrix = matrix.map(row => [...row]);
    newMatrix[i][j] = Number(value);
    setMatrix(newMatrix);
  };

  const handleUpdateMatrix = (newMatrix) => {
    // Do something with newMatrix, e.g., update state and trigger tree reconstruction
    setMatrix(newMatrix);
    // ...any other logic you need
  };

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
                      {i === j ? (
                        '∞'
                      ) : (
                        <input
                          type="number"
                          className="w-14 bg-transparent text-white text-center border-none outline-none"
                          value={matrix[i][j]}
                          min={0}
                          onChange={e => handleInputChange(i, j, e.target.value)}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-end mt-4">
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
            onClick={() => onUpdateMatrix(matrix)}
          >
            Update Tree
          </button>
        </div>
        <div className="mt-4 text-xs text-slate-400">
          <p>• Diagonal values represent no self-loops (∞)</p>
          <p>• Values represent Euclidean distances between nodes</p>
        </div>
      </motion.div>
    </motion.div>
  );
};