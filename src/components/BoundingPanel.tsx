import React from 'react';
import { motion } from 'framer-motion';
import { PartialSolution, BranchingStep } from '../types/tsp';
import { TreePine, Target } from 'lucide-react';
import { StateSpaceTree } from './StateSpaceTree';

interface BoundingPanelProps {
  currentSolutions: PartialSolution[];
  exploredSolutions: PartialSolution[];
  bestSolution: PartialSolution | null;
  recentSteps: BranchingStep[];
  currentStep: number;
  totalSteps: number;
}

export const BoundingPanel: React.FC<BoundingPanelProps> = ({
  currentSolutions,
  exploredSolutions,
  bestSolution,
  recentSteps,
  currentStep,
  totalSteps
}) => {
  const activeSolutions = currentSolutions.filter(s => !s.isPruned);
  const prunedSolutions = exploredSolutions.filter(s => s.isPruned);
  const allSolutions = [...exploredSolutions, ...currentSolutions];

  return (
    <div className="h-full bg-slate-800 border-l border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-2">Branch & Bound Explorer</h2>
        <div className="flex items-center gap-4 text-sm text-slate-300">
          <span>Step {currentStep} / {totalSteps}</span>
          <div className="w-24 bg-slate-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Best Solution */}
      {bestSolution && (
        <div className="p-4 border-b border-slate-700 bg-emerald-900/20">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-medium">Best Solution</span>
          </div>
          <div className="text-sm text-white mb-1">
            Path: {bestSolution.path.join(' → ')}
          </div>
          <div className="text-lg font-bold text-emerald-300">
            Cost: {bestSolution.cost.toFixed(1)}
          </div>
        </div>
      )}

      {/* State Space Tree */}
      <div className="flex-1 overflow-hidden">
        <StateSpaceTree
          solutions={allSolutions}
          bestSolution={bestSolution}
          currentStep={currentStep}
        />
      </div>

      {/* Active Queue */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <TreePine className="w-4 h-4 text-blue-400" />
          <span className="text-blue-400 font-medium">Active Queue ({activeSolutions.length})</span>
        </div>
        
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {activeSolutions
            .sort((a, b) => a.lowerBound - b.lowerBound)
            .slice(0, 4)
            .map((solution) => (
            <motion.div
              key={solution.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-slate-700/60 rounded p-2 border border-slate-600"
            >
              <div className="text-xs text-slate-300 mb-1">
                {solution.path.join(' → ')}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-300">
                  Cost: {solution.cost.toFixed(1)}
                </span>
                <span className="text-blue-300">
                  Bound: {solution.lowerBound.toFixed(1)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="p-4 border-t border-slate-700 bg-slate-900/50">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-slate-400 mb-1">Explored</div>
            <div className="text-white font-medium">{exploredSolutions.length}</div>
          </div>
          <div>
            <div className="text-slate-400 mb-1">Pruned</div>
            <div className="text-red-300 font-medium">{prunedSolutions.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};