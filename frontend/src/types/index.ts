export type MemoryType = 'EPISODIC' | 'SEMANTIC' | 'PREFERENCE' | 'OUTCOME' | 'ENVIRONMENT';

export type ActionStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'PARTIAL';

export type CaseStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Customer {
  id: string;
  name: string;
  email: string;
  environment: Record<string, any>;
  created_at: string;
}

export interface Action {
  id: string;
  case_id: string;
  action: string;
  result: ActionStatus;
  notes?: string;
  created_at: string;
}

export interface CustomerPreference {
  id: string;
  customer_id: string;
  preference: string;
  confidence: number;
  created_at: string;
}

export interface Memory {
  id: string;
  customer_id: string;
  memory_type: MemoryType;
  content: string;
  importance: number;
  confidence: number;
  source_case_id?: string;
  metadata_json: Record<string, any>;
  created_at: string;
  last_used?: string;
}

export interface MemoryWithRelevance extends Memory {
  relevance_score: number;
  reason: string;
  is_applicable: boolean;
  environment_impact_warning?: string;
}

export interface EnvironmentDiff {
  changed: boolean;
  differences: Record<string, { previous: any; current: any }>;
  previous_snapshot: Record<string, any>;
  current_snapshot: Record<string, any>;
  reasoning_implication: string;
}

export interface DiagnosticResult {
  tool_name: string;
  status: string;
  output: Record<string, any>;
  recommendation: string;
}

export interface HindsightContext {
  retrieved_memories: MemoryWithRelevance[];
  previous_successful_solutions: string[];
  previous_failed_actions: string[];
  customer_preferences: string[];
  environment_diff: EnvironmentDiff;
  reasoning_summary: string;
  agent_guidance: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface SupportCase {
  id: string;
  customer_id: string;
  problem: string;
  conversation: ChatMessage[];
  resolution?: string;
  status: CaseStatus;
  created_at: string;
  closed_at?: string;
  actions?: Action[];
}

export interface ChatResponse {
  response: string;
  case_id: string;
  customer_id: string;
  hindsight_context: HindsightContext;
  diagnostics_run: DiagnosticResult[];
  extracted_memories: Memory[];
  actions_attempted: Action[];
  case_status: CaseStatus;
  is_demo_mode: boolean;
}

export interface AnalyticsMetric {
  total_customers: number;
  total_support_cases: number;
  memories_created: number;
  memories_retrieved: number;
  useful_memories: number;
  successful_memory_reuse: number;
  failed_action_avoidance: number;
  avg_resolution_time_minutes: number;
  memory_type_distribution: Record<string, number>;
  comparison_with_vs_without: Record<string, any>;
}

export interface DemoStep {
  step_number: number;
  title: string;
  phase: string;
  timeline_node: string;
  description: string;
  details: Record<string, any>;
}
