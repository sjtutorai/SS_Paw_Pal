
import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Stethoscope, 
  Brain, 
  Activity, 
  AlertCircle, 
  ChevronRight, 
  Loader2,
  FileText,
  Zap,
  ShieldAlert,
  ArrowLeft,
  Search,
  Wand2,
  Sparkles
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useAuth } from '../context/AuthContext';
import { PetProfile } from '../types';

const AIAssistant: React.FC = () => {
  const { user } = useAuth();
  const [pet, setPet] = useState<PetProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [groundingChunks, setGroundingChunks] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    type: 'Health',
    urgency: 'Routine',
    details: '',
    symptoms: [] as string[]
  });

  const commonSymptoms = [
    'Not Eating 🍔', 'Feeling Lazy 😴', 'Itchy 🦟', 'Coughing 🤧', 
    'Sick Tummy 🤢', 'Super Thirsty 💧', 'Anxious 😰'
  ];

  useEffect(() => {
    const saved = localStorage.getItem(`ssp_pets_${user?.uid}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) setPet(parsed[0]);
    }
  }, [user]);

  const toggleSymptom = (s: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(s) 
        ? prev.symptoms.filter(item => item !== s) 
        : [...prev.symptoms, s]
    }));
  };

  const handleConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.details && formData.symptoms.length === 0) return;
    
    setIsLoading(true);
    setErrorMessage(null);
    setReport(null);
    setGroundingChunks([]);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        YOU ARE THE MAGIC PAW BOT! BE SUPER FRIENDLY AND FUN! USE EMOJIS!
        Pet: ${pet?.name} (${pet?.species})
        Problem: ${formData.details}
        Symptoms: ${formData.symptoms.join(', ')}
        
        Write a cool report for a kid to read about what to do next. 
        Use headings like: 🚀 SUMMARY, ✨ WHAT MIGHT BE WRONG, 🛠️ NEXT STEPS, 🚨 WARNINGS!
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "You are the Super Friendly Magic Paw Bot. Help pet parents with fun and easy-to-read advice! Use tons of emojis!",
          temperature: 0.9,
        },
      });

      setReport(response.text || "Oops! The bot got confused! 😵");
    } catch (err: any) {
      console.error("AI Error:", err);
      setErrorMessage("The Magic Bot is sleeping... try again later! 💤");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="flex items-center gap-6 mb-8">
        <div className="sticker-card bg-purple-500 p-5 border-4 border-black rotate-[-5deg]">
            <Bot size={48} className="text-white" />
        </div>
        <div>
            <h2 className="text-5xl font-black text-black tracking-tight">MAGIC PAW BOT! 🤖</h2>
            <p className="text-xl font-bold text-purple-600">ASK ME ANYTHING ABOUT YOUR PET!</p>
        </div>
      </div>

      {report || errorMessage ? (
        <div className="space-y-8 animate-in zoom-in">
          <button onClick={() => { setReport(null); setErrorMessage(null); }} className="fun-button bg-white px-6 py-3 rounded-xl flex items-center gap-2">
            <ArrowLeft /> GO BACK
          </button>

          <div className="sticker-card bg-white border-4 border-black overflow-hidden">
            <div className="bg-purple-600 p-8 text-white border-b-4 border-black">
                <h3 className="text-3xl font-black flex items-center gap-3"><Sparkles /> THE MAGIC BOT SAYS...</h3>
            </div>
            <div className="p-10 space-y-6">
                {errorMessage ? (
                    <div className="text-center p-10 bg-red-100 border-2 border-red-500 rounded-3xl">
                        <ShieldAlert size={64} className="mx-auto text-red-500 mb-4" />
                        <p className="text-2xl font-black text-red-600">{errorMessage}</p>
                    </div>
                ) : (
                    <div className="text-xl font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {report}
                    </div>
                )}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleConsultation} className="space-y-10">
            <div className="sticker-card bg-white p-10 border-4 border-black space-y-8">
                <div className="space-y-4">
                    <h3 className="text-2xl font-black flex items-center gap-2 text-indigo-600"><Wand2 /> WHAT'S HAPPENING?</h3>
                    <textarea 
                        required
                        value={formData.details}
                        onChange={e => setFormData({...formData, details: e.target.value})}
                        placeholder="Tell me what your pet is doing today... be specific! 🐶"
                        className="w-full h-48 bg-slate-50 border-4 border-black rounded-[2rem] p-6 text-lg font-bold outline-none focus:bg-white transition-all shadow-inner"
                    />
                </div>

                <div className="space-y-4">
                    <h3 className="text-2xl font-black flex items-center gap-2 text-red-500"><Activity /> ANY SYMPTOMS?</h3>
                    <div className="flex flex-wrap gap-3">
                        {commonSymptoms.map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => toggleSymptom(s)}
                                className={`px-6 py-3 rounded-full border-2 border-black font-black text-sm transition-all shadow-[3px_3px_0px_0px_#000] active:translate-y-1 active:shadow-none ${
                                    formData.symptoms.includes(s) 
                                    ? 'bg-yellow-400 text-black translate-y-1 shadow-none' 
                                    : 'bg-white text-slate-500'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={isLoading}
                className="fun-button w-full bg-purple-600 text-white py-8 rounded-[3rem] text-3xl font-black hover:rotate-1 transition-transform flex items-center justify-center gap-4"
            >
                {isLoading ? <Loader2 className="animate-spin" size={48} /> : <>ASK THE BOT! 🚀</>}
            </button>
        </form>
      )}
    </div>
  );
};

export default AIAssistant;