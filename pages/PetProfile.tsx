
import React, { useState, useEffect, useRef } from 'react';
import { 
  Dog, Plus, PawPrint, Weight, ArrowLeft, Camera, Check, 
  Trash2, Edit3, Stethoscope, LineChart, Syringe, Sparkles, 
  Info, Quote, Loader2, Wand2, QrCode, Scan, X, Save, User as UserIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PetProfile, WeightRecord } from '../types';
import { BREED_DATA, PET_CATEGORIES } from '../App';

const PetProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetProfile | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [step, setStep] = useState(1);
  const [newPet, setNewPet] = useState<Partial<PetProfile>>({ name: '', species: 'Dog', breed: '', birthday: '', bio: '' });

  useEffect(() => {
    const saved = localStorage.getItem(`ssp_pets_${user?.uid}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setPets(parsed);
      if (parsed.length > 0) setSelectedPet(parsed[0]);
    }
  }, [user]);

  const handleAddPet = (e: React.FormEvent) => {
    e.preventDefault();
    const id = crypto.randomUUID();
    const completePet: PetProfile = {
      ...newPet as PetProfile,
      id,
      weightHistory: [],
      vaccinations: [],
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${id}`
    };
    const updated = [...pets, completePet];
    localStorage.setItem(`ssp_pets_${user?.uid}`, JSON.stringify(updated));
    setPets(updated);
    setSelectedPet(completePet);
    setIsAdding(false);
    setStep(1);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="rotate-[-2deg] sticker-card bg-white p-6 border-4 border-black inline-block">
          <h2 className="text-5xl font-black text-black tracking-tight">MY PET FAMILY! 🐕‍🦺</h2>
          <p className="text-xl font-bold text-indigo-600">LIST OF ALL MY COOLEST BEST FRIENDS!</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="fun-button bg-yellow-400 px-10 py-5 rounded-full text-2xl font-black hover:rotate-3 transition-transform">
          ADD NEW FRIEND! +
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {pets.map(p => (
          <button 
            key={p.id} 
            onClick={() => { setSelectedPet(p); setIsAdding(false); }}
            className={`sticker-card p-4 flex flex-col items-center gap-3 border-4 transition-all ${selectedPet?.id === p.id ? 'bg-purple-500 border-black text-white' : 'bg-white border-black text-black'}`}
          >
            <div className="w-20 h-20 border-2 border-black rounded-3xl overflow-hidden bg-slate-100 flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
                {p.avatarUrl ? <img src={p.avatarUrl} className="w-full h-full object-cover" /> : <PawPrint size={32} className="text-slate-300" />}
            </div>
            <span className="font-black text-sm uppercase tracking-widest">{p.name}</span>
          </button>
        ))}
      </div>

      {isAdding ? (
        <div className="sticker-card bg-white p-12 border-4 border-black max-w-2xl mx-auto animate-in slide-in-from-bottom-10">
            <h2 className="text-3xl font-black mb-8">NEW PET REGISTRATION! 📋</h2>
            <form onSubmit={handleAddPet} className="space-y-6">
                <div className="space-y-2">
                    <label className="font-black uppercase text-sm">Pet's Name:</label>
                    <input required value={newPet.name} onChange={e => setNewPet({...newPet, name: e.target.value})} className="w-full p-4 border-4 border-black rounded-2xl text-xl font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="font-black uppercase text-sm">Species:</label>
                        <select value={newPet.species} onChange={e => setNewPet({...newPet, species: e.target.value})} className="w-full p-4 border-4 border-black rounded-2xl font-bold">
                            <option value="Dog">Dog 🐕</option>
                            <option value="Cat">Cat 🐈</option>
                            <option value="Rabbit">Rabbit 🐰</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="font-black uppercase text-sm">Birthday:</label>
                        <input type="date" value={newPet.birthday} onChange={e => setNewPet({...newPet, birthday: e.target.value})} className="w-full p-4 border-4 border-black rounded-2xl font-bold" />
                    </div>
                </div>
                <button type="submit" className="fun-button w-full bg-purple-600 text-white py-5 rounded-3xl text-2xl font-black">
                    SAVE MY NEW FRIEND! 💾
                </button>
            </form>
        </div>
      ) : selectedPet && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="sticker-card bg-white p-10 border-4 border-black space-y-6 text-center">
                <div className="w-56 h-56 border-4 border-black rounded-[4rem] mx-auto overflow-hidden bg-slate-50 shadow-[8px_8px_0px_0px_#000]">
                    {selectedPet.avatarUrl ? <img src={selectedPet.avatarUrl} className="w-full h-full object-cover" /> : <Dog size={128} className="m-auto text-slate-200 mt-10" />}
                </div>
                <div>
                    <h3 className="text-4xl font-black">{selectedPet.name.toUpperCase()}</h3>
                    <p className="text-xl font-bold text-purple-600 uppercase tracking-widest">{selectedPet.breed || selectedPet.species}</p>
                </div>
                <div className="p-6 bg-slate-50 border-4 border-black rounded-[3rem] inline-block">
                    <img src={selectedPet.qrCodeUrl} className="w-40 h-40" alt="QR" />
                    <p className="mt-2 text-[10px] font-black uppercase">MY SUPER ID TAG! 🏷️</p>
                </div>
            </div>

            <div className="lg:col-span-2 space-y-10">
                <div className="sticker-card bg-white p-10 border-4 border-black">
                    <h3 className="text-2xl font-black mb-6 flex items-center gap-2"><Weight className="text-red-500" /> HEAVY-O-METER! ⚖️</h3>
                    <div className="h-64 flex items-end gap-2 bg-slate-50 border-2 border-black rounded-3xl p-6 overflow-hidden">
                        {selectedPet.weightHistory.length ? selectedPet.weightHistory.map((w, i) => (
                            <div key={i} className="flex-1 bg-purple-500 border-2 border-black rounded-t-lg" style={{ height: `${(w.weight / 50) * 100}%` }}></div>
                        )) : <p className="m-auto text-slate-400 font-bold">No weight data logged yet! 📈</p>}
                    </div>
                </div>

                <div className="sticker-card bg-indigo-600 p-10 border-4 border-black text-white space-y-4">
                    <h3 className="text-2xl font-black flex items-center gap-2"><Sparkles /> PET BIO:</h3>
                    <p className="text-xl font-bold italic">"{selectedPet.bio || 'This pet is a mysterious hero with no backstory yet...'}"</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default PetProfilePage;