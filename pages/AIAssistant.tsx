import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Loader2,
  RefreshCcw,
  Search,
  User as UserIcon,
  Sparkles,
  AlertTriangle,
  Info,
  Trash2,
  BrainCircuit,
  ChevronRight
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useAuth } from '../context/AuthContext';
import { PetProfile } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
  grounding?: any[];
  timestamp: Date;
  isThinking?: boolean;
}

const AIAssistant: React.FC = () => {
  const { user } = useAuth();
  const [pet, setPet] = useState<PetProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const QUICK_PROMPTS = [
    'Dietary advice for my breed',
    'Common health red flags',
    'Behavioral training tips',
    'Vaccination schedule'
  ];

  useEffect(() => {
    const saved = localStorage.getItem(`ssp_pets_${user?.uid}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) {
        setPet(parsed[0]);
        setMessages([{
          role: 'model',
          text: `Hello! I'm your AI Pet Care Expert. I've loaded ${parsed[0].name}'s health record. How can I support you both today?`,
          timestamp: new Date()
        }]);
      } else {
        setMessages([{
          role: 'model',
          text: "Welcome! I'm your AI Specialist. Register a pet for personalized medical insights, or ask me any general pet health questions right now!",
          timestamp: new Date()
        }]);
      }
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isThinking]);

  const handleSendMessage = async (textOverride?: string) => {
    const messageText = textOverride || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      text: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsThinking(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const petContext = pet ? `
        PATIENT PROFILE:
        - Name: ${pet.name}
        - Species: ${pet.species}
        - Breed: ${pet.breed}
        - Age: ${pet.ageYears}y ${pet.ageMonths}m
        - Health History: ${pet.healthNotes || 'No prior conditions noted.'}
      ` : 'General pet inquiry (No specific profile).';

      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
          ...history,
          { role: 'user', parts: [{ text: `${petContext}\n\nUSER QUERY: ${messageText}` }] }
        ],
        config: {
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingBudget: 4000 },
          systemInstruction: "You are an Elite Pet Health Specialist. Your goal is to provide deep, reasoned, and accurate medical and behavioral guidance based on the provided pet profile and global veterinary standards. Always prioritize safety. Structure responses with markdown, using ## headers and bullet points. Mention red flags clearly.",
          temperature: 0.8,
        },
      });

      const modelText = response.text || "I was unable to generate a response. Please check your query and try again.";
      const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      setMessages(prev => [...prev, {
        role: 'model',
        text: modelText,
        grounding,
        timestamp: new Date()
      }]);
    } catch (err: any) {
      console.error("AI Assistant Error:", err);
      setMessages(prev => [...prev, {
        role: 'model',
        text: "My diagnostic systems are currently offline. Please ensure you have a stable connection.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  };

  const clearChat = () => {
    if (confirm("Reset current consultation?")) {
      setMessages([{
        role: 'model',
        text: `Consultation cleared. How can I assist ${pet?.name || 'your companion'} now?`,
        timestamp: new Date()
      }]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-6xl mx-auto animate-fade-in relative bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50/80 backdrop-blur-md p-8 border-b border-slate-100 flex items-center justify-between z-10">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-theme text-white rounded-[1.5rem] shadow-xl shadow-theme/20 flex items-center justify-center relative group cursor-pointer transition-theme">
            <Bot size={28} />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI Pet Concierge</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Sparkles size={12} className="text-theme" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Powered by Gemini 3 Pro Reasoning</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={clearChat}
            className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
            title="Clear Chat"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 custom-scrollbar scroll-smooth">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
            <div className={`flex gap-5 max-w-[90%] md:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg border-2 ${
                msg.role === 'user' ? 'bg-white border-slate-100' : 'bg-theme border-theme text-white transition-theme'
              }`}>
                {msg.role === 'user' ? (
                  user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover rounded-2xl" /> : <UserIcon size={24} className="text-slate-300" />
                ) : <Bot size={24} />}
              </div>
              
              <div className="space-y-4">
                <div className={`p-8 rounded-[2.5rem] shadow-xl relative transition-all duration-500 ${
                  msg.role === 'user' 
                  ? 'bg-theme text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 border border-slate-50 rounded-tl-none'
                }`}>
                  <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-headings:text-slate-900 prose-li:font-medium">
                    {msg.text.split('\n').map((line, i) => {
                      const trimmed = line.trim();
                      if (trimmed.startsWith('##')) return <h4 key={i} className={`text-xl font-black mt-6 mb-3 ${msg.role === 'user' ? 'text-white' : 'text-slate-900'}`}>{trimmed.replace('##', '')}</h4>;
                      if (trimmed.startsWith('*') || trimmed.startsWith('-')) return <li key={i} className="ml-5 mb-2 font-medium list-disc">{trimmed.replace(/^[\*\-]\s/, '')}</li>;
                      return <p key={i} className="mb-3 font-medium text-[15px]">{trimmed}</p>;
                    })}
                  </div>
                  <div className={`mt-6 pt-4 border-t flex items-center justify-between ${msg.role === 'user' ? 'border-white/10' : 'border-slate-50'}`}>
                    <span className={`text-[9px] font-black uppercase tracking-widest opacity-40 ${msg.role === 'user' ? 'text-white' : 'text-slate-400'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.role === 'model' && <Sparkles size={14} className="text-theme opacity-30" />}
                  </div>
                </div>

                {/* Grounding Metadata */}
                {msg.grounding && msg.grounding.length > 0 && (
                  <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-700">
                    {msg.grounding.map((chunk, gIdx) => chunk.web && (
                      <a 
                        key={gIdx} 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50/50 border border-indigo-100/50 rounded-xl text-[10px] font-black text-theme uppercase tracking-wider hover:bg-theme hover:text-white transition-all shadow-sm"
                      >
                        <Search size={12} /> {chunk.web.title || 'Source'}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isThinking && (
          <div className="flex justify-start">
            <div className="flex gap-5 max-w-[80%] items-start">
              <div className="w-12 h-12 rounded-2xl bg-theme flex items-center justify-center text-white shadow-xl animate-pulse transition-theme">
                <Bot size={24} />
              </div>
              <div className="bg-slate-50 p-8 rounded-[2.5rem] rounded-tl-none border border-slate-100 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <BrainCircuit size={20} className="text-theme animate-spin duration-3000" />
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Deep Reasoning in Progress...</span>
                </div>
                <div className="space-y-2">
                  <div className="h-1.5 w-48 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-theme w-1/2 animate-shimmer"></div>
                  </div>
                  <div className="h-1.5 w-32 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-theme w-1/3 animate-shimmer [animation-delay:0.5s]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="p-8 bg-slate-50/50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length < 4 && (
            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar-hide">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => handleSendMessage(p)}
                  className="whitespace-nowrap px-6 py-2.5 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:border-theme hover:text-theme hover:shadow-lg transition-all active:scale-95"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
          
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex items-center gap-4"
          >
            <div className="flex-1 relative group">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={`Tell me more about ${pet?.name || 'your pet'}...`}
                className="w-full bg-white border border-slate-200 rounded-[2rem] py-6 px-10 text-[15px] font-medium focus:ring-[12px] focus:ring-theme/5 focus:border-theme transition-all outline-none shadow-sm"
                disabled={isLoading}
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                 <BrainCircuit size={18} className="text-theme opacity-0 group-focus-within:opacity-30 transition-opacity" />
              </div>
            </div>
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-16 h-16 bg-theme text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-theme/30 hover:bg-theme-hover active:scale-90 transition-all disabled:opacity-50 transition-theme"
            >
              {isLoading ? <Loader2 size={28} className="animate-spin" /> : <Send size={28} className="translate-x-0.5 -translate-y-0.5" />}
            </button>
          </form>
          
          <div className="flex items-center justify-center gap-6 opacity-40">
             <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
               <AlertTriangle size={12} /> Veterinary Education Mode
             </div>
             <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
             <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
               <Info size={12} /> Professional Reasoning Enabled
             </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default AIAssistant;