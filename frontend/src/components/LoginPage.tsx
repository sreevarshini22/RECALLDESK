import React, { useState } from 'react';
import {
  Brain,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api/client';
import { Customer } from '../types';

interface LoginPageProps {
  onLoginSuccess: (customer: Customer) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [activeMode, setActiveMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedEnvPreset, setSelectedEnvPreset] = useState('Windows 11 / Workstation');
  
  // UI State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (activeMode === 'login') {
        const resp = await api.login({ email, password });
        if (resp.success && resp.customer) {
          onLoginSuccess(resp.customer);
        } else {
          setErrorMsg(resp.message || 'Invalid email or password');
        }
      } else if (activeMode === 'register') {
        if (!name.trim()) {
          setErrorMsg('Please enter customer full name');
          setIsLoading(false);
          return;
        }

        let envObj: Record<string, any> = { device: 'Standard Workstation', os: selectedEnvPreset };
        if (selectedEnvPreset.includes('Dell')) envObj = { device: 'Dell Laptop', os: 'Windows 11 Enterprise' };
        if (selectedEnvPreset.includes('MacBook')) envObj = { device: 'MacBook Pro M2', os: 'macOS Sonoma' };

        const resp = await api.register({ name, email, password, environment: envObj });
        if (resp.success && resp.customer) {
          const authCust = resp.customer;
          setSuccessMsg('Account created successfully! Signing in...');
          setTimeout(() => {
            onLoginSuccess(authCust);
          }, 800);
        } else {
          setErrorMsg(resp.message || 'Registration failed');
        }
      } else if (activeMode === 'forgot') {
        const resp = await api.forgotPassword({ email });
        setSuccessMsg(resp.message || 'Password reset instructions dispatched.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication service error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#171615] text-[#E9DFC8] flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#C86B3C] selection:text-[#171615]">
      
      {/* Top Operations Console Header */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#242220] border border-[#3A3631] flex items-center justify-center">
            <Brain className="w-4 h-4 text-[#C86B3C]" />
          </div>
          <div>
            <span className="text-base font-bold font-mono tracking-tight text-[#E9DFC8]">
              RECALLDESK
            </span>
            <span className="text-xs text-[#817A71] block font-mono">
              OPERATIONS & SUPPORT CONTROL CONSOLE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono text-[#817A71]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#5FA7A0]" />
          <span className="hidden sm:inline">PBKDF2-SHA256 SECURED</span>
        </div>
      </div>

      {/* Main Centered Authentication Container */}
      <div className="max-w-md w-full mx-auto my-auto py-8">
        
        <div className="bg-[#242220] p-6 sm:p-8 rounded-xl border border-[#3A3631] shadow-2xl space-y-6">
          
          {/* Header Mode Switcher */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-mono text-[#E9DFC8]">
                {activeMode === 'login' ? 'Customer Sign In' : activeMode === 'register' ? 'Create Customer Account' : 'Password Recovery'}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#171615] text-[#5FA7A0] border border-[#3A3631]">
                {activeMode === 'login' ? 'Portal Auth' : activeMode === 'register' ? 'New Profile' : 'Recovery'}
              </span>
            </div>
            <p className="text-xs text-[#B8B1A5]">
              {activeMode === 'login'
                ? 'Enter your credentials to access your support case history and memory archive.'
                : activeMode === 'register'
                ? 'Create a dedicated customer profile with isolated outcome memory.'
                : 'Enter your account email to receive recovery instructions.'}
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 rounded-md bg-[#171615] border border-[#C95F55]/60 text-xs text-[#C95F55] font-mono animate-fade-in">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-md bg-[#171615] border border-[#8BA58A]/60 text-xs text-[#8BA58A] font-mono animate-fade-in">
              {successMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {activeMode === 'register' && (
              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold text-[#817A71] uppercase tracking-wider">
                  Full Customer Name:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#817A71] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Customer Name"
                    className="w-full bg-[#171615] border border-[#3A3631] rounded-md pl-9 pr-3 py-2 text-xs text-[#E9DFC8] placeholder-[#817A71] focus:outline-none focus:border-[#C86B3C] font-mono"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold text-[#817A71] uppercase tracking-wider">
                Email Address:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#817A71] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full bg-[#171615] border border-[#3A3631] rounded-md pl-9 pr-3 py-2 text-xs text-[#E9DFC8] placeholder-[#817A71] focus:outline-none focus:border-[#C86B3C] font-mono"
                />
              </div>
            </div>

            {activeMode !== 'forgot' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono font-bold text-[#817A71] uppercase tracking-wider">
                    Password:
                  </label>
                  {activeMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMode('forgot');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] text-[#C86B3C] hover:text-[#d67a4b] font-mono cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#817A71] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#171615] border border-[#3A3631] rounded-md pl-9 pr-10 py-2 text-xs text-[#E9DFC8] placeholder-[#817A71] focus:outline-none focus:border-[#C86B3C] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#817A71] hover:text-[#E9DFC8]"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {activeMode === 'register' && (
              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold text-[#817A71] uppercase tracking-wider">
                  Initial Hardware Environment:
                </label>
                <select
                  value={selectedEnvPreset}
                  onChange={(e) => setSelectedEnvPreset(e.target.value)}
                  className="w-full bg-[#171615] border border-[#3A3631] rounded-md px-3 py-2 text-xs text-[#E9DFC8] focus:outline-none focus:border-[#C86B3C] font-mono"
                >
                  <option value="Windows 11 / Workstation">Windows 11 Enterprise (Workstation)</option>
                  <option value="Dell Laptop / Windows 11">Dell XPS 15 (Windows 11)</option>
                  <option value="MacBook Pro M2 / macOS">MacBook Pro M2 (macOS Sonoma)</option>
                  <option value="Linux / Ubuntu Server">Linux Workstation (Ubuntu 24.04)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-md bg-[#C86B3C] hover:bg-[#d67a4b] text-[#171615] text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-[#171615] border-t-transparent animate-spin" />
                  <span>Processing...</span>
                </>
              ) : activeMode === 'login' ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Authenticate & Open Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : activeMode === 'register' ? (
                <>
                  <User className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Send Recovery Instructions</span>
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher Links */}
          <div className="pt-2 border-t border-[#3A3631] flex items-center justify-between text-xs font-mono">
            {activeMode === 'login' ? (
              <>
                <span className="text-[#817A71]">New to RecallDesk?</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('register');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[#5FA7A0] hover:text-[#E9DFC8] font-bold cursor-pointer"
                >
                  Create Account
                </button>
              </>
            ) : (
              <>
                <span className="text-[#817A71]">Already registered?</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[#5FA7A0] hover:text-[#E9DFC8] font-bold cursor-pointer"
                >
                  Return to Sign In
                </button>
              </>
            )}
          </div>

        </div>

        {/* Security & Multi-Tenant Assurance Badge */}
        <div className="mt-4 p-4 rounded-xl bg-[#242220] border border-[#3A3631] space-y-1.5 text-xs font-mono">
          <div className="flex items-center gap-2 text-[#5FA7A0] font-bold text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Multi-Tenant Customer Isolation Active</span>
          </div>
          <p className="text-[#817A71] text-[11px] leading-relaxed">
            Every customer account maintains strictly isolated support histories, outcome memories, and environment parameters.
          </p>
        </div>

      </div>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto py-3 text-center text-[11px] font-mono text-[#817A71] border-t border-[#3A3631]">
        RECALLDESK OPERATIONS ARCHIVE • MULTI-TENANT ISOLATION ACTIVE
      </footer>

    </div>
  );
};
