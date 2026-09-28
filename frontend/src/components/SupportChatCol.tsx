import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  User,
  Bot,
  Brain,
  Radio,
  CheckCircle2,
  Terminal,
  Zap,
  CornerDownRight
} from 'lucide-react';
import { ChatMessage, DiagnosticResult, Customer } from '../types';

interface SupportChatColProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
  diagnostics?: DiagnosticResult[];
  currentCustomer?: Customer | null;
  newMemoryIngestedToast?: string | null;
  onClearToast?: () => void;
}

export const SupportChatCol: React.FC<SupportChatColProps> = ({
  messages,
  onSendMessage,
  isLoading,
  currentCustomer,
  newMemoryIngestedToast,
  onClearToast
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-[#242220] rounded-xl border border-[#3A3631] overflow-hidden relative">
      
      {/* 1. Operations Console Chat Header */}
      <div className="p-4 border-b border-[#3A3631] bg-[#242220] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2D2A27] border border-[#3A3631] flex items-center justify-center">
            <Terminal className="w-4 h-4 text-[#C86B3C]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#E9DFC8] font-mono uppercase tracking-wider">
                SUPPORT OPERATIONS CONSOLE
              </h3>
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#5FA7A0] bg-[#171615] px-2 py-0.5 rounded border border-[#3A3631]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5FA7A0] animate-pulse" />
                HINDSIGHT ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-[#817A71] font-mono">
              SESSION: <strong className="text-[#B8B1A5]">{currentCustomer?.name || 'CUSTOMER'}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 2. LIVE MEMORY INGESTION TOAST BANNER */}
      {newMemoryIngestedToast && (
        <div className="p-3 bg-[#171615] border-b border-[#8BA58A]/50 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2 text-xs text-[#8BA58A] font-mono">
            <Brain className="w-4 h-4 text-[#8BA58A] shrink-0" />
            <span>{newMemoryIngestedToast}</span>
          </div>
          {onClearToast && (
            <button
              onClick={onClearToast}
              className="text-[10px] text-[#817A71] hover:text-[#E9DFC8] uppercase font-mono font-bold cursor-pointer"
            >
              [Dismiss]
            </button>
          )}
        </div>
      )}

      {/* 3. Conversation Message Stream (Dark Operations Aesthetic) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#817A71] space-y-2">
            <Radio className="w-8 h-8 text-[#3A3631] animate-pulse" />
            <p className="text-xs font-mono font-bold text-[#E9DFC8] uppercase tracking-wider">
              OPERATIONS SESSION INITIALIZED
            </p>
            <p className="text-xs text-[#817A71] max-w-xs leading-relaxed">
              Describe your issue below. RecallDesk automatically checks historical customer memories and environment specs.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
              >
                {/* Message Header Label */}
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#817A71] px-1">
                  {isUser ? (
                    <>
                      <span>{currentCustomer?.name || 'CUSTOMER'}</span>
                      <span>•</span>
                      <span>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'NOW'}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[#C86B3C] font-bold">RECALLDESK AGENT</span>
                      <span>•</span>
                      <span className="text-[#5FA7A0]">MEMORY ENGINE</span>
                    </>
                  )}
                </div>

                {/* Message Card Surface */}
                <div
                  className={`max-w-[88%] rounded-lg p-3.5 text-xs sm:text-[13px] leading-relaxed border ${
                    isUser
                      ? 'bg-[#2D2A27] text-[#E9DFC8] border-[#3A3631] rounded-tr-xs'
                      : 'bg-[#1F1E1C] text-[#E9DFC8] border-[#3A3631] border-l-2 border-l-[#C86B3C] rounded-tl-xs whitespace-pre-line'
                  }`}
                >
                  <p>{msg.content}</p>
                </div>
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex flex-col items-start space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#5FA7A0] px-1">
              <span>RECALLDESK AGENT</span>
              <span>•</span>
              <span>REASONING</span>
            </div>
            <div className="p-3 rounded-lg bg-[#1F1E1C] border border-[#3A3631] border-l-2 border-l-[#5FA7A0] text-xs font-mono text-[#5FA7A0] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5FA7A0] animate-ping" />
              <span>Retrieving customer memory archive & evaluating environment diff...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Chat Input Box */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[#3A3631] bg-[#1F1E1C] flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Input support query as ${currentCustomer?.name || 'Customer'}...`}
          disabled={isLoading}
          className="flex-1 bg-[#171615] border border-[#3A3631] rounded-md px-3 py-2 text-xs sm:text-sm text-[#E9DFC8] placeholder-[#817A71] focus:outline-none focus:border-[#C86B3C] font-mono transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="px-4 py-2 rounded-md bg-[#C86B3C] hover:bg-[#D47A4B] text-[#171615] font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>

    </div>
  );
};
