import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Settings, Zap, Clock, Cpu, Grid3X3, Eye, Navigation } from 'lucide-react';

interface ControlPanelProps {
  selectedCount: number;
  isRunning: boolean;
  isComplete: boolean;
  canSolve: boolean;
  animationSpeed: number;
  onSolve: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onShowMatrix: () => void;
  onToggleWeights: () => void;
  onSimulate: () => void;
  showWeights: boolean;
  hasSource: boolean;
  isSimulating: boolean;
  complexity: {
    timeComplexity: string;
    spaceComplexity: string;
    estimatedOps: number;
  };
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedCount,
  isRunning,
  isComplete,
  canSolve,
  animationSpeed,
  onSolve,
  onReset,
  onSpeedChange,
  onShowMatrix,
  onToggleWeights,
  onSimulate,
  showWeights,
  hasSource,
  isSimulating,
  complexity
}) => {
  return (
    <div className="bg-slate-800 border-t border-slate-700 p-4">
      <div className="flex items-center justify-between gap-4">
        {/* Main Controls */}
        <div className="flex items-center gap-3">
          <motion.button
            onClick={onSolve}
            disabled={!canSolve || isRunning || !hasSource}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
              ${canSolve && !isRunning && hasSource
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }
            `}
            whileHover={canSolve && !isRunning && hasSource ? { scale: 1.02 } : {}}
            whileTap={canSolve && !isRunning && hasSource ? { scale: 0.98 } : {}}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isRunning ? 'Running...' : 'Solve TSP'}
          </motion.button>

          {isComplete && !isSimulating && (
            <motion.button
              onClick={onSimulate}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Navigation className="w-4 h-4" />
              Simulate Journey
            </motion.button>
          )}

          <motion.button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-slate-700 hover:bg-slate-600 text-white transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </motion.button>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-3">
          {selectedCount >= 2 && (
            <>
              <motion.button
                onClick={onShowMatrix}
                className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium bg-slate-700 hover:bg-slate-600 text-white transition-colors text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Grid3X3 className="w-4 h-4" />
                Matrix
              </motion.button>

              <motion.button
                onClick={onToggleWeights}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors text-sm
                  ${showWeights 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Eye className="w-4 h-4" />
                Weights
              </motion.button>
            </>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <Settings className="w-4 h-4" />
            <span>Nodes: {selectedCount}</span>
          </div>

          {/* Animation Speed */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 text-xs">Speed:</span>
            <div className="flex items-center gap-1">
              {[0.5, 1, 2, 4].map(speed => (
                <button
                  key={speed}
                  onClick={() => onSpeedChange(speed)}
                  className={`
                    px-2 py-1 text-xs rounded transition-colors
                    ${animationSpeed === speed
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }
                  `}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Complexity Info */}
          <div className="flex items-center gap-3 text-xs text-slate-400 border-l border-slate-600 pl-4">
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              <span>Time: {complexity.timeComplexity}</span>
            </div>
            <div>Space: {complexity.spaceComplexity}</div>
            {complexity.estimatedOps > 0 && (
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="text-amber-300">
                  ~{complexity.estimatedOps.toLocaleString()} ops
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-3 text-xs text-slate-400 border-t border-slate-700 pt-3">
        {selectedCount === 0 && (
          <span>🖱️ Click nodes in the graph to select cities for the TSP problem</span>
        )}
        {selectedCount > 0 && selectedCount < 4 && (
          <span>Select at least 4 nodes to create an interesting TSP problem</span>
        )}
        {selectedCount >= 4 && !hasSource && !isRunning && !isComplete && (
          <span>📍 Select a starting city from the panel above to begin</span>
        )}
        {selectedCount >= 4 && hasSource && !isRunning && !isComplete && (
          <span>✨ Ready to solve! Click "Solve TSP" to watch the Branch & Bound algorithm in action</span>
        )}
        {isRunning && (
          <span>🧠 Algorithm is exploring the solution space using Branch & Bound...</span>
        )}
        {isComplete && !isSimulating && (
          <span>🎉 Solution found! Click "Simulate Journey" to watch the traveling salesman's route</span>
        )}
        {isSimulating && (
          <span>🚶 Watching the traveling salesman journey through the optimal path...</span>
        )}
      </div>
    </div>
  );
};