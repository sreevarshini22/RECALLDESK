import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  ShieldAlert,
  Database
} from 'lucide-react';

export interface TimelineNode {
  id: string;
  stepNumber: number;
  label: string;
  sublabel: string;
  status: 'completed' | 'active' | 'future' | 'warning';
  category: 'History' | 'Storage' | 'Retrieval' | 'Reasoning' | 'Evolution';
  details: {
    event: string;
    evidence: string;
    agentInternalState: string;
    memoryPayload?: Record<string, any>;
  };
}

const TIMELINE_DATA: TimelineNode[] = [
  {
    id: 'first_interaction',
    stepNumber: 1,
    label: 'First Interaction',
    sublabel: 'Problem detected',
    status: 'completed',
    category: 'History',
    details: {
      event: 'Customer reports: "My internet disconnects every evening around 8 PM."',
      evidence: 'Router: X200 (Firmware 2.1.0). High evening 2.4GHz interference.',
      agentInternalState: 'Initial triage: Discovery mode without prior memories.',
      memoryPayload: { router: 'X200', issue: 'Evening dropouts' }
    }
  },
  {
    id: 'actions_attempted',
    stepNumber: 2,
    label: 'Actions Attempted',
    sublabel: 'Reboot vs Channel Change',
    status: 'completed',
    category: 'History',
    details: {
      event: 'Step 1: Restart Router -> FAILED. Step 2: Switch Wi-Fi Channel to 11 -> SUCCESS.',
      evidence: 'Reboot did not alleviate neighbor AP congestion; Channel 11 isolated signal.',
      agentInternalState: 'Tracking action outcomes and customer preferences for concise instructions.',
      memoryPayload: { failed: ['Restart router'], success: ['Change Wi-Fi channel to 11'] }
    }
  },
  {
    id: 'memory_created',
    stepNumber: 3,
    label: 'Memory Created',
    sublabel: 'Structured Memory Archive',
    status: 'completed',
    category: 'Storage',
    details: {
      event: 'Memory Extraction Engine analyzes resolved case and creates structured memories.',
      evidence: 'Distills OUTCOME, EPISODIC, PREFERENCE, ENVIRONMENT, and SEMANTIC records.',
      agentInternalState: 'Memories committed to database with confidence scores and environment tags.',
      memoryPayload: {
        outcome: 'Restart router FAILED; Channel 11 SUCCESS',
        preference: 'Concise step-by-step instructions',
        environment: 'Router X200, Firmware 2.1.0'
      }
    }
  },
  {
    id: 'time_passes',
    stepNumber: 4,
    label: 'Time Passes',
    sublabel: 'Customer profile persists',
    status: 'completed',
    category: 'Storage',
    details: {
      event: 'Days elapse. The structured memories remain indexed in RECALLDESK memory archive.',
      evidence: 'Recency decay algorithm tracks freshness while maintaining high importance.',
      agentInternalState: 'Customer profile ready for instant retrieval on future tickets.',
      memoryPayload: { indexed_records: 5, status: 'PERSISTED' }
    }
  },
  {
    id: 'customer_returns',
    stepNumber: 5,
    label: 'Customer Returns',
    sublabel: '"Disconnecting again"',
    status: 'active',
    category: 'Retrieval',
    details: {
      event: 'Customer returns: "My internet is disconnecting again. Yesterday I upgraded my router to X300."',
      evidence: 'Similar problem signature triggers similarity search against prior memories.',
      agentInternalState: 'Retrieving top memories: OUTCOME, EPISODIC, PREFERENCE, ENVIRONMENT.',
      memoryPayload: { query: 'internet disconnecting again', retrieved_count: 5 }
    }
  },
  {
    id: 'memory_retrieved',
    stepNumber: 6,
    label: 'Memory Retrieved',
    sublabel: 'Avoid failures & load preferences',
    status: 'active',
    category: 'Retrieval',
    details: {
      event: 'System identifies previous failed router restart and previous channel fix.',
      evidence: 'Confidence 0.95. Rule enforced: DO NOT suggest rebooting router.',
      agentInternalState: 'Hindsight synthesized: Skip basic reboots; load concise format preference.',
      memoryPayload: { avoided_actions: ['Restart router'], tone_preference: 'Concise' }
    }
  },
  {
    id: 'environment_compared',
    stepNumber: 7,
    label: 'Environment Diff',
    sublabel: 'Router X200 → Router X300',
    status: 'warning',
    category: 'Reasoning',
    details: {
      event: 'Environment Comparison Engine detects hardware upgrade: Router X200 -> Router X300.',
      evidence: 'X300 uses SmartConnect band steering, not standard fixed-channel 2.4GHz.',
      agentInternalState: 'CRITICAL ALERT: Same problem != same environment. Do NOT blindly assume Channel 11 applies to X300.',
      memoryPayload: { previous_router: 'X200', current_router: 'X300', diff_warning: 'SmartConnect Band Steering active' }
    }
  },
  {
    id: 'adaptive_response',
    stepNumber: 8,
    label: 'Adaptive Response',
    sublabel: 'Hindsight Synthesis',
    status: 'active',
    category: 'Reasoning',
    details: {
      event: 'Agent combines: Old Experience (no reboots) + New Hardware (X300) + Concise Preference.',
      evidence: 'Instructs customer to separate SSIDs and disable SmartConnect on X300.',
      agentInternalState: 'Synthesized grounded solution tailored to the new environment.',
      memoryPayload: { suggested_action: 'Disable SmartConnect / Separate SSIDs on X300' }
    }
  },
  {
    id: 'new_outcome_updated',
    stepNumber: 9,
    label: 'Outcome Ingested',
    sublabel: 'Continuous Learning',
    status: 'completed',
    category: 'Evolution',
    details: {
      event: 'Customer applies SSID separation: "That fixed it!" Case resolved in 2 turns.',
      evidence: 'New X300 OUTCOME memory created; prior memory utility rewarded with +5% confidence.',
      agentInternalState: 'System is permanently smarter for all future X300 and customer interactions.',
      memoryPayload: {
        new_memory: 'X300 evening dropouts resolved by disabling SmartConnect',
        feedback: 'HELPED_RESOLVE (+5% confidence)'
      }
    }
  }
];

