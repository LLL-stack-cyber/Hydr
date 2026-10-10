import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Cpu, ShieldCheck, Trash2, RefreshCw } from 'lucide-react';
import { auth, db, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from '../services/firebase';

interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp?: any;
}

export function GeminiChatTab() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'Hello! I am your HydroGuard AI Water Reclamation Assistant, powered by Gemini. Ask me anything about water purification, Random Forest sensor anomalies, INSEF project architecture, or fluid dynamics.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.5-flash');
  const [systemRole, setSystemRole] = useState('You are HydroGuard AI, an expert autonomous water reclamation, IoT sensor, and INSEF science fair assistant.');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUser = auth.currentUser;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat history from Firestore if user is logged in
  useEffect(() => {
    async function fetchHistory() {
      if (!currentUser) return;
      try {
        const q = query(
          collection(db, `users/${currentUser.uid}/chats`),
          orderBy('timestamp', 'asc'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        const loaded: Message[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.role && data.content) {
            loaded.push({ role: data.role, content: data.content });
          }
        });
        if (loaded.length > 0) {
          setMessages(loaded);
        }
      } catch (e) {
        console.warn("Could not fetch chat history from Firestore:", e);
      }
    }
    fetchHistory();
  }, [currentUser]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Save user msg to Firestore if authenticated
      if (currentUser) {
        await addDoc(collection(db, `users/${currentUser.uid}/chats`), {
          role: 'user',
          content: userMsg,
          timestamp: serverTimestamp()
        });
      }

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: messages,
          model: selectedModel,
          systemInstruction: systemRole
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to get response');

      const modelReply = data.text || 'No response returned.';
      const updatedMessages: Message[] = [...newMessages, { role: 'model', content: modelReply }];
      setMessages(updatedMessages);

      // Save model reply to Firestore
      if (currentUser) {
        await addDoc(collection(db, `users/${currentUser.uid}/chats`), {
          role: 'model',
          content: modelReply,
          timestamp: serverTimestamp()
        });
      }
    } catch (err: any) {
      setMessages([...newMessages, { role: 'model', content: `[Error: ${err.message || 'AI request failed'}]` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0A0A] text-white p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-wide flex items-center gap-2">
            <Sparkles className="text-cyan-400" size={22} />
            Gemini Water AI Advisor & Chatbot
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Multi-turn intelligent assistant with role configuration and persistent Firestore history.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="block text-[10px] uppercase font-semibold text-gray-400 mb-1">Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-black/60 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="gemini-3.5-flash">gemini-3.5-flash (General / Fast)</option>
              <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex / STEM)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra-fast)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-gray-400 mb-1">Expert Persona</label>
            <select
              value={systemRole}
              onChange={(e) => setSystemRole(e.target.value)}
              className="bg-black/60 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value="You are HydroGuard AI, an expert autonomous water reclamation and IoT sensor assistant.">HydroGuard Water Expert</option>
              <option value="You are an INSEF senior science fair judge and PhD hydrologist evaluating water filtration innovations.">INSEF Science Fair Judge</option>
              <option value="You are an Embedded IoT Engineer specializing in ESP32, MQTT telemetry, and SCADA control loops.">Embedded IoT Engineer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chat Messages Scrollable Thread */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                <Bot size={18} />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-cyan-600 text-black font-medium'
                  : 'bg-[#12131A] border border-white/10 text-gray-200'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <User size={18} />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Bot size={18} />
            </div>
            <div className="bg-[#12131A] border border-white/10 rounded-2xl px-4 py-3 text-xs text-gray-400 flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              Gemini is reasoning through telemetry and water reclamation protocols...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="flex gap-3 items-center bg-[#12131A] border border-white/10 rounded-xl p-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Gemini about water turbidity spikes, pH thresholds, or IoT control loops..."
          className="flex-1 bg-transparent px-3 py-2 text-sm text-white focus:outline-none placeholder:text-gray-500 font-sans"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-cyan-500 hover:bg-cyan-400 text-black px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-40"
        >
          <Send size={15} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
