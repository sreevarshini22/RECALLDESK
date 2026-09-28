import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Brain,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DemoStep } from '../types';

interface InteractiveDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: DemoStep[];
  onExecuteFullDemo: () => Promise<void>;
  onApplyStepToWorkspace?: (stepNumber: number) => void;
}

export const InteractiveDemoModal: React.FC<InteractiveDemoModalProps> = ({
  isOpen,
  onClose,
  steps,
  onExecuteFullDemo,
  onApplyStepToWorkspace,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const currentStep = steps[currentStepIndex] || steps[0];

  useEffect(() => {
    let timer: any;
    if (isPlaying && currentStepIndex < steps.length - 1) {
      timer = setTimeout(() => {
        setCurrentStepIndex((prev) => {
          const next = prev + 1;
          if (next === 7 || next === 8) {
            triggerConfetti();
          }
          if (onApplyStepToWorkspace) onApplyStepToWorkspace(next + 1);
          return next;
        });
      }, 3500);
    } else if (isPlaying && currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps.length]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#C86B3C', '#5FA7A0', '#8BA58A', '#E9DFC8']
    });
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      const next = currentStepIndex + 1;
      setCurrentStepIndex(next);
      if (next === 7 || next === 8) triggerConfetti();
      if (onApplyStepToWorkspace) onApplyStepToWorkspace(next + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prev = currentStepIndex - 1;
      setCurrentStepIndex(prev);
      if (onApplyStepToWorkspace) onApplyStepToWorkspace(prev + 1);
    }
  };

  const handleRunAll = async () => {
    setIsExecuting(true);
    try {
      await onExecuteFullDemo();
      setCurrentStepIndex(steps.length - 1);
      triggerConfetti();
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171615]/85 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#242220] border border-[#3A3631] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Top Bar */}
        <div className="p-5 border-b border-[#3A3631] bg-[#171615] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#2D2A27] border border-[#3A3631]">
              <Sparkles className="w-5 h-5 text-[#C86B3C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#E9DFC8] tracking-tight">
                  Hindsight Memory: 9-Stage Operational Lifecycle
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#2D2A27] text-[#5FA7A0] border border-[#3A3631]">
                  Stage {currentStepIndex + 1} of {steps.length}
                </span>
              </div>
              <p className="text-xs text-[#817A71]">
                Interactive execution of cross-session learning, error avoidance, and environment shift adaptation.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#2D2A27] border border-[#3A3631] text-[#817A71] hover:text-[#E9DFC8] hover:border-[#817A71] transition-all"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar & Stepper */}
        <div className="px-6 py-3 bg-[#1F1E1C] border-b border-[#3A3631]">
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
            {steps.map((s, idx) => {
              const isCurrent = idx === currentStepIndex;
              const isDone = idx < currentStepIndex;
              return (
                <button
                  key={s.step_number}
                  onClick={() => {
                    setCurrentStepIndex(idx);
                    if (onApplyStepToWorkspace) onApplyStepToWorkspace(idx + 1);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium whitespace-nowrap transition-all border ${
                    isCurrent
                      ? 'bg-[#C86B3C] text-[#171615] border-[#C86B3C] font-bold shadow-sm'
                      : isDone
                      ? 'bg-[#2D2A27] text-[#8BA58A] border-[#3A3631]'
                      : 'bg-[#171615] text-[#817A71] border-[#3A3631] hover:text-[#B8B1A5]'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent ? 'bg-[#171615] text-[#C86B3C]' : isDone ? 'bg-[#171615] text-[#8BA58A]' : 'bg-[#242220] text-[#817A71]'
                  }`}>
                    {isDone ? '✓' : s.step_number}
                  </span>
                  <span className="hidden sm:inline font-sans">{s.title.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Step Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-[#242220]">
          {/* Milestone Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#171615] border border-[#3A3631]">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5FA7A0] font-mono">
                Stage {currentStep.step_number} • {currentStep.phase}
              </span>
              <h2 className="text-lg font-bold text-[#E9DFC8] mt-0.5">
                {currentStep.title}
              </h2>
            </div>
            <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-[#2D2A27] text-[#B8B1A5] border border-[#3A3631]">
              {currentStep.timeline_node}
            </span>
          </div>

          {/* Description */}
          <div className="p-4 rounded-xl bg-[#2D2A27] border border-[#3A3631] text-sm text-[#B8B1A5] leading-relaxed">
            {currentStep.description}
          </div>

          {/* Detailed Breakdown Card */}
          <div className="p-4 rounded-xl bg-[#171615] border border-[#3A3631] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#E9DFC8] font-mono uppercase tracking-wider">
              <Brain className="w-4 h-4 text-[#5FA7A0]" />
              <span>Hindsight Engine State & Structured Data</span>
            </div>

            <div className="space-y-2">
              {Object.entries(currentStep.details).map(([key, value], idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[#242220] border border-[#3A3631] flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-xs"
                >
                  <span className="font-semibold text-[#5FA7A0] uppercase tracking-wider text-[11px] font-mono sm:w-48 shrink-0">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <div className="text-[#E9DFC8] font-medium flex-1">
                    {typeof value === 'object' ? (
                      <pre className="text-[11px] font-mono text-[#E9DFC8] bg-[#171615] p-2.5 rounded border border-[#3A3631] overflow-x-auto">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      <span>{String(value)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Controls Footer */}
        <div className="p-4 border-t border-[#3A3631] bg-[#171615] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all border ${
                isPlaying
                  ? 'bg-[#D99A4E] text-[#171615] border-[#D99A4E]'
                  : 'bg-[#242220] text-[#E9DFC8] border-[#3A3631] hover:border-[#817A71]'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Pause' : 'Auto Play'}</span>
            </button>

            <button
              onClick={() => {
                setCurrentStepIndex(0);
                if (onApplyStepToWorkspace) onApplyStepToWorkspace(1);
              }}
              className="p-2 rounded-lg bg-[#242220] border border-[#3A3631] text-[#817A71] hover:text-[#E9DFC8] transition-all text-xs"
              title="Restart from Stage 1"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#242220] border border-[#3A3631] text-[#B8B1A5] hover:text-[#E9DFC8] disabled:opacity-30 text-xs font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>

            <button
              onClick={handleNext}
              disabled={currentStepIndex === steps.length - 1}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[#5FA7A0] text-[#171615] hover:bg-[#72b9b2] disabled:opacity-30 text-xs font-bold"
            >
              <span>Next Stage</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleRunAll}
              disabled={isExecuting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C86B3C] text-[#171615] hover:bg-[#d67a4b] disabled:opacity-40 text-xs font-bold shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isExecuting ? 'Running...' : 'Execute Full Story'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
