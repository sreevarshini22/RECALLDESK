import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { CustomerProfileCol } from './components/CustomerProfileCol';
import { SupportChatCol } from './components/SupportChatCol';
import { HindsightMemoryCol } from './components/HindsightMemoryCol';
import { MemoryGraphVisualizer } from './components/MemoryGraphVisualizer';
import { HindsightTimeline } from './components/HindsightTimeline';
import { InteractiveDemoModal } from './components/InteractiveDemoModal';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { KnowledgeBaseModal } from './components/KnowledgeBaseModal';
import { ComparisonModal } from './components/ComparisonModal';
import { LoginPage } from './components/LoginPage';
import { api } from './api/client';
import {
  Customer,
  Memory,
  MemoryWithRelevance,
  ChatMessage,
  HindsightContext,
  DiagnosticResult,
  Action,
  AnalyticsMetric,
  DemoStep,
  SupportCase
} from './types';

export function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // Navigation & Modal State
  const [activeTab, setActiveTab] = useState<'support' | 'graph' | 'timeline' | 'analytics'>('support');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState<boolean>(false);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [memoryToast, setMemoryToast] = useState<string | null>(null);

  // Dynamic Customer & Environment State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [currentEnvironment, setCurrentEnvironment] = useState<Record<string, any>>({});
  const [currentCaseId, setCurrentCaseId] = useState<string | undefined>(undefined);
  const [cases, setCases] = useState<SupportCase[]>([]);

  // Chat & AI State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [retrievedMemories, setRetrievedMemories] = useState<MemoryWithRelevance[]>([]);
  const [allMemories, setAllMemories] = useState<Memory[]>([]);
  const [hindsightContext, setHindsightContext] = useState<HindsightContext | undefined>(undefined);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [actionsAttempted, setActionsAttempted] = useState<Action[]>([]);
  const [latestResponse, setLatestResponse] = useState<string>('');

  // Analytics & Demo Data
  const [metrics, setMetrics] = useState<AnalyticsMetric | null>(null);
  const [demoSteps, setDemoSteps] = useState<DemoStep[]>([]);
  const [activeTimelineStep, setActiveTimelineStep] = useState<number>(7);

  // 1. Initial Authentication Check & Startup Load
  useEffect(() => {
    checkAuthAndInit();
  }, []);

  const checkAuthAndInit = async () => {
    setIsCheckingAuth(true);
    try {
      const [analyticsData, custList] = await Promise.all([
        api.getAnalytics().catch(() => null),
        api.getCustomers().catch(() => [])
      ]);

      if (analyticsData) setMetrics(analyticsData);
      if (custList.length > 0) setCustomers(custList);

      // Check if session token is valid via GET /api/me
      const token = api.getToken();
      if (token) {
        try {
          const authUser = await api.getMe();
          if (authUser && authUser.id) {
            setIsAuthenticated(true);
            await switchCustomer(authUser);
            return;
          }
        } catch {
          // Token expired or invalid
          api.setToken(null);
        }
      }

      setIsAuthenticated(false);
    } catch (e) {
      console.error('Failed to initialize RecallDesk application:', e);
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // 2. Handle Login Success
  const handleLoginSuccess = async (customer: Customer) => {
    setIsAuthenticated(true);
    const custList = await api.getCustomers().catch(() => []);
    if (custList.length > 0) setCustomers(custList);
    await switchCustomer(customer);
  };

  // 3. Handle Logout
  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      setIsAuthenticated(false);
      setCurrentCustomer(null);
      setCases([]);
      setAllMemories([]);
      setMessages([]);
      setRetrievedMemories([]);
      setHindsightContext(undefined);
      setMemoryToast(null);
    }
  };

  // 4. Switch Customer and update all customer-specific data
  const switchCustomer = async (cust: Customer) => {
    setCurrentCustomer(cust);
    setCurrentEnvironment(cust.environment || {});
    setCurrentCaseId(undefined);
    setRetrievedMemories([]);
    setHindsightContext(undefined);
    setDiagnostics([]);
    setActionsAttempted([]);
    setLatestResponse('');
    setMemoryToast(null);

    // Fetch customer-specific cases, memories, and demo steps
    try {
      const [custCases, custMems, custSteps] = await Promise.all([
        api.getCustomerCases(cust.id).catch(() => []),
        api.getCustomerMemories(cust.id).catch(() => []),
        api.getDemoSteps(cust.id).catch(() => [])
      ]);

      setCases(custCases);
      setAllMemories(custMems);
      if (custSteps.length > 0) setDemoSteps(custSteps);

      // Generate Dynamic Welcome Message from Customer's Real Memory Bank
      if (custMems.length === 0) {
        setMessages([
          {
            role: 'assistant',
            content: `👋 Hello ${cust.name}! Welcome to RECALLDESK Support.\n\n🧠 **Hindsight Memory Status:**\n• *No previous support history recorded for your account.*\n• RecallDesk will build verified outcome memory as we resolve your issue.\n\nHow can I help you today?`
          }
        ]);
        setActiveTimelineStep(1);
      } else {
        // Extract customer's actual failed actions and working solutions dynamically
        const failedActions: string[] = [];
        const successActions: string[] = [];
        custMems.forEach((m) => {
          if (m.metadata_json?.failed_actions) failedActions.push(...m.metadata_json.failed_actions);
          if (m.metadata_json?.successful_actions) successActions.push(...m.metadata_json.successful_actions);
        });

        const memoryPoints: string[] = [];
        if (failedActions.length > 0) {
          memoryPoints.push(`• Skipping ${failedActions[0]} (previously failed on your account).`);
        }
        if (successActions.length > 0) {
          memoryPoints.push(`• Historical verified fix: ${successActions[0]}.`);
        }
        if (cust.environment && Object.keys(cust.environment).length > 0) {
          const envSummary = Object.entries(cust.environment).map(([k, v]) => `${k}: ${v}`).slice(0, 2).join(', ');
          memoryPoints.push(`• Active hardware profile loaded (${envSummary}).`);
        }

        const pointsText = memoryPoints.length > 0
          ? `\n\n🧠 **Memory Applied:**\n${memoryPoints.join('\n')}`
          : '';

        setMessages([
          {
            role: 'assistant',
            content: `👋 Welcome back, ${cust.name}! I've loaded your profile and verified support history (${custMems.length} memories indexed).${pointsText}\n\nHow can I assist you with your system today?`
          }
        ]);
        setActiveTimelineStep(7);
      }
    } catch (e) {
      console.error('Error fetching customer data on switch:', e);
    }
  };

  const handleSelectCustomerId = (customerId: string) => {
    const target = customers.find((c) => c.id === customerId);
    if (target) {
      switchCustomer(target);
    }
  };

  const handleUpdateEnvironment = async (newEnv: Record<string, any>) => {
    if (!currentCustomer) return;
    setCurrentEnvironment(newEnv);
    try {
      const updatedCust = await api.updateCustomerEnvironment(currentCustomer.id, newEnv);
      setCurrentCustomer(updatedCust);
      setCustomers((prev) => prev.map((c) => (c.id === updatedCust.id ? updatedCust : c)));
    } catch (e) {
      console.error('Failed to update environment in backend:', e);
    }
  };

  const handleSendMessage = async (userMsg: string) => {
    if (!currentCustomer) return;
    setIsLoading(true);

    const nowIso = new Date().toISOString();
    const newMsg: ChatMessage = { role: 'user', content: userMsg, timestamp: nowIso };
    setMessages((prev) => [...prev, newMsg]);

    try {
      const resp = await api.sendChatMessage({
        customer_id: currentCustomer.id,
        case_id: currentCaseId,
        message: userMsg,
        environment: currentEnvironment,
        auto_execute_diagnostics: true
      });

      setCurrentCaseId(resp.case_id);
      setLatestResponse(resp.response);
      setHindsightContext(resp.hindsight_context);
      setRetrievedMemories(resp.hindsight_context?.retrieved_memories || []);
      setDiagnostics(resp.diagnostics_run || []);
      setActionsAttempted(resp.actions_attempted || []);

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: resp.response,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Refresh customer memories, cases, and analytics
      const [updatedMems, updatedAnalytics, updatedCases] = await Promise.all([
        api.getCustomerMemories(currentCustomer.id).catch(() => []),
        api.getAnalytics().catch(() => null),
        api.getCustomerCases(currentCustomer.id).catch(() => [])
      ]);
      if (updatedMems.length >= 0) setAllMemories(updatedMems);
      if (updatedAnalytics) setMetrics(updatedAnalytics);
      if (updatedCases.length > 0) setCases(updatedCases);

      if (userMsg.toLowerCase().includes('fixed') || userMsg.toLowerCase().includes('worked') || userMsg.toLowerCase().includes('solved')) {
        setActiveTimelineStep(9);
        setMemoryToast(`🧠 Outcome Ingested: Verified resolution stored under ${currentCustomer.name}'s profile.`);
      } else {
        setActiveTimelineStep(7);
      }

    } catch (err: any) {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: `⚠️ Unable to connect to support service: ${err.message || 'Server offline'}. Please verify backend connection.`,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (memoryId: string, wasUseful: boolean) => {
    try {
      await api.submitMemoryFeedback(memoryId, {
        was_useful: wasUseful,
        result: wasUseful ? 'HELPED_RESOLVE' : 'OUTDATED',
        notes: wasUseful ? 'User marked memory as helpful.' : 'User marked memory as outdated.'
      });
      if (currentCustomer) {
        const mems = await api.getCustomerMemories(currentCustomer.id);
        setAllMemories(mems);
      }
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await api.resetDemo();
      await checkAuthAndInit();
    } finally {
      setIsResetting(false);
    }
  };

  const handleExecuteFullDemo = async () => {
    if (!currentCustomer) return;
    try {
      const demoResult = await api.runFullDemo(currentCustomer.id);
      if (demoResult.case_id) setCurrentCaseId(demoResult.case_id);
      if (demoResult.hindsight_context) setHindsightContext(demoResult.hindsight_context);
      if (demoResult.hindsight_context?.retrieved_memories) {
        setRetrievedMemories(demoResult.hindsight_context.retrieved_memories);
      }

      // Simulate the 2-step conversation
      const custName = (currentCustomer.name || '').toLowerCase();
      let simUser1 = "My issue is recurring. Should I repeat the basic troubleshooting restart?";
      let simUser2 = "I applied the recommended hindsight resolution. That completely fixed it!";

      if (custName.includes('rahul')) {
        simUser1 = "My internet is disconnecting again in the evening. Yesterday I upgraded my router to X300.";
        simUser2 = "I separated the SSIDs and updated firmware to v3.0.4. That completely fixed it!";
        setCurrentEnvironment({
          device: "Wi-Fi Gateway",
          router: "X300",
          firmware: "3.0.4",
          isp: "FiberNet",
          band: "Separate 2.4G and 5G"
        });
      } else if (custName.includes('priya')) {
        simUser1 = "VPN is disconnecting again whenever my laptop enters sleep mode. Should I reinstall Cisco AnyConnect?";
        simUser2 = "I ran the PowerShell command to disable the sleep power cutoff. VPN is rock solid across sleep now!";
      } else if (custName.includes('arjun')) {
        simUser1 = "Docker build crashed with error 137 again. Should I run docker system prune?";
        simUser2 = "Updated daemon.json with VirtioFS and restarted Docker. Multi-stage build finished without OOM crash!";
      } else {
        simUser1 = "Hello, my mobile app push notifications are not arriving on my Android device.";
        simUser2 = "I enabled background data permission and battery optimization whitelist. Notifications working now, thanks!";
      }

      setMessages([
        { role: 'user', content: simUser1 },
        { role: 'assistant', content: demoResult.initial_agent_response || 'Adaptive response with hindsight diagnosis applied.' },
        { role: 'user', content: simUser2 },
        { role: 'assistant', content: demoResult.resolution_agent_response || 'Case marked as resolved and new outcome memory stored.' }
      ]);

      setLatestResponse(demoResult.resolution_agent_response);
      setActiveTimelineStep(9);
      setMemoryToast(`🧠 Outcome Ingested: Demo scenario verified & indexed into ${currentCustomer.name}'s memory bank.`);

      // Refresh memory list & cases
      const [mems, casesData, updatedAnalytics] = await Promise.all([
        api.getCustomerMemories(currentCustomer.id).catch(() => []),
        api.getCustomerCases(currentCustomer.id).catch(() => []),
        api.getAnalytics().catch(() => null)
      ]);
      if (mems) setAllMemories(mems);
      if (casesData) setCases(casesData);
      if (updatedAnalytics) setMetrics(updatedAnalytics);

    } catch (e) {
      console.error('Failed to execute full demo:', e);
    }
  };

  // 5. Render Loading Spinner while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#171615] text-[#E9DFC8] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-[#242220] border border-[#3A3631] flex items-center justify-center shadow-2xl">
          <span className="w-5 h-5 rounded-full border-2 border-[#C86B3C] border-t-transparent animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-[#E9DFC8] tracking-wider uppercase font-mono">RECALLDESK</p>
          <p className="text-xs text-[#817A71]">Verifying customer authenticated session...</p>
        </div>
      </div>
    );
  }

  // 6. Render Customer Login Page if Unauthenticated
  if (!isAuthenticated || !currentCustomer) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // 7. Render Authenticated Workspace Dashboard
  return (
    <div className="min-h-screen bg-[#171615] text-[#E9DFC8] flex flex-col font-sans selection:bg-[#C86B3C] selection:text-[#171615]">
      
      {/* 1. Top Navigation */}
      <TopNav
        onOpenDemo={() => setIsDemoModalOpen(true)}
        onOpenAnalytics={() => setActiveTab('analytics')}
        onOpenKnowledgeBase={() => setIsKnowledgeModalOpen(true)}
        onOpenComparison={() => setIsComparisonModalOpen(true)}
        onResetDemo={handleResetDemo}
        onLogout={handleLogout}
        isResetting={isResetting}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        customers={customers}
        selectedCustomerId={currentCustomer?.id}
        onSelectCustomer={handleSelectCustomerId}
        currentCustomer={currentCustomer}
      />

      {/* 2. Main Dashboard Container */}
      <main className="flex-1 max-w-[1780px] w-full mx-auto p-4 sm:p-6 lg:p-7 space-y-6">
        
        {/* TAB 1: 3-Column Operations Support Workspace */}
        {activeTab === 'support' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[calc(100vh-140px)]">
            
            {/* COLUMN 1: Customer Profile & Case Archive (3 cols on desktop) */}
            <div className="lg:col-span-3 xl:col-span-3 h-full">
              <CustomerProfileCol
                customers={customers}
                customer={currentCustomer}
                cases={cases}
                onSelectCustomer={handleSelectCustomerId}
                currentEnvironment={currentEnvironment}
                onUpdateEnvironment={handleUpdateEnvironment}
                onLogout={handleLogout}
              />
            </div>

            {/* COLUMN 2: Operations Support Chat (4 cols on desktop) */}
            <div className="lg:col-span-4 xl:col-span-4 h-full">
              <SupportChatCol
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                diagnostics={diagnostics}
                currentCustomer={currentCustomer}
                newMemoryIngestedToast={memoryToast}
                onClearToast={() => setMemoryToast(null)}
              />
            </div>

            {/* COLUMN 3: Hindsight Memory Panel (5 cols on desktop - Visual Centerpiece) */}
            <div className="lg:col-span-5 xl:col-span-5 h-full">
              <HindsightMemoryCol
                memories={retrievedMemories}
                allCustomerMemories={allMemories}
                hindsightContext={hindsightContext}
                currentEnvironment={currentEnvironment}
                currentCustomer={currentCustomer}
                onFeedback={handleFeedback}
              />
            </div>

          </div>
        )}

        {/* TAB 2: Interactive Hindsight Memory Knowledge Graph */}
        {activeTab === 'graph' && (
          <div className="space-y-6">
            <MemoryGraphVisualizer
              customer={currentCustomer}
              memories={allMemories}
              currentEnvironment={currentEnvironment}
            />
          </div>
        )}

        {/* TAB 3: Visual Hindsight Lifecycle Timeline */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <HindsightTimeline activeStep={activeTimelineStep} />
          </div>
        )}

        {/* TAB 4: Operations ROI & Benchmark Telemetry */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <AnalyticsDashboard metrics={metrics} />
          </div>
        )}

      </main>

      {/* Interactive Guided Walkthrough Modal */}
      <InteractiveDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        steps={demoSteps}
        onExecuteFullDemo={handleExecuteFullDemo}
      />

      {/* Benchmark Side-by-Side Comparison Modal */}
      <ComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        currentCustomer={currentCustomer}
      />

      {/* Diagnostics Sandbox Modal */}
      <KnowledgeBaseModal
        isOpen={isKnowledgeModalOpen}
        onClose={() => setIsKnowledgeModalOpen(false)}
      />

      {/* Operations Console Universal Footer Bar */}
      <footer className="border-t border-[#3A3631] bg-[#242220] py-2.5 px-6 text-xs text-[#817A71]">
        <div className="max-w-[1780px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[#E9DFC8] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#8BA58A] animate-pulse" />
              RECALLDESK Hindsight Engine Active
            </span>
            <span className="text-[#3A3631]">•</span>
            <span className="text-[#817A71]">Operational Memory Archive</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-[#817A71]">
            <span className="text-[#C86B3C]">Customer ID: {currentCustomer?.id || '—'}</span>
            <span>•</span>
            <span className="text-[#8BA58A]">Session: Authenticated</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
export default App;
