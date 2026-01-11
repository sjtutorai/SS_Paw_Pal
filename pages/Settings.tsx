
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Dog, 
  Bot, 
  Bell, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Moon, 
  Sun, 
  Shield, 
  Syringe,
  Weight,
  Sparkles,
  Zap,
  Activity,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { logout, db } from '../services/firebase';
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { permissionStatus, addNotification, requestPermission } = useNotifications();
  const navigate = useNavigate();
  const [dbUser, setDbUser] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('ssp_dark_mode') === 'true');
  const [prefVaccines, setPrefVaccines] = useState(() => localStorage.getItem('ssp_pref_vaccines') !== 'false');
  const [prefWeight, setPrefWeight] = useState(() => localStorage.getItem('ssp_pref_weight') !== 'false');

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDbUser(docSnap.data());
        }
      }
    };
    fetchUserData();
  }, [user]);

  const togglePreference = (key: string, current: boolean, setter: (v: boolean) => void) => {
    const newVal = !current;
    setter(newVal);
    localStorage.setItem(key, String(newVal));
  };

  const handleTestNotification = () => {
    addNotification('SSP System Test', 'System is online!', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto pb-32 space-y-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest mb-2">Settings</div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Account & Preferences</h2>
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-white rounded-[3.5rem] p-10 md:p-14 border border-slate-100 shadow-sm space-y-10">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Me" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={40} className="text-indigo-300" />
              )}
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-800">@{dbUser?.username || 'user'}</h3>
              <p className="text-slate-500 font-medium">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Display Name</p>
              <p className="font-bold text-slate-800 text-lg">{user?.displayName}</p>
            </div>
            <div className="flex flex-col gap-4">
              <button onClick={() => { logout(); navigate('/login'); }} className="w-full text-indigo-600 font-black flex items-center justify-center gap-2 px-8 py-5 bg-indigo-50 rounded-[2rem] hover:bg-indigo-100 transition-all border border-indigo-100">
                <LogOut size={20} /> Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[3.5rem] p-10 md:p-14 border border-slate-100 shadow-sm space-y-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-50 rounded-3xl text-indigo-600"><Bell size={28} /></div>
            <h3 className="text-2xl font-black text-slate-800">Notification Channels</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={() => togglePreference('ssp_pref_vaccines', prefVaccines, setPrefVaccines)} className={`p-8 rounded-[2.5rem] border transition-all flex items-center justify-between ${prefVaccines ? 'bg-white border-indigo-600 shadow-xl' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-4">
                <Syringe size={24} className={prefVaccines ? "text-indigo-600" : "text-slate-400"} />
                <span className="font-black text-slate-800 text-sm uppercase">Vaccinations</span>
              </div>
              <div className={`w-12 h-6 rounded-full p-1 transition-colors ${prefVaccines ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${prefVaccines ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </button>
            <button onClick={() => togglePreference('ssp_pref_weight', prefWeight, setPrefWeight)} className={`p-8 rounded-[2.5rem] border transition-all flex items-center justify-between ${prefWeight ? 'bg-white border-indigo-600 shadow-xl' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-4">
                <Weight size={24} className={prefWeight ? "text-indigo-600" : "text-slate-400"} />
                <span className="font-black text-slate-800 text-sm uppercase">Weight Checks</span>
              </div>
              <div className={`w-12 h-6 rounded-full p-1 transition-colors ${prefWeight ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${prefWeight ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
