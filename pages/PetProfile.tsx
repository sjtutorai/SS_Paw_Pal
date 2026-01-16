import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { GoogleGenAI } from "@google/genai";
import { syncPetToDb, getPetById } from '../services/firebase';
import jsQR from 'jsqr';
import { 
  Dog, Plus, PawPrint, Camera, CheckCircle2, Bird,  
  Trash2, Stethoscope, Brain, Wand2, Scan, X, Syringe, TrendingUp, Loader2
} from 'lucide-react';
import { PetProfile, WeightRecord, VaccinationRecord } from '../types';

export const BREED_DATA: Record<string, string[]> = {
  Dog: ['Labrador Retriever', 'German Shepherd', 'Golden Retriever', 'French Bulldog', 'Poodle', 'Beagle', 'Mixed Breed'],
  Cat: ['Persian', 'Maine Coon', 'Siamese', 'Ragdoll', 'Bengal', 'Mixed Breed'],
  Bird: ['African Grey Parrot', 'Cockatiel', 'Budgerigar', 'Macaw', 'Conure', 'Lovebird', 'Cockatoo'],
  Rabbit: ['Holland Lop', 'Mini Rex', 'Dutch Rabbit', 'Lionhead'],
  Hamster: ['Syrian Hamster', 'Dwarf Hamster', 'Roborovski Hamster'],
  'Guinea Pig': ['Abyssinian', 'American', 'Peruvian', 'Teddy'],
  Other: ['Exotic Pet', 'Wild Animal', 'Invertebrate']
};

export const PET_CATEGORIES = [
  { id: 'mammal', name: 'Mammals', icon: Dog, species: ['Dog', 'Cat', 'Rabbit', 'Hamster', 'Guinea Pig'] },
  { id: 'bird', name: 'Birds', icon: Bird, species: ['African Grey Parrot', 'Cockatiel', 'Budgerigar', 'Macaw', 'Conure'] },
];

const calculateAge = (birthday: string) => {
  if (!birthday) return { years: 0, months: 0 };
  const birthDate = new Date(birthday);
  const today = new Date();
  if (birthDate > today) return { years: 0, months: 0 };
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  if (months < 0) { years--; months += 12; }
  return { years: Math.max(0, years), months: Math.max(0, months) };
};

const PetProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetProfile | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingRecord, setIsAddingRecord] = useState<'vaccine' | 'weight' | null>(null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [newPet, setNewPet] = useState<Partial<PetProfile>>({ name: '', breed: '', birthday: '', bio: '', species: 'Dog', weightHistory: [], vaccinations: [] });
  const [newRecord, setNewRecord] = useState({ name: '', date: new Date().toISOString().split('T')[0], weight: '', nextDueDate: '' });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const saved = localStorage.getItem(`ssp_pets_${user.uid}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPets(parsed);
        if (parsed.length > 0 && !selectedPet) setSelectedPet(parsed[0]);
      } catch (e) { /* silent fail */ }
    }
  }, [user?.uid]);

  const savePetsToStorage = async (updatedPets: PetProfile[]) => {
    if (!user?.uid) return;
    localStorage.setItem(`ssp_pets_${user.uid}`, JSON.stringify(updatedPets));
    setPets(updatedPets);
    for (const pet of updatedPets) await syncPetToDb(pet);
  };

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const id = `SSP-${Date.now()}`;
    const { years, months } = calculateAge(newPet.birthday || '');
    const completePet: PetProfile = { 
        ...newPet as PetProfile, 
        id, 
        ownerId: user.uid, 
        ownerName: user.displayName || 'Parent', 
        ageYears: String(years), 
        ageMonths: String(months), 
        weightHistory: [], 
        vaccinations: [], 
        isPublic: true,
        lowercaseName: newPet.name?.toLowerCase() || ''
    };
    const updatedPets = [...pets, completePet];
    await savePetsToStorage(updatedPets);
    setSelectedPet(completePet);
    setSaveSuccess(true);
    setTimeout(() => { setIsAdding(false); setSaveSuccess(false); setStep(1); }, 1500);
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPet) return;

    let updatedPet = { ...selectedPet };
    if (isAddingRecord === 'vaccine') {
      const v: VaccinationRecord = { name: newRecord.name, date: newRecord.date, nextDueDate: newRecord.nextDueDate };
      updatedPet.vaccinations = [...(updatedPet.vaccinations || []), v];
    } else {
      const w: WeightRecord = { date: newRecord.date, weight: parseFloat(newRecord.weight) };
      updatedPet.weightHistory = [...(updatedPet.weightHistory || []), w];
    }

    const updatedPets = pets.map(p => p.id === selectedPet.id ? updatedPet : p);
    await savePetsToStorage(updatedPets);
    setSelectedPet(updatedPet);
    setIsAddingRecord(null);
    setNewRecord({ name: '', date: new Date().toISOString().split('T')[0], weight: '', nextDueDate: '' });
    addNotification('Record Added', 'Health logs updated successfully.', 'success');
  };

  const handleDeleteRecord = async (type: 'vaccine' | 'weight', index: number) => {
    if (!selectedPet) return;
    let updatedPet = { ...selectedPet };
    if (type === 'vaccine') {
      const newVaccines = [...(updatedPet.vaccinations || [])];
      newVaccines.splice(index, 1);
      updatedPet.vaccinations = newVaccines;
    } else {
      const newWeight = [...(updatedPet.weightHistory || [])];
      newWeight.splice(index, 1);
      updatedPet.weightHistory = newWeight;
    }
    const updatedPets = pets.map(p => p.id === selectedPet.id ? updatedPet : p);
    await savePetsToStorage(updatedPets);
    setSelectedPet(updatedPet);
    addNotification('Record Deleted', 'Health log removed.', 'info');
  };

  const generateAIAvatar = async (base64Source?: string) => {
    if (!selectedPet) return;
    setIsGeneratingAvatar(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const petDetails = `${selectedPet.breed || ''} ${selectedPet.species}`.trim();
      const prompt = `A cinematic, ultra-high-quality professional studio avatar portrait of a ${petDetails} named ${selectedPet.name}. Detailed textures, vibrant colors, studio spotlighting, 8K resolution.`;
      const parts: any[] = [{ text: prompt }];
      if (base64Source) {
        parts.push({ inlineData: { data: base64Source.split(',')[1], mimeType: 'image/png' } });
      }
      const response = await ai.models.generateContent({ 
        model: 'gemini-2.5-flash-image', 
        contents: { parts }, 
        config: { imageConfig: { aspectRatio: "1:1" } } 
      });
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const avatarUrl = `data:image/png;base64,${part.inlineData.data}`;
            const updatedPet = { ...selectedPet, avatarUrl };
            const updatedPets = pets.map(p => p.id === selectedPet.id ? updatedPet : p);
            await savePetsToStorage(updatedPets);
            setSelectedPet(updatedPet);
            addNotification('AI Studio', 'New avatar generated!', 'success');
            break;
          }
        }
      }
    } catch (err) {
      addNotification('Studio Error', 'AI generation failed.', 'error');
    } finally { 
      setIsGeneratingAvatar(false); 
    }
  };

  const handleScanClick = () => {
    qrFileInputRef.current?.click();
  };

  const handleFileScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = img.width; canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          const petData = await getPetById(code.data);
          if (petData) {
            const userPet = pets.find(p => p.id === petData.id);
            if (userPet) setSelectedPet(userPet); else navigate(`/pet/${petData.id}`);
            addNotification('ID Found', `Profile for ${petData.name} retrieved.`, 'success');
          }
        }
        setIsScanning(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-12 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Companion Registry</h2>
          <p className="text-slate-500 font-bold text-sm mt-1">Manage profiles and health intelligence.</p>
        </div>
        <div className="flex items-center gap-4">
          <input type="file" ref={qrFileInputRef} className="hidden" accept="image/*" onChange={handleFileScan} />
          <button onClick={handleScanClick} disabled={isScanning} className="flex items-center gap-3 px-8 py-4.5 bg-white border border-slate-200 text-slate-600 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50">
            {isScanning ? <Loader2 size={18} className="animate-spin" /> : <Scan size={18} />} Identify Companion
          </button>
          <button onClick={() => { setStep(1); setIsAdding(true); }} className="flex items-center gap-3 px-8 py-4.5 bg-theme text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-theme-hover transition-all shadow-2xl active:scale-95">
            <Plus size={18} /> Register New
          </button>
        </div>
      </div>

      <div className="gap-5 overflow-x-auto pb-6 scroll-hide flex px-2">
        {pets.map(p => (
          <button key={p.id} onClick={() => { setSelectedPet(p); setIsAdding(false); setIsAddingRecord(null); }} className={`flex items-center gap-4 px-6 py-4 rounded-[1.75rem] border-2 transition-all shrink-0 ${selectedPet?.id === p.id && !isAdding ? 'bg-theme-light border-theme shadow-lg scale-105' : 'bg-white border-transparent hover:bg-slate-50'}`}>
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm">
              {p.avatarUrl ? <img src={p.avatarUrl} className="w-full h-full object-cover" /> : <PawPrint size={16} className="text-slate-300" />}
            </div>
            <span className={`font-black text-xs uppercase tracking-widest ${selectedPet?.id === p.id && !isAdding ? 'text-theme' : 'text-slate-500'}`}>{p.name}</span>
          </button>
        ))}
      </div>

      {isAdding ? (
        <div className="max-w-2xl mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 relative overflow-hidden animate-in zoom-in-95 duration-500">
          {saveSuccess && <div className="absolute inset-0 bg-theme/95 flex flex-col items-center justify-center z-50 text-white animate-in fade-in"><CheckCircle2 size={64} /><h3 className="text-3xl font-black mt-4">Registered</h3></div>}
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Step {step}</h2>
            <button onClick={() => setIsAdding(false)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl"><X size={20} /></button>
          </div>
          {step === 1 ? (
            <div className="grid grid-cols-2 gap-5">
              {PET_CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => { setSelectedCategory(cat); setStep(2); }} className="p-12 rounded-[2.5rem] bg-slate-50 hover:bg-theme-light hover:text-theme transition-all flex flex-col items-center gap-6 group">
                  <cat.icon size={56} className="group-hover:scale-110 transition-transform duration-500" />
                  <span className="font-black text-xs uppercase tracking-[0.2em]">{cat.name}</span>
                </button>
              ))}
            </div>
          ) : step === 2 ? (
            <div className="grid grid-cols-2 gap-4">
              {selectedCategory?.species.map((s: string) => (
                <button key={s} onClick={() => { setNewPet({ ...newPet, species: s, breed: BREED_DATA[s]?.[0] || 'Unknown' }); setStep(3); }} className="p-6 rounded-2xl bg-white border border-slate-100 font-black text-slate-700 text-sm uppercase tracking-widest transition-all">{s}</button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleAddPet} className="space-y-8">
              <input required value={newPet.name} onChange={e => setNewPet({ ...newPet, name: e.target.value })} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-lg" placeholder="Companion Name" />
              <input type="date" required value={newPet.birthday} onChange={e => setNewPet({ ...newPet, birthday: e.target.value })} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-lg" />
              <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl">Complete</button>
            </form>
          )}
        </div>
      ) : selectedPet ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 space-y-10">
            <div className="bg-white rounded-[3.5rem] p-10 border border-slate-50 shadow-xl text-center space-y-8 group">
              <div className="w-56 h-56 rounded-[4rem] overflow-hidden mx-auto shadow-2xl relative border-8 border-white transition-all duration-700 hover:scale-[1.05]">
                {selectedPet.avatarUrl ? <img src={selectedPet.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200"><Dog size={80} /></div>}
                {isGeneratingAvatar && <div className="absolute inset-0 bg-white/50 flex flex-col items-center justify-center backdrop-blur-xl animate-in fade-in"><Loader2 size={40} className="animate-spin text-theme mb-3" /><span className="text-[10px] font-black uppercase tracking-[0.4em] text-theme">Designing...</span></div>}
              </div>
              <div className="flex gap-3 justify-center">
                <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 text-slate-400 transition-all hover:text-theme"><Camera size={24} /><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => generateAIAvatar(reader.result as string); reader.readAsDataURL(file); } }} /></button>
                <button onClick={() => generateAIAvatar()} disabled={isGeneratingAvatar} className="p-4 rounded-2xl shadow-xl transition-all bg-slate-900 text-theme hover:bg-black group/wand"><Wand2 size={24} /></button>
              </div>
              <div className="space-y-2 pb-6">
                <h3 className="text-5xl font-black text-slate-900 tracking-tighter">{selectedPet.name}</h3>
                <p className="text-[11px] font-black text-theme uppercase tracking-[0.4em]">{selectedPet.breed} · {selectedPet.species}</p>
                <div className="inline-block mt-6 px-5 py-2 bg-slate-50 rounded-full border border-slate-100 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">ID: {selectedPet.id}</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-[3.5rem] p-10 border border-slate-50 shadow-sm min-h-[600px] flex flex-col relative overflow-hidden">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
               <div className="flex items-center gap-5">
                 <div className="p-4 bg-slate-900 text-theme rounded-2xl shadow-2xl"><Brain size={32} /></div>
                 <div>
                   <h4 className="font-black text-2xl text-slate-900 tracking-tight">Health Intelligence</h4>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1.5">Medical records & AI Insights</p>
                 </div>
               </div>
               <div className="flex gap-3">
                 <button onClick={() => setIsAddingRecord('weight')} className="px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-slate-100">+ Log Weight</button>
                 <button onClick={() => setIsAddingRecord('vaccine')} className="px-6 py-3 bg-theme text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-theme/20 hover:bg-theme-hover transition-theme">+ Add Vaccine</button>
               </div>
             </div>

             {isAddingRecord ? (
               <form onSubmit={handleAddRecord} className="flex-1 bg-slate-50/50 rounded-[2.5rem] p-10 border border-slate-100 space-y-8 animate-in slide-in-from-top-6 relative z-10">
                 <div className="flex items-center justify-between mb-2">
                   <h5 className="font-black text-slate-800 text-sm uppercase tracking-[0.3em]">Add {isAddingRecord === 'vaccine' ? 'Vaccination' : 'Weight'}</h5>
                   <button type="button" onClick={() => setIsAddingRecord(null)} className="p-2 text-slate-400 hover:text-slate-900"><X size={20} /></button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <input type="date" required value={newRecord.date} onChange={e => setNewRecord({...newRecord, date: e.target.value})} className="w-full p-5 rounded-2xl bg-white border border-slate-100 font-black text-sm" />
                   {isAddingRecord === 'vaccine' ? (
                     <>
                       <input required placeholder="Vaccine Name" value={newRecord.name} onChange={e => setNewRecord({...newRecord, name: e.target.value})} className="w-full p-5 rounded-2xl bg-white border border-slate-100 font-black text-sm" />
                       <input type="date" required value={newRecord.nextDueDate} onChange={e => setNewRecord({...newRecord, nextDueDate: e.target.value})} className="w-full p-5 rounded-2xl bg-white border border-slate-100 font-black text-sm" />
                     </>
                   ) : (
                     <input type="number" step="0.01" required placeholder="Weight (KG)" value={newRecord.weight} onChange={e => setNewRecord({...newRecord, weight: e.target.value})} className="w-full p-5 rounded-2xl bg-white border border-slate-100 font-black text-sm" />
                   )}
                 </div>
                 <button type="submit" className="w-full py-5 bg-slate-900 text-theme rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-xl">Secure Health Entry</button>
               </form>
             ) : (selectedPet.vaccinations?.length || 0) + (selectedPet.weightHistory?.length || 0) > 0 ? (
               <div className="flex-1 space-y-12 relative z-10 overflow-y-auto pr-2 custom-scrollbar">
                 {selectedPet.vaccinations && selectedPet.vaccinations.length > 0 && (
                   <div className="space-y-5">
                     <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] flex items-center gap-3"><Syringe size={18} className="text-theme"/> Vaccination Timeline</h5>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {selectedPet.vaccinations.map((v, i) => (
                         <div key={i} className="group p-6 bg-slate-50/50 rounded-[1.75rem] border border-slate-100 flex items-center justify-between hover:bg-white hover:shadow-xl hover:border-theme/10 transition-all duration-500">
                            <div><p className="font-black text-slate-900 text-base">{v.name}</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{v.date}</p></div>
                            <div className="flex items-center gap-4"><div className="text-right"><p className="text-[9px] font-black text-theme uppercase tracking-[0.2em]">Next Due</p><p className="text-xs font-black text-slate-700 mt-1">{v.nextDueDate}</p></div><button onClick={() => handleDeleteRecord('vaccine', i)} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button></div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
                 {selectedPet.weightHistory && selectedPet.weightHistory.length > 0 && (
                   <div className="space-y-5">
                     <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] flex items-center gap-3"><TrendingUp size={18} className="text-theme"/> Weight Analysis</h5>
                     <div className="flex gap-4 overflow-x-auto pb-4 scroll-hide">
                       {selectedPet.weightHistory.map((w, i) => (
                         <div key={i} className="group p-6 bg-white rounded-[1.75rem] border border-slate-100 flex flex-col items-center shrink-0 min-w-[140px] shadow-sm hover:shadow-xl hover:border-theme/10 transition-all duration-500">
                            <button onClick={() => handleDeleteRecord('weight', i)} className="absolute top-3 right-3 p-1.5 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12}/></button>
                            <p className="text-2xl font-black text-slate-900 tracking-tighter">{w.weight} <span className="text-xs text-slate-400">kg</span></p><p className="text-[10px] font-black text-slate-300 uppercase mt-2">{w.date}</p>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-10 relative z-10">
                  <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-8 text-slate-200 border border-dashed border-slate-200"><Stethoscope size={48} /></div>
                  <h5 className="text-2xl font-black text-slate-900 tracking-tight">No health intelligence found</h5>
                  <p className="text-slate-400 font-medium text-sm mt-3 max-w-sm">Add medical logs or vaccination records to unlock health monitoring.</p>
                  <button onClick={() => setIsAddingRecord('vaccine')} className="mt-8 bg-theme text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-theme-hover shadow-2xl transition-theme">+ Add First Record</button>
               </div>
             )}
          </div>
        </div>
      ) : (
        <div className="py-40 text-center animate-in zoom-in-95 duration-500">
          <div className="bg-slate-100/50 w-32 h-32 rounded-[3.5rem] flex items-center justify-center mx-auto mb-10 text-slate-200 border border-slate-100"><Dog size={64} /></div>
          <h3 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">Registry Offline</h3>
          <p className="text-slate-500 font-medium mb-12 max-w-md mx-auto">Register your first companion to unlock AI health tracking.</p>
          <button onClick={() => { setStep(1); setIsAdding(true); }} className="bg-slate-900 text-white px-12 py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl active:scale-95">Start New Registration</button>
        </div>
      )}
    </div>
  );
};

export default PetProfilePage;
