
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
  UserSearch,
  Gamepad2,
  Trophy
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
      title: "🚀 MAIN STUFF",
      items: [
        { label: '🏠 Home Base', path: AppRoutes.HOME, icon: Home, color: 'bg-yellow-400' },
        { label: '🤖 Magic AI', path: AppRoutes.AI_ASSISTANT, icon: MessageSquare, color: 'bg-purple-400' },
        { label: '✨ Daily Fun', path: AppRoutes.PET_CARE, icon: Sparkles, color: 'bg-pink-400' },
      ]
    },
    {
      title: "👯 FRIENDS",
      items: [
        { label: '📸 Pet Pics', path: AppRoutes.CREATE_POST, icon: PlusSquare, color: 'bg-orange-400' },
        { label: '💬 Chat Box', path: AppRoutes.CHAT, icon: Send, color: 'bg-blue-400' },
        { label: '🔍 Find Pals', path: AppRoutes.FIND_FRIENDS, icon: UserSearch, color: 'bg-green-400' },
      ]
    },
    {
      title: "🛠️ PET TOOLS",
      items: [
        { label: '🏥 Vet Help', path: AppRoutes.HEALTH_CHECKUP, icon: Stethoscope, color: 'bg-red-400' },
        { label: '🐕 My Pet', path: AppRoutes.PET_PROFILE, icon: Dog, color: 'bg-indigo-400' },
      ]
    }
  ];

  const handleLogout = async () => {
    if(confirm("Are you SURE you want to leave?! 😭")) {
        try {
          await logout();
          navigate('/login', { replace: true });
        } catch (error) {
          console.error("Sidebar logout error:", error);
        }
    }
  };

  const LOGO_URL = "https://res.cloudinary.com/dazlddxht/image/upload/v1768234409/SS_Paw_Pal_Logo_aceyn8.png";

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      <aside className={`
        fixed inset-y-0 left-0 z-[70] bg-white border-r-4 border-black
        transform transition-all duration-300
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'md:w-24' : 'lg:w-72 md:w-64'}
        flex flex-col
      `}>
        
        <div className="h-24 flex items-center px-6 border-b-4 border-black bg-yellow-100">
          <Link to={AppRoutes.HOME} className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white border-2 border-black rounded-full p-1 shadow-[3px_3px_0px_0px_#000] rotate-[-5deg]">
              <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
            </div>
            {(!isCollapsed || isOpen) && (
              <span className="font-black text-black text-xl tracking-tighter">SS PAW PAL!</span>
            )}
          </Link>
          <button onClick={() => setIsOpen(false)} className="md:hidden absolute right-4"><X /></button>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              {(!isCollapsed || isOpen) && (
                <h3 className="px-2 text-[12px] font-black text-slate-400 uppercase tracking-widest">{group.title}</h3>
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
                        flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-black font-bold text-sm
                        transition-all hover:translate-x-1
                        ${isActive 
                          ? `${item.color} text-black shadow-[4px_4px_0px_0px_#000]` 
                          : 'bg-white text-slate-600 hover:bg-slate-50 shadow-[2px_2px_0px_0px_#000]'}
                      `}
                    >
                      <item.icon size={20} className={isActive ? 'animate-bounce' : ''} />
                      {(!isCollapsed || isOpen) && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t-4 border-black bg-slate-50">
          <Link to={AppRoutes.SETTINGS} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-all">
            <div className="w-10 h-10 border-2 border-black rounded-full overflow-hidden bg-white">
                {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <UserIcon />}
            </div>
            {(!isCollapsed || isOpen) && (
              <div className="min-w-0">
                <p className="text-sm font-black truncate">{user?.displayName || 'Pet Parent'}</p>
                <p className="text-[10px] font-bold text-indigo-500 uppercase">My Profile ⚙️</p>
              </div>
            )}
          </Link>
          <button onClick={handleLogout} className="w-full mt-4 p-2 text-red-500 font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-red-50 rounded-lg">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;