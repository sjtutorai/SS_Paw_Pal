
import React, { useState, useEffect } from 'react';
// FIX: Added missing ShieldCheck to the lucide-react imports
import { Loader2, AlertCircle, Eye, EyeOff, CheckCircle2, User as UserIcon, Mail, Lock, AtSign, ArrowLeft, ShieldCheck } from 'lucide-react';
import { 
  loginWithGoogle, 
  loginWithApple, 
  loginWithIdentifier, 
  signUpWithEmail 
} from '../services/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppRoutes } from '../types';

// Validation Utilities
const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const validatePassword = (password: string) => {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return re.test(password);
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const LOGO_URL = "https://res.cloudinary.com/dazlddxht/image/upload/v1768234409/SS_Paw_Pal_Logo_aceyn8.png";

  const [formData, setFormData] = useState({
    identifier: '', 
    password: '',
    confirmPassword: '',
    fullName: '',
    username: '',
  });

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const formatFirebaseError = (err: any) => {
    const code = err.code || '';
    switch (code) {
      case 'auth/invalid-credential': return "Incorrect email or password.";
      case 'auth/user-not-found': return "No account associated with this email.";
      case 'auth/wrong-password': return "Invalid credentials.";
      case 'auth/email-already-in-use': return "This email is already registered.";
      case 'auth/weak-password': return "Password is not secure enough.";
      default: return err.message || "An unexpected error occurred.";
    }
  };

  const validate = () => {
    if (!isLogin) {
      if (!formData.fullName.trim()) { setError("Full Name is required."); return false; }
      if (!validateEmail(formData.identifier)) { setError("Invalid email format."); return false; }
      if (!formData.username.trim()) { setError("Handle is required."); return false; }
      if (!validatePassword(formData.password)) {
        setError("Secret Key must be 8+ characters with uppercase, lowercase, and a number.");
        return false;
      }
      if (formData.password !== formData.confirmPassword) { setError("Keys do not match."); return false; }
      if (!agreedToTerms) { setError("Accept the Terms to proceed."); return false; }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      if (isLogin) {
        await loginWithIdentifier(formData.identifier, formData.password);
        navigate('/', { replace: true });
      } else {
        await signUpWithEmail(formData.identifier, formData.password, formData.fullName, formData.username);
        setSuccessMessage("Identity verified. Welcome to the pack.");
        setTimeout(() => navigate('/', { replace: true }), 1500);
      }
    } catch (err: any) {
      setError(formatFirebaseError(err));
    } finally {
      if (isLogin) setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
      navigate('/', { replace: true });
    } catch (err) { setError(formatFirebaseError(err)); }
    finally { setIsLoading(false); }
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithApple();
      navigate('/', { replace: true });
    } catch (err) { setError(formatFirebaseError(err)); }
    finally { setIsLoading(false); }
  };

  if (successMessage) {
    return (
      <div className="min-h-screen bg-[#111315] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#1c1f23] rounded-[3rem] shadow-2xl p-12 text-center animate-in zoom-in-95 border border-white/5">
          <CheckCircle2 size={64} className="mx-auto text-[#5ed5a8] mb-6" />
          <h2 className="text-3xl font-black text-white tracking-tight">Verified</h2>
          <p className="text-slate-400 mt-4 font-medium">{successMessage}</p>
          <Loader2 className="mx-auto mt-8 w-8 h-8 animate-spin text-[#ff8c52]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111315] flex items-center justify-center p-4 font-inter relative overflow-hidden">
      {/* Subtle Background Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/carbon-fibre.png")` }}></div>
      
      <div className="max-w-md w-full bg-[#1c1f23] rounded-[3.5rem] shadow-2xl border border-white/5 p-8 md:p-10 animate-in fade-in zoom-in-95 duration-700 relative z-10">
        
        {/* Top Navigation */}
        <div className="mb-8">
           <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-bold">
             <ArrowLeft size={16} />
             Back to Home
           </button>
        </div>

        <div className="mb-8 text-center">
          <div className="w-20 h-20 bg-white rounded-full p-3 flex items-center justify-center shadow-2xl mx-auto mb-6">
            <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">
            {isLogin ? "Welcome Back" : "Join the Pack"}
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            {isLogin ? "Continue your pet parenting journey" : "Become part of a supportive pet community"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-[11px] font-bold flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative group">
              <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-[#ff8c52] transition-colors" />
              <input 
                name="fullName" 
                type="text" 
                placeholder="Full name" 
                value={formData.fullName} 
                onChange={handleChange} 
                className="w-full bg-[#2d3139] border border-white/5 rounded-full py-4 pl-14 pr-6 text-sm font-medium text-white focus:ring-2 focus:ring-[#ff8c52]/50 outline-none transition-all placeholder:text-slate-600" 
              />
            </div>
          )}
          
          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-[#ff8c52] transition-colors" />
            <input 
              name="identifier" 
              type="text" 
              placeholder={isLogin ? "Email or username" : "Email address"} 
              value={formData.identifier} 
              onChange={handleChange} 
              className="w-full bg-[#2d3139] border border-white/5 rounded-full py-4 pl-14 pr-6 text-sm font-medium text-white focus:ring-2 focus:ring-[#ff8c52]/50 outline-none transition-all placeholder:text-slate-600" 
            />
          </div>

          {!isLogin && (
            <div className="relative group">
              <AtSign className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-[#ff8c52] transition-colors" />
              <input 
                name="username" 
                type="text" 
                placeholder="Unique handle" 
                value={formData.username} 
                onChange={handleChange} 
                className="w-full bg-[#2d3139] border border-white/5 rounded-full py-4 pl-14 pr-6 text-sm font-medium text-white focus:ring-2 focus:ring-[#ff8c52]/50 outline-none transition-all placeholder:text-slate-600" 
              />
            </div>
          )}

          <div className="relative group">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-[#ff8c52] transition-colors" />
            <input 
              name="password" 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              value={formData.password} 
              onChange={handleChange} 
              className="w-full bg-[#2d3139] border border-white/5 rounded-full py-4 pl-14 pr-12 text-sm font-medium text-white focus:ring-2 focus:ring-[#ff8c52]/50 outline-none transition-all placeholder:text-slate-600" 
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {!isLogin && (
            <>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-[#ff8c52] transition-colors" />
                <input 
                  name="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Confirm password" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  className="w-full bg-[#2d3139] border border-white/5 rounded-full py-4 pl-14 pr-12 text-sm font-medium text-white focus:ring-2 focus:ring-[#ff8c52]/50 outline-none transition-all placeholder:text-slate-600" 
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex items-start gap-3 px-2 py-1">
                <input 
                  type="checkbox" 
                  checked={agreedToTerms} 
                  onChange={e => setAgreedToTerms(e.target.checked)} 
                  className="mt-1 accent-[#ff8c52] w-4 h-4 rounded border-white/10" 
                />
                <label className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  I agree to the <Link to={AppRoutes.TERMS} className="text-[#ff8c52] font-bold hover:underline">Terms of Service</Link> and <Link to={AppRoutes.PRIVACY} className="text-[#ff8c52] font-bold hover:underline">Privacy Policy</Link>.
                </label>
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full h-16 mt-4 bg-gradient-to-r from-[#ff8c52] to-[#5ed5a8] text-white rounded-full font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-[#ff8c52]/20 disabled:opacity-50 active:scale-[0.98] flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : (isLogin ? "Enter Portal" : "Create Account")}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm font-medium">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-[#ff8c52] font-black uppercase tracking-widest text-xs hover:underline ml-1"
            >
              {isLogin ? "Join Now" : "Sign In"}
            </button>
          </p>
        </div>

        {/* Social Authentication Section */}
        <div className="mt-10 pt-8 border-t border-white/5 space-y-4">
           <div className="flex items-center gap-4 text-slate-600 mb-6">
              <div className="h-px bg-white/5 flex-1"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Or Secure Access Via</span>
              <div className="h-px bg-white/5 flex-1"></div>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <button onClick={handleGoogleLogin} className="flex items-center justify-center gap-3 bg-[#2d3139] border border-white/5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white hover:bg-[#343942] transition-all shadow-sm active:scale-95">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                Google
              </button>
              <button onClick={handleAppleLogin} className="flex items-center justify-center gap-3 bg-black border border-white/5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white hover:bg-zinc-900 transition-all shadow-xl active:scale-95">
                 <svg className="w-5 h-5" viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 21.8-88.5 21.8-11.4 0-51.1-22.1-82.6-22.1-41.9 0-80.6 24.1-102.2 61.9-43.2 75.3-11.1 185.9 31.5 247.4 20.8 29.9 45.3 63.6 77.3 62.6 31.1-1 42.8-20.1 80.5-20.1 37.7 0 48.6 20.1 80.5 19.3 32.7-.8 53.7-30.5 73.8-60 23.2-33.9 32.7-66.8 33-68.5-.8-.4-64.1-24.6-64.4-97.5zm-58.5-157.4c16-19.7 26.8-47 23.8-74.3-23.3 1-51.3 15.6-68 35.3-14.9 17.5-28 45.3-24.5 71.5 26.1 2 52.7-12.8 68.7-32.5z"/></svg>
                 Apple
              </button>
           </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-3 text-slate-600">
           <ShieldCheck size={14} className="text-[#5ed5a8]" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em]">End-to-End Secure Identity Protocol</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
