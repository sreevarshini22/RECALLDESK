import React, { useState, useEffect, useRef } from 'react';
import {
  Network,
  Play,
  Info,
  Filter
} from 'lucide-react';
import { Memory, Customer } from '../types';

interface GraphNode {
  id: string;
  label: string;
  category: 'CUSTOMER' | 'ISSUE' | 'OUTCOME_SUCCESS' | 'OUTCOME_FAIL' | 'ENVIRONMENT' | 'PREFERENCE' | 'SEMANTIC';
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  radius: number;
  details: {
    title: string;
    description: string;
    confidence?: number;
    importance?: number;
    metadata?: Record<string, any>;
  };
}

interface GraphLink {
  source: string;
  target: string;
  label: string;
  type: 'proven' | 'failed' | 'shift' | 'attribute' | 'learned';
}

interface MemoryGraphVisualizerProps {
  customer: Customer | null;
  memories: Memory[];
  currentEnvironment?: Record<string, any>;
}

export const MemoryGraphVisualizer: React.FC<MemoryGraphVisualizerProps> = ({
  customer,
  memories = []
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [isSimulatingTraversal, setIsSimulatingTraversal] = useState<boolean>(false);
  const [traversalStep, setTraversalStep] = useState<number>(0);
  const [draggedNode, setDraggedNode] = useState<GraphNode | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);

  // Dynamically build graph nodes & links based on the active customer and their stored memories
  useEffect(() => {
    const custName = customer?.name || 'Customer Entity';
    const custId = customer?.id || 'cust-000';
    const custEmail = customer?.email || '';

    const newNodes: GraphNode[] = [];
    const newLinks: GraphLink[] = [];

    // Center Node: Active Customer
    const centerNode: GraphNode = {
      id: 'cust-core',
      label: custName,
      category: 'CUSTOMER',
      x: 450,
      y: 280,
      radius: 34,
      details: {
        title: `Customer: ${custName}`,
        description: `ID: ${custId} • Email: ${custEmail}`,
        importance: 1.0,
        confidence: 1.0,
        metadata: customer?.environment
      }
    };
    newNodes.push(centerNode);

    if (memories.length === 0) {
      // Zero memories state
      const emptyNode: GraphNode = {
        id: 'no-mem-node',
        label: 'No Memories Yet',
        category: 'SEMANTIC',
        x: 450,
        y: 150,
        radius: 26,
        details: {
          title: 'Fresh Baseline State',
          description: 'This customer has no previous support history. RecallDesk will build memory as cases are resolved.',
          importance: 0.5,
          confidence: 1.0
        }
      };
      newNodes.push(emptyNode);
      newLinks.push({ source: 'cust-core', target: 'no-mem-node', label: 'ZERO_HISTORY', type: 'attribute' });
    } else {
      // Position memories around center
      const total = memories.length;
      memories.forEach((mem, idx) => {
        const angle = (idx * 2 * Math.PI) / total;
        const dist = 180 + (idx % 2 === 0 ? 0 : 35);
        const nx = 450 + Math.cos(angle) * dist;
        const ny = 280 + Math.sin(angle) * dist;

        let category: GraphNode['category'] = 'SEMANTIC';
        let label: string = String(mem.memory_type);
        let linkType: GraphLink['type'] = 'attribute';

        if (mem.memory_type === 'OUTCOME') {
          const hasSuccess = mem.content.includes('SUCCESS');
          category = hasSuccess ? 'OUTCOME_SUCCESS' : 'OUTCOME_FAIL';
          label = mem.metadata_json?.successful_actions?.[0] || 'Outcome Resolution';
          linkType = hasSuccess ? 'proven' : 'failed';
        } else if (mem.memory_type === 'PREFERENCE') {
          category = 'PREFERENCE';
          label = 'Tone Preference';
          linkType = 'attribute';
        } else if (mem.memory_type === 'ENVIRONMENT') {
          category = 'ENVIRONMENT';
          label = 'Device Spec';
          linkType = 'shift';
        } else if (mem.memory_type === 'EPISODIC') {
          category = 'ISSUE';
          label = 'Archived Case';
          linkType = 'learned';
        }

        const memNode: GraphNode = {
          id: mem.id,
          label: label.length > 20 ? label.slice(0, 18) + '...' : label,
          category,
          x: Math.max(80, Math.min(820, nx)),
          y: Math.max(60, Math.min(500, ny)),
          radius: 26,
          details: {
            title: `${mem.memory_type} Memory: ${label}`,
            description: mem.content,
            importance: mem.importance,
            confidence: mem.confidence,
            metadata: mem.metadata_json
          }
        };

        newNodes.push(memNode);
        newLinks.push({
          source: 'cust-core',
          target: mem.id,
          label: mem.memory_type,
          type: linkType
        });
      });
    }

    setNodes(newNodes);
    setLinks(newLinks);
    setSelectedNode(newNodes[0]);
  }, [customer, memories]);

  // Exact RecallDesk operations palette mapping
  const getNodeColor = (cat: GraphNode['category']) => {
    switch (cat) {
      case 'CUSTOMER':
        return { bg: '#C86B3C', stroke: '#E9DFC8', glow: 'rgba(200, 107, 60, 0.4)' };
      case 'ISSUE':
        return { bg: '#5FA7A0', stroke: '#E9DFC8', glow: 'rgba(95, 167, 160, 0.4)' };
      case 'OUTCOME_SUCCESS':
        return { bg: '#8BA58A', stroke: '#E9DFC8', glow: 'rgba(139, 165, 138, 0.5)' };
      case 'OUTCOME_FAIL':
        return { bg: '#C95F55', stroke: '#E9DFC8', glow: 'rgba(201, 95, 85, 0.5)' };
      case 'ENVIRONMENT':
        return { bg: '#D99A4E', stroke: '#E9DFC8', glow: 'rgba(217, 154, 78, 0.4)' };
      case 'PREFERENCE':
        return { bg: '#C86B3C', stroke: '#E9DFC8', glow: 'rgba(200, 107, 60, 0.3)' };
      case 'SEMANTIC':
        return { bg: '#2D2A27', stroke: '#5FA7A0', glow: 'rgba(95, 167, 160, 0.2)' };
      default:
        return { bg: '#242220', stroke: '#3A3631', glow: 'rgba(58, 54, 49, 0.3)' };
    }
  };

  // Traversal animation
  useEffect(() => {
    let timer: any;
    if (isSimulatingTraversal) {
      timer = setInterval(() => {
        setTraversalStep((prev) => {
          const next = (prev + 1) % (nodes.length || 1);
          if (next === 0) setIsSimulatingTraversal(false);
          return next;
        });
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [isSimulatingTraversal, nodes.length]);

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particleOffset = 0;

    const render = () => {
      particleOffset = (particleOffset + 0.008) % 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Background Grid
      ctx.strokeStyle = 'rgba(233, 223, 200, 0.025)';
      ctx.lineWidth = 1;
      const gridSize = 35;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Links (Memory Threads)
      links.forEach((link) => {
        const sourceNode = nodes.find((n) => n.id === link.source);
        const targetNode = nodes.find((n) => n.id === link.target);
        if (!sourceNode || !targetNode) return;

        // Check filter visibility
        if (activeFilter !== 'ALL') {
          if (sourceNode.category !== activeFilter && targetNode.category !== activeFilter && sourceNode.category !== 'CUSTOMER') {
            return;
          }
        }

        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);

        if (link.type === 'failed') {
          ctx.strokeStyle = 'rgba(201, 95, 85, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 5]);
        } else if (link.type === 'proven') {
          ctx.strokeStyle = 'rgba(139, 165, 138, 0.7)';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
        } else if (link.type === 'shift') {
          ctx.strokeStyle = 'rgba(217, 154, 78, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
        } else {
          ctx.strokeStyle = 'rgba(95, 167, 160, 0.35)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated Particle on Proven Links or during Simulation
        if (link.type === 'proven' || isSimulatingTraversal) {
          const px = sourceNode.x + (targetNode.x - sourceNode.x) * particleOffset;
          const py = sourceNode.y + (targetNode.y - sourceNode.y) * particleOffset;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#C86B3C';
          ctx.shadowColor = '#C86B3C';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Draw Nodes
      nodes.forEach((node, idx) => {
        if (activeFilter !== 'ALL' && node.category !== activeFilter && node.category !== 'CUSTOMER') {
          return;
        }

        const colors = getNodeColor(node.category);
        const isSelected = selectedNode?.id === node.id;
        const isTraversing = isSimulatingTraversal && traversalStep === idx;

        // Outer Glow
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + (isSelected || isTraversing ? 8 : 3), 0, Math.PI * 2);
        ctx.fillStyle = colors.glow;
        ctx.fill();

        // Node Body
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = colors.bg;
        ctx.fill();
        ctx.lineWidth = isSelected || isTraversing ? 2.5 : 1;
        ctx.strokeStyle = isSelected ? '#E9DFC8' : colors.stroke;
        ctx.stroke();

        // Node Label
        ctx.font = `600 ${node.radius > 30 ? '11px' : '10px'} monospace`;
        ctx.fillStyle = node.category === 'CUSTOMER' || node.category === 'OUTCOME_SUCCESS' || node.category === 'OUTCOME_FAIL' ? '#171615' : '#E9DFC8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x, node.y);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [nodes, links, selectedNode, activeFilter, isSimulatingTraversal, traversalStep]);

  // Canvas Mouse Interactions
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = nodes.find((node) => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
      setDraggedNode(clickedNode);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedNode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(40, Math.min(canvas.width - 40, e.clientX - rect.left));
    const y = Math.max(40, Math.min(canvas.height - 40, e.clientY - rect.top));

    setNodes((prev) =>
      prev.map((n) => (n.id === draggedNode.id ? { ...n, x, y } : n))
    );
  };

  const handleCanvasMouseUp = () => {
    setDraggedNode(null);
  };

  return (
    <div className="bg-[#242220] p-6 rounded-xl border border-[#3A3631] shadow-2xl space-y-6">
      
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#3A3631]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#2D2A27] border border-[#3A3631] flex items-center justify-center">
            <Network className="w-5 h-5 text-[#C86B3C]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#E9DFC8] flex items-center gap-2">
              Hindsight Memory Knowledge Graph
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2D2A27] text-[#5FA7A0] border border-[#3A3631] font-mono">
                {customer?.name || 'Active Customer'}
              </span>
            </h2>
            <p className="text-xs text-[#817A71]">
              Isolated customer memory threads, verified outcomes, and negative knowledge boundaries.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSimulatingTraversal(!isSimulatingTraversal)}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              isSimulatingTraversal
                ? 'bg-[#D99A4E] text-[#171615] border-[#D99A4E] animate-pulse'
                : 'bg-[#C86B3C] hover:bg-[#d67a4b] text-[#171615] border-[#C86B3C]'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isSimulatingTraversal ? 'Traversing Graph...' : 'Simulate Retrieval'}</span>
          </button>
        </div>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#817A71] shrink-0 flex items-center gap-1 mr-1 font-mono">
          <Filter className="w-3.5 h-3.5 text-[#5FA7A0]" />
          Filter:
        </span>
        {[
          { key: 'ALL', label: 'All Nodes' },
          { key: 'OUTCOME_SUCCESS', label: 'Proven Solutions' },
          { key: 'OUTCOME_FAIL', label: 'Mistakes Avoided' },
          { key: 'ENVIRONMENT', label: 'Environment Diff' },
          { key: 'PREFERENCE', label: 'Preferences' },
          { key: 'SEMANTIC', label: 'Principles' }
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveFilter(item.key)}
            className={`px-3 py-1 rounded-md font-mono text-xs transition-all cursor-pointer border ${
              activeFilter === item.key
                ? 'bg-[#C86B3C] text-[#171615] border-[#C86B3C] font-bold'
                : 'bg-[#171615] border-[#3A3631] text-[#B8B1A5] hover:text-[#E9DFC8]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 3. Graph Canvas + Side Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Canvas Container (8 Cols) */}
        <div className="lg:col-span-8 relative bg-[#171615] rounded-xl border border-[#3A3631] overflow-hidden shadow-inner">
          <canvas
            ref={canvasRef}
            width={900}
            height={560}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            className="w-full h-auto cursor-grab active:cursor-grabbing block"
          />

          {/* Legend Overlay */}
          <div className="absolute bottom-3 left-3 bg-[#242220]/95 backdrop-blur-sm p-2.5 rounded-lg border border-[#3A3631] text-[10px] font-mono space-y-1">
            <div className="flex items-center gap-2 text-[#E9DFC8]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8BA58A]" />
              <span>Proven Fix (Verified)</span>
            </div>
            <div className="flex items-center gap-2 text-[#E9DFC8]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C95F55]" />
              <span>Failed Action (Avoided)</span>
            </div>
            <div className="flex items-center gap-2 text-[#E9DFC8]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D99A4E]" />
              <span>Environment Shift Boundary</span>
            </div>
          </div>
        </div>

        {/* Inspector Panel (4 Cols) */}
        <div className="lg:col-span-4 bg-[#2D2A27] p-5 rounded-xl border border-[#3A3631] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#3A3631]">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#5FA7A0]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#E9DFC8] font-mono">
                Node Inspector
              </span>
            </div>
            {selectedNode && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#171615] border border-[#3A3631] text-[#5FA7A0]">
                {selectedNode.category}
              </span>
            )}
          </div>

          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#E9DFC8]">
                  {selectedNode.details.title}
                </h3>
                <p className="text-xs text-[#B8B1A5] mt-1 leading-relaxed whitespace-pre-line">
                  {selectedNode.details.description}
                </p>
              </div>

              {/* Metric Ratings */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#171615] border border-[#3A3631]">
                  <span className="text-[#817A71] text-[10px] block font-mono uppercase">Confidence:</span>
                  <span className="text-[#8BA58A] font-bold font-mono text-sm">
                    {Math.round((selectedNode.details.confidence || 0.9) * 100)}%
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#171615] border border-[#3A3631]">
                  <span className="text-[#817A71] text-[10px] block font-mono uppercase">Importance:</span>
                  <span className="text-[#C86B3C] font-bold font-mono text-sm">
                    {Math.round((selectedNode.details.importance || 0.85) * 100)}%
                  </span>
                </div>
              </div>

              {/* Metadata */}
              {selectedNode.details.metadata && (
                <div className="p-3 rounded-lg bg-[#171615] border border-[#3A3631] space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#817A71] block font-mono">
                    Attributes:
                  </span>
                  <pre className="text-[11px] text-[#5FA7A0] font-mono overflow-x-auto">
                    {JSON.stringify(selectedNode.details.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-[#817A71] text-xs">
              Click any node in the canvas to inspect its parameters.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