interface HindsightTimelineProps {
  activeStep?: number;
  onSelectNode?: (node: TimelineNode) => void;
}

export const HindsightTimeline: React.FC<HindsightTimelineProps> = ({
  activeStep = 7,
  onSelectNode
}) => {
  const [selectedNode, setSelectedNode] = useState<TimelineNode>(TIMELINE_DATA[activeStep - 1] || TIMELINE_DATA[0]);

  const handleNodeClick = (node: TimelineNode) => {
    setSelectedNode(node);
    if (onSelectNode) onSelectNode(node);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-xl border border-[#3A3631] bg-[#242220]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C86B3C]" />
              <h2 className="text-base sm:text-lg font-bold text-[#E9DFC8] tracking-tight">
                The Hindsight Memory Lifecycle
              </h2>
            </div>
            <p className="text-xs text-[#817A71] mt-1 max-w-2xl">
              Visualizing how RecallDesk transforms past interactions into structured outcome memories, compares environment shifts, and adapts in real time.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-[#E9DFC8]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8BA58A]" />
              Verified Fix
            </span>
            <span className="flex items-center gap-1.5 text-[#E9DFC8]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C95F55]" />
              Failed Action
            </span>
            <span className="flex items-center gap-1.5 text-[#E9DFC8]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D99A4E]" />
              Env Diff
            </span>
          </div>
        </div>
      </div>

      {/* Visual Timeline Grid / Flow */}
      <div className="p-6 rounded-xl border border-[#3A3631] bg-[#242220]">
        <div className="relative">
          
          {/* Memory Thread Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-4 right-4 h-[2px] bg-[#3A3631] -translate-y-1/2 z-0">
            <div className="h-full bg-gradient-to-r from-[#5FA7A0] via-[#C86B3C] to-[#8BA58A] opacity-60" />
          </div>

          {/* Nodes list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-3 relative z-10">
            {TIMELINE_DATA.map((node) => {
              const isSelected = selectedNode.id === node.id;
              const isWarning = node.status === 'warning';
              const isNodeActive = node.stepNumber === activeStep;

              return (
                <button
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  className={`relative flex flex-col items-center text-center p-3 rounded-lg border transition-all duration-200 group ${
                    isSelected
                      ? 'bg-[#2D2A27] border-[#C86B3C] shadow-lg scale-105'
                      : isWarning
                      ? 'bg-[#2D2A27] border-[#D99A4E]/60 hover:border-[#D99A4E]'
                      : 'bg-[#171615] border-[#3A3631] hover:border-[#817A71]'
                  }`}
                >
                  {/* Step Indicator Badge */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold mb-2 transition-transform group-hover:scale-110 ${
                      isWarning
                        ? 'bg-[#D99A4E] text-[#171615]'
                        : isNodeActive
                        ? 'bg-[#C86B3C] text-[#171615]'
                        : isSelected
                        ? 'bg-[#5FA7A0] text-[#171615]'
                        : 'bg-[#242220] text-[#B8B1A5] border border-[#3A3631]'
                    }`}
                  >
                    {isWarning ? <ShieldAlert className="w-3.5 h-3.5" /> : node.stepNumber}
                  </div>

                  <span className="text-xs font-bold text-[#E9DFC8] line-clamp-1">
                    {node.label}
                  </span>
                  <span className="text-[10px] text-[#817A71] mt-0.5 line-clamp-1 font-mono">
                    {node.sublabel}
                  </span>

                  {/* Active node indicator */}
                  {isNodeActive && (
                    <span className="absolute -bottom-1 w-2 h-2 rounded-full bg-[#C86B3C] animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Node Inspector Details Card */}
      {selectedNode && (
        <div className="p-6 rounded-xl bg-[#242220] border border-[#3A3631] shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 relative z-10">
            {/* Left: Summary */}
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase bg-[#171615] text-[#5FA7A0] border border-[#3A3631]">
                  Stage {selectedNode.stepNumber}: {selectedNode.category}
                </span>
                <h3 className="text-lg font-bold text-[#E9DFC8]">
                  {selectedNode.label}
                </h3>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-[#171615] border border-[#3A3631]">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#817A71] mb-1">
                    Event Logged
                  </div>
                  <p className="text-sm text-[#E9DFC8] font-medium">
                    {selectedNode.details.event}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#171615] border border-[#3A3631]">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#5FA7A0] mb-1">
                    Hindsight Evidence & Analysis
                  </div>
                  <p className="text-xs text-[#B8B1A5] leading-relaxed">
                    {selectedNode.details.evidence}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#171615] border border-[#3A3631]">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#C86B3C] mb-1">
                    Agent Internal Reasoning State
                  </div>
                  <p className="text-xs text-[#E9DFC8] leading-relaxed font-mono">
                    {selectedNode.details.agentInternalState}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Memory Structured JSON Snapshot */}
            {selectedNode.details.memoryPayload && (
              <div className="w-full lg:w-96 p-4 rounded-lg bg-[#171615] border border-[#3A3631]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-[#5FA7A0]" />
                    <span className="text-xs font-bold text-[#E9DFC8] font-mono uppercase">
                      Structured Memory Record
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8BA58A] font-mono">
                    Indexed
                  </span>
                </div>

                <pre className="text-[11px] font-mono text-[#5FA7A0] bg-[#242220] p-3 rounded overflow-x-auto max-h-56 leading-relaxed border border-[#3A3631]">
                  {JSON.stringify(selectedNode.details.memoryPayload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
