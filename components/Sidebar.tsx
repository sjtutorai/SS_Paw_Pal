import React from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  PlusSquare, 
  Dog, 
  LogOut, 
  X,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Sparkles,
  Send,
  User as UserIcon,
  Search,
  LayoutDashboard,
  Settings
} from 'lucide-react';
import { AppRoutes } from '../types';
import { logout } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const menuGroups = [
    {
      title: "Core",
      items: [
        { label: 'Dashboard', path: AppRoutes.HOME, icon: LayoutDashboard },
        { label: 'AI Support', path: AppRoutes.AI_ASSISTANT, icon: Sparkles },
      ]
    },
    {
      title: "Social",
      items: [
        { label: 'Community', path: AppRoutes.CREATE_POST, icon: PlusSquare },
        { label: 'Inbox', path: AppRoutes.CHAT, icon: Send },
        { label: 'Search', path: AppRoutes.FIND_FRIENDS, icon: Search },
      ]
    },
    {
      title: "Health",
      items: [
        { label: 'Wellness', path: AppRoutes.PET_CARE, icon: Stethoscope },
        { label: 'Pet Profiles', path: AppRoutes.PET_PROFILE, icon: Dog },
      ]
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error("Sidebar logout error:", error);
    }
  };

  const LOGO_URL = "https://res.cloudinary.com/dazlddxht/image/upload/v1768234409/SS_Paw_Pal_Logo_aceyn8.png";

  return (
    <>
      {/* Mobile Overlay - Modern Glassmorphism */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] transition-opacity duration-500 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Slide Navigation Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] 
        bg-white border-r border-slate-100
        transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-[100px]' : 'lg:w-[300px] md:w-[260px]'}
        flex flex-col shadow-[20px_0_60px_-15px_rgba(0,0,0,0.03)] md:shadow-none
      `}>
        
        {/* Header Area */}
        <div className="h-24 flex items-center px-8 shrink-0 border-b border-slate-50 overflow-hidden">
          <Link to={AppRoutes.HOME} className="flex items-center gap-5 group">
            <div className="w-12 h-12 bg-white border border-slate-100 rounded-[1.25rem] p-3 flex items-center justify-center shrink-0 shadow-2xl shadow-slate-200/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
              <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500">
                <span className="font-black text-slate-900 tracking-tighter text-2xl leading-none">
                  Paw Pal
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1.5">Smart Engine</span>
              </div>
            )}
          </Link>
          <button 
            onClick={() => setIsOpen(false)} 
            className="md:hidden ml-auto w-12 h-12 flex items-center justify-center bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-5 py-10 space-y-10 overflow-y-auto scroll-hide">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-5">
              {!isCollapsed && (
                <h3 className="px-5 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
                  {group.title}
                </h3>
              )}
              <div className="space-y-2">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`
                        group relative flex items-center gap-4 px-5 py-4.5 rounded-[1.5rem] transition-all duration-500
                        ${isActive 
                          ? 'bg-slate-900 text-white shadow-[0_20px_40px_-10px_rgba(15,23,42,0.3)]' 
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                      `}
                    >
                      <item.icon size={22} className={`shrink-0 transition-transform duration-500 group-hover:scale-110 ${isActive ? 'text-theme' : ''}`} />
                      {!isCollapsed && (
                        <span className="text-sm font-black tracking-tight">{item.label}</span>
                      )}
                      
                      {isActive && !isCollapsed && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-theme shadow-[0_0_15px_#4f46e5] animate-pulse" />
                      )}
                      
                      {/* Tooltip for Collapsed State */}
                      {isCollapsed && (
                        <div className="absolute left-[calc(100%+20px)] px-4 py-2.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-xl opacity-0 translate-x-[-10px] pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all z-[80] whitespace-nowrap shadow-2xl">
                          {item.label}
                          <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User / Footer Section */}
        <div className="p-6 border-t border-slate-50 space-y-4">
          {!isCollapsed && (
            <Link to={AppRoutes.SETTINGS} className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50/50 hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-100">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white border border-slate-200 shrink-0 shadow-sm transition-transform group-hover:scale-105">
                {user?.photoURL ? (
                  <img src={user.photoURL} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={20} className="m-3 text-slate-300" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-900 truncate group-hover:text-theme transition-colors">Guardian Settings</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate mt-0.5">Control Panel</p>
              </div>
            </Link>
          )}
          
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-4 p-5 rounded-[1.5rem] transition-all text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 group ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={22} className="shrink-0 transition-transform group-hover:rotate-12" />
            {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-[0.3em]">Sign Out Hub</span>}
          </button>
        </div>

        {/* Desktop Collapse Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-5 top-28 w-10 h-10 bg-white border border-slate-100 rounded-2xl items-center justify-center text-slate-400 hover:text-slate-900 shadow-2xl transition-all z-[80] hover:scale-110 active:scale-90"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;