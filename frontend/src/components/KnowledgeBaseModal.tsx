import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Terminal,
  Wifi,
  Play
} from 'lucide-react';
import { DiagnosticResult } from '../types';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunDiagnostic?: (toolName: string) => void;
}

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'hardware' | 'knowledge' | 'tools'>('hardware');
  const [activeRouter, setActiveRouter] = useState<'X200' | 'X300'>('X300');
  const [testResult, setTestResult] = useState<DiagnosticResult | null>(null);

  if (!isOpen) return null;

  const runTest = (tool: string) => {
    if (tool === 'scan_wifi') {
      if (activeRouter === 'X300') {
        setTestResult({
          tool_name: 'scan_wifi_channels(X300)',
          status: 'SUCCESS',
          output: {
            smart_connect_band_steering: true,
            channel_5ghz: 36,
            channel_2ghz: 6,
            band_drop_glitch_detected: true,
            recommendation: 'Separate SSIDs and update firmware to v3.0.4'
          },
          recommendation: 'Disable SmartConnect to prevent evening dropout loop.'
        });
      } else {
        setTestResult({
          tool_name: 'scan_wifi_channels(X200)',
          status: 'SUCCESS',
          output: {
            current_channel: 1,
            congestion_index: 0.88,
            neighbor_interference: '9 APs on Channel 1',
            recommended_channel: 11
          },
          recommendation: 'High interference on Ch 1. Switch to Ch 11.'
        });
      }
    } else if (tool === 'ping') {
      setTestResult({
        tool_name: 'ping_gateway(192.168.1.1)',
        status: 'SUCCESS',
        output: {
          packet_loss: '0%',
          avg_latency: '4.1ms',
          jitter: '1.2ms',
          status: 'HEALTHY'
        },
        recommendation: 'Gateway latency is healthy.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171615]/85 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#242220] border border-[#3A3631] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-[#3A3631] bg-[#171615] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#2D2A27] border border-[#3A3631]">
              <BookOpen className="w-5 h-5 text-[#C86B3C]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#E9DFC8]">
                Diagnostic Knowledge Base & Probe Sandbox
              </h3>
              <p className="text-xs text-[#817A71]">
                Hardware architecture comparisons, firmware specs, and live telemetry probes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#2D2A27] border border-[#3A3631] text-[#817A71] hover:text-[#E9DFC8] transition-all"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 py-3 bg-[#1F1E1C] border-b border-[#3A3631] flex gap-2">
          <button
            onClick={() => setActiveTab('hardware')}
            className={`px-4 py-1.5 rounded-md text-xs font-mono font-bold transition-all border ${
              activeTab === 'hardware'
                ? 'bg-[#C86B3C] text-[#171615] border-[#C86B3C]'
                : 'bg-[#171615] text-[#B8B1A5] border-[#3A3631] hover:text-[#E9DFC8]'
            }`}
          >
            Hardware Comparison (X200 vs X300)
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-4 py-1.5 rounded-md text-xs font-mono font-bold transition-all border ${
              activeTab === 'tools'
                ? 'bg-[#C86B3C] text-[#171615] border-[#C86B3C]'
                : 'bg-[#171615] text-[#B8B1A5] border-[#3A3631] hover:text-[#E9DFC8]'
            }`}
          >
            Diagnostic Sandbox
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`px-4 py-1.5 rounded-md text-xs font-mono font-bold transition-all border ${
              activeTab === 'knowledge'
                ? 'bg-[#C86B3C] text-[#171615] border-[#C86B3C]'
                : 'bg-[#171615] text-[#B8B1A5] border-[#3A3631] hover:text-[#E9DFC8]'
            }`}
          >
            Troubleshooting Protocols
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-[#242220]">
          
          {activeTab === 'hardware' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveRouter('X200')}
                  className={`flex-1 p-3 rounded-xl border text-left transition-all ${
                    activeRouter === 'X200'
                      ? 'bg-[#2D2A27] border-[#5FA7A0] shadow-sm'
                      : 'bg-[#171615] border-[#3A3631] opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-[#E9DFC8] text-sm">Router X200</span>
                    <span className="text-[10px] bg-[#171615] px-2 py-0.5 rounded text-[#5FA7A0] font-mono border border-[#3A3631]">Legacy Spec</span>
                  </div>
                  <p className="text-xs text-[#817A71]">Fixed-channel 2.4GHz / 5GHz architecture.</p>
                </button>

                <button
                  onClick={() => setActiveRouter('X300')}
                  className={`flex-1 p-3 rounded-xl border text-left transition-all ${
                    activeRouter === 'X300'
                      ? 'bg-[#2D2A27] border-[#D99A4E] shadow-sm'
                      : 'bg-[#171615] border-[#3A3631] opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-[#E9DFC8] text-sm">Router X300</span>
                    <span className="text-[10px] bg-[#171615] px-2 py-0.5 rounded text-[#D99A4E] font-mono border border-[#3A3631]">Active Upgrade</span>
                  </div>
                  <p className="text-xs text-[#817A71]">SmartConnect Band Steering & Wi-Fi 6.</p>
                </button>
              </div>

              {activeRouter === 'X200' ? (
                <div className="p-4 rounded-xl bg-[#171615] border border-[#3A3631] space-y-3 text-xs">
                  <h4 className="font-bold text-[#E9DFC8] text-sm font-mono">Router X200 Specifications & Failure Patterns</h4>
                  <ul className="space-y-2 text-[#B8B1A5]">
                    <li>• <strong className="text-[#E9DFC8]">Architecture:</strong> Dual-band concurrent (2.4GHz 802.11n + 5GHz 802.11ac).</li>
                    <li>• <strong className="text-[#E9DFC8]">Default Channel:</strong> Channel 1 (2.4GHz) — Highly vulnerable to evening neighbor interference.</li>
                    <li>• <strong className="text-[#8BA58A]">Proven Resolution:</strong> Manually locking 2.4GHz to non-overlapping Channel 11.</li>
                    <li>• <strong className="text-[#C95F55]">Failed Action Note:</strong> Simple reboots do not clear neighbor RF congestion.</li>
                  </ul>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#171615] border border-[#D99A4E]/50 space-y-3 text-xs">
                  <h4 className="font-bold text-[#D99A4E] text-sm font-mono">Router X300 Specifications & Environment Differences</h4>
                  <ul className="space-y-2 text-[#B8B1A5]">
                    <li>• <strong className="text-[#E9DFC8]">SmartConnect Band Steering:</strong> Merges 2.4GHz and 5GHz under a single SSID, automatically steering devices.</li>
                    <li>• <strong className="text-[#D99A4E]">Known Flaw in Firmware 3.0.0:</strong> During evening load spikes, the band steering engine enters an infinite handoff loop, dropping connections every few minutes.</li>
                    <li>• <strong className="text-[#8BA58A]">Required Fix:</strong> Log into <code className="text-[#E9DFC8] bg-[#242220] px-1 py-0.5 rounded font-mono">192.168.1.1</code> → Wireless → Disable SmartConnect → Separate SSID names → Update to Firmware 3.0.4.</li>
                    <li>• <strong className="text-[#C95F55]">Why X200 fix fails on X300:</strong> Changing 2.4GHz channel on X300 does nothing while SmartConnect is forcing band-switch drops.</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => runTest('scan_wifi')}
                  className="p-3 rounded-xl bg-[#171615] border border-[#3A3631] hover:border-[#5FA7A0] text-left transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#5FA7A0] text-xs flex items-center gap-1.5 font-mono">
                      <Wifi className="w-4 h-4" /> scan_wifi_channels()
                    </span>
                    <Play className="w-3.5 h-3.5 text-[#C86B3C]" />
                  </div>
                  <p className="text-[11px] text-[#817A71]">Scans AP congestion and band-steering parameters on {activeRouter}.</p>
                </button>

                <button
                  onClick={() => runTest('ping')}
                  className="p-3 rounded-xl bg-[#171615] border border-[#3A3631] hover:border-[#5FA7A0] text-left transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#5FA7A0] text-xs flex items-center gap-1.5 font-mono">
                      <Terminal className="w-4 h-4" /> ping_gateway()
                    </span>
                    <Play className="w-3.5 h-3.5 text-[#C86B3C]" />
                  </div>
                  <p className="text-[11px] text-[#817A71]">Pings gateway 192.168.1.1 to verify physical LAN link.</p>
                </button>
              </div>

              {testResult && (
                <div className="p-4 rounded-xl bg-[#171615] border border-[#3A3631] text-xs space-y-2">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-[#5FA7A0] font-bold">{testResult.tool_name}</span>
                    <span className="text-[#8BA58A] font-bold">{testResult.status}</span>
                  </div>
                  <p className="text-[#E9DFC8]"><strong className="text-[#817A71]">Recommendation:</strong> {testResult.recommendation}</p>
                  <pre className="text-[10px] font-mono text-[#5FA7A0] bg-[#242220] p-2.5 rounded overflow-x-auto border border-[#3A3631]">
                    {JSON.stringify(testResult.output, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#171615] border border-[#3A3631]">
                <h5 className="font-bold text-[#E9DFC8] mb-1 font-mono">Protocol 1: Evening 2.4GHz RF Interference Mitigation</h5>
                <p className="text-[#B8B1A5] leading-relaxed">
                  When multiple residential routers share Channel 1 or 6, carrier-sense multiple access causes packets to queue indefinitely during peak evening hours (8-10 PM). Moving to Channel 11 provides clean RF separation.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#171615] border border-[#3A3631]">
                <h5 className="font-bold text-[#E9DFC8] mb-1 font-mono">Protocol 2: SmartConnect Band Steering Dropout Handling</h5>
                <p className="text-[#B8B1A5] leading-relaxed">
                  Band steering attempts to dynamically shift dual-band devices between 2.4GHz and 5GHz. On unpatched router firmware, devices with low RSSI thresholds get stuck in authentication loops. Separating SSIDs bypasses band steering.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
