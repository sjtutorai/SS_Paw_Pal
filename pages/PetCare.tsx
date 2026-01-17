import React, { useState, useEffect } from 'react';
import { 
  Utensils, 
  Moon, 
  CloudRain, 
  Wind, 
  Heart, 
  Baby, 
  Bot, 
  Zap,
  CheckCircle,
  AlertCircle,
  Map,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleGenAI } from "@google/genai";
import { PetProfile } from '../types';

const ProgressBar: React.FC<{ label: string, value: number, color: string }> = ({ label, value, color }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
      <div 
        className={`h-full ${color} transition-all duration-1000 ease-out`} 
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

const PetCare: React.FC = () => {
  const { user } = useAuth();
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [activePet, setActivePet] = useState<PetProfile | null>(null);
  const [stats, setStats] = useState({ hunger: 70, energy: 40, happiness: 85 });
  const [isAnimating, setIsAnimating] = useState<string | null>(null);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`ssp_pets_${user?.uid}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setPets(parsed);
      if (parsed.length > 0) setActivePet(parsed[0]);
    }
  }, [user]);

  // Generate automatic health insight when active pet changes
  useEffect(() => {
    if (activePet) {
      generateHealthInsight();
    }
  }, [activePet]);

  const generateHealthInsight = async () => {
    if (!activePet) return;
    setIsLoadingInsight(true);
    setAiInsight(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analyze this pet's biological profile for professional wellness observation:
      Name: ${activePet.name}
      Breed/Species: ${activePet.breed} ${activePet.species}
      Category: ${activePet.petSpecies}
      Age: ${activePet.ageYears} years, ${activePet.ageMonths} months
      Existing Health Notes: ${activePet.healthNotes || 'No specific notes recorded'}

      Instructions: 
      1. Provide ONE specific, professional wellness insight focused on their biological life-stage or category.
      2. Mention a specific behavioral or dietary observation relevant to this profile.
      3. For seniors, focus on joint/organ health. For young pets, focus on developmental enrichment.
      4. DO NOT provide a medical diagnosis. Keep it authoritative yet caring.
      5. Max 45 words.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setAiInsight(response.text || null);
    } catch (e) {
      console.error("AI Insight failed", e);
    } finally {
      setIsLoadingInsight(false);
    }
  };

  const handleAction = (type: string) => {
    setIsAnimating(type);
    setTimeout(() => setIsAnimating(null), 2000);

    if (type === 'feed') setStats(s => ({ ...s, hunger: Math.min(100, s.hunger + 20) }));
    if (type === 'sleep') setStats(s => ({ ...s, energy: Math.min(100, s.energy + 30) }));
    if (type === 'walk') setStats(s => ({ ...s, happiness: Math.min(100, s.happiness + 20), energy: Math.max(0, s.energy - 15) }));
    if (type === 'play') setStats(s => ({ ...s, happiness: Math.min(100, s.happiness + 25), energy: Math.max(0, s.energy - 10) }));
  };

  const askAiForTreat = async () => {
    if (!activePet) return;
    setAiTip("Asking the experts...");
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `My pet is a ${activePet.breed} ${activePet.species} (${activePet.petSpecies}). 
        Stage: ${activePet.ageYears}y ${activePet.ageMonths}m. 
        What is a healthy, species-appropriate treat or environmental enrichment activity I can give them right now? 
        If species is "Other", provide a safe general enrichment tip. 
        Keep it under 50 words.`,
      });
      setAiTip(response.text || "Fresh habitat water and observation are always great!");
    } catch (e) {
      setAiTip("A peaceful environment is the best treat for any companion!");
    }
  };

  const getAgeMessage = () => {
    if (!activePet) return null;
    const years = parseInt(activePet.ageYears || '0');
    const months = parseInt(activePet.ageMonths || '0');
    const totalMonths = (years * 12) + months;

    if (activePet.petSpecies === 'Mammals' && (totalMonths === 4 || totalMonths === 5)) {
      return {
        title: "🌟 Mammalian Milestone: Teething Phase",
        content: `At ${totalMonths} months, expect significant developmental changes. Focus on gentle socialization and consistent training habits.`,
        icon: Baby,
        color: "bg-amber-100 border-amber-200 text-amber-900"
      };
    } else if (['Reptiles', 'Amphibians', 'Insects/Arthropods'].includes(activePet.petSpecies)) {
       return {
         title: "🌡️ Habitat Monitoring",
         content: "For ectothermic companions, consistent environmental regulation is vital for metabolism and health.",
         icon: Wind,
         color: "bg-sky-50 border-sky-100 text-sky-900"
       };
    } else {
      return {
        title: "🛡️ Proactive Wellness",
        content: "Regular observation of activity levels and species-appropriate appetite is the cornerstone of long-term health.",
        icon: Heart,
        color: "bg-emerald-50 border-emerald-100 text-emerald-900"
      };
    }
  };

  const ageData = getAgeMessage();

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Wellness Portal</h2>
          <p className="text-slate-500 font-medium">Stage-specific monitoring for {activePet?.name || 'your companion'}.</p>
        </div>
        <div className="flex gap-4">
          <select 
            value={activePet?.id || ''} 
            onChange={(e) => setActivePet(pets.find(p => p.id === e.target.value) || null)}
            className="bg-white border border-slate-200 px-6 py-3 rounded-2xl font-bold shadow-sm outline-none cursor-pointer focus:ring-4 focus:ring-theme/5 transition-all"
          >
            {pets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.species})</option>)}
          </select>
          <button 
            onClick={askAiForTreat}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-black transition-all active:scale-95 shadow-xl"
          >
            <Bot size={18} />
            Care Tips
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden relative">
          <div className="p-10 text-center relative z-10">
            <div className="mb-10 relative inline-block">
               <div className={`w-56 h-56 rounded-[5rem] bg-indigo-50 border-4 border-white shadow-2xl overflow-hidden mx-auto transition-all duration-500 ${isAnimating ? 'scale-110 rotate-3' : ''}`}>
                  {activePet?.avatarUrl ? (
                    <img src={activePet.avatarUrl} alt="Pet" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                       <Heart size={64} />
                    </div>
                  )}
               </div>
               {isAnimating && (
                 <div className="absolute -top-4 -right-4 bg-white p-4 rounded-full shadow-2xl animate-bounce">
                    {isAnimating === 'feed' && <Utensils className="text-indigo-600" />}
                    {isAnimating === 'sleep' && <Moon className="text-indigo-600" />}
                    {isAnimating === 'walk' && <Map className="text-indigo-600" />}
                    {isAnimating === 'play' && <Zap className="text-indigo-600" />}
                 </div>
               )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button onClick={() => handleAction('feed')} className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-theme hover:text-white hover:shadow-xl transition-all group flex flex-col items-center gap-3">
                <Utensils className="text-theme group-hover:text-white" />
                <span className="font-black text-xs uppercase tracking-widest">Feed</span>
              </button>
              <button onClick={() => handleAction('sleep')} className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-theme hover:text-white hover:shadow-xl transition-all group flex flex-col items-center gap-3">
                <Moon className="text-theme group-hover:text-white" />
                <span className="font-black text-xs uppercase tracking-widest">Rest</span>
              </button>
              <button onClick={() => handleAction('walk')} className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-theme hover:text-white hover:shadow-xl transition-all group flex flex-col items-center gap-3">
                <Map className="text-theme group-hover:text-white" />
                <span className="font-black text-xs uppercase tracking-widest">Activity</span>
              </button>
              <button onClick={() => handleAction('play')} className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-theme hover:text-white hover:shadow-xl transition-all group flex flex-col items-center gap-3">
                <Zap className="text-theme group-hover:text-white" />
                <span className="font-black text-xs uppercase tracking-widest">Enrich</span>
              </button>
            </div>
          </div>
          
          {aiTip && (
            <div className="absolute inset-x-0 bottom-0 p-6 bg-slate-900 text-white animate-in slide-in-from-bottom-full duration-500 z-20">
               <div className="flex items-start gap-4 max-w-2xl mx-auto">
                 <div className="p-2 bg-white/20 rounded-xl"><Bot size={20} /></div>
                 <p className="text-sm font-medium leading-relaxed italic">"{aiTip}"</p>
                 <button onClick={() => setAiTip(null)} className="text-white/40 hover:text-white">✕</button>
               </div>
            </div>
          )}
        </div>

        <div className="space-y-10">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="font-black text-xl text-slate-800 uppercase tracking-widest">Vital Metrics</h3>
            <div className="space-y-6">
              <ProgressBar label="Maintenance" value={stats.hunger} color="bg-amber-500" />
              <ProgressBar label="Vigor" value={stats.energy} color="bg-theme" />
              <ProgressBar label="Welfare" value={stats.happiness} color="bg-rose-500" />
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
               <Sparkles size={80} />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-theme mb-4 flex items-center gap-2">
               <Bot size={14}/> Biological Insight
            </h4>
            {isLoadingInsight ? (
              <div className="py-4 flex items-center gap-3">
                <Loader2 size={20} className="animate-spin text-theme" />
                <span className="text-xs font-bold text-slate-400">Syncing stage context...</span>
              </div>
            ) : aiInsight ? (
              <p className="text-sm font-medium leading-relaxed italic animate-in fade-in slide-in-from-left-4">
                "{aiInsight}"
              </p>
            ) : (
              <p className="text-xs text-slate-400">Select a profile to activate automated biological tracking.</p>
            )}
          </div>

          {ageData && (
            <div className={`p-8 rounded-[3rem] border-2 shadow-sm ${ageData.color} transition-all duration-500 hover:shadow-md`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm">
                  <ageData.icon size={24} className="text-slate-800" />
                </div>
                <h4 className="font-black text-lg leading-tight tracking-tight">{ageData.title}</h4>
              </div>
              <p className="text-sm font-medium leading-relaxed opacity-90">{ageData.content}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PetCare;