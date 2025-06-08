import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PartialSolution, BranchingStep } from '../types/tsp';
import { TreePine, Zap, Target, Scissors } from 'lucide-react';

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

      {/* Active Queue */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <TreePine className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 font-medium">Active Queue ({activeSolutions.length})</span>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <AnimatePresence>
              {activeSolutions
                .sort((a, b) => a.lowerBound - b.lowerBound)
                .slice(0, 8)
                .map((solution) => (
                <motion.div
                  key={solution.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-slate-700/60 rounded-lg p-3 border border-slate-600"
                >
                  <div className="text-xs text-slate-300 mb-1">
                    Level {solution.level}: {solution.path.join(' → ')}
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
            </AnimatePresence>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-4 flex-1 overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-medium">Recent Activity</span>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <AnimatePresence>
              {recentSteps.slice(-10).reverse().map((step, index) => (
                <motion.div
                  key={`${step.timestamp}-${index}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`text-xs p-2 rounded border-l-2 ${getStepStyling(step.action)}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getStepIcon(step.action)}
                    <span className="font-medium capitalize">{step.action}</span>
                  </div>
                  <div className="text-slate-300 leading-relaxed">
                    {step.message}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
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
    </div>
  );
};

function getStepStyling(action: string): string {
  switch (action) {
    case 'explore':
      return 'bg-blue-900/20 border-blue-400 text-blue-100';
    case 'prune':
      return 'bg-red-900/20 border-red-400 text-red-100';
    case 'complete':
      return 'bg-emerald-900/20 border-emerald-400 text-emerald-100';
    case 'bound':
      return 'bg-amber-900/20 border-amber-400 text-amber-100';
    default:
      return 'bg-slate-700/20 border-slate-400 text-slate-100';
  }
}

function getStepIcon(action: string): React.ReactNode {
  switch (action) {
    case 'explore':
      return <TreePine className="w-3 h-3 text-blue-400" />;
    case 'prune':
      return <Scissors className="w-3 h-3 text-red-400" />;
    case 'complete':
      return <Target className="w-3 h-3 text-emerald-400" />;
    case 'bound':
      return <Zap className="w-3 h-3 text-amber-400" />;
    default:
      return <div className="w-3 h-3 rounded-full bg-slate-400" />;
  }
}