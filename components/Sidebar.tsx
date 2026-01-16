
import React, { useMemo } from 'react';
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
  UserSearch,
  LayoutDashboard,
  Settings,
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
      title: "Navigation",
      items: [
        { label: 'Dashboard', path: AppRoutes.HOME, icon: LayoutDashboard },
        { label: 'AI Support', path: AppRoutes.AI_ASSISTANT, icon: Sparkles },
        { label: 'Wellness', path: AppRoutes.PET_CARE, icon: Stethoscope },
      ]
    },
    {
      title: "Community",
      items: [
        { label: 'Feed', path: AppRoutes.CREATE_POST, icon: PlusSquare },
        { label: 'Messages', path: AppRoutes.CHAT, icon: Send },
        { label: 'Discovery', path: AppRoutes.FIND_FRIENDS, icon: UserSearch },
      ]
    },
    {
      title: "Settings",
      items: [
        { label: 'Companion', path: AppRoutes.PET_PROFILE, icon: Dog },
        { label: 'Settings', path: AppRoutes.SETTINGS, icon: Settings },
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

  // Flatten items to find the global index for the indicator position
  const allItems = useMemo(() => menuGroups.flatMap(g => g.items), [menuGroups]);
  const activeIndex = allItems.findIndex(item => item.path === location.pathname);

  // Helper to calculate total height offset for the sliding indicator
  // This logic accounts for group headers and gaps
  const calculateIndicatorStyle = () => {
    if (activeIndex === -1) return { display: 'none' };
    
    let offset = 24; // Initial padding-top of the nav container
    let found = false;
    let count = 0;

    for (const group of menuGroups) {
      if (!isCollapsed) offset += 32; // Header + margin
      
      for (const item of group.items) {
        if (count === activeIndex) {
          found = true;
          break;
        }
        offset += 52; // Item height + gap
        count++;
      }
      if (found) break;
      offset += 32; // Extra gap between groups
    }

    return {
      transform: `translateY(${offset}px)`,
      width: isCollapsed ? '48px' : 'calc(100% - 24px)',
      left: '12px',
      height: '48px',
      display: 'block'
    };
  };

  return (
    <>
      {/* Mobile Backdrop - Blur effect */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] transition-opacity duration-500 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Slide Navigation Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] 
        bg-white border-r border-slate-100
        sidebar-transition
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-[88px]' : 'lg:w-[280px] md:w-[240px]'}
        flex flex-col shadow-2xl md:shadow-none overflow-hidden
      `}>
        
        {/* Header/Logo Area */}
        <div className="h-24 flex items-center px-6 shrink-0 border-b border-slate-50/60 relative z-10">
          <Link to={AppRoutes.HOME} className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 bg-white border border-slate-100 rounded-xl p-1.5 flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 group-hover:rotate-2">
              <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500">
                <span className="font-black text-slate-900 tracking-tighter text-xl leading-none">
                  SS Paw Pal
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Pet Care Pro
                </span>
              </div>
            )}
          </Link>
          <button onClick={() => setIsOpen(false)} className="md:hidden ml-auto p-2.5 text-slate-400 bg-slate-50 rounded-xl">
            <X size={18} />
          </button>
        </div>

        {/* Navigation Section with Sliding Indicator */}
        <nav className="flex-1 px-3 py-6 relative overflow-y-auto overflow-x-hidden custom-scrollbar">
          {/* Floating Indicator Pill */}
          <div className="nav-indicator" style={calculateIndicatorStyle()} />

          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="mb-8 last:mb-0">
              {!isCollapsed && (
                <h3 className="px-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-300 mb-4 animate-in fade-in slide-in-from-bottom-1">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1 relative z-10">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`
                        group relative flex items-center gap-4 px-4 h-[48px] rounded-2xl transition-all duration-300
                        ${isActive 
                          ? 'text-white' 
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/80'}
                        ${isCollapsed ? 'justify-center px-0' : ''}
                      `}
                    >
                      <item.icon 
                        size={20} 
                        className={`shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} 
                      />
                      
                      {!isCollapsed && (
                        <span className="text-sm font-bold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                          {item.label}
                        </span>
                      )}

                      {/* Tooltip for Collapsed State */}
                      {isCollapsed && (
                        <div className="absolute left-[calc(100%+12px)] px-3 py-2 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all z-[100] whitespace-nowrap shadow-xl tooltip-pop">
                          <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45 rounded-sm" />
                          {item.label}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User / Logout Section - Redesigned as a floating card */}
        <div className="p-4 relative z-10 bg-white border-t border-slate-50">
          <div className="bg-slate-50/80 border border-slate-100/50 rounded-3xl p-3 space-y-2">
            {!isCollapsed && (
              <Link to={AppRoutes.SETTINGS} className="flex items-center gap-3 p-2 hover:bg-white rounded-2xl transition-all group">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 shadow-sm group-hover:border-theme transition-colors">
                  {user?.photoURL ? (
                    <img src={user.photoURL} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                       <UserIcon size={18} />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-900 truncate tracking-tight">{user?.displayName || 'Pet Parent'}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">My Account</p>
                </div>
              </Link>
            )}
            
            <button
              onClick={handleLogout}
              className={`
                w-full flex items-center gap-3 h-12 rounded-2xl transition-all 
                text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 
                ${isCollapsed ? 'justify-center' : 'px-4'}
              `}
            >
              <LogOut size={18} />
              {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-[0.2em]">Logout</span>}
            </button>
          </div>
        </div>

        {/* Desktop Collapse Toggle - Enhanced Style */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-28 w-7 h-7 bg-white border border-slate-100 rounded-xl items-center justify-center text-slate-400 hover:text-theme shadow-[0_4px_10px_rgba(0,0,0,0.04)] transition-all z-50 hover:scale-110 active:scale-95 group"
        >
          {isCollapsed ? <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" /> : <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
