import React, { useState } from 'react';
import {
  User,
  Cpu,
  Clock,
  CheckCircle2,
  FileText,
  Activity,
  Layers,
  ChevronRight,
  ShieldCheck,
  Laptop,
  Terminal,
  LogOut,
  Edit3,
  Archive,
  Tag
} from 'lucide-react';
import { Customer, SupportCase } from '../types';

interface CustomerProfileColProps {
  customers: Customer[];
  customer: Customer | null;
  cases: SupportCase[];
  onSelectCustomer: (customerId: string) => void;
  currentEnvironment: Record<string, any>;
  onUpdateEnvironment: (env: Record<string, any>) => void;
  onLogout?: () => void;
}

export const CustomerProfileCol: React.FC<CustomerProfileColProps> = ({
  customers = [],
  customer,
  cases = [],
  onSelectCustomer,
  currentEnvironment,
  onUpdateEnvironment,
  onLogout
}) => {
  const [isEditingEnv, setIsEditingEnv] = useState(false);
  const [customEnvKey, setCustomEnvKey] = useState('');
  const [customEnvVal, setCustomEnvVal] = useState('');

  const envEntries = Object.entries(currentEnvironment || customer?.environment || {});

  const handleAddCustomEnv = () => {
    if (!customEnvKey.trim()) return;
    onUpdateEnvironment({
      ...(currentEnvironment || customer?.environment || {}),
      [customEnvKey.trim()]: customEnvVal.trim()
    });
    setCustomEnvKey('');
    setCustomEnvVal('');
    setIsEditingEnv(false);
  };

  const getPersonaIcon = (name: string = '') => {
    const n = name.toLowerCase();
    if (n.includes('priya')) return <Laptop className="w-4 h-4 text-[#5FA7A0]" />;
    if (n.includes('arjun')) return <Terminal className="w-4 h-4 text-[#8BA58A]" />;
    return <User className="w-4 h-4 text-[#C86B3C]" />;
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      
      {/* 1. Customer Profile Card (Archived Identity) */}
      <div className="bg-[#242220] p-4.5 rounded-xl border border-[#3A3631] space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-[#3A3631]">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#817A71]">
            Customer Profile
          </span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono text-[#8BA58A] bg-[#171615] border border-[#3A3631]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8BA58A]" />
              AUTHENTICATED
            </span>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="text-[11px] text-[#817A71] hover:text-[#C95F55] font-mono transition-colors cursor-pointer"
                title="Sign Out"
              >
                Exit
              </button>
            )}
          </div>
        </div>

        {/* Customer Selector Dropdown */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono font-bold text-[#817A71] uppercase tracking-wider block">
            Customer Archive Record:
          </label>
          <select
            value={customer?.id || ''}
            onChange={(e) => onSelectCustomer(e.target.value)}
            className="w-full bg-[#171615] border border-[#3A3631] rounded-md px-3 py-1.5 text-xs font-mono text-[#E9DFC8] focus:outline-none focus:border-[#C86B3C] cursor-pointer"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#242220] text-[#E9DFC8]">
                {c.name} ({c.email})
              </option>
            ))}
          </select>
        </div>

        {/* Customer Details Box */}
        <div className="p-3 rounded-lg bg-[#2D2A27] border border-[#3A3631] space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#171615] border border-[#3A3631] flex items-center justify-center shrink-0">
              {getPersonaIcon(customer?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-[#E9DFC8] truncate">
                {customer?.name || 'Customer Account'}
              </h4>
              <p className="text-xs text-[#B8B1A5] truncate font-mono">
                {customer?.email || '—'}
              </p>
            </div>
          </div>

          {/* Dynamic Environment Details */}
          <div className="pt-2 border-t border-[#3A3631] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#817A71] flex items-center gap-1.5 font-mono text-[11px]">
                <Cpu className="w-3.5 h-3.5 text-[#5FA7A0]" />
                ENVIRONMENT SPEC:
              </span>
              <button
                type="button"
                onClick={() => setIsEditingEnv(!isEditingEnv)}
                className="text-[10px] text-[#C86B3C] hover:text-[#D47A4B] font-mono cursor-pointer flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                {isEditingEnv ? 'Done' : 'Edit Spec'}
              </button>
            </div>

            {/* Environment Parameters */}
            <div className="space-y-1 bg-[#171615] p-2 rounded border border-[#3A3631] font-mono text-[11px]">
              {envEntries.length === 0 ? (
                <span className="text-[#817A71] italic">No active environment parameters</span>
              ) : (
                envEntries.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-[#817A71] capitalize">{k}:</span>
                    <span className="font-bold text-[#E9DFC8] truncate max-w-[160px] text-right">
                      {String(v)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {isEditingEnv && (
              <div className="p-2 bg-[#171615] rounded border border-[#3A3631] space-y-1.5 mt-2">
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    placeholder="Key (e.g. router)"
                    value={customEnvKey}
                    onChange={(e) => setCustomEnvKey(e.target.value)}
                    className="px-2 py-1 bg-[#242220] border border-[#3A3631] rounded text-xs text-[#E9DFC8] font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. X300)"
                    value={customEnvVal}
                    onChange={(e) => setCustomEnvVal(e.target.value)}
                    className="px-2 py-1 bg-[#242220] border border-[#3A3631] rounded text-xs text-[#E9DFC8] font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomEnv}
                  className="w-full py-1 bg-[#C86B3C] hover:bg-[#D47A4B] text-[#171615] font-bold rounded text-xs transition-colors cursor-pointer"
                >
                  Apply Specification
                </button>
              </div>
            )}
          </div>

          {/* Sentiment & Guard */}
          <div className="pt-2 border-t border-[#3A3631] space-y-1 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#817A71] font-mono">FRUSTRATION GUARD:</span>
              <span className="text-[#8BA58A] font-mono font-bold">ACTIVE (0/10)</span>
            </div>
            <p className="text-[10px] text-[#B8B1A5] leading-tight">
              System bypasses previously failed actions to eliminate repetitive customer friction.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Archived Support Cases List */}
      <div className="bg-[#242220] p-4.5 rounded-xl border border-[#3A3631] flex-1 flex flex-col space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#3A3631]">
          <div className="flex items-center gap-2">
            <Archive className="w-3.5 h-3.5 text-[#5FA7A0]" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#817A71]">
              Case Archive
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#817A71]">
            {cases.length} Records
          </span>
        </div>

        {/* Operational Records Cards */}
        <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
          {cases.length === 0 ? (
            <div className="p-4 text-center text-[#817A71] text-xs bg-[#171615] rounded border border-[#3A3631] font-mono">
              No historical cases recorded.
            </div>
          ) : (
            cases.map((c, idx) => {
              const isResolved = String(c.status).toLowerCase() === 'resolved';
              return (
                <div
                  key={c.id || idx}
                  className="p-3 rounded-lg bg-[#2D2A27] border border-[#3A3631] space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="font-bold text-[#E9DFC8]">
                      CASE #RD-{1000 + idx + 1}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase ${
                        isResolved
                          ? 'text-[#8BA58A] bg-[#171615] border border-[#8BA58A]/40'
                          : 'text-[#D99A4E] bg-[#171615] border border-[#D99A4E]/40'
                      }`}
                    >
                      ● {c.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#E9DFC8] leading-snug line-clamp-2">
                    "{c.problem}"
                  </p>

                  {c.resolution && (
                    <div className="pt-1.5 border-t border-[#3A3631] text-[11px] text-[#8BA58A] flex items-start gap-1">
                      <span className="font-bold">●</span>
                      <span className="line-clamp-2">{c.resolution}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
};
