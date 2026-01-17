import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { GoogleGenAI } from "@google/genai";
import { syncPetToDb, getPetById, getPetsByOwnerId } from '../services/firebase';
import jsQR from 'jsqr';
import { 
  Dog, Plus, PawPrint, Camera, CheckCircle2, Bird, Fish, Thermometer,  
  Trash2, Stethoscope, Brain, Wand2, Scan, X, Syringe, TrendingUp, Loader2, Palette, Sparkles, Bug, Droplets
} from 'lucide-react';
import { PetProfile, WeightRecord, VaccinationRecord } from '../types';

export const BREED_DATA: Record<string, string[]> = {
  Dog: ['Labrador Retriever', 'German Shepherd', 'Golden Retriever', 'French Bulldog', 'Poodle', 'Beagle', 'Mixed Breed'],
  Cat: ['Persian', 'Maine Coon', 'Siamese', 'Ragdoll', 'Bengal', 'Mixed Breed'],
  Bird: ['African Grey Parrot', 'Cockatiel', 'Budgerigar', 'Macaw', 'Conure', 'Lovebird', 'Cockatoo'],
  Rabbit: ['Holland Lop', 'Mini Rex', 'Dutch Rabbit', 'Lionhead'],
  Hamster: ['Syrian Hamster', 'Dwarf Hamster', 'Roborovski Hamster'],
  'Guinea Pig': ['Abyssinian', 'American', 'Peruvian', 'Teddy'],
  Rodent: ['Hamster', 'Guinea Pig', 'Fancy Rat', 'Gerbil', 'Chinchilla'],
  Reptile: ['Leopard Gecko', 'Bearded Dragon', 'Ball Python', 'Corn Snake', 'Russian Tortoise'],
  Amphibian: ['Axolotl', 'Pacman Frog', 'African Clawed Frog', 'Fire-Bellied Toad', 'Tiger Salamander'],
  Insect: ['Tarantula', 'Praying Mantis', 'Stick Insect', 'Hissing Cockroach', 'Ant Colony'],
  Other: ['Exotic Pet', 'Wild Animal', 'Invertebrate']
};

export const PET_CATEGORIES = [
  { id: 'mammal', name: 'Mammals', icon: Dog, species: ['Dog', 'Cat', 'Rabbit', 'Rodent'] },
  { id: 'bird', name: 'Birds', icon: Bird, species: ['Bird'] },
  { id: 'fish', name: 'Fish', icon: Fish, species: ['Fish'] },
  { id: 'reptile', name: 'Reptiles', icon: Thermometer, species: ['Reptile'] },
  { id: 'amphibian', name: 'Amphibians', icon: Droplets, species: ['Amphibian'] },
  { id: 'insect', name: 'Insects/Arthropods', icon: Bug, species: ['Insect'] },
  { id: 'other', name: 'Other', icon: Sparkles, species: ['Other'] }
];

const calculateAge = (birthday: string) => {
  if (!birthday) return { years: 0, months: 0 };
  const birthDate = new Date(birthday);
  const today = new Date();
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
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingRecord, setIsAddingRecord] = useState<'vaccine' | 'weight' | null>(null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [newPet, setNewPet] = useState<Partial<PetProfile>>({ name: '', breed: '', birthday: '', bio: '', species: 'Dog', petSpecies: 'Mammals', weightHistory: [], vaccinations: [] });
  const [newRecord, setNewRecord] = useState({ name: '', date: new Date().toISOString().split('T')[0], weight: '', nextDueDate: '' });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPets = async () => {
      if (!user?.uid) return;
      setIsLoading(true);
      try {
        const firestorePets = await getPetsByOwnerId(user.uid);
        setPets(firestorePets);
        if (firestorePets.length > 0) setSelectedPet(firestorePets[0]);
        localStorage.setItem(`ssp_pets_${user.uid}`, JSON.stringify(firestorePets));
      } catch (e) {
        const saved = localStorage.getItem(`ssp_pets_${user.uid}`);
        if (saved) setPets(JSON.parse(saved));
      } finally {
        setIsLoading(false);
      }
    };
    fetchPets();
  }, [user?.uid]);

  const savePet = async (pet: PetProfile) => {
    await syncPetToDb(pet);
    const updated = await getPetsByOwnerId(user!.uid);
    setPets(updated);
    localStorage.setItem(`ssp_pets_${user!.uid}`, JSON.stringify(updated));
    return updated;
  };

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const id = `SSP-${Date.now()}`;
    const { years, months } = calculateAge(newPet.birthday || '');
    const completePet: PetProfile = { 
        ...newPet as PetProfile, 
        id, ownerId: user.uid, ownerName: user.displayName || 'Parent', 
        ageYears: String(years), ageMonths: String(months), 
        weightHistory: [], vaccinations: [], isPublic: false,
        lowercaseName: newPet.name?.toLowerCase() || ''
    };
    await savePet(completePet);
    setSelectedPet(completePet);
    setSaveSuccess(true);
    setTimeout(() => { setIsAdding(false); setSaveSuccess(false); setStep(1); }, 1500);
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPet) return;
    let updatedPet = { ...selectedPet };
    if (isAddingRecord === 'vaccine') updatedPet.vaccinations = [...(updatedPet.vaccinations || []), { name: newRecord.name, date: newRecord.date, nextDueDate: newRecord.nextDueDate }];
    else updatedPet.weightHistory = [...(updatedPet.weightHistory || []), { date: newRecord.date, weight: parseFloat(newRecord.weight) }];
    await savePet(updatedPet);
    setSelectedPet(updatedPet);
    setIsAddingRecord(null);
    setNewRecord({ name: '', date: new Date().toISOString().split('T')[0], weight: '', nextDueDate: '' });
  };

  const generateAIAvatar = async (base64Source?: string) => {
    if (!selectedPet) return;
    setIsGeneratingAvatar(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `A cinematic, realistic 4K portrait of a ${selectedPet.breed} ${selectedPet.species} named ${selectedPet.name} (${selectedPet.petSpecies}).`;
      const contents: any = { parts: [{ text: prompt }] };
      if (base64Source) contents.parts.push({ inlineData: { data: base64Source.split(',')[1], mimeType: 'image/png' } });
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents, config: { imageConfig: { aspectRatio: "1:1" } } });
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const updatedPet = { ...selectedPet, avatarUrl: `data:image/png;base64,${part.inlineData.data}` };
          await savePet(updatedPet);
          setSelectedPet(updatedPet);
          break;
        }
      }
    } catch (err) { addNotification('AI Studio', 'Avatar generation failed.', 'error'); } 
    finally { setIsGeneratingAvatar(false); }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-theme" size={40} /></div>;

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Companion Registry</h2>
          <p className="text-slate-500 font-medium text-sm">Manage profiles and wellness records for your pets.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setStep(1); setIsAdding(true); }} className="flex items-center gap-2 px-6 py-3.5 bg-theme text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-theme-hover transition-all shadow-xl active:scale-95">
            <Plus size={18} /> Register Companion
          </button>
        </div>
      </div>

      <div className="gap-3 overflow-x-auto pb-4 flex">
        {pets.map(p => (
          <button key={p.id} onClick={() => { setSelectedPet(p); setIsAdding(false); }} className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all shrink-0 ${selectedPet?.id === p.id && !isAdding ? 'bg-theme-light border-theme' : 'bg-white border-transparent'}`}>
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
              {p.avatarUrl ? <img src={p.avatarUrl} className="w-full h-full object-cover" /> : <PawPrint size={14} className="text-slate-300" />}
            </div>
            <span className={`font-black text-[10px] uppercase tracking-widest ${selectedPet?.id === p.id ? 'text-theme' : 'text-slate-500'}`}>{p.name}</span>
          </button>
        ))}
      </div>

      {isAdding ? (
        <div className="max-w-2xl mx-auto bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 relative">
          {saveSuccess && <div className="absolute inset-0 bg-theme/95 flex flex-col items-center justify-center z-50 text-white animate-fade-in"><CheckCircle2 size={48} /><h3 className="text-2xl font-black mt-2">Companion Registered</h3></div>}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black">Step {step}: {step === 1 ? 'Select Domain' : 'Details'}</h2>
            <button onClick={() => setIsAdding(false)} className="p-2 text-slate-300 hover:text-slate-500"><X size={20} /></button>
          </div>
          {step === 1 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {PET_CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => { setSelectedCategory(cat); setStep(2); }} className="p-8 rounded-3xl bg-slate-50 hover:bg-theme-light hover:text-theme flex flex-col items-center gap-4 group transition-all">
                  <cat.icon size={32} />
                  <span className="font-black text-[9px] uppercase tracking-widest">{cat.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleAddPet} className="space-y-6">
              <input required value={newPet.name} onChange={e => setNewPet({ ...newPet, name: e.target.value })} className="w-full p-4 bg-slate-50 rounded-xl font-bold" placeholder="Companion's Name" />
              <select value={newPet.species} onChange={e => setNewPet({...newPet, species: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm">
                {selectedCategory?.species.map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input type="date" required value={newPet.birthday} onChange={e => setNewPet({ ...newPet, birthday: e.target.value })} className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm" />
              <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl">Complete Registration</button>
            </form>
          )}
        </div>
      ) : selectedPet ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-xl text-center space-y-6">
            <div className="w-52 h-52 rounded-[3.5rem] overflow-hidden mx-auto shadow-2xl relative border-4 border-white group">
              {selectedPet.avatarUrl ? <img src={selectedPet.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200"><Dog size={64} /></div>}
              {isGeneratingAvatar && <div className="absolute inset-0 bg-white/40 backdrop-blur-md flex items-center justify-center"><Loader2 size={32} className="animate-spin text-theme" /></div>}
              <button onClick={() => generateAIAvatar()} className="absolute bottom-4 right-4 p-3 bg-slate-900 text-theme rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"><Wand2 size={20}/></button>
            </div>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{selectedPet.name}</h3>
            <p className="text-[10px] font-black text-theme uppercase tracking-widest">{selectedPet.breed} · {selectedPet.petSpecies}</p>
          </div>
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm">
             <div className="flex items-center justify-between mb-8">
               <h4 className="font-black text-xl">Health Intelligence</h4>
               <button onClick={() => setIsAddingRecord('vaccine')} className="px-4 py-2 bg-theme text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-theme/10 hover:bg-theme-hover">+ Add Health Log</button>
             </div>
             <div className="space-y-4">
                {selectedPet.vaccinations.map((v, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                    <div><p className="font-black text-slate-800 text-sm">{v.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase">Admin: {v.date}</p></div>
                    <div className="text-right"><p className="text-[8px] font-black text-theme uppercase">Next Due</p><p className="text-[10px] font-black">{v.nextDueDate}</p></div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      ) : (
        <div className="py-40 text-center">
          <h3 className="text-3xl font-black text-slate-900">No companions registered yet.</h3>
          <button onClick={() => { setStep(1); setIsAdding(true); }} className="mt-8 bg-slate-900 text-white px-10 py-5 rounded-3xl font-black uppercase text-xs tracking-widest">Register Now</button>
        </div>
      )}
    </div>
  );
};

export default PetProfilePage;