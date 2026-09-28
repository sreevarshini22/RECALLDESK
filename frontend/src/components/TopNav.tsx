import React from 'react';
import {
  Brain,
  Sparkles,
  BarChart3,
  RotateCcw,
  BookOpen,
  Activity,
  Layers,
  Zap,
  UserCheck,
  LogOut,
  Scale,
  GitCommit
} from 'lucide-react';
import { Customer } from '../types';

interface TopNavProps {
  onOpenDemo: () => void;
  onOpenAnalytics: () => void;
  onOpenKnowledgeBase: () => void;
  onOpenComparison: () => void;
  onResetDemo: () => void;
  onLogout: () => void;
  isResetting: boolean;
  activeTab: 'support' | 'graph' | 'timeline' | 'analytics';
  setActiveTab: (tab: 'support' | 'graph' | 'timeline' | 'analytics') => void;
  customers: Customer[];
  selectedCustomerId?: string;
  onSelectCustomer: (customerId: string) => void;
  currentCustomer?: Customer | null;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenDemo,
  onOpenAnalytics,
  onOpenKnowledgeBase,
  onOpenComparison,
  onResetDemo,
  onLogout,
  isResetting,
  activeTab,
  setActiveTab,
  customers = [],
  selectedCustomerId,
  onSelectCustomer,
  currentCustomer
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-[#3A3631] bg-[#242220]">
      <div className="max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
        
        {/* Left: Operations Console Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#2D2A27] border border-[#3A3631]">
            <Brain className="w-5 h-5 text-[#C86B3C]" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold tracking-tight text-[#E9DFC8] font-mono">
                RECALLDESK
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded bg-[#171615] text-[#5FA7A0] border border-[#3A3631]">
                MEMORY ARCHIVE
              </span>
            </div>
            <p className="text-[11px] text-[#817A71] hidden sm:block">
              Support that remembers what happened.
            </p>
          </div>
        </div>

        {/* Center: Console View Switcher */}
        <nav className="hidden md:flex items-center p-0.5 rounded-lg bg-[#171615] border border-[#3A3631]">
          <button
            onClick={() => setActiveTab('support')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'support'
                ? 'bg-[#C86B3C] text-[#171615] font-bold shadow-xs'
                : 'text-[#B8B1A5] hover:text-[#E9DFC8] hover:bg-[#242220]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Workspace
          </button>

          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'graph'
                ? 'bg-[#C86B3C] text-[#171615] font-bold shadow-xs'
                : 'text-[#B8B1A5] hover:text-[#E9DFC8] hover:bg-[#242220]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Memory Graph
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-[#C86B3C] text-[#171615] font-bold shadow-xs'
                : 'text-[#B8B1A5] hover:text-[#E9DFC8] hover:bg-[#242220]'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            Lifecycle
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-[#C86B3C] text-[#171615] font-bold shadow-xs'
                : 'text-[#B8B1A5] hover:text-[#E9DFC8] hover:bg-[#242220]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            ROI Telemetry
          </button>
        </nav>

        {/* Right: Controls, Customer Selector & Actions */}
        <div className="flex items-center gap-2">
          {/* Customer Account Selector */}
          <div className="flex items-center gap-1.5 bg-[#171615] border border-[#3A3631] px-2.5 py-1 rounded-md text-xs">
            <UserCheck className="w-3.5 h-3.5 text-[#5FA7A0] shrink-0" />
            <select
              value={selectedCustomerId || currentCustomer?.id || ''}
              onChange={(e) => onSelectCustomer(e.target.value)}
              className="bg-transparent text-[#E9DFC8] font-mono text-xs focus:outline-none cursor-pointer pr-1"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#242220] text-[#E9DFC8]">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Benchmark Compare */}
          <button
            onClick={onOpenComparison}
            className="px-2.5 py-1.5 rounded-md bg-[#2D2A27] hover:bg-[#35322F] border border-[#3A3631] text-[#E9DFC8] transition-colors text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            title="Benchmark Comparison: Standard Bot vs RecallDesk"
          >
            <Scale className="w-3.5 h-3.5 text-[#D99A4E]" />
            <span className="hidden xl:inline">Compare</span>
          </button>

          {/* Diagnostics Sandbox */}
          <button
            onClick={onOpenKnowledgeBase}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-md bg-[#2D2A27] hover:bg-[#35322F] border border-[#3A3631] text-[#B8B1A5] hover:text-[#E9DFC8] transition-colors text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            title="Diagnostics Sandbox"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#5FA7A0]" />
            <span className="hidden sm:inline">Diagnostics</span>
          </button>

          {/* Reset Baseline State */}
          <button
            onClick={onResetDemo}
            disabled={isResetting}
            className="p-1.5 sm:px-2 sm:py-1.5 rounded-md bg-[#2D2A27] hover:bg-[#35322F] border border-[#3A3631] text-[#817A71] hover:text-[#C95F55] transition-colors text-xs disabled:opacity-50 cursor-pointer"
            title="Reset Database Baseline"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-[#C95F55]' : ''}`} />
          </button>

          {/* PRIMARY CTA: Run Hindsight Demo */}
          <button
            onClick={onOpenDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#C86B3C] hover:bg-[#D47A4B] text-[#171615] text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Run Hindsight Demo</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-md bg-[#2D2A27] hover:bg-[#35322F] border border-[#3A3631] text-[#B8B1A5] hover:text-[#C95F55] transition-colors text-xs font-medium flex items-center gap-1 cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>

      </div>
    </header>
  );
};
