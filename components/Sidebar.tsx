
import React from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  MessageSquare, 
  PlusSquare, 
  Dog, 
  LogOut, 
  X,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Settings,
  Sparkles,
  Send,
  User as UserIcon,
  LayoutGrid,
  UserSearch,
  Activity
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
        { label: 'Dashboard', path: AppRoutes.HOME, icon: Home },
        { label: 'AI Assistant', path: AppRoutes.AI_ASSISTANT, icon: MessageSquare },
        { label: 'Care Plans', path: AppRoutes.PET_CARE, icon: Activity },
      ]
    },
    {
      title: "Social",
      items: [
        { label: 'Feed', path: AppRoutes.CREATE_POST, icon: LayoutGrid },
        { label: 'Direct Messages', path: AppRoutes.CHAT, icon: Send },
        { label: 'Discover', path: AppRoutes.FIND_FRIENDS, icon: UserSearch },
      ]
    },
    {
      title: "Management",
      items: [
        { label: 'Medical History', path: AppRoutes.PET_PROFILE, icon: Stethoscope },
        { label: 'Profiles', path: AppRoutes.PET_PROFILE, icon: Dog },
      ]
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const LOGO_URL = "https://res.cloudinary.com/dazlddxht/image/upload/v1768234409/SS_Paw_Pal_Logo_aceyn8.png";

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60] md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Main */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] bg-white border-r border-slate-200 
        transform transition-all duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'md:w-20' : 'md:w-64 lg:w-72'}
        flex flex-col
      `}>
        
        {/* Header/Logo */}
        <div className="h-20 flex items-center px-5 mb-4 shrink-0">
          <Link to={AppRoutes.HOME} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 rounded-xl p-1.5 border border-slate-100 flex-shrink-0 shadow-sm">
              <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <span className="font-bold text-slate-800 text-lg tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300">
                Paw Pal <span className="text-theme font-black">Pro</span>
              </span>
            )}
          </Link>
          <button onClick={() => setIsOpen(false)} className="md:hidden ml-auto p-2 text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-3 space-y-8 overflow-y-auto custom-scrollbar-hide">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <h3 className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2">
                  {group.title}
                </h3>
              )}
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`
                      group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                      ${isActive 
                        ? 'bg-theme text-white shadow-md shadow-theme/10' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                  >
                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                    {!isCollapsed && (
                      <span className="text-sm font-semibold tracking-tight whitespace-nowrap">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Profile/Footer Section */}
        <div className="p-3 mt-auto">
          <div className="bg-slate-50 rounded-2xl p-2 space-y-1 border border-slate-100">
            <Link 
              to={AppRoutes.SETTINGS}
              className={`flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all group ${isCollapsed ? 'justify-center' : ''}`}
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 shadow-sm shrink-0">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400"><UserIcon size={16} /></div>
                )}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate leading-none">{user?.displayName || 'Parent'}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1 truncate">Settings</p>
                </div>
              )}
            </Link>

            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 transition-all ${isCollapsed ? 'justify-center' : ''}`}
            >
              <LogOut size={18} />
              {!isCollapsed && <span className="text-xs font-bold">Sign Out</span>}
            </button>
          </div>
        </div>

        {/* Desktop Collapse Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3.5 top-20 w-7 h-7 bg-white border border-slate-200 rounded-full shadow-md items-center justify-center text-slate-400 hover:text-theme transition-all z-[80]"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
