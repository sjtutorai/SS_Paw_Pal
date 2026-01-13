
import React, { useEffect, useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Heart, 
  Calendar, 
  Activity, 
  Plus, 
  PawPrint, 
  Dog, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  CircleDot,
  Trophy,
  PartyPopper,
  Sparkles,
  ChevronDown,
  Edit2,
  X,
  Save,
  Rocket,
  Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Link } from "react-router-dom";
import { AppRoutes, PetProfile } from '../types';

const StatCard: React.FC<{ 
  icon: React.ElementType, 
  label: string, 
  value: string, 
  color: string,
  onEdit?: () => void 
}> = ({ icon: Icon, label, value, color, onEdit }) => (
  <div className={`sticker-card p-6 flex flex-col items-center text-center group cursor-pointer ${color}`}>
    <div className="bg-white border-2 border-black p-3 rounded-full mb-3 shadow-[3px_3px_0px_0px_#000]">
      <Icon className="w-6 h-6 text-black" />
    </div>
    <p className="text-[12px] font-black uppercase tracking-widest text-black/60 mb-1">{label}</p>
    <h3 className="text-2xl font-black text-black">{value}</h3>
    {onEdit && (
        <button onClick={onEdit} className="mt-2 text-[10px] font-black underline">Update ✏️</button>
    )}
  </div>
);

const Home: React.FC = () => {
  const { user } = useAuth();
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [activePet, setActivePet] = useState<PetProfile | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(`ssp_pets_${user?.uid}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setPets(parsed);
      if (parsed.length > 0) setActivePet(parsed[0]);
    }
  }, [user]);

  const firstName = user?.displayName?.split(' ')[0] || 'Friend';
  
  return (
    <div className="space-y-12 pb-20">
      <div className="sticker-card bg-white p-8 border-4 border-black flex flex-col md:flex-row items-center justify-between gap-6 rotate-[-1deg]">
        <div className="space-y-2">
            <h1 className="text-5xl font-black text-black tracking-tight">HI {firstName.toUpperCase()}! 🐾</h1>
            <p className="text-xl font-bold text-purple-600">WELCOME TO THE COOLEST PET APP EVER!!</p>
        </div>
        <div className="flex gap-4">
            <Link to={AppRoutes.CREATE_POST} className="fun-button bg-yellow-400 px-8 py-4 rounded-full text-black flex items-center gap-2 text-xl hover:rotate-2 transition-transform">
                <Plus size={24} /> POST A PIC!
            </Link>
        </div>
      </div>

      {!pets.length ? (
        <div className="sticker-card bg-purple-500 p-12 text-white text-center space-y-8 rotate-[1deg]">
            <div className="inline-block p-6 bg-white border-4 border-black rounded-full shadow-[6px_6px_0px_0px_#000]">
                <Rocket size={64} className="text-black" />
            </div>
            <h2 className="text-4xl font-black">OH NO! YOU HAVE NO PETS YET! 😭</h2>
            <p className="text-xl font-bold">Quick! Click the button below to add your awesome pet companion!</p>
            <Link to={AppRoutes.PET_PROFILE} className="fun-button bg-white text-black px-12 py-6 rounded-full text-2xl inline-block hover:scale-110 transition-transform">
                ADD MY PET NOW! 🐕
            </Link>
        </div>
      ) : (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard icon={Heart} label="Pet Weight" value={activePet?.weightHistory?.[activePet.weightHistory.length - 1]?.weight ? `${activePet.weightHistory[activePet.weightHistory.length - 1].weight} kg` : '--'} color="bg-red-400" />
                <StatCard icon={Star} label="Pet Status" value="SUPER HAPPY!" color="bg-yellow-400" />
                <StatCard icon={Trophy} label="Rank" value="GOLD PAW" color="bg-emerald-400" />
                <StatCard icon={ShieldCheck} label="Safe" value="YES! ✅" color="bg-blue-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 sticker-card bg-white p-10 border-4 border-black space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-orange-400 border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000]">
                            <Activity size={32} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-black text-black">DAILY MISSION: {activePet?.name.toUpperCase()}!</h2>
                    </div>
                    <div className="h-64 bg-slate-100 border-2 border-black rounded-3xl flex flex-col items-center justify-center border-dashed group hover:bg-white transition-all">
                        <Plus size={48} className="text-slate-300 group-hover:text-purple-500 transition-colors" />
                        <p className="text-xl font-black text-slate-400 group-hover:text-black">LOG AN ACTIVITY!</p>
                    </div>
                </div>

                <div className="sticker-card bg-indigo-600 p-8 border-4 border-black text-white space-y-6 rotate-[-2deg]">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black">TODO LIST ✅</h3>
                        <div className="bg-white/20 p-2 rounded-full"><Clock size={20} /></div>
                    </div>
                    <div className="space-y-4">
                        {['Feed Pet 🥩', 'Go For Walk 🌳', 'Brush Fur 🛁'].map((t, i) => (
                            <div key={i} className="bg-white text-black p-4 border-2 border-black rounded-xl font-bold flex items-center gap-3 shadow-[4px_4px_0px_0px_#000]">
                                <div className="w-6 h-6 border-2 border-black rounded-full"></div>
                                {t}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
      )}
    </div>
  );
};

export default Home;