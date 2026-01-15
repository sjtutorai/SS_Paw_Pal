
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
  TrendingUp,
  Sparkles,
  ChevronDown,
  Edit2,
  X,
  Save,
  ArrowRight,
  // Added missing LayoutGrid icon
  LayoutGrid
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Link } from "react-router-dom";
import { AppRoutes, PetProfile } from '../types';

interface RoutineTask {
  id: string;
  task: string;
  startHour: number;
  endHour: number;
  timeLabel: string;
}

const STAT_ROUTINE: RoutineTask[] = [
  { id: 'morning_walk', task: 'Morning Walk', startHour: 7, endHour: 9, timeLabel: '07:00 - 09:00' },
  { id: 'breakfast', task: 'Breakfast', startHour: 8, endHour: 10, timeLabel: '08:00 - 10:00' },
  { id: 'midday_play', task: 'Lunch/Exercise', startHour: 12, endHour: 14, timeLabel: '12:00 - 14:00' },
  { id: 'dinner', task: 'Evening Meal', startHour: 18, endHour: 20, timeLabel: '18:00 - 20:00' },
  { id: 'night_walk', task: 'Night Walk', startHour: 21, endHour: 23, timeLabel: '21:00 - 23:00' },
];

const MetricCard: React.FC<{ 
  icon: React.ElementType, 
  label: string, 
  value: string, 
  trend?: string,
  colorClass: string,
  onAction?: () => void 
}> = ({ icon: Icon, label, value, trend, colorClass, onAction }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-xl ${colorClass}`}>
        <Icon size={20} />
      </div>
      {trend && (
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
          <TrendingUp size={10} /> {trend}
        </span>
      )}
    </div>
    <div className="space-y-1">
      <p className="text-slate-500 text-xs font-semibold">{label}</p>
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        {onAction && (
          <button onClick={onAction} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-theme transition-all">
            <Edit2 size={14} />
          </button>
        )}
      </div>
    </div>
  </div>
);

const Home: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [activePet, setActivePet] = useState<PetProfile | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [appointments, setAppointments] = useState(() => localStorage.getItem(`ssp_appointments_${user?.uid}`) || '0 Scheduled');
  const [exercise, setExercise] = useState(() => localStorage.getItem(`ssp_exercise_${user?.uid}`) || '0');
  const [editingStat, setEditingStat] = useState<'appointments' | 'exercise' | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
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

  const currentHour = currentTime.getHours();

  const handleSaveStat = () => {
    if (editingStat === 'appointments') {
      setAppointments(editValue);
      localStorage.setItem(`ssp_appointments_${user?.uid}`, editValue);
    } else if (editingStat === 'exercise') {
      setExercise(editValue);
      localStorage.setItem(`ssp_exercise_${user?.uid}`, editValue);
    }
    setEditingStat(null);
  };

  const getTaskStatus = (task: RoutineTask) => {
    if (currentHour >= task.endHour) return 'completed';
    if (currentHour >= task.startHour && currentHour < task.endHour) return 'active';
    return 'upcoming';
  };

  const dayStatus = useMemo(() => {
    const completedCount = STAT_ROUTINE.filter(t => currentHour >= t.endHour).length;
    const progress = Math.round((completedCount / STAT_ROUTINE.length) * 100);
    return { progress, completedCount };
  }, [currentHour]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.displayName?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Your pet companion status is healthy.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {pets.length > 1 && (
            <div className="relative group">
              <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:border-slate-300 transition-all shadow-sm">
                <Dog size={16} className="text-slate-400" />
                {activePet?.name}
                <ChevronDown size={14} />
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50 overflow-hidden">
                {pets.map(p => (
                  <button key={p.id} onClick={() => setActivePet(p)} className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Link 
            to={AppRoutes.PET_PROFILE}
            className="bg-theme text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-theme-hover transition-all shadow-lg shadow-theme/10"
          >
            <Plus size={16} /> New Record
          </Link>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          icon={Heart} 
          label="Recent Weight" 
          value={activePet?.weightHistory?.length ? `${activePet.weightHistory[activePet.weightHistory.length-1].weight} kg` : '--'} 
          trend="+0.2kg"
          colorClass="bg-rose-50 text-rose-600"
        />
        <MetricCard 
          icon={Calendar} 
          label="Appointments" 
          value={appointments} 
          colorClass="bg-indigo-50 text-indigo-600"
          onAction={() => { setEditingStat('appointments'); setEditValue(appointments); }}
        />
        <MetricCard 
          icon={Activity} 
          label="Exercise Duration" 
          value={`${exercise}m`} 
          trend="+12%"
          colorClass="bg-emerald-50 text-emerald-600"
          onAction={() => { setEditingStat('exercise'); setEditValue(exercise); }}
        />
        <MetricCard 
          icon={ShieldCheck} 
          label="Medical Status" 
          value="Up to date" 
          colorClass="bg-blue-50 text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed/Insights Section */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles size={18} className="text-theme" />
                AI Health Insights
              </h4>
              <Link to={AppRoutes.AI_ASSISTANT} className="text-xs font-bold text-theme hover:underline flex items-center gap-1">
                Full Consultation <ArrowRight size={12} />
              </Link>
            </div>
            <div className="p-8">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex gap-4">
                <div className="p-3 bg-white rounded-xl h-fit border border-slate-200">
                  <Activity size={24} className="text-theme" />
                </div>
                <div className="space-y-2">
                  <h5 className="font-bold text-slate-800 text-sm">Vital Observation</h5>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    {activePet ? `Based on ${activePet.name}'s latest activity logs, their energy levels are peaking during morning hours. Consider moving intensive exercise to 08:30 AM for optimal metabolic response.` : 'Register a pet to receive personalized health and activity insights driven by Google Gemini.'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link to={AppRoutes.CREATE_POST} className="bg-slate-900 text-white p-8 rounded-[2rem] hover:bg-black transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <LayoutGrid size={80} />
              </div>
              <h4 className="text-xl font-bold mb-2">Social Feed</h4>
              <p className="text-slate-400 text-xs font-medium max-w-[180px]">Connect with the community and share moments.</p>
              <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-theme">
                View Posts <ArrowRight size={14} />
              </div>
            </Link>
            <Link to={AppRoutes.PET_CARE} className="bg-indigo-600 text-white p-8 rounded-[2rem] hover:bg-indigo-700 transition-all group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Activity size={80} />
              </div>
              <h4 className="text-xl font-bold mb-2">Care Planner</h4>
              <p className="text-indigo-100 text-xs font-medium max-w-[180px]">Automate your pet's daily medication and routine.</p>
              <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/90">
                Manage Daily <ArrowRight size={14} />
              </div>
            </Link>
          </section>
        </div>

        {/* Right Sidebar - Routine */}
        <div className="space-y-8">
          <section className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-base font-bold text-slate-900">Today's Progress</h4>
              <span className="text-[10px] font-bold text-theme bg-theme/5 px-2 py-0.5 rounded-full">{dayStatus.progress}%</span>
            </div>
            
            <div className="h-2 w-full bg-slate-100 rounded-full mb-8 overflow-hidden">
              <div 
                className="h-full bg-theme transition-all duration-1000" 
                style={{ width: `${dayStatus.progress}%` }} 
              />
            </div>

            <div className="space-y-4">
              {STAT_ROUTINE.map(task => {
                const status = getTaskStatus(task);
                return (
                  <div key={task.id} className="flex items-center gap-4 group">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                      status === 'completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                      status === 'active' ? 'bg-theme text-white border-theme animate-pulse' :
                      'bg-slate-50 border-slate-100 text-slate-300'
                    }`}>
                      {status === 'completed' ? <CheckCircle2 size={16} /> : <CircleDot size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {task.task}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400">{task.timeLabel}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {!activePet && (
            <div className="bg-gradient-to-br from-theme to-indigo-700 p-8 rounded-[2rem] text-white shadow-xl">
              <h4 className="text-lg font-bold mb-2">Missing Pet Profile</h4>
              <p className="text-white/80 text-xs font-medium leading-relaxed mb-6">
                Complete your pet's identity to unlock medical tracking and unique QR ID tags.
              </p>
              <Link to={AppRoutes.PET_PROFILE} className="block text-center py-3 bg-white text-theme rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors">
                Register Pet
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal Overlay */}
      {editingStat && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Update {editingStat}</h3>
              <button onClick={() => setEditingStat(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entry Value</label>
              <input 
                autoFocus
                type="text"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-800 outline-none focus:ring-4 focus:ring-theme/5 focus:border-theme/30 transition-all"
              />
            </div>
            <button onClick={handleSaveStat} className="w-full py-4 bg-theme text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-theme-hover transition-all">
              Save Entry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
