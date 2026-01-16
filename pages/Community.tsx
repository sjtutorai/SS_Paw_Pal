import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Heart, 
  Share2, 
  ImageIcon, 
  Send, 
  Camera, 
  Loader2, 
  Search, 
  Filter, 
  X, 
  User as UserIcon, 
  MessageSquare, 
  ChevronDown, 
  TrendingUp, 
  Clock,
  Wand2,
  Sparkles,
  Smile,
  PawPrint,
  Check,
  MessageCircle,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { db, addPostComment } from '../services/firebase';
import { useNavigate } from "react-router-dom";
import { 
  collection, 
  addDoc, 
  query, 
  where,
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  getDocs
} from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";
import { Post, PostComment, PetProfile } from '../types';

const PET_TYPES = ['All', 'Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 'Reptile', 'Other'];

const IMAGE_FILTERS = [
  { name: 'None', class: '' },
  { name: 'Vibrant', class: 'brightness-110 contrast-110 saturate-125' },
  { name: 'Warm', class: 'sepia-[0.2] saturate-150 hue-rotate-[-10deg]' },
  { name: 'Noir', class: 'grayscale contrast-125' },
  { name: 'Cinematic', class: 'contrast-125 brightness-90 saturate-75' },
  { name: 'Bright', class: 'brightness-125 contrast-90' },
  { name: 'Vintage', class: 'sepia-[0.4] contrast-80 brightness-110 saturate-50' },
  { name: 'Black & White', class: 'grayscale' },
  { name: 'Sepia', class: 'sepia saturate-150' },
];

const CommentSection: React.FC<{ postId: string, commentsCount: number }> = ({ postId, commentsCount }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PostComment[];
      setComments(fetched);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addPostComment(postId, user, newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error("Comment error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-6 pb-6 pt-2 space-y-4 border-t border-slate-50 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {loading && <div className="text-center py-2"><Loader2 size={16} className="animate-spin text-slate-200 mx-auto" /></div>}
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 border border-slate-50 shrink-0">
              {comment.userAvatar ? <img src={comment.userAvatar} className="w-full h-full object-cover" /> : <UserIcon size={14} className="m-2 text-slate-300" />}
            </div>
            <div className="bg-slate-50/50 p-3 rounded-2xl flex-1">
              <p className="text-[10px] font-black text-slate-900 leading-none mb-1">{comment.userName}</p>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">{comment.text}</p>
            </div>
          </div>
        ))}
        {!loading && comments.length === 0 && <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest py-2">No comments yet</p>}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input 
          type="text" 
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Add a comment..." 
          className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-medium outline-none focus:ring-4 focus:ring-theme/5 transition-all"
        />
        <button 
          disabled={!newComment.trim() || isSubmitting}
          className="p-2 bg-theme text-white rounded-xl hover:bg-theme-hover disabled:opacity-50 transition-all active:scale-95"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
};

const Community: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [userPets, setUserPets] = useState<PetProfile[]>([]);
  const [selectedPetForPost, setSelectedPetForPost] = useState<PetProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState(IMAGE_FILTERS[0]);
  const [isPosting, setIsPosting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [friendUids, setFriendUids] = useState<Set<string>>(new Set());
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'commented' | 'friends'>('newest');

  useEffect(() => {
    if (user?.uid) {
      const savedPetsStr = localStorage.getItem(`ssp_pets_${user.uid}`);
      if (savedPetsStr) {
        try {
          const parsed = JSON.parse(savedPetsStr);
          setUserPets(parsed);
          if (parsed.length > 0) setSelectedPetForPost(parsed[0]);
        } catch (e) {
          console.error("Failed to parse pet data", e);
        }
      }

      const fetchFriends = async () => {
        const q = query(collection(db, "chats"), where("participants", "array-contains", user.uid));
        const snap = await getDocs(q);
        const uids = new Set<string>();
        snap.docs.forEach(d => {
          const parts = d.data().participants as string[];
          parts.forEach(p => { if (p !== user.uid) uids.add(p); });
        });
        setFriendUids(uids);
      };
      fetchFriends();
    }
  }, [user]);

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

  const handleEnhanceWithAI = async () => {
    if (!newPostContent.trim()) {
      addNotification('AI Assistant', 'Draft a message first for AI to enhance!', 'info');
      return;
    }
    setIsEnhancing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Enhance this pet social media caption: "${newPostContent}". Make it engaging, add relevant pet hashtags, and keep it under 40 words.`,
      });
      if (response.text) {
        setNewPostContent(response.text.trim());
        addNotification('AI Magical Touch', 'Caption enhanced!', 'success');
      }
    } catch (error) {
      addNotification('AI Engine Error', 'Could not enhance caption.', 'error');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPosting) return;
    if (!newPostContent.trim() && !selectedImage) {
      addNotification('Post empty', 'Add text or an image to share your moment.', 'info');
      return;
    }
    if (!user) {
      addNotification('Not Authenticated', 'Please log in to share moments.', 'error');
      return;
    }

    setIsPosting(true);
    
    try {
      const postPayload = {
        user: user.displayName || 'Pet Parent',
        avatar: user.photoURL || null,
        petName: selectedPetForPost?.name || 'My Companion',
        petType: selectedPetForPost?.species || 'Other',
        content: newPostContent.trim(),
        image: selectedImage || '',
        imageFilter: activeFilter.class,
        likes: 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
        userId: user.uid
      };
      
      await addDoc(collection(db, "posts"), postPayload);
      
      setNewPostContent('');
      setSelectedImage(null);
      setActiveFilter(IMAGE_FILTERS[0]);
      addNotification('Moment Shared', 'Your post is now visible to the community.', 'success');
    } catch (error: any) {
      console.error("Firestore posting error:", error);
      addNotification('Posting Error', `Failure: ${error.message || 'Check connection'}`, 'error');
    } finally {
      setIsPosting(false);
    }
  };

  const filteredPosts = useMemo(() => {
    let result = posts.filter(p => {
      const matchesSearch = (p.petName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                           (p.content?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'All' || p.petType === typeFilter;
      
      if (sortBy === 'friends' && p.userId !== user?.uid && !friendUids.has(p.userId)) {
        return false;
      }

      return matchesSearch && matchesType;
    });

    if (sortBy === 'popular') {
      result = result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (sortBy === 'commented') {
      result = result.sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0));
    }
    return result;
  }, [posts, searchQuery, typeFilter, sortBy, friendUids, user?.uid]);

  const toggleComments = (postId: string) => {
    setOpenComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleSharePost = async (post: Post) => {
    const shareData = {
      title: `${post.petName}'s Moment`,
      text: post.content,
      url: window.location.href
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) { /* silent cancel */ }
    } else {
      navigator.clipboard.writeText(window.location.href);
      addNotification('Link Copied', 'URL copied to clipboard.', 'success');
    }
  };

  return (
    <div className="space-y-10 animate-fade-in px-2 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Community Feed</h2>
          <p className="text-slate-500 font-medium text-sm">See what's happening in the pet world today.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex-wrap gap-1">
          <button 
            onClick={() => setSortBy('newest')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'newest' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Clock size={14} className="inline mr-1" /> New
          </button>
          <button 
            onClick={() => setSortBy('popular')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'popular' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <TrendingUp size={14} className="inline mr-1" /> Popular
          </button>
          <button 
            onClick={() => setSortBy('commented')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'commented' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <MessageCircle size={14} className="inline mr-1" /> Most Commented
          </button>
          <button 
            onClick={() => setSortBy('friends')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'friends' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Users size={14} className="inline mr-1" /> Friends
          </button>
        </div>
      </div>

      {/* Unified Dashboard */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-6">
        {/* Search & Species Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by keywords or pet name..." 
              className="w-full bg-slate-50 border border-slate-100 rounded-full py-4 pl-14 pr-4 text-sm font-medium text-slate-600 focus:ring-4 focus:ring-theme/5 outline-none transition-all" 
            />
          </div>

          <div className="flex bg-slate-50 border border-slate-100 rounded-full p-1 overflow-x-auto scroll-hide">
             {PET_TYPES.map(type => (
               <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${typeFilter === type ? 'bg-white text-theme shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 {type}
               </button>
             ))}
          </div>
        </div>

        {/* Text Area */}
        <div className="flex gap-4 items-start">
           <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0 overflow-hidden shadow-sm border border-slate-200">
            {user?.photoURL ? (
              <img src={user.photoURL} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="m-3 text-slate-300" />
            )}
          </div>
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder={`Tell us about ${selectedPetForPost?.name || 'your pet'}...`}
            className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-5 text-sm font-medium focus:ring-4 focus:ring-theme/5 resize-none h-28 outline-none transition-all"
          />
        </div>

        {/* Pet Association */}
        {userPets.length > 0 && (
          <div className="space-y-3">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tag a Pet</p>
             <div className="flex gap-3 overflow-x-auto pb-2 scroll-hide">
               {userPets.map(pet => (
                 <button 
                  key={pet.id} 
                  onClick={() => setSelectedPetForPost(pet)}
                  className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-all shrink-0 ${selectedPetForPost?.id === pet.id ? 'bg-theme-light border-theme shadow-sm' : 'bg-white border-slate-50'}`}
                 >
                   <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100">
                     {pet.avatarUrl ? <img src={pet.avatarUrl} className="w-full h-full object-cover" /> : <PawPrint size={14} className="m-2 text-slate-300" />}
                   </div>
                   <span className={`text-[10px] font-black uppercase tracking-widest pr-2 ${selectedPetForPost?.id === pet.id ? 'text-theme' : 'text-slate-500'}`}>{pet.name}</span>
                 </button>
               ))}
             </div>
          </div>
        )}

        {/* Bottom Row */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setSelectedImage(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} 
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              className={`p-3.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm border ${selectedImage ? 'border-theme' : 'border-slate-100'}`}
            >
              <ImageIcon size={20} className={selectedImage ? 'text-theme' : ''} />
            </button>
            <button 
              type="button" 
              onClick={handleEnhanceWithAI} 
              disabled={isEnhancing} 
              className="p-3.5 bg-slate-900 text-theme rounded-xl hover:bg-black transition-all shadow-md border border-slate-800"
              title="AI Magic Caption"
            >
              {isEnhancing ? <Loader2 size={20} className="animate-spin text-white" /> : <Wand2 size={20} />}
            </button>
          </div>

          <button 
            onClick={handleCreatePost}
            disabled={isPosting || (!newPostContent.trim() && !selectedImage)} 
            className="bg-theme text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-theme-hover shadow-xl shadow-theme/20 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            {isPosting ? <Loader2 size={16} className="animate-spin" /> : 'Post Moment'}
          </button>
        </div>

        {selectedImage && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 mt-4">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="relative w-full md:w-64 h-64 rounded-2xl overflow-hidden border-2 border-white shadow-lg bg-slate-100 group">
                <img src={selectedImage} className={`w-full h-full object-cover transition-all duration-700 ease-in-out ${activeFilter.class}`} />
                <button onClick={() => setSelectedImage(null)} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full backdrop-blur-sm hover:bg-black transition-all">
                  <X size={14} />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[8px] px-2 py-1 rounded font-black uppercase tracking-widest backdrop-blur-sm">
                  Preset: {activeFilter.name}
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={14} className="text-theme" /> Studio Filters
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {IMAGE_FILTERS.map((f) => (
                    <button 
                      key={f.name}
                      onClick={() => setActiveFilter(f)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all flex items-center justify-between ${activeFilter.name === f.name ? 'bg-theme text-white border-theme' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-theme/30'}`}
                    >
                      {f.name}
                      {activeFilter.name === f.name && <Check size={12} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feed Area */}
      <div className="space-y-12 mt-12">
        {loading ? (
          <div className="py-20 text-center"><Loader2 size={32} className="animate-spin text-slate-200 mx-auto" /></div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-300 font-black uppercase tracking-widest text-xs">
            {searchQuery ? 'No matching moments found' : 'Be the first to share a moment!'}
          </div>
        ) : (
          filteredPosts.map(post => (
            <article key={post.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-50">
                    {post.avatar ? <img src={post.avatar} className="w-full h-full object-cover" /> : <UserIcon className="m-2 text-slate-300" />}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm leading-none">{post.user} <span className="text-theme mx-1">·</span> <span className="text-theme">{post.petName}</span></h4>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{post.petType}</p>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 text-slate-700 font-medium leading-relaxed">{post.content}</div>
              {post.image && (
                <div className="px-4 pb-4">
                  <img 
                    src={post.image} 
                    className={`w-full h-auto rounded-[1.5rem] shadow-xl ${post.imageFilter || ''}`} 
                    loading="lazy"
                  />
                </div>
              )}
              <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/20 flex gap-6">
                <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest">
                  <Heart size={16} /> {post.likes}
                </button>
                <button 
                  onClick={() => toggleComments(post.id)}
                  className={`flex items-center gap-2 text-[10px] font-black transition-colors uppercase tracking-widest ${openComments[post.id] ? 'text-theme' : 'text-slate-400 hover:text-theme'}`}
                >
                  <MessageSquare size={16} /> {post.commentsCount || 0}
                </button>
                <button onClick={() => handleSharePost(post)} className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-theme transition-colors uppercase tracking-widest">
                  <Share2 size={16} />
                </button>
              </div>
              
              {openComments[post.id] && (
                <CommentSection postId={post.id} commentsCount={post.commentsCount || 0} />
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
};

export default Community;