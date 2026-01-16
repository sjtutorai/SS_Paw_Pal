import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Plus, 
  Image as ImageIcon, 
  Send, 
  MoreHorizontal,
  Smile,
  CheckCircle2,
  Camera,
  Loader2,
  Search,
  Filter,
  Calendar as CalendarIcon,
  X,
  User as UserIcon,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { db, startChat, checkMutualFollow } from '../services/firebase';
import { useNavigate } from "react-router-dom";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";
import { AppRoutes } from '../types';

interface Post {
  id: string;
  user: string;
  avatar: string | null;
  petName: string;
  petType?: string;
  content: string;
  image: string;
  likes: number;
  comments: number;
  createdAt: any;
  isUser?: boolean;
  userId: string;
}

const Community: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [pet, setPet] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Load user's primary pet
  useEffect(() => {
    if (user?.uid) {
      const savedPet = localStorage.getItem(`ssp_pets_${user.uid}`);
      if (savedPet) {
        try {
          const parsed = JSON.parse(savedPet);
          if (parsed.length > 0) setPet(parsed[0]);
        } catch (e) {
          console.error("Failed to parse pet data", e);
        }
      }
    }
  }, [user]);

  // Fetch global feed
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];
      
      setPosts(fetchedPosts);
      setLoading(false);
    }, (error) => {
      console.error("Firestore feed error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPostContent.trim()) {
      addNotification('Empty Post', 'Please write something before sharing your moment!', 'warning');
      return;
    }

    if (!user) {
      addNotification('Auth Required', 'Please log in to share posts.', 'error');
      return;
    }

    setIsPosting(true);

    try {
      const postPayload = {
        user: user.displayName || 'Pet Parent',
        avatar: user.photoURL || null,
        petName: pet?.name || 'My Pet',
        petType: pet?.species || 'Unknown',
        content: newPostContent.trim(),
        image: selectedImage || '',
        likes: 0,
        comments: 0,
        createdAt: serverTimestamp(),
        userId: user.uid
      };

      await addDoc(collection(db, "posts"), postPayload);

      setNewPostContent('');
      setSelectedImage(null);
      addNotification('Moment Shared!', 'Your post is now live in the community feed.', 'success');
    } catch (error: any) {
      console.error("Post creation failed:", error);
      addNotification('Posting Failed', 'We couldn\'t share your moment. Please try again.', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  const handleMessageUser = async (targetUserId: string) => {
    if (!user || user.uid === targetUserId) return;

    const areMutuals = await checkMutualFollow(user.uid, targetUserId);
    if (areMutuals) {
      const chatId = await startChat(user.uid, targetUserId);
      if (chatId) {
        navigate(AppRoutes.CHAT);
      }
    } else {
      addNotification('Private Profile', 'Mutual follow required to start direct messaging.', 'info');
    }
  };

  const filteredPosts = useMemo(() => {
    let result = [...posts];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.content.toLowerCase().includes(q) || p.petName.toLowerCase().includes(q));
    }
    if (typeFilter !== 'All') result = result.filter(p => p.petType === typeFilter);
    return result;
  }, [posts, searchQuery, typeFilter]);

  const formatTime = (createdAt: any) => {
    if (!createdAt) return 'Just now';
    const date = createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-32 animate-fade-in">
      <div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Community Feed</h2>
        <p className="text-slate-500 font-medium">Shared by pet parents globally.</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm">
        <div className="relative">
          <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search moments by pet name or content..." 
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-12 text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-theme/10 transition-all" 
          />
        </div>
      </div>

      {/* Create Post Form */}
      <form onSubmit={handleCreatePost} className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Me" className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={24} className="text-slate-300" />
            )}
          </div>
          <textarea
            required
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder={`What's ${pet?.name || 'your pet'} up to today?`}
            className="flex-1 bg-slate-50 border border-slate-50 rounded-[2rem] p-6 text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-theme/5 transition-all resize-none min-h-[120px] font-medium"
          />
        </div>

        {selectedImage && (
          <div className="relative w-40 h-40 rounded-3xl overflow-hidden group ml-16 shadow-lg border-4 border-white">
            <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
            <button 
              type="button"
              onClick={() => setSelectedImage(null)} 
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
            >
              <X size={24} />
            </button>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-4 pl-16">
          <div className="flex items-center gap-2">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()} 
              className="px-6 py-3 text-theme hover:bg-theme-light rounded-2xl transition-all flex items-center gap-2 font-black text-[11px] uppercase tracking-widest"
            >
              <ImageIcon size={18} />
              Attach Moment
            </button>
          </div>
          
          <button 
            type="submit" 
            disabled={isPosting} 
            className="bg-theme text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-theme-hover transition-all shadow-xl shadow-theme/10 disabled:opacity-50 active:scale-95 transition-theme"
          >
            {isPosting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {isPosting ? 'Sharing...' : 'Share Now'}
          </button>
        </div>
      </form>

      {/* Posts Feed */}
      <div className="space-y-12">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <Loader2 size={40} className="animate-spin text-theme opacity-30" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Feed Engine</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-[3.5rem] p-24 text-center border border-slate-100">
            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-200">
              <Camera size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Feed is quiet...</h3>
            <p className="text-slate-500 font-medium">Be the first to share a moment with the community!</p>
          </div>
        ) : filteredPosts.map((post) => (
          <article key={post.id} className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500">
            <div className="p-10 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                  {post.avatar ? (
                    <img src={post.avatar} alt={post.user} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={24} className="text-slate-300" />
                  )}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 flex items-center gap-2">
                    {post.user} 
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="text-theme font-black">{post.petName}</span>
                  </h4>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{formatTime(post.createdAt)}</p>
                </div>
              </div>
              
              {user?.uid !== post.userId && (
                <button 
                  onClick={() => handleMessageUser(post.userId)}
                  className="p-4 bg-slate-50 text-slate-400 rounded-[1.5rem] hover:bg-theme hover:text-white transition-all shadow-sm group/btn"
                  title="Message Pet Parent"
                >
                  <MessageSquare size={20} className="group-hover/btn:scale-110 transition-transform" />
                </button>
              )}
            </div>

            <div className="px-10 pb-8 text-slate-600 font-medium text-lg leading-relaxed">
              {post.content}
            </div>

            {post.image && (
              <div className="px-6 pb-6">
                <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden rounded-[3rem] shadow-inner">
                  <img src={post.image} alt="Moment" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            <div className="p-8 px-10 flex items-center justify-between border-t border-slate-50 bg-slate-50/30">
              <div className="flex items-center gap-6">
                <button className="flex items-center gap-3 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-all group/like">
                  <div className="p-3 rounded-2xl bg-white border border-slate-100 group-hover/like:bg-rose-50 group-hover/like:border-rose-100 shadow-sm">
                    <Heart size={18} className="group-hover/like:fill-rose-500" />
                  </div>
                  {post.likes} Appreciation
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Community;