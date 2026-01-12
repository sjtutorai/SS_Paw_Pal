
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
  Shield, 
  Syringe,
  Weight,
  Sparkles,
  Zap,
  Activity,
  User as UserIcon,
  Edit3,
  X,
  Save,
  Loader2,
  AtSign,
  Phone,
  Palette,
  // Fix: Added Plus icon import
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { logout, db, updateUserProfile } from '../services/firebase';
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

const THEME_PRESETS = [
  { name: 'Indigo', color: '#4f46e5' },
  { name: 'Rose', color: '#e11d48' },
  { name: 'Emerald', color: '#10b981' },
  { name: 'Amber', color: '#f59e0b' },
  { name: 'Violet', color: '#7c3aed' },
  { name: 'Sky', color: '#0ea5e9' },
  { name: 'Midnight', color: '#0f172a' },
];

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  
  const [dbUser, setDbUser] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('ssp_theme_color') || '#4f46e5');
  
  // Form State
  const [editData, setEditData] = useState({
    displayName: '',
    username: '',
    phoneNumber: ''
  });
  
  const [prefVaccines, setPrefVaccines] = useState(() => localStorage.getItem('ssp_pref_vaccines') !== 'false');
  const [prefWeight, setPrefWeight] = useState(() => localStorage.getItem('ssp_pref_weight') !== 'false');

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDbUser(data);
          setEditData({
            displayName: data.displayName || user.displayName || '',
            username: data.username || '',
            phoneNumber: data.phoneNumber || ''
          });
        }
      }
    };
    fetchUserData();
  }, [user]);

  const changeTheme = (color: string) => {
    setCurrentTheme(color);
    localStorage.setItem('ssp_theme_color', color);
    addNotification('Theme Updated', 'Your visual preferences have been applied.', 'success');
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    setSaveStatus(null);
    
    try {
      await updateUserProfile(user.uid, {
        displayName: editData.displayName,
        username: editData.username,
        phoneNumber: editData.phoneNumber
      });
      
      setDbUser((prev: any) => ({ 
        ...prev, 
        displayName: editData.displayName,
        username: editData.username.toLowerCase(),
        phoneNumber: editData.phoneNumber
      }));
      
      setSaveStatus({ message: 'Profile updated successfully!', type: 'success' });
      setIsEditing(false);
      addNotification('Profile Updated', 'Your identity and contact info have been saved.', 'success');
    } catch (error: any) {
      setSaveStatus({ message: error.message || 'Failed to update profile', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-32 space-y-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex px-4 py-1.5 bg-theme-light text-theme rounded-full text-xs font-black uppercase tracking-widest mb-2 transition-theme">Personalization</div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Settings Hub</h2>
        </div>
        {saveStatus && (
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border animate-in slide-in-from-top-4 ${saveStatus.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
            {saveStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="font-bold text-sm">{saveStatus.message}</span>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {/* Profile Card */}
        <div className="bg-white rounded-[3.5rem] p-10 md:p-14 border border-slate-100 shadow-sm space-y-10 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-32 h-32 rounded-[3rem] bg-theme-light border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden shrink-0 relative transition-theme">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Me" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={56} className="text-theme opacity-30" />
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-4">
              {isEditing ? (
                <div className="space-y-4 max-w-md">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      value={editData.displayName}
                      onChange={(e) => setEditData({...editData, displayName: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl font-bold text-slate-800 outline-none ring-theme focus:ring-4 transition-all"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unique Handle</label>
                    <div className="relative">
                      <AtSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        value={editData.username}
                        onChange={(e) => setEditData({...editData, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                        className="w-full bg-slate-50 border border-slate-200 p-3 pl-10 rounded-2xl font-bold text-slate-800 outline-none ring-theme focus:ring-4 transition-all"
                        placeholder="username"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number (For other parents to call you)</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="tel"
                        value={editData.phoneNumber}
                        onChange={(e) => setEditData({...editData, phoneNumber: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 p-3 pl-10 rounded-2xl font-bold text-slate-800 outline-none ring-theme focus:ring-4 transition-all"
                        placeholder="+1 234 567 890"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex-1 bg-theme text-white py-3 rounded-2xl font-black flex items-center justify-center gap-2 bg-theme-hover transition-all shadow-xl active:scale-95 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      Save Changes
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                      className="px-6 bg-slate-100 text-slate-500 py-3 rounded-2xl font-black hover:bg-slate-200 transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <h3 className="text-4xl font-black text-slate-800 tracking-tight">@{dbUser?.username || 'user'}</h3>
                    <span className="px-3 py-1 bg-theme-light text-theme rounded-full text-[10px] font-black uppercase tracking-widest transition-theme">
                      {dbUser?.displayName || user?.displayName}
                    </span>
                  </div>
                  <p className="text-slate-400 font-bold text-lg">{user?.email}</p>
                  {dbUser?.phoneNumber && (
                    <p className="text-emerald-600 font-black text-sm flex items-center gap-2">
                      <Phone size={14} /> {dbUser.phoneNumber}
                    </p>
                  )}
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg"
                  >
                    <Edit3 size={14} /> Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Theme Picker Section */}
        <div className="bg-white rounded-[3.5rem] p-10 md:p-14 border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-theme-light text-theme rounded-2xl transition-theme">
              <Palette size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">App Theme Color</h3>
              <p className="text-slate-500 font-medium text-sm">Choose the primary color for buttons, headers, and accents.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {THEME_PRESETS.map((theme) => (
              <button
                key={theme.color}
                onClick={() => changeTheme(theme.color)}
                className={`group relative flex flex-col items-center gap-2 p-2 rounded-3xl transition-all ${
                  currentTheme === theme.color ? 'bg-slate-50 ring-2 ring-slate-200' : 'hover:bg-slate-50'
                }`}
              >
                <div 
                  className={`w-14 h-14 rounded-2xl shadow-lg transition-transform group-hover:scale-110 flex items-center justify-center ${
                    currentTheme === theme.color ? 'scale-105' : ''
                  }`}
                  style={{ backgroundColor: theme.color }}
                >
                  {currentTheme === theme.color && <CheckCircle2 size={24} className="text-white" />}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${
                  currentTheme === theme.color ? 'text-theme' : 'text-slate-400'
                }`}>
                  {theme.name}
                </span>
              </button>
            ))}
            
            {/* Custom Color Picker (Optional/Bonus) */}
            <label className="group relative flex flex-col items-center gap-2 p-2 rounded-3xl hover:bg-slate-50 cursor-pointer">
              <div className="w-14 h-14 rounded-2xl shadow-lg bg-gradient-to-tr from-rose-500 via-indigo-500 to-emerald-500 flex items-center justify-center transition-transform group-hover:scale-110">
                <Plus size={24} className="text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Custom</span>
              <input 
                type="color" 
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => changeTheme(e.target.value)}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
