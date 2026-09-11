'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  X,
  MessageSquareText,
  PhoneCall,
} from 'lucide-react';
import { api, AgentConsultResponse } from '@/lib/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  urgency?: 'nominal' | 'warning' | 'critical';
  escalate?: boolean;
  citations?: AgentConsultResponse['citations'];
  toolsExecuted?: string[];
  timestamp: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-0',
    sender: 'agent',
    text: "Hello! I'm your Healios Clinical Recovery Concierge. I have secure real-time access to your postoperative vitals, wound scan history, and verified ERAS recovery protocols. How are you feeling today?",
    urgency: 'nominal',
    timestamp: 'Just now',
  },
];

const SUGGESTIONS = [
  'Is my incision swelling normal?',
  'Can I take Tylenol with my antibiotics?',
  'When can I shower after surgery?',
  'Check my recovery vitals status',
];

export const RecoveryConciergeChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedCitation, setExpandedCitation] = useState<string | null>(null);

  const handleSend = async (queryToSend?: string) => {
    const text = (queryToSend || inputQuery).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const response = await api.consultAgent(text, 'pat-default');
      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: response.response,
        urgency: response.urgency,
        escalate: response.escalate_to_surgeon,
        citations: response.citations,
        toolsExecuted: response.tools_executed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, agentMsg]);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: 'I am temporarily unable to reach the clinical agent service. If you are experiencing fever, purulent drainage, or uncontrolled pain, please contact your surgical clinic directly.',
        urgency: 'warning',
        escalate: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            className="h-13 px-4 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl flex items-center gap-2.5 transition-transform hover:scale-105"
          >
            <div className="relative">
              <Bot className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </div>
            <span className="font-bold text-xs">Recovery Concierge</span>
          </Button>
        </div>
      )}

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-[95vw] sm:w-[460px] h-[600px] max-h-[85vh] bg-card border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <CardHeader className="p-4 border-b border-border bg-muted/40 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  Recovery Concierge AI
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase font-mono text-primary border-primary/30 bg-primary/10">
                    ERAS Grounded
                  </Badge>
                </CardTitle>
                <p className="text-[11px] text-muted-foreground font-mono">
                  Live EHR Biometrics & Protocol Triage
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          {/* Chat Stream Body */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                  )}

                  <div className={`max-w-[85%] space-y-2`}>
                    <div
                      className={`p-3 rounded-2xl leading-relaxed whitespace-pre-line ${
                        isUser
                          ? 'bg-primary text-primary-foreground rounded-tr-xs'
                          : 'bg-muted/40 border border-border/80 text-foreground rounded-tl-xs'
                      }`}
                    >
                      {m.text}
                    </div>

                    {/* Active Tools Executed */}
                    {m.toolsExecuted && m.toolsExecuted.length > 0 && (
                      <div className="flex flex-wrap gap-1 items-center pt-0.5">
                        <span className="text-[10px] text-muted-foreground font-mono">Tools:</span>
                        {m.toolsExecuted.map((tool) => (
                          <span
                            key={tool}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/60 text-foreground/75 border border-border/60"
                          >
                            ✓ {tool}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Citations Card */}
                    {m.citations && m.citations.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1">
                          <BookOpen className="h-3 w-3 text-primary" /> Verified Clinical Grounding:
                        </span>
                        {m.citations.map((c) => (
                          <div
                            key={c.protocol_id}
                            className="p-2 rounded-lg bg-card border border-border/80 text-[11px] space-y-1"
                          >
                            <div
                              onClick={() =>
                                setExpandedCitation(expandedCitation === c.protocol_id ? null : c.protocol_id)
                              }
                              className="flex items-center justify-between cursor-pointer font-semibold text-primary"
                            >
                              <span>
                                [{c.protocol_id}] {c.title}
                              </span>
                              {expandedCitation === c.protocol_id ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </div>
                            {expandedCitation === c.protocol_id && (
                              <p className="text-muted-foreground text-[10px] leading-relaxed pt-1 border-t border-border/50">
                                {c.guideline}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Escalation Call Button */}
                    {m.escalate && (
                      <a href="tel:+15552348901" className="block pt-1">
                        <Button
                          size="sm"
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 h-8 rounded-lg shadow-sm"
                        >
                          <PhoneCall className="h-3.5 w-3.5" /> Call Surgical On-Call Line
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2 items-center text-xs text-muted-foreground p-2 rounded-lg bg-muted/20">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="font-mono text-[11px]">Executing EHR tools & querying ERAS protocols...</span>
              </div>
            )}
          </CardContent>

          {/* Quick Questions Chips */}
          <div className="px-4 py-2 border-t border-border/60 bg-muted/10 flex gap-1.5 overflow-x-auto no-scrollbar">
            {SUGGESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="whitespace-nowrap text-[10px] px-2.5 py-1 rounded-full border border-border bg-card hover:border-primary/50 text-foreground/80 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Footer Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-border bg-card flex gap-2"
          >
            <Input
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about medications, healing, or symptoms..."
              disabled={loading}
              className="h-9 text-xs rounded-xl border-border bg-muted/30 focus-visible:ring-primary"
            />
            <Button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              size="icon"
              className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      )}
    </>
  );
};
