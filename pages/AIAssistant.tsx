
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { PetProfile } from '../types';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Sparkles, Bot, User as UserIcon, Send, Dog, Cat, Syringe, Scissors, AlertTriangle, ChevronDown, PawPrint, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const QUICK_QUESTIONS = [
  { text: "Puppy feeding schedule", icon: Dog },
  { text: "My cat is not eating", icon: Cat },
  { text: "Essential grooming tips", icon: Scissors },
  { text: "Vaccination schedule for new pets", icon: Syringe },
  { text: "When is it an emergency?", icon: AlertTriangle },
];

const AIAssistant: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [activePet, setActivePet] = useState<PetProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.uid) {
      const savedPets = localStorage.getItem(`ssp_pets_${user.uid}`);
      if (savedPets) {
        try {
          const parsedPets: PetProfile[] = JSON.parse(savedPets);
          setPets(parsedPets);
          if (parsedPets.length > 0) {
            setActivePet(parsedPets[0]);
          }
        } catch (e) {
          console.error("Failed to parse pet profiles from storage", e);
        }
      }
    }
  }, [user]);
  
  const systemInstruction = useMemo(() => {
    const petContext = activePet 
      ? `You are advising on the user's current pet, named ${activePet.name}. Here is their profile:
        - Name: ${activePet.name}
        - Species: ${activePet.species}
        - Breed: ${activePet.breed}
        - Age: ${activePet.ageYears} years and ${activePet.ageMonths} months.
        Use this information to make your advice specific and personalized. Address the pet by name.`
      : "The user has not selected a specific pet. Please provide general advice but encourage them to create a pet profile for more personalized help.";

    return `You are SS Paw Pal, a friendly and highly knowledgeable AI veterinary assistant. Your goal is to provide helpful, empathetic, and safe pet care advice.

**Your Persona:**
- **Friendly & Empathetic:** Always start conversations with a warm and reassuring tone. Use pet-friendly emojis like 🐾, ❤️, or ✨ where appropriate.
- **Professional & Cautious:** You are an assistant, not a doctor. **CRITICAL RULE:** At the end of every response that gives any form of advice, you MUST include this exact disclaimer: "Please remember, I'm an AI assistant and not a substitute for a professional veterinarian. For any serious health concerns, please consult your vet immediately."
- **Inquisitive:** When a user presents a vague problem (e.g., "my dog is not eating"), DO NOT jump to solutions. First, ask clarifying questions to gather more information. For example: "I’m so sorry to hear that. To help me understand the situation with ${activePet?.name || 'your pet'} better, could you please tell me: 1. How long has this been happening? 2. Are there any other symptoms like vomiting or lethargy? 3. Is your pet still drinking water?".

**Contextual Awareness:**
${petContext}
`;
  }, [activePet]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (prompt?: string) => {
    const currentInput = prompt || input;
    if (!currentInput.trim() || isLoading) return;

    setInput('');
    setIsLoading(true);

    const userMessage: Message = { role: 'user', text: currentInput };
    setMessages(prev => [...prev, userMessage]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

      const streamResponse = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: [...chatHistory, { role: 'user', parts: [{ text: currentInput }] }],
        config: {
          systemInstruction: systemInstruction,
        },
      });

      let modelResponseText = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of streamResponse) {
        const c = chunk as GenerateContentResponse;
        if (c && c.text) {
          modelResponseText += c.text;
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { role: 'model', text: modelResponseText };
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.error("Gemini API error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    handleSendMessage(question);
  };
  
  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">AI Consultant</h2>
          <p className="text-slate-500 font-medium">Your smart, friendly guide to pet wellness.</p>
        </div>
        
        {pets.length > 0 && (
          <div className="relative group">
            <button className="flex items-center gap-3 bg-white border border-slate-200 px-5 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm text-sm">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                {activePet?.avatarUrl ? <img src={activePet.avatarUrl} className="w-full h-full object-cover" /> : <PawPrint size={16} className="m-2 text-slate-300"/>}
              </div>
              <span className="text-slate-700">Advising for: <span className="text-theme">{activePet?.name}</span></span>
              <ChevronDown size={18} className="text-slate-400" />
            </button>
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50 p-2 space-y-1">
              {pets.map(p => (
                <button key={p.id} onClick={() => setActivePet(p)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm ${activePet?.id === p.id ? 'bg-theme-light text-theme' : 'text-slate-700 hover:bg-slate-50'}`}>
                  <div className="w-8 h-8 rounded-md overflow-hidden bg-slate-50 flex items-center justify-center flex-shrink-0">
                      {p.avatarUrl ? <img src={p.avatarUrl} className="w-full h-full object-cover" /> : <PawPrint size={16} className="text-slate-300" />}
                  </div>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl h-[calc(100vh-20rem)] min-h-[500px] flex flex-col overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
              <Bot size={48} className="mb-4 text-slate-300" />
              <h3 className="text-xl font-black text-slate-700">SS Paw Pal AI Assistant</h3>
              <p className="font-medium text-sm max-w-xs">How can I help you and {activePet ? activePet.name : 'your companion'} today?</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`flex gap-4 items-start ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'model' && <div className="w-10 h-10 bg-slate-900 text-theme rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"><Sparkles size={20} /></div>}
                <div className={`p-5 rounded-[1.5rem] max-w-xl shadow-sm leading-relaxed font-medium text-sm ${msg.role === 'user' ? 'bg-theme text-white rounded-br-none' : 'bg-slate-50 text-slate-800 rounded-bl-none'}`}>
                  {msg.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                </div>
                {msg.role === 'user' && (
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-100">
                    {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover rounded-xl" /> : <UserIcon size={20} className="text-slate-400" />}
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && messages.length > 0 && (
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-slate-900 text-theme rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"><Sparkles size={20} className="animate-pulse" /></div>
              <div className="p-5 rounded-[1.5rem] bg-slate-50 text-slate-400 font-medium rounded-bl-none shadow-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions & Input */}
        <div className="p-6 bg-white border-t border-slate-50 space-y-4">
          {messages.length === 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scroll-hide">
              {QUICK_QUESTIONS.map(q => (
                <button key={q.text} onClick={() => handleQuickQuestion(q.text)} className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-theme-light text-slate-600 hover:text-theme rounded-full text-xs font-bold whitespace-nowrap transition-all border border-slate-100">
                  <q.icon size={14} />
                  {q.text}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your pet's health, diet, or behavior..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:ring-4 focus:ring-theme/10 transition-all font-medium text-sm outline-none"
            />
            <button type="submit" disabled={isLoading || !input.trim()} className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg hover:bg-black disabled:opacity-50 transition-all active:scale-95">
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
