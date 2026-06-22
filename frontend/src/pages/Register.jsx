import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUniversity, login, getMe } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Building2, UserCircle, Mail, Lock, Globe, Sparkles } from 'lucide-react';
import logo from '../assets/Logo.svg';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '', subdomain: '', admin_first_name: '', admin_last_name: '', admin_email: '', admin_password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const handleNameChange = (e) => {
    const name = e.target.value;
    const subdomain = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').substring(0, 30);
    setFormData({ ...formData, name, subdomain });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerUniversity(formData);
      const loginRes = await login(formData.admin_email, formData.admin_password);
      localStorage.setItem('access_token', loginRes.data.access_token);
      const meRes = await getMe();
      loginUser(loginRes.data, meRes.data);
      navigate('/dashboard');
    } catch (err) {
      setError(typeof err.response?.data?.detail === 'string' ? err.response.data.detail : 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      
      {/* ─── Left: 3D Animated Panel ─── */}
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
            Rejoignez <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-brand-400 to-violet-300">Uniora</span>
          </h2>
          <p className="text-slate-300/80 text-base font-light max-w-xs leading-relaxed">
            Déployez l'écosystème numérique de votre université en quelques clics.
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

          <h1 className="text-3xl font-extrabold text-brand-600 mb-1 tracking-tight">Créer votre université</h1>
          <p className="text-slate-400 text-sm mb-5">Remplissez les informations pour commencer.</p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium mb-4 border border-red-100">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Section: Université */}
            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-brand-500/10 rounded-xl flex items-center justify-center">
                  <Building2 size={18} className="text-brand-600" />
                </div>
                <span className="text-base font-bold text-brand-700">Votre Université</span>
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input type="text" required value={formData.name} onChange={handleNameChange} placeholder="Nom de l'université"
                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all text-slate-800 placeholder:text-slate-300" />
                </div>
                <div className="relative">
                  <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input type="text" required value={formData.subdomain} onChange={e => setFormData({...formData, subdomain: e.target.value})} placeholder="sous-domaine"
                    className="w-full pl-10 pr-20 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all text-slate-800 placeholder:text-slate-300" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-mono">.uniora.dz</span>
                </div>
              </div>
            </div>

            {/* Section: Admin */}
            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-brand-500/10 rounded-xl flex items-center justify-center">
                  <UserCircle size={18} className="text-brand-600" />
                </div>
                <span className="text-base font-bold text-brand-700">Compte Administrateur</span>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" required value={formData.admin_first_name} onChange={e => setFormData({...formData, admin_first_name: e.target.value})} placeholder="Prénom"
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all text-slate-800 placeholder:text-slate-300" />
                  <input type="text" required value={formData.admin_last_name} onChange={e => setFormData({...formData, admin_last_name: e.target.value})} placeholder="Nom"
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all text-slate-800 placeholder:text-slate-300" />
                </div>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input type="email" required value={formData.admin_email} onChange={e => setFormData({...formData, admin_email: e.target.value})} placeholder="admin@universite.dz"
                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all text-slate-800 placeholder:text-slate-300" />
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input type="password" required minLength={8} value={formData.admin_password} onChange={e => setFormData({...formData, admin_password: e.target.value})} placeholder="Mot de passe (min 8 car.)"
                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all text-slate-800 placeholder:text-slate-300" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl font-bold text-sm shadow-[0_6px_20px_rgba(139,92,246,0.35)] hover:shadow-[0_10px_30px_rgba(139,92,246,0.5)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <span className="spinner" /> : (<><Sparkles size={16} /> Lancer mon université</>)}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-400">
            Déjà inscrit ? <Link to="/login" className="font-bold text-brand-600 hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>

      {/* 3D CSS Animations */}
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
