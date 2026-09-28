import React, { useState } from 'react';
import {
  Brain,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Layers,
  ArrowRight,
  Ban,
  Clock,
  Zap,
  Search,
  Download,
  ArrowUpDown,
  GitBranch,
  Sliders
} from 'lucide-react';
import { Memory, MemoryWithRelevance, MemoryType, EnvironmentDiff, HindsightContext, Customer } from '../types';

interface HindsightMemoryColProps {
  memories: MemoryWithRelevance[];
  allCustomerMemories: Memory[];
  hindsightContext?: HindsightContext;
  currentEnvironment?: Record<string, any>;
  currentCustomer?: Customer | null;
  onFeedback: (memoryId: string, wasUseful: boolean) => void;
}

export const HindsightMemoryCol: React.FC<HindsightMemoryColProps> = ({
  memories = [],
  allCustomerMemories = [],
  hindsightContext,
  currentEnvironment = {},
  currentCustomer,
  onFeedback
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'relevance' | 'confidence' | 'recent'>('relevance');
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({});

  const displayMemories = memories.length > 0 ? memories : (allCustomerMemories as MemoryWithRelevance[]);

  // Apply search query and category filters
  let filteredMemories = displayMemories.filter((m) => {
    const matchesCategory = activeFilter === 'ALL' || m.memory_type === activeFilter;
    const matchesSearch = !searchQuery.trim() ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.memory_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.metadata_json && JSON.stringify(m.metadata_json).toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Apply sorting
  filteredMemories = [...filteredMemories].sort((a, b) => {
    if (sortBy === 'confidence') {
      return (b.confidence || 0.8) - (a.confidence || 0.8);
    } else if (sortBy === 'recent') {
      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    } else {
      return (b.relevance_score || b.importance || 0.8) - (a.relevance_score || a.importance || 0.8);
    }
  });

  const envDiff = hindsightContext?.environment_diff;
  const isEnvChanged = envDiff?.changed;

  // Extract customer-specific failed actions and proven paths
  const failedAvoided = hindsightContext?.previous_failed_actions?.length
    ? hindsightContext.previous_failed_actions
    : allCustomerMemories
        .filter((m) => m.memory_type === 'OUTCOME')
        .flatMap((m) => m.metadata_json?.failed_actions || []);

  const successfulPaths = hindsightContext?.previous_successful_solutions?.length
    ? hindsightContext.previous_successful_solutions
    : allCustomerMemories
        .filter((m) => m.memory_type === 'OUTCOME')
        .flatMap((m) => m.metadata_json?.successful_actions || []);

  const handleFeedbackClick = (memId: string, useful: boolean) => {
    setFeedbackGiven((prev) => ({ ...prev, [memId]: true }));
    onFeedback(memId, useful);
  };

  // Export Portable Customer Runbook as Markdown
  const handleExportRunbook = () => {
    const custName = currentCustomer?.name || 'Customer';
    const lines = [
      `# RecallDesk Operational Runbook`,
      `**Customer Archive:** ${custName} (${currentCustomer?.email || 'N/A'})`,
      `**Exported:** ${new Date().toLocaleString()}`,
      `**Hardware Environment:**`,
      '```json',
      JSON.stringify(currentEnvironment, null, 2),
      '```',
      '',
      `## 1. Verified Working Solutions (Proven Paths)`,
      successfulPaths.length > 0
        ? successfulPaths.map((p) => `- [x] **Verified Fix:** ${p}`).join('\n')
        : '- *No verified fixes recorded yet.*',
      '',
      `## 2. Known Failures (Mistakes Avoided)`,
      failedAvoided.length > 0
        ? failedAvoided.map((f) => `- [ ] ✕ **Do Not Repeat:** ${f}`).join('\n')
        : '- *No failed attempts recorded yet.*',
      '',
      `## 3. Indexed Hindsight Memories (${allCustomerMemories.length} Nodes)`,
      ...allCustomerMemories.map((m, idx) => {
        return `### Memory #${idx + 1} [${m.memory_type}] (Confidence: ${Math.round((m.confidence || 0.85) * 100)}%)\n${m.content}\n`;
      })
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${custName.replace(/\s+/g, '_')}_RecallDesk_Runbook.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Memory Category Indicator Tag Generator
  const getCategoryTag = (type: MemoryType | string) => {
    switch (type) {
      case 'OUTCOME':
        return { label: 'WHAT WORKED / FAILED', color: 'text-[#8BA58A] border-[#8BA58A]/40 bg-[#171615]' };
      case 'PREFERENCE':
        return { label: 'CUSTOMER PREFERENCE', color: 'text-[#C86B3C] border-[#C86B3C]/40 bg-[#171615]' };
      case 'ENVIRONMENT':
        return { label: 'WHAT CHANGED', color: 'text-[#D99A4E] border-[#D99A4E]/40 bg-[#171615]' };
      case 'EPISODIC':
        return { label: 'WHAT HAPPENED BEFORE', color: 'text-[#5FA7A0] border-[#5FA7A0]/40 bg-[#171615]' };
      case 'SEMANTIC':
        return { label: 'DOMAIN PRINCIPLE', color: 'text-[#E9DFC8] border-[#3A3631] bg-[#171615]' };
      default:
        return { label: String(type), color: 'text-[#B8B1A5] border-[#3A3631] bg-[#171615]' };
    }
  };

  // ZERO MEMORY / EMPTY STATE
  if (displayMemories.length === 0) {
    return (
      <div className="flex flex-col h-full bg-[#242220] rounded-xl border border-[#3A3631] overflow-hidden">
        <div className="p-4 border-b border-[#3A3631] bg-[#242220] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2D2A27] border border-[#3A3631] flex items-center justify-center">
              <Brain className="w-4 h-4 text-[#5FA7A0]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#E9DFC8] font-mono uppercase tracking-wider">
                Hindsight Memory
              </h3>
              <p className="text-[11px] text-[#817A71]">
                Memory Archive Engine
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[#817A71] border border-[#3A3631] bg-[#171615]">
            0 Records
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#2D2A27] border border-[#3A3631] flex items-center justify-center">
            <Brain className="w-6 h-6 text-[#817A71]" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h4 className="text-sm font-bold text-[#E9DFC8]">
              Clean Customer Record
            </h4>
            <p className="text-xs text-[#B8B1A5] leading-relaxed">
              No previous support history recorded. RecallDesk will index verified outcome memories as cases are resolved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#242220] rounded-xl border border-[#3A3631] overflow-hidden">
      
      {/* 1. Header (Ivory Typography) */}
      <div className="p-4 border-b border-[#3A3631] bg-[#242220] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2D2A27] border border-[#3A3631] flex items-center justify-center">
            <Brain className="w-4 h-4 text-[#5FA7A0]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#E9DFC8] font-mono uppercase tracking-wider">
                HINDSIGHT MEMORY
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[#5FA7A0] bg-[#171615] border border-[#3A3631]">
                {displayMemories.length} Indexed
              </span>
            </div>
            <p className="text-[11px] text-[#817A71]">
              Operational knowledge archive for active customer session
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportRunbook}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2D2A27] hover:bg-[#35322F] border border-[#3A3631] text-[#E9DFC8] text-xs font-mono transition-colors cursor-pointer"
          title="Export Runbook"
        >
          <Download className="w-3.5 h-3.5 text-[#C86B3C]" />
          <span className="hidden sm:inline">Export Runbook</span>
        </button>
      </div>

      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* 2. ENVIRONMENT COMPARISON CARD ("Same problem != same environment") */}
        {isEnvChanged ? (
          <div className="p-3.5 rounded-lg border border-[#D99A4E]/60 bg-[#2D2A27] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-bold text-[#D99A4E] bg-[#171615] px-2 py-0.5 rounded border border-[#D99A4E]/40">
                  WHAT CHANGED
                </span>
                <span className="text-xs font-bold text-[#E9DFC8]">
                  Environment Shift Detected
                </span>
              </div>
              <span className="text-[10px] text-[#D99A4E] font-mono">
                Adaptive Reasoning Guard Active
              </span>
            </div>

            {/* Before vs Now Diff Block */}
            <div className="grid grid-cols-2 gap-2 bg-[#171615] p-2.5 rounded border border-[#3A3631] text-xs font-mono">
              <div className="space-y-1 border-r border-[#3A3631] pr-2">
                <span className="text-[10px] text-[#817A71] block uppercase">BEFORE (Historical Baseline)</span>
                {Object.entries(envDiff.differences).map(([k, diff]) => (
                  <div key={k} className="text-[#B8B1A5] text-[11px] truncate">
                    <span className="text-[#817A71]">{k}:</span> {String(diff.previous)}
                  </div>
                ))}
              </div>
              <div className="space-y-1 pl-2">
                <span className="text-[10px] text-[#D99A4E] block uppercase font-bold">NOW (Current Profile)</span>
                {Object.entries(envDiff.differences).map(([k, diff]) => (
                  <div key={k} className="text-[#E9DFC8] text-[11px] truncate font-bold">
                    <span className="text-[#D99A4E]">{k}:</span> {String(diff.current)}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-[#B8B1A5] leading-relaxed bg-[#171615] p-2 rounded border border-[#3A3631]">
              <strong className="text-[#E9DFC8]">Memory Protocol:</strong> "Same symptom ≠ same environment. The previous successful solution is evaluated as context, but blind repetition is avoided."
            </p>
          </div>
        ) : (
          <div className="p-2.5 rounded-lg border border-[#3A3631] bg-[#2D2A27] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#8BA58A]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Environment Match: Profile parameters match historical baseline.</span>
            </div>
            <span className="text-[10px] text-[#5FA7A0] font-mono">Direct Continuity</span>
          </div>
        )}

        {/* 3. PROVEN PATHS & MISTAKES AVOIDED (Muted Sage & Muted Coral) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          
          {/* What Worked (Sage) */}
          <div className="p-3 rounded-lg bg-[#2D2A27] border border-[#3A3631] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#8BA58A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8BA58A]" />
              <span>WHAT WORKED (PROVEN)</span>
            </div>
            {successfulPaths.length === 0 ? (
              <p className="text-[11px] text-[#817A71] italic">No verified solutions recorded yet</p>
            ) : (
              <ul className="space-y-1 text-[11px] text-[#E9DFC8]">
                {successfulPaths.map((act, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-[#8BA58A] font-bold shrink-0">✓</span>
                    <span className="line-clamp-2">{act}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* What Failed (Coral) */}
          <div className="p-3 rounded-lg bg-[#2D2A27] border border-[#3A3631] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#C95F55]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C95F55]" />
              <span>WHAT FAILED (AVOID)</span>
            </div>
            {failedAvoided.length === 0 ? (
              <p className="text-[11px] text-[#817A71] italic">No failed attempts recorded</p>
            ) : (
              <ul className="space-y-1 text-[11px] text-[#B8B1A5]">
                {failedAvoided.map((act, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-[#C95F55] font-bold shrink-0">✕</span>
                    <span className="line-clamp-2">Bypass: {act}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>

        {/* 4. MEMORY THREAD REASONING SUMMARY */}
        <div className="p-3.5 rounded-lg bg-[#2D2A27] border border-[#3A3631] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#C86B3C]" />
              <span className="text-xs font-mono font-bold text-[#E9DFC8] uppercase tracking-wider">
                Hindsight Reasoning Summary
              </span>
            </div>
            <span className="text-[10px] text-[#5FA7A0] font-mono">Memory Thread Active</span>
          </div>

          <div className="p-2.5 rounded bg-[#171615] border border-[#3A3631] text-xs text-[#B8B1A5] space-y-1.5 leading-relaxed">
            <p className="text-[#E9DFC8]">
              {hindsightContext?.reasoning_summary || 'Historical support experience retrieved and mapped to current case context.'}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-[#817A71] pt-1 border-t border-[#3A3631]">
              <span className="text-[#8BA58A]">● Proven solutions prioritized</span>
              <span className="text-[#C95F55]">● Ineffective actions skipped</span>
              <span className="text-[#5FA7A0]">● Continuous learning loop</span>
            </div>
          </div>
        </div>

        {/* 5. SEARCH, SORT & CATEGORY FILTER TABS */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#817A71] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search archived customer memory..."
                className="w-full bg-[#171615] border border-[#3A3631] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#E9DFC8] placeholder-[#817A71] focus:outline-none focus:border-[#C86B3C] font-mono transition-colors"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#171615] border border-[#3A3631] px-2 py-1.5 rounded-md text-xs text-[#817A71]">
              <ArrowUpDown className="w-3 h-3 text-[#5FA7A0] shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-[#E9DFC8] font-mono text-xs focus:outline-none cursor-pointer pr-1"
              >
                <option value="relevance" className="bg-[#242220]">Relevance</option>
                <option value="confidence" className="bg-[#242220]">Confidence</option>
                <option value="recent" className="bg-[#242220]">Newest</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {[
              { id: 'ALL', label: 'ALL' },
              { id: 'OUTCOME', label: 'OUTCOMES' },
              { id: 'PREFERENCE', label: 'PREFERENCES' },
              { id: 'ENVIRONMENT', label: 'ENVIRONMENT' },
              { id: 'EPISODIC', label: 'EPISODES' }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveFilter(cat.id)}
                className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                  activeFilter === cat.id
                    ? 'bg-[#C86B3C] text-[#171615] font-bold'
                    : 'bg-[#171615] text-[#817A71] hover:text-[#E9DFC8] border border-[#3A3631]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6. STRUCTURED ARCHIVE MEMORY CARDS LIST */}
        <div className="space-y-2.5">
          {filteredMemories.length === 0 ? (
            <div className="p-6 text-center text-[#817A71] text-xs bg-[#171615] rounded-md border border-[#3A3631] font-mono">
              No memory records found matching query "{searchQuery}"
            </div>
          ) : (
            filteredMemories.map((mem, idx) => {
              const confidencePct = Math.round((mem.confidence || 0.85) * 100);
              const relevancePct = Math.round((mem.relevance_score || mem.importance || 0.8) * 100);
              const isFeedbackLogged = feedbackGiven[mem.id];
              const categoryTag = getCategoryTag(mem.memory_type);

              return (
                <div
                  key={mem.id || idx}
                  className="p-3.5 rounded-lg bg-[#2D2A27] border border-[#3A3631] hover:border-[#4D4741] space-y-2 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${categoryTag.color}`}>
                      {categoryTag.label}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#817A71]">
                      <span>Relevance: <strong className="text-[#5FA7A0]">{relevancePct}%</strong></span>
                      <span>•</span>
                      <span>Confidence: <strong className="text-[#8BA58A]">{confidencePct}%</strong></span>
                    </div>
                  </div>

                  <p className="text-xs text-[#E9DFC8] leading-relaxed whitespace-pre-line">
                    {mem.content}
                  </p>

                  {mem.metadata_json && Object.keys(mem.metadata_json).length > 0 && (
                    <div className="bg-[#171615] p-2 rounded border border-[#3A3631] text-[10px] font-mono text-[#817A71] space-y-0.5">
                      {mem.metadata_json.successful_actions && (
                        <div className="text-[#8BA58A] truncate">
                          <strong>✓ Working Fix:</strong> {mem.metadata_json.successful_actions.join(', ')}
                        </div>
                      )}
                      {mem.metadata_json.failed_actions && (
                        <div className="text-[#C95F55] truncate">
                          <strong>✕ Ineffective Attempt:</strong> {mem.metadata_json.failed_actions.join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Operational Feedback Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#3A3631] text-[11px]">
                    <span className="text-[10px] text-[#817A71] font-mono">
                      Feedback verification:
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleFeedbackClick(mem.id, true)}
                        disabled={isFeedbackLogged}
                        className={`p-1 rounded hover:bg-[#171615] text-[#817A71] hover:text-[#8BA58A] transition-colors cursor-pointer ${
                          isFeedbackLogged ? 'text-[#8BA58A]' : ''
                        }`}
                        title="Mark as Helpful (+Confidence)"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFeedbackClick(mem.id, false)}
                        disabled={isFeedbackLogged}
                        className={`p-1 rounded hover:bg-[#171615] text-[#817A71] hover:text-[#C95F55] transition-colors cursor-pointer ${
                          isFeedbackLogged ? 'text-[#C95F55]' : ''
                        }`}
                        title="Mark as Outdated (-Confidence)"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
};
