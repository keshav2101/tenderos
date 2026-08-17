import { useState, useEffect, useRef } from 'react';
import { fetchTenders, fetchChat } from '../services/api';
import ReactMarkdown from 'react-markdown';
import { Bot, Send, Search, Loader2, ScrollText, Info } from 'lucide-react';

export default function Copilot() {
  const [tenders, setTenders] = useState([]);
  const [selectedTender, setSelectedTender] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchTenders(1, {}).then(d => setTenders(d.tenders || [])).catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSelect = (t) => {
    setSelectedTender(t);
    setMessages([{
      role: 'assistant',
      text: `**Hello!** I am **TenderOS AI Copilot**, your intelligent procurement assistant.\n\nI've loaded the context for:\n\n> **${t.title}**\n> Issued by: *${t.organisation}*\n\nYou may ask me about **EMD waivers**, **eligibility criteria**, **GFR 2017 compliance**, **Make in India** requirements, or **bid strategy** for this tender.`
    }]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedTender || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages(p => [...p, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const res = await fetchChat(selectedTender.id, msg);
      setMessages(p => [...p, { role: 'assistant', text: res.answer }]);
    } catch {
      setMessages(p => [...p, { role: 'assistant', text: 'Sorry, I encountered an error. Please check that the backend service is running.' }]);
    } finally { setLoading(false); }
  };

  const filtered = tenders.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.organisation?.toLowerCase().includes(search.toLowerCase())
  );

  const QUICK_PROMPTS = [
    'Am I MSME eligible for EMD waiver?',
    'What are the eligibility criteria?',
    'Explain the GFR 2017 rules here.',
    'What is the bid strategy for this tender?',
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Copilot</h1>
          <p className="page-subtitle">Conversational AI assistant for Indian Government Procurement intelligence</p>
        </div>
        <div className="badge badge-green flex-row gap-1" style={{ padding: '5px 12px' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)' }} />
          AI Engine Active
        </div>
      </div>

      <div className="flex-row" style={{ height: 'calc(100vh - 190px)', gap: 16, alignItems: 'stretch' }}>
        {/* Left — Tender list */}
        <div className="panel" style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header">
            <h2 className="panel-title"><ScrollText size={15} />Select Tender</h2>
          </div>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
            <div className="search-bar" style={{ width: '100%' }}>
              <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input type="text" placeholder="Filter tenders..." value={search} onChange={e => setSearch(e.target.value)} style={{ fontSize: 13 }} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.slice(0, 20).map(t => (
              <div
                key={t.id}
                onClick={() => handleSelect(t)}
                style={{
                  padding: '11px 14px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--gray-100)',
                  borderLeft: selectedTender?.id === t.id ? '3px solid var(--saffron)' : '3px solid transparent',
                  background: selectedTender?.id === t.id ? 'var(--saffron-faint)' : 'white',
                  transition: 'all 0.12s ease',
                }}
                onMouseEnter={e => { if (selectedTender?.id !== t.id) e.currentTarget.style.background = 'var(--gray-50)'; }}
                onMouseLeave={e => { if (selectedTender?.id !== t.id) e.currentTarget.style.background = 'white'; }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: selectedTender?.id === t.id ? 'var(--navy)' : 'var(--text-primary)', marginBottom: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                  {t.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.organisation}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Chat */}
        <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header">
            <h2 className="panel-title"><Bot size={16} />
              {selectedTender ? `Copilot — ${selectedTender.id.substring(0, 10)}…` : 'Tender Copilot'}
            </h2>
            {selectedTender && <span className="badge badge-navy">{selectedTender.organisation?.substring(0, 30)}</span>}
          </div>

          {!selectedTender ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 56, height: 56, background: 'var(--navy-faint)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🤖</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 15 }}>Select a Tender to Begin</div>
                <div className="text-sm text-muted mt-1">Choose from the list on the left to start an AI-powered conversation</div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 10 }}>
                    {m.role === 'assistant' && (
                      <div style={{ width: 30, height: 30, background: 'var(--navy)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, fontSize: 14 }}>🤖</div>
                    )}
                    <div style={{
                      maxWidth: '78%',
                      padding: '12px 16px',
                      borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      fontSize: 13.5,
                      lineHeight: 1.6,
                      ...(m.role === 'user' ? {
                        background: 'var(--navy)',
                        color: 'white',
                        boxShadow: 'var(--shadow-sm)'
                      } : {
                        background: 'white',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-sm)'
                      })
                    }}>
                      {m.role === 'assistant'
                        ? <div className="markdown-body"><ReactMarkdown>{m.text}</ReactMarkdown></div>
                        : m.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex-row gap-2" style={{ color: 'var(--text-muted)', paddingLeft: 40 }}>
                    <Loader2 size={14} className="loading-pulse" />
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick prompts */}
              {messages.length <= 1 && (
                <div style={{ padding: '0 20px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {QUICK_PROMPTS.map(p => (
                    <button key={p} onClick={() => setInput(p)} className="btn btn-outline" style={{ fontSize: 12, padding: '5px 12px' }}>
                      {p}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--gray-50)' }}>
                <form onSubmit={handleSend} className="flex-row gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask about EMD waivers, eligibility, GFR 2017 rules, bid strategy..."
                    className="text-input"
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()} style={{ padding: '8px 16px' }}>
                    <Send size={15} />Send
                  </button>
                </form>
                <div className="flex-row gap-1 mt-2" style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                  <Info size={11} />
                  Powered by TenderOS AI — Specialized in Indian Government Procurement
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
