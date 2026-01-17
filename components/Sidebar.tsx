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
  LayoutDashboard
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
        { label: 'Feed', path: AppRoutes.CREATE_POST, icon: PlusSquare },
        { label: 'Inbox', path: AppRoutes.CHAT, icon: Send },
        { label: 'Search', path: AppRoutes.FIND_FRIENDS, icon: Search },
      ]
    },
    {
      title: "Health",
      items: [
        { label: 'Wellness', path: AppRoutes.PET_CARE, icon: Stethoscope },
        { label: 'Profiles', path: AppRoutes.PET_PROFILE, icon: Dog },
      ]
    }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] transition-opacity duration-500 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)} />
      <aside className={`fixed inset-y-0 left-0 z-[70] bg-white border-r border-slate-100 transition-all duration-500 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${isCollapsed ? 'md:w-[90px]' : 'lg:w-[280px] md:w-[240px]'} flex flex-col shadow-2xl md:shadow-none`}>
        <div className="h-24 flex items-center px-6 border-b border-slate-50">
          <Link to={AppRoutes.HOME} className="flex items-center gap-4">
            <div className="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center shrink-0">
              <img src="https://res.cloudinary.com/dazlddxht/image/upload/v1768234409/SS_Paw_Pal_Logo_aceyn8.png" className="w-6 h-6 object-contain" />
            </div>
            {!isCollapsed && <span className="font-black text-slate-900 tracking-tighter text-xl leading-none">Paw Pal</span>}
          </Link>
          <button onClick={() => setIsOpen(false)} className="md:hidden ml-auto p-2"><X size={20} /></button>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-8 overflow-y-auto">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-2">
              {!isCollapsed && <h3 className="px-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{group.title}</h3>}
              {group.items.map(item => (
                <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)} className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${location.pathname === item.path ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                  <item.icon size={20} className="shrink-0" />
                  {!isCollapsed && <span className="text-sm font-bold">{item.label}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-50">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 text-slate-400 hover:text-rose-500 transition-all">
            <LogOut size={20} />
            {!isCollapsed && <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>}
          </button>
        </div>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden md:flex absolute -right-4 top-24 w-8 h-8 bg-white border border-slate-100 rounded-full items-center justify-center text-slate-400 shadow-xl transition-all z-[80] hover:scale-110">
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;