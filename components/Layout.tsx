import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, User as UserIcon, Trash2, CheckCircle2, AlertTriangle, Info, Search, Loader2, Settings as SettingsIcon } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { handleFollowRequestAction } from '../services/firebase';
import { Link, useLocation } from "react-router-dom";
import { AppRoutes, AppNotification } from '../types';

const NotificationItem: React.FC<{ notif: AppNotification; onMarkRead: (id: string) => void }> = ({ notif, onMarkRead }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleAction = async (action: 'accept' | 'decline') => {
    if (!notif.relatedId) return;
    setIsProcessing(true);
    try {
      await handleFollowRequestAction(notif.id, notif.relatedId, action);
    } catch (error) {
      console.error(`Action failed:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  const icons = {
    warning: { Icon: AlertTriangle, bg: 'bg-amber-50', text: 'text-amber-500' },
    success: { Icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-500' },
    follow_request: { Icon: UserIcon, bg: 'bg-indigo-50', text: 'text-indigo-500' },
    default: { Icon: Info, bg: 'bg-slate-50', text: 'text-slate-500' }
  };
  
  const theme = icons[notif.type] || icons.default;

  return (
    <div className={`p-4 border-b border-slate-50 transition-colors ${!notif.read ? 'bg-indigo-50/10' : 'hover:bg-slate-50/50'}`}>
      <div className="flex gap-3">
        <div className={`p-2 rounded-xl shrink-0 ${theme.bg} ${theme.text}`}>
          <theme.Icon size={16} />
        </div>
        <div className="flex-1" onClick={() => onMarkRead(notif.id)}>
          <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{notif.title}</h5>
          <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">{notif.message}</p>
          <p className="text-[9px] text-slate-300 font-black uppercase mt-2">Received · Just Now</p>
        </div>
      </div>
      {notif.type === 'follow_request' && !notif.read && (
        <div className="flex gap-2 mt-3 ml-11">
          <button onClick={() => handleAction('accept')} disabled={isProcessing} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50">
            {isProcessing ? <Loader2 size={12} className="animate-spin mx-auto"/> : 'Accept'}
          </button>
          <button onClick={() => handleAction('decline')} disabled={isProcessing} className="flex-1 bg-slate-100 text-slate-500 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
            Decline
          </button>
        </div>
      )}
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setIsNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const titles: Record<string, string> = {
    [AppRoutes.HOME]: "Dashboard Overview",
    [AppRoutes.AI_ASSISTANT]: "AI Support Specialist",
    [AppRoutes.PET_CARE]: "Wellness Monitoring",
    [AppRoutes.CREATE_POST]: "Community Feed",
    [AppRoutes.CHAT]: "Guardian Inbox",
    [AppRoutes.PET_PROFILE]: "Companion Registry",
    [AppRoutes.SETTINGS]: "System Preferences"
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50/50">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-40 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
              <Menu size={20} />
            </button>
            <div className="hidden md:flex flex-col">
              <h2 className="text-[17px] font-black text-slate-900 tracking-tight leading-none">
                {titles[location.pathname] || "Paw Pal Portal"}
              </h2>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Node Cluster 01 Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative" ref={notifRef}>
              <button onClick={() => setIsNotifOpen(!isNotifOpen)} className={`p-2.5 rounded-xl transition-all relative ${isNotifOpen ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 text-[10px] flex items-center justify-center font-black rounded-full bg-rose-500 text-white border-[3px] border-white">{unreadCount}</span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-4 w-80 bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-[100] animate-in fade-in zoom-in-95 origin-top-right">
                  <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Feed</h4>
                    <button onClick={clearAll} className="text-[10px] font-black uppercase text-theme hover:underline">Clear All</button>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="py-16 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.3em]">Directory Empty</div>
                    ) : (
                      notifications.map(n => <NotificationItem key={n.id} notif={n} onMarkRead={markAsRead} />)
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-slate-100 mx-2" />

            <Link to={AppRoutes.SETTINGS} className="flex items-center gap-3 p-1 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-sm group-hover:shadow-indigo-100 group-hover:scale-105 transition-all">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={18} className="m-2.5 text-slate-300" />
                )}
              </div>
              <div className="hidden lg:block text-left mr-2">
                <p className="text-[11px] font-black text-slate-900 leading-tight">@{user?.displayName?.split(' ')[0] || 'User'}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active</p>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
          <footer className="mt-32 py-10 text-center border-t border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-200">
              SS Paw Pal Systems © 2026
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Layout;