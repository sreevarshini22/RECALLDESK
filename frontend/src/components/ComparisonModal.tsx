import React, { useState } from 'react';
import {
  X,
  Bot,
  Brain,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Ban,
  Zap,
  Users,
  Scale
} from 'lucide-react';
import { Customer } from '../types';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCustomer?: Customer | null;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  currentCustomer
}) => {
  const [selectedPersona, setSelectedPersona] = useState<'rahul' | 'priya' | 'arjun'>(
    (currentCustomer?.name || '').toLowerCase().includes('priya')
      ? 'priya'
      : (currentCustomer?.name || '').toLowerCase().includes('arjun')
      ? 'arjun'
      : 'rahul'
  );

  if (!isOpen) return null;

  const comparisons = {
    rahul: {
      customerName: 'Rahul Sharma',
      device: 'Router X200 ➔ Upgraded to X300',
      scenario: 'Recurring evening latency spikes & frequent Wi-Fi dropouts.',
      without: {
        agentTitle: 'Standard Support Bot (0 Memory)',
        steps: [
          { role: 'user', text: 'My Wi-Fi is disconnecting again in the evening.' },
          { role: 'bot', text: 'Hello! Have you tried restarting your router for 30 seconds?' },
          { role: 'user', text: 'I told your agent yesterday that restarting DOES NOT WORK!' },
          { role: 'bot', text: 'I understand. What model router do you currently have?' },
          { role: 'user', text: 'Router X300. I upgraded yesterday.' },
          { role: 'bot', text: 'Please log into admin panel and change Wi-Fi channel to 11.' },
          { role: 'user', text: 'Channel 11 failed last week and caused total 5GHz dropout!' }
        ],
        stats: {
          time: '46 Minutes',
          turns: '8 Turns',
          frustration: 'High (Repetitive Loops)',
          cost: '$26.80',
          outcome: 'Failed / Escalated'
        }
      },
      with: {
        agentTitle: 'RecallDesk (Hindsight Memory Engine)',
        steps: [
          { role: 'user', text: 'My Wi-Fi is disconnecting again in the evening.' },
          {
            role: 'bot',
            text: "Welcome back Rahul. Profile loaded:\n\nMEMORY APPLIED:\n• Bypassing router restart (previously failed 3x).\n• Bypassing Channel 11 (ineffective on 5GHz).\n• Detected hardware upgrade: X200 ➔ X300.\n\nADAPTIVE RESOLUTION: Separate 2.4GHz/5GHz SSIDs and set 5GHz channel bandwidth to 80MHz."
          },
          { role: 'user', text: 'Separated the SSIDs and set 80MHz. Connection is rock solid now! Fixed!' },
          {
            role: 'bot',
            text: 'Case resolved. Ingested new outcome into your customer memory archive.'
          }
        ],
        stats: {
          time: '1.8 Minutes',
          turns: '2 Turns',
          frustration: 'Zero (Frictionless)',
          cost: '$1.05',
          outcome: 'First-Contact Resolution'
        }
      }
    },
    priya: {
      customerName: 'Priya Kumar',
      device: 'Dell XPS 15 (Windows 11) • Intel AX201',
      scenario: 'Cisco AnyConnect VPN drops connection every time laptop enters sleep mode.',
      without: {
        agentTitle: 'Standard Support Bot (0 Memory)',
        steps: [
          { role: 'user', text: 'VPN is disconnecting whenever my laptop enters sleep mode.' },
          { role: 'bot', text: 'Please uninstall and reinstall the Cisco AnyConnect client.' },
          { role: 'user', text: 'I already reinstalled it twice yesterday. Did nothing.' },
          { role: 'bot', text: 'Please reset your TCP/IP stack using netsh in CMD.' },
          { role: 'user', text: 'I tried that last week. It just reset my DNS and broke intranet access!' }
        ],
        stats: {
          time: '52 Minutes',
          turns: '7 Turns',
          frustration: 'High (Wasted Engineering Time)',
          cost: '$30.30',
          outcome: 'Unresolved / Reopened'
        }
      },
      with: {
        agentTitle: 'RecallDesk (Hindsight Memory Engine)',
        steps: [
          { role: 'user', text: 'VPN is disconnecting whenever my laptop enters sleep mode.' },
          {
            role: 'bot',
            text: "Welcome back Priya. Profile loaded (Dell XPS 15 / Windows 11):\n\nMEMORY APPLIED:\n• Bypassing AnyConnect reinstall & TCP/IP stack reset.\n• Target hardware: Intel AX201 Wi-Fi 6 adapter.\n\nTARGETED FIX: Windows 11 Modern Standby powers down adapter. Run PowerShell command:\n`Set-NetAdapterPowerManagement -Name 'Wi-Fi' -AllowComputerToTurnOffDevice Disabled`"
          },
          { role: 'user', text: 'Ran the PowerShell command. VPN stays connected across sleep now. Fixed!' },
          {
            role: 'bot',
            text: 'Outcome confirmed and stored under your Dell XPS 15 profile.'
          }
        ],
        stats: {
          time: '1.5 Minutes',
          turns: '2 Turns',
          frustration: 'Zero (Direct Precision)',
          cost: '$0.90',
          outcome: 'First-Contact Resolution'
        }
      }
    },
    arjun: {
      customerName: 'Arjun Reddy',
      device: 'MacBook Pro M2 Max (macOS Sonoma)',
      scenario: 'Docker Desktop multi-stage container build crashing with exit code 137 (OOM).',
      without: {
        agentTitle: 'Standard Support Bot (0 Memory)',
        steps: [
          { role: 'user', text: 'Docker build crashed with error code 137 again.' },
          { role: 'bot', text: 'Please restart Docker Desktop and run `docker system prune -a`.' },
          { role: 'user', text: 'Prune removes all my cached layers and does not fix OOM 137!' },
          { role: 'bot', text: 'Have you tried installing colima instead?' },
          { role: 'user', text: 'Colima is incompatible with our internal company VPN setup.' }
        ],
        stats: {
          time: '41 Minutes',
          turns: '6 Turns',
          frustration: 'High (Build Cache Wiped)',
          cost: '$23.90',
          outcome: 'Failed'
        }
      },
      with: {
        agentTitle: 'RecallDesk (Hindsight Memory Engine)',
        steps: [
          { role: 'user', text: 'Docker build crashed with error code 137 again.' },
          {
            role: 'bot',
            text: "Welcome back Arjun. Profile loaded (macOS Sonoma M2 Max):\n\nMEMORY APPLIED:\n• Bypassing `docker system prune -a`.\n• Memory spec: 32GB Unified Memory.\n\nROOT CAUSE & FIX: In `~/.docker/daemon.json`, enable VirtioFS and allocate 8GB RAM to prevent kernel OOM 137."
          },
          { role: 'user', text: 'Updated daemon.json with VirtioFS + 8GB RAM. Build finished in 34s! Perfect!' },
          {
            role: 'bot',
            text: 'High-confidence outcome indexed into your developer profile.'
          }
        ],
        stats: {
          time: '1.2 Minutes',
          turns: '2 Turns',
          frustration: 'Zero (Immediate Fix)',
          cost: '$0.75',
          outcome: 'First-Contact Resolution'
        }
      }
    }
  };

  const currentComp = comparisons[selectedPersona];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
      <div className="w-full max-w-5xl rounded-xl border border-[#3A3631] bg-[#242220] shadow-2xl overflow-hidden my-6 font-sans">
        
        {/* Header */}
        <div className="p-4.5 border-b border-[#3A3631] bg-[#242220] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#171615] border border-[#3A3631] flex items-center justify-center">
              <Scale className="w-4 h-4 text-[#D99A4E]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#E9DFC8] font-mono uppercase tracking-wider">
                  Benchmark: Standard Bot vs. RecallDesk
                </h3>
              </div>
              <p className="text-xs text-[#817A71]">
                Side-by-side operational transcript comparison on identical support cases.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#817A71] hover:text-[#E9DFC8] hover:bg-[#2D2A27] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Persona Selector Tabs */}
        <div className="px-5 py-2.5 bg-[#171615] border-b border-[#3A3631] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#817A71] flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#5FA7A0]" />
              Persona:
            </span>
            {(['rahul', 'priya', 'arjun'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedPersona(p)}
                className={`px-2.5 py-1 rounded text-xs font-mono capitalize transition-colors cursor-pointer ${
                  selectedPersona === p
                    ? 'bg-[#C86B3C] text-[#171615] font-bold'
                    : 'bg-[#242220] text-[#817A71] hover:text-[#E9DFC8] border border-[#3A3631]'
                }`}
              >
                {comparisons[p].customerName}
              </button>
            ))}
          </div>

          <div className="text-xs text-[#817A71] font-mono">
            Hardware: <span className="text-[#E9DFC8]">{currentComp.device}</span>
          </div>
        </div>

        {/* 2-Column Comparison Body */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#3A3631] p-5 gap-5">
          
          {/* LEFT: WITHOUT MEMORY */}
          <div className="space-y-3">
            <div className="p-2.5 rounded bg-[#171615] border border-[#3A3631] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-[#C95F55]" />
                <span className="text-xs font-mono font-bold text-[#C95F55]">
                  Standard Support Bot (0 Memory)
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#C95F55] border border-[#C95F55]/40 px-1.5 py-0.2 rounded">
                Context Amnesia
              </span>
            </div>

            {/* Transcript */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto p-3 rounded bg-[#171615] border border-[#3A3631] text-xs font-mono">
              {currentComp.without.steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded border ${
                    step.role === 'user'
                      ? 'bg-[#242220] text-[#E9DFC8] border-[#3A3631] ml-4'
                      : 'bg-[#171615] text-[#C95F55] border-[#C95F55]/30 mr-4'
                  }`}
                >
                  <div className="text-[10px] uppercase mb-0.5 opacity-70">
                    {step.role === 'user' ? 'Customer' : 'Standard Bot'}
                  </div>
                  <p>{step.text}</p>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="p-3 rounded bg-[#171615] border border-[#3A3631] space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-[#817A71]">
                <span>Resolution Time:</span>
                <span className="text-[#C95F55] font-bold">{currentComp.without.stats.time}</span>
              </div>
              <div className="flex justify-between text-[#817A71]">
                <span>Conversation Turns:</span>
                <span className="text-[#C95F55]">{currentComp.without.stats.turns}</span>
              </div>
              <div className="flex justify-between text-[#817A71]">
                <span>Support Cost:</span>
                <span className="text-[#C95F55]">{currentComp.without.stats.cost}</span>
              </div>
            </div>
          </div>

          {/* RIGHT: WITH RECALLDESK */}
          <div className="space-y-3">
            <div className="p-2.5 rounded bg-[#171615] border border-[#8BA58A]/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#8BA58A]" />
                <span className="text-xs font-mono font-bold text-[#8BA58A]">
                  RecallDesk (Hindsight Engine)
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#8BA58A] border border-[#8BA58A]/40 px-1.5 py-0.2 rounded">
                Memory Retained
              </span>
            </div>

            {/* Transcript */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto p-3 rounded bg-[#171615] border border-[#3A3631] text-xs font-mono">
              {currentComp.with.steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded border ${
                    step.role === 'user'
                      ? 'bg-[#2D2A27] text-[#E9DFC8] border-[#3A3631] ml-4'
                      : 'bg-[#171615] text-[#E9DFC8] border-l-2 border-l-[#C86B3C] border-[#3A3631] mr-4 whitespace-pre-line'
                  }`}
                >
                  <div className="text-[10px] uppercase mb-0.5 text-[#5FA7A0]">
                    {step.role === 'user' ? 'Customer' : 'RecallDesk Agent'}
                  </div>
                  <p>{step.text}</p>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="p-3 rounded bg-[#171615] border border-[#3A3631] space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-[#817A71]">
                <span>Resolution Time:</span>
                <span className="text-[#8BA58A] font-bold">{currentComp.with.stats.time} (80% faster)</span>
              </div>
              <div className="flex justify-between text-[#817A71]">
                <span>Conversation Turns:</span>
                <span className="text-[#8BA58A] font-bold">{currentComp.with.stats.turns}</span>
              </div>
              <div className="flex justify-between text-[#817A71]">
                <span>Support Cost:</span>
                <span className="text-[#8BA58A] font-bold">{currentComp.with.stats.cost} (96% saved)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#3A3631] bg-[#171615] flex items-center justify-between">
          <span className="text-xs text-[#817A71] font-mono">
            "Support that remembers what happened."
          </span>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-[#2D2A27] hover:bg-[#35322F] border border-[#3A3631] text-[#E9DFC8] text-xs font-mono font-bold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
