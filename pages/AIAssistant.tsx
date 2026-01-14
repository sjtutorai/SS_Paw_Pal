
import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Stethoscope, 
  Send, 
  Loader2,
  ArrowLeft,
  RefreshCcw,
  ExternalLink,
  Search,
  User as UserIcon,
  Sparkles,
  AlertTriangle,
  Info,
  ChevronDown,
  Trash2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useAuth } from '../context/AuthContext';
import { PetProfile } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
  grounding?: any[];
  timestamp: Date;
}

const AIAssistant: React.FC = () => {
  const { user } = useAuth();
  const [pet, setPet] = useState<PetProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const QUICK_SYMPTOMS = [
    'Appetite Loss', 'Lethargy', 'Itching', 'Coughing', 
    'Vomiting', 'Diarrhea', 'Limping', 'Anxiety'
  ];

  useEffect(() => {
    const saved = localStorage.getItem(`ssp_pets_${user?.uid}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) {
        setPet(parsed[0]);
        // Initial greeting
        setMessages([{
          role: 'model',
          text: `Hello! I'm your AI Triage Assistant. I've loaded ${parsed[0].name}'s profile (${parsed[0].breed}). How can I help you today?`,
          timestamp: new Date()
        }]);
      } else {
        setMessages([{
          role: 'model',
          text: "Hello! I'm your AI Triage Assistant. Please register a pet in the Pet Profile section for a more personalized analysis, but feel free to ask any general health questions now!",
          timestamp: new Date()
        }]);
      }
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const petContext = pet ? `
        PRIMARY PATIENT CONTEXT:
        - Name: ${pet.name}
        - Species: ${pet.species}
        - Breed: ${pet.breed}
        - Age: ${pet.ageYears}y ${pet.ageMonths}m
        - History: ${pet.healthNotes || 'None'}
      ` : 'No specific pet profile selected.';

      const chatHistory = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
          ...chatHistory,
          { role: 'user', parts: [{ text: `${petContext}\n\nUser Question: ${messageText}` }] }
        ],
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: "You are a professional Pet Care Triage Assistant. Use Google Search grounding to provide verified vet standards. NEVER diagnose; provide educational context, red flags, and triage steps. Keep responses structured and use markdown. If mentioning specific sources, they will be captured in grounding metadata.",
          temperature: 0.7,
        },
      });

      const modelText = response.text || "I'm sorry, I couldn't process that. Please try again.";
      const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      setMessages(prev => [...prev, {
        role: 'model',
        text: modelText,
        grounding,
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error("AI Error:", err);
      setMessages(prev => [...prev, {
        role: 'model',
        text: "I encountered a connection issue. Please check your internet and try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm("Clear consultation history?")) {
      setMessages([{
        role: 'model',
        text: `Consultation reset. How can I help ${pet?.name || 'your pet'} now?`,
        timestamp: new Date()
      }]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto animate-fade-in relative">
      {/* Header */}
      <div className="bg-white border border-slate-100 rounded-t-[3rem] p-6 shadow-sm flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-theme text-white rounded-2xl shadow-lg shadow-theme/20">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">AI Health Support</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gemini 3 Pro + Search Grounding</p>
            </div>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
          title="Clear History"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-slate-50/30 custom-scrollbar border-x border-slate-100">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
            <div className={`flex gap-4 max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm border ${
                msg.role === 'user' ? 'bg-white border-slate-200' : 'bg-theme border-theme text-white'
              }`}>
                {msg.role === 'user' ? (
                  user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover rounded-xl" /> : <UserIcon size={20} className="text-slate-400" />
                ) : <Bot size={20} />}
              </div>
              
              <div className="space-y-4">
                <div className={`p-6 rounded-[2rem] shadow-sm relative ${
                  msg.role === 'user' 
                  ? 'bg-theme text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                }`}>
                  <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed">
                    {msg.text.split('\n').map((line, i) => {
                      const trimmed = line.trim();
                      if (trimmed.startsWith('##')) return <h4 key={i} className={`text-lg font-black mt-4 mb-2 ${msg.role === 'user' ? 'text-white' : 'text-slate-900'}`}>{trimmed.replace('##', '')}</h4>;
                      if (trimmed.startsWith('*') || trimmed.startsWith('-')) return <li key={i} className="ml-4 mb-1 font-medium">{trimmed.replace(/^[\*\-]\s/, '')}</li>;
                      return <p key={i} className="mb-2 font-medium">{trimmed}</p>;
                    })}
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest block mt-3 opacity-40 ${msg.role === 'user' ? 'text-white' : 'text-slate-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Grounding Links */}
                {msg.grounding && msg.grounding.length > 0 && (
                  <div className="flex flex-wrap gap-2 animate-in fade-in duration-700">
                    {msg.grounding.map((chunk, gIdx) => chunk.web && (
                      <a 
                        key={gIdx} 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-[10px] font-black text-theme uppercase tracking-wider hover:bg-theme hover:text-white transition-all shadow-sm"
                      >
                        <Search size={10} /> {chunk.web.title?.slice(0, 20) || 'Source'}...
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="flex gap-4 max-w-[75%]">
              <div className="w-10 h-10 rounded-xl flex-shrink-0 bg-theme flex items-center justify-center text-white">
                <Bot size={20} />
              </div>
              <div className="bg-white border border-slate-100 p-6 rounded-[2rem] rounded-tl-none shadow-sm flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-theme rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-theme rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-theme rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consulting Knowledge Base...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="bg-white border border-slate-100 rounded-b-[3rem] p-6 shadow-xl z-10">
        {messages.length < 3 && (
          <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar-hide">
            {QUICK_SYMPTOMS.map(s => (
              <button
                key={s}
                onClick={() => handleSendMessage(s)}
                className="whitespace-nowrap px-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-xs font-bold text-slate-500 hover:border-theme hover:text-theme hover:bg-white transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex items-center gap-4"
        >
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Ask about ${pet?.name || 'your pet'}...`}
              className="w-full bg-slate-50 border-none rounded-[2rem] py-5 px-8 text-sm font-medium focus:ring-4 focus:ring-theme/10 transition-all outline-none"
              disabled={isLoading}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
               <Sparkles size={16} className="text-theme opacity-30" />
            </div>
          </div>
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-14 h-14 bg-theme text-white rounded-full flex items-center justify-center shadow-xl shadow-theme/20 hover:bg-theme-hover active:scale-90 transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} className="translate-x-0.5 -translate-y-0.5" />}
          </button>
        </form>
        
        <div className="flex items-center justify-center gap-4 mt-4 opacity-40">
           <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-slate-500">
             <AlertTriangle size={10} /> Educational guidance only
           </div>
           <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
           <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-slate-500">
             <Info size={10} /> Consult a local vet for emergencies
           </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
