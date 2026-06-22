import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, getMe } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Mail, Lock, LogIn, Sparkles } from 'lucide-react';
import logo from '../assets/Logo.svg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      localStorage.setItem('access_token', res.data.access_token);
      const meRes = await getMe();
      loginUser(res.data, meRes.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      
      {/* ─── Left: 3D Animated Panel (Matches Register.jsx) ─── */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900 items-center justify-center overflow-hidden reg-perspective">
        
        {/* Deep space background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#1e1040_0%,#0f172a_70%)]" />
        
        {/* 3D Rotating cube wireframe */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="reg-cube">
            <div className="reg-cube-face reg-cube-front" />
            <div className="reg-cube-face reg-cube-back" />
            <div className="reg-cube-face reg-cube-left" />
            <div className="reg-cube-face reg-cube-right" />
            <div className="reg-cube-face reg-cube-top" />
            <div className="reg-cube-face reg-cube-bottom" />
          </div>
        </div>

        {/* Floating 3D rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="reg-ring reg-ring-1" />
          <div className="reg-ring reg-ring-2" />
          <div className="reg-ring reg-ring-3" />
        </div>

        {/* Glowing orbs */}
        <div className="absolute top-[20%] left-[15%] w-40 h-40 bg-brand-600/30 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute bottom-[25%] right-[10%] w-56 h-56 bg-accent-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '7s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-10">
          <div className="relative group mb-8">
            <div className="absolute inset-[-20px] rounded-full bg-brand-500/20 blur-2xl animate-pulse group-hover:bg-brand-500/40 transition-all" style={{ animationDuration: '3s' }} />
            <img src={logo} alt="Uniora" className="relative h-56 filter brightness-0 invert drop-shadow-[0_0_50px_rgba(139,92,246,0.7)] group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h2 className="text-4xl font-black text-white mb-3 tracking-tight">
            Espace <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-brand-400 to-violet-300">Uniora</span>
          </h2>
          <p className="text-slate-300/80 text-base font-light max-w-xs leading-relaxed">
            Accédez au portail numérique de votre université.
          </p>
        </div>
      </div>

      {/* ─── Right: Compact Form (no scroll) ─── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 bg-white">
        <div className="w-full max-w-md">
          
          <Link to="/" className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-brand-50 text-brand-600 hover:bg-brand-100 hover:text-brand-700 mb-6 transition-all group shadow-sm">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          
          <div className="lg:hidden mb-4 flex justify-center">
            <img src={logo} alt="Uniora" className="h-12" />
          </div>

          <h1 className="text-3xl font-extrabold text-brand-600 mb-1 tracking-tight">Se connecter</h1>
          <p className="text-slate-400 text-sm mb-6">Entrez vos identifiants pour accéder à votre espace.</p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium mb-4 border border-red-100">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Form Fields Card Container */}
            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-5 space-y-4">
              
              <div>
                <label className="block text-sm font-semibold text-brand-700 mb-1.5">Adresse Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com"
                    className="w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all text-slate-800 placeholder:text-slate-300" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-brand-700">Mot de passe</label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors">Mot de passe oublié ?</Link>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all text-slate-800 placeholder:text-slate-300" />
                </div>
              </div>

            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl font-bold text-sm shadow-[0_6px_20px_rgba(139,92,246,0.35)] hover:shadow-[0_10px_30px_rgba(139,92,246,0.5)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <span className="spinner" /> : (<><LogIn size={16} /> Se connecter</>)}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Vous êtes directeur ? <Link to="/register" className="font-bold text-brand-600 hover:underline">Inscrivez votre université</Link>
          </p>
        </div>
      </div>

      {/* 3D CSS Animations (Matches Register.jsx) */}
      <style dangerouslySetInnerHTML={{__html: `
        .reg-perspective { perspective: 1200px; }

        /* ── 3D Rotating Cube ── */
        .reg-cube {
          width: 220px; height: 220px;
          position: relative;
          transform-style: preserve-3d;
          animation: regCubeRotate 18s linear infinite;
        }
        .reg-cube-face {
          position: absolute; width: 100%; height: 100%;
          border: 1.5px solid rgba(139, 92, 246, 0.15);
          border-radius: 18px;
          background: rgba(139, 92, 246, 0.02);
        }
        .reg-cube-front  { transform: translateZ(110px); }
        .reg-cube-back   { transform: translateZ(-110px) rotateY(180deg); }
        .reg-cube-left   { transform: translateX(-110px) rotateY(-90deg); }
        .reg-cube-right  { transform: translateX(110px) rotateY(90deg); }
        .reg-cube-top    { transform: translateY(-110px) rotateX(90deg); }
        .reg-cube-bottom { transform: translateY(110px) rotateX(-90deg); }

        @keyframes regCubeRotate {
          0%   { transform: rotateX(0deg) rotateY(0deg); }
          100% { transform: rotateX(360deg) rotateY(360deg); }
        }

        /* ── 3D Tilting Rings ── */
        .reg-ring {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid transparent;
          transform-style: preserve-3d;
        }
        .reg-ring-1 {
          width: 400px; height: 400px;
          border-color: rgba(139, 92, 246, 0.12);
          animation: regRing1 12s linear infinite;
        }
        .reg-ring-2 {
          width: 320px; height: 320px;
          border-color: rgba(249, 115, 22, 0.1);
          animation: regRing2 10s linear infinite;
        }
        .reg-ring-3 {
          width: 500px; height: 500px;
          border-color: rgba(139, 92, 246, 0.06);
          animation: regRing3 16s linear infinite;
        }

        @keyframes regRing1 {
          0%   { transform: rotateX(70deg) rotateZ(0deg); }
          100% { transform: rotateX(70deg) rotateZ(360deg); }
        }
        @keyframes regRing2 {
          0%   { transform: rotateX(50deg) rotateY(30deg) rotateZ(0deg); }
          100% { transform: rotateX(50deg) rotateY(30deg) rotateZ(-360deg); }
        }
        @keyframes regRing3 {
          0%   { transform: rotateX(80deg) rotateY(-20deg) rotateZ(0deg); }
          100% { transform: rotateX(80deg) rotateY(-20deg) rotateZ(360deg); }
        }
      `}} />
    </div>
  );
}
