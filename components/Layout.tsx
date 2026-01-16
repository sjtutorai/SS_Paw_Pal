import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, User as UserIcon, Trash2, CheckCircle2, AlertTriangle, Info, X, Search, Settings as SettingsIcon, Dog, Sparkles } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNotifications, AppNotification } from '../context/NotificationContext';
import { Link, useLocation } from "react-router-dom";
import { AppRoutes } from '../types';

interface NotificationItemProps { 
  notif: AppNotification; 
  onMarkRead: (id: string) => void; 
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notif, onMarkRead }) => {
  const Icon = notif.type === 'warning' ? AlertTriangle : notif.type === 'success' ? CheckCircle2 : Info;
  const colorClass = notif.type === 'warning' ? 'text-amber-500 bg-amber-50' : notif.type === 'success' ? 'text-emerald-500 bg-emerald-50' : 'text-indigo-500 bg-indigo-50';

  return (
    <div 
      className={`p-5 hover:bg-slate-50 transition-colors border-b border-slate-100 flex gap-4 items-start ${!notif.read ? 'bg-indigo-50/20' : ''}`}
      onClick={() => onMarkRead(notif.id)}
    >
      <div className={`p-2.5 rounded-xl shrink-0 ${colorClass} shadow-sm`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 space-y-0.5">
        <h5 className="text-xs font-black text-slate-800 uppercase tracking-tight">{notif.title}</h5>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">{notif.message}</p>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const { notifications, unreadCount, markAsRead, clearAll } = useNotifications();
  const notifRef = useRef<HTMLDivElement>(null);

  const LOGO_URL = "https://res.cloudinary.com/dazlddxht/image/upload/v1768234409/SS_Paw_Pal_Logo_aceyn8.png";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === AppRoutes.HOME) return "Dashboard";
    if (path === AppRoutes.AI_ASSISTANT) return "AI Consultation";
    if (path === AppRoutes.PET_CARE) return "Daily Wellness";
    if (path === AppRoutes.CREATE_POST) return "Community Feed";
    if (path === AppRoutes.CHAT) return "Direct Messages";
    if (path === AppRoutes.PET_PROFILE) return "Pet Family";
    if (path === AppRoutes.SETTINGS) return "Account Hub";
    return "SS Paw Pal";
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50/40">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <div className={`
        flex-1 flex flex-col overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
      `}>
        <header className="h-28 bg-white/60 backdrop-blur-2xl border-b border-slate-200/40 flex items-center justify-between px-8 md:px-14 z-40 transition-all duration-500">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="md:hidden p-4 text-slate-600 hover:bg-slate-100 rounded-2xl transition-all active:scale-90"
            >
              <Menu size={24} />
            </button>
            
            <div className="hidden md:block">
              <p className="text-[10px] font-black text-theme uppercase tracking-[0.6em] mb-1.5 opacity-40">Section / {getPageTitle()}</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{getPageTitle()}</h2>
            </div>

            <Link to={AppRoutes.HOME} className="flex items-center gap-3 md:hidden active:scale-95 transition-transform">
              <div className="w-12 h-12 bg-white rounded-2xl p-1.5 flex items-center justify-center shadow-xl border border-slate-100">
                <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-6 md:gap-12">
            <div className="hidden lg:flex items-center relative group">
              <Search size={20} className="absolute left-6 text-slate-400 group-focus-within:text-theme transition-all" />
              <input 
                type="text" 
                placeholder="Find in workspace..." 
                className="bg-slate-100/60 border border-transparent rounded-[1.8rem] py-4 pl-16 pr-8 text-[15px] font-bold text-slate-700 focus:bg-white focus:ring-[12px] focus:ring-theme/5 focus:border-theme/20 outline-none transition-all w-80 lg:w-[480px] shadow-sm"
              />
            </div>

            <div className="flex items-center gap-4 md:gap-8">
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)} 
                  className={`p-4 rounded-[1.4rem] transition-all relative ${isNotifOpen ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/40' : 'text-slate-500 hover:bg-theme-light hover:text-theme'}`}
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-rose-500 border-2 border-white text-[9px] font-black text-white flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-8 w-80 md:w-[28rem] bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.25)] border border-slate-100 overflow-hidden z-[100] animate-in zoom-in-95 fade-in slide-in-from-top-4 duration-500 origin-top-right">
                    <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h4 className="text-xl font-black text-slate-800 tracking-tight">Intelligence Feed</h4>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1.5">Updates Waiting: {unreadCount}</p>
                      </div>
                      <button 
                        onClick={clearAll} 
                        className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                        title="Clear History"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    <div className="max-h-[520px] overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="py-28 text-center space-y-6">
                          <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                            <Bell className="text-slate-200" size={48} />
                          </div>
                          <p className="text-slate-400 font-black text-sm italic opacity-60">Workspace is quiet.</p>
                        </div>
                      ) : (
                        notifications.map(notif => <NotificationItem key={notif.id} notif={notif} onMarkRead={markAsRead} />)
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="h-10 w-px bg-slate-200 hidden md:block opacity-40"></div>
              
              <Link 
                to={AppRoutes.SETTINGS}
                className="flex items-center gap-5 p-2 pr-8 bg-slate-100/50 hover:bg-white rounded-[2rem] transition-all border border-transparent hover:border-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/40 group"
              >
                <div className="h-12 w-12 rounded-[1.2rem] overflow-hidden bg-slate-200 border-2 border-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon size={24} className="text-slate-400" />
                  )}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-[15px] font-black text-slate-800 leading-none truncate max-w-[140px]">{user?.displayName || 'Pet Parent'}</p>
                  <p className="text-[9px] font-black text-theme uppercase tracking-[0.5em] mt-1.5">Workspace Admin</p>
                </div>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 md:p-14 lg:p-24 scroll-smooth">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {children}
          </div>
          
          <footer className="mt-40 py-20 border-t border-slate-200/30 text-center">
             <div className="flex items-center justify-center gap-4 text-slate-300 font-black text-[12px] uppercase tracking-[0.6em]">
               <Dog size={16} /> SS Paw Pal <Sparkles size={16} />
             </div>
             <p className="text-slate-400 font-black text-[10px] mt-8 opacity-30 uppercase tracking-[0.3em] flex items-center justify-center gap-6">
                <Link to={AppRoutes.TERMS} className="hover:text-theme transition-colors">Terms</Link>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                <Link to={AppRoutes.PRIVACY} className="hover:text-theme transition-colors">Privacy</Link>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                <span>Version 1.2.0</span>
             </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Layout;