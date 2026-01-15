
import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, User as UserIcon, Trash2, Search, Settings as SettingsIcon, LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNotifications, AppNotification } from '../context/NotificationContext';
import { Link, useLocation } from "react-router-dom";
import { AppRoutes } from '../types';

const NotificationItem: React.FC<{ notif: AppNotification; onMarkRead: (id: string) => void }> = ({ notif, onMarkRead }) => (
  <div 
    className={`p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 flex gap-3 cursor-pointer ${!notif.read ? 'bg-indigo-50/10' : ''}`}
    onClick={() => onMarkRead(notif.id)}
  >
    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!notif.read ? 'bg-theme' : 'bg-transparent'}`} />
    <div className="flex-1 space-y-1">
      <h5 className="text-xs font-bold text-slate-800 leading-tight">{notif.title}</h5>
      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{notif.message}</p>
      <p className="text-[10px] text-slate-400 font-medium mt-1">{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
    </div>
  </div>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const { notifications, unreadCount, markAsRead, clearAll } = useNotifications();
  const notifRef = useRef<HTMLDivElement>(null);

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
    if (path === AppRoutes.AI_ASSISTANT) return "AI Assistant";
    if (path === AppRoutes.PET_CARE) return "Care Management";
    if (path === AppRoutes.CREATE_POST) return "Community";
    if (path === AppRoutes.CHAT) return "Messages";
    if (path === AppRoutes.PET_PROFILE) return "Pet Profiles";
    if (path === AppRoutes.SETTINGS) return "Settings";
    return "SS Paw Pal";
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="md:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-sm font-bold text-slate-900 md:text-base">{getPageTitle()}</h2>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:flex items-center relative group">
              <Search size={16} className="absolute left-3 text-slate-400 group-focus-within:text-theme transition-colors" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-9 pr-3 text-sm focus:bg-white focus:ring-2 focus:ring-theme/10 focus:border-theme/30 outline-none transition-all w-48 lg:w-64"
              />
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1"></div>

            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)} 
                className={`p-2 rounded-xl transition-all relative ${isNotifOpen ? 'bg-slate-100 text-theme' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border border-white" />
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-200">
                  <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                    <button onClick={clearAll} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center text-slate-400 text-xs font-medium">No new notifications</div>
                    ) : (
                      notifications.map(notif => <NotificationItem key={notif.id} notif={notif} onMarkRead={markAsRead} />)
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link to={AppRoutes.SETTINGS} className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-all">
              <SettingsIcon size={20} />
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-10">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
