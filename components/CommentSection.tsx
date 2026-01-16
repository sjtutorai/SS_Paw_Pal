
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { addCommentToPost, getCommentsForPost } from '../services/firebase';
import { Loader2, Send, User as UserIcon } from 'lucide-react';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  text: string;
  createdAt: any;
}

interface CommentSectionProps {
  postId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentInput, setCommentInput] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = getCommentsForPost(postId, (fetchedComments) => {
      setComments(fetchedComments as Comment[]);
      setIsLoading(false);
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [postId]);
  
  useEffect(() => {
    // Scroll to the latest comment smoothly
    if (!isLoading) {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, isLoading]);


  const submitComment = async () => {
    if (!commentInput.trim() || !user) return;
    const text = commentInput;
    setCommentInput('');
    await addCommentToPost(postId, user.uid, user.displayName || 'User', user.photoURL, text);
  };

  return (
    <div className="space-y-6 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-4">
      <div className="space-y-5 max-h-64 overflow-y-auto pr-2">
        {isLoading ? (
          <div className="py-10 text-center"><Loader2 size={24} className="animate-spin text-slate-200 mx-auto" /></div>
        ) : comments.length === 0 ? (
          <p className="text-[10px] font-black text-slate-300 text-center py-4 uppercase tracking-widest">
            No thoughts yet. Be the first!
          </p>
        ) : (
          comments.map(c => (
            <div key={c.id} className="flex gap-3 items-start group/comment">
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-100 bg-white">
                {c.userAvatar ? (
                  <img src={c.userAvatar} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="m-2 text-slate-200" />
                )}
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex-1">
                <p className="text-[10px] font-black text-slate-900 mb-1">{c.userName}</p>
                <p className="text-xs font-medium text-slate-600 leading-relaxed">{c.text}</p>
              </div>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      <div className="flex gap-3">
        <input
          value={commentInput}
          onChange={e => setCommentInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submitComment(); } }}
          placeholder="Share your thoughts..."
          className="flex-1 bg-white border border-slate-200 rounded-xl px-5 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-theme/5 transition-all"
        />
        <button onClick={submitComment} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-all">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default CommentSection;
