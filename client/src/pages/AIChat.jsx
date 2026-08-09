import React, { useEffect, useRef, useState } from 'react';
import api from '../api/client';
import { Card, Empty, Loading } from '../components/UI';

const QUICK_PROMPTS = [
  'How can I improve soil fertility?',
  'Best irrigation practices for my crops?',
  'How do I prevent crop disease?',
  'Suggest fertilizer application tips',
  'Where can I compare market prices?',
];

export default function AIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get('/chat/history').then((res) => {
      setMessages(res.data.map((m) => ({ role: m.role, content: m.content })));
      setHistoryLoading(false);
    }).catch(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (prompt) => {
    const text = (prompt ?? input).trim();
    if (!text) return;
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/chat', { message: text });
      setMessages((m) => [...m, { role: 'assistant', content: res.data.reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: '⚠️ ' + e.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card>
        <div className="chat-window">
          <div className="chat-history">
            {historyLoading && <Loading />}
            {!historyLoading && messages.length === 0 && (
              <div>
                <Empty message="Start a conversation with your AI farming assistant." />
                <div className="mt-2">
                  {QUICK_PROMPTS.map((q) => (
                    <button key={q} className="btn btn-outline btn-sm mt-1" style={{ marginRight: 8 }} onClick={() => send(q)}>{q}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role === 'user' ? 'msg-user' : 'msg-assistant'}`}>{m.content}</div>
            ))}
            {loading && <div className="msg msg-assistant">Thinking… 🤔</div>}
            <div ref={bottomRef} />
          </div>
          <div className="chat-input">
            <input className="input" value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Ask about crops, pests, soil, weather…" />
            <button className="btn btn-primary" onClick={() => send()} disabled={loading || !input.trim()}>Send</button>
          </div>
        </div>
        <p className="disclaimer small mt-2">KrishiMitra AI provides general guidance only. For high-risk or urgent decisions, always consult a qualified agricultural expert.</p>
      </Card>
    </div>
  );
}

