import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Node } from '../types/tsp';
import { MapPin } from 'lucide-react';

interface SourceSelectorProps {
  nodes: Node[];
  selectedSource: string | null;
  onSourceSelect: (nodeId: string) => void;
  isVisible: boolean;
}

export const SourceSelector: React.FC<SourceSelectorProps> = ({
  nodes,
  selectedSource,
  onSourceSelect,
  isVisible
}) => {
  const selectedNodes = nodes.filter(n => n.selected);

  if (!isVisible || selectedNodes.length < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-slate-800 rounded-lg border border-slate-600 p-4 mb-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-emerald-400" />
        <span className="text-emerald-400 font-medium">Select Starting City</span>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        <AnimatePresence>
          {selectedNodes.map(node => (
            <motion.button
              key={node.id}
              onClick={() => onSourceSelect(node.id)}
              className={`
                p-3 rounded-lg border transition-all text-sm font-medium
                ${selectedSource === node.id
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              {node.label}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};