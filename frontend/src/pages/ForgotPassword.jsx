import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../api/services';
import { ArrowLeft, Mail, Lock, KeyRound, Sparkles, CheckCircle2, Copy, Check } from 'lucide-react';
import logo from '../assets/Logo.svg';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: Token + New Password, 3: Success
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [debugToken, setDebugToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestToken = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      if (res.data.debug_token) {
        setDebugToken(res.data.debug_token);
        setToken(res.data.debug_token); // Préremplir pour le développement
      }
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.detail || 'Le code est invalide ou a expiré.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(debugToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#090d16]" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      
      {/* ─── Dynamic Animated Background ─── */}
      <div className="absolute inset-0 overflow-hidden z-0">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e1040] via-[#3b1d6b] to-[#090d16] animate-gradient-xy bg-[length:400%_400%]" />
        
        {/* Soft Noise Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.04] bg-[url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZUZpbHRlciI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ0cmFuc3BhcmVudCIvPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZUZpbHRlcikiIG9wYWNpdHk9IjEiLz48L3N2Zz4=')] mix-blend-overlay"></div>
        
        {/* Floating Animated Shapes */}
        <ul className="floating-shapes">
          <li></li><li></li><li></li><li></li><li></li>
          <li></li><li></li><li></li><li></li><li></li>
        </ul>
      </div>

      {/* ─── Centered Premium Card (Agrandie) ─── */}
      <div className="relative z-10 w-full max-w-xl mx-4 bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] border border-white/30 p-10 sm:p-12 transition-all duration-500">
        
        {/* Header with Back Button and Logo */}
        <div className="flex items-center justify-between mb-10">
          {step < 3 ? (
            <button onClick={() => step === 2 ? setStep(1) : navigate('/login')} className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-slate-50 text-slate-600 hover:bg-brand-50 hover:text-brand-600 transition-all duration-300 group shadow-sm border border-slate-100 hover:border-brand-100">
              <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform duration-300" />
            </button>
          ) : <div className="w-11 h-11" />}
          
          <img src={logo} alt="Uniora" className="h-10 sm:h-12 filter brightness-100 drop-shadow-sm" />
        </div>

        {/* Step 1: Request Password Reset */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-800 mb-3 tracking-tight">Mot de passe oublié ?</h1>
            <p className="text-slate-500 text-base mb-8 font-medium leading-relaxed">Entrez l'adresse email associée à votre compte, nous vous enverrons un code sécurisé pour réinitialiser votre accès.</p>

            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm text-red-600 p-4 rounded-2xl text-sm font-bold mb-8 border border-red-100 shadow-sm flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {error}
              </div>
            )}

            <form onSubmit={handleRequestToken} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Votre Email</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-brand-500/10 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                  <div className="relative bg-white border-2 border-slate-100 rounded-2xl p-1 focus-within:border-brand-200 focus-within:bg-brand-50/30 transition-all duration-300 shadow-sm">
                    <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="exemple@universite.dz"
                      className="w-full pl-12 pr-4 py-4 bg-transparent text-base font-medium outline-none text-slate-800 placeholder:text-slate-300" />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-4 sm:py-5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-2xl font-bold text-base sm:text-lg shadow-[0_10px_30px_-10px_rgba(139,92,246,0.6)] hover:shadow-[0_15px_35px_-10px_rgba(139,92,246,0.7)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 mt-4">
                {loading ? <span className="spinner w-6 h-6 border-2" /> : (<><Sparkles size={22} className="text-brand-100" /> Recevoir mon code</>)}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Reset Password Form */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-800 mb-3 tracking-tight">Réinitialisation</h1>
            <p className="text-slate-500 text-base mb-8 font-medium leading-relaxed">Saisissez le code de sécurité reçu par email et choisissez votre nouveau mot de passe.</p>

            {/* ⚠️ Simulation Token Display ⚠️ */}
            {debugToken && (
              <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 mb-8 flex items-center justify-between text-brand-800 text-sm shadow-sm">
                <div className="flex-1 min-w-0 pr-4">
                  <span className="font-bold block mb-1.5 text-brand-600">🔑 Code de simulation (Dev Mode) :</span>
                  <code className="block bg-white px-3 py-2 rounded-xl border border-brand-100 font-mono text-brand-700 select-all overflow-x-auto truncate shadow-inner">{debugToken}</code>
                </div>
                <button onClick={copyToClipboard} className="p-3 bg-white border border-brand-200 hover:bg-brand-100 hover:text-brand-700 text-brand-600 rounded-xl transition-all shadow-sm">
                  {copied ? <Check size={20} className="text-emerald-600" /> : <Copy size={20} />}
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm text-red-600 p-4 rounded-2xl text-sm font-bold mb-8 border border-red-100 shadow-sm flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {error}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Code de sécurité</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-brand-500/10 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                    <div className="relative bg-white border-2 border-slate-100 rounded-2xl p-1 focus-within:border-brand-200 focus-within:bg-brand-50/30 transition-all duration-300 shadow-sm">
                      <KeyRound size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                      <input type="text" required value={token} onChange={e => setToken(e.target.value)} placeholder="Ex: a1b2c3d4..."
                        className="w-full pl-12 pr-4 py-4 bg-transparent text-base font-medium outline-none text-slate-800 placeholder:text-slate-300" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Nouveau mot de passe</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-brand-500/10 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                    <div className="relative bg-white border-2 border-slate-100 rounded-2xl p-1 focus-within:border-brand-200 focus-within:bg-brand-50/30 transition-all duration-300 shadow-sm">
                      <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                      <input type="password" required minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 8 caractères"
                        className="w-full pl-12 pr-4 py-4 bg-transparent text-base font-medium outline-none text-slate-800 placeholder:text-slate-300" />
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-4 sm:py-5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-2xl font-bold text-base sm:text-lg shadow-[0_10px_30px_-10px_rgba(139,92,246,0.6)] hover:shadow-[0_15px_35px_-10px_rgba(139,92,246,0.7)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 mt-8">
                {loading ? <span className="spinner w-6 h-6 border-2" /> : (<><CheckCircle2 size={22} className="text-brand-100" /> Mettre à jour</>)}
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="text-center py-8 animate-fade-in">
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 border-[6px] border-white shadow-[0_0_40px_rgba(16,185,129,0.2)]">
              <CheckCircle2 size={48} className="text-emerald-500 animate-bounce" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-800 mb-4 tracking-tight">C'est fait !</h1>
            <p className="text-slate-500 text-base mb-10 leading-relaxed font-medium">Votre mot de passe a été réinitialisé avec succès. Votre sécurité est assurée.</p>
            
            <Link to="/login" className="block w-full py-4 sm:py-5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-2xl font-bold text-base sm:text-lg text-center shadow-[0_10px_30px_-10px_rgba(139,92,246,0.6)] hover:shadow-[0_15px_35px_-10px_rgba(139,92,246,0.7)] hover:-translate-y-1 transition-all duration-300">
              Retourner à la connexion
            </Link>
          </div>
        )}

        {/* Footer Link */}
        {step < 3 && (
          <p className="mt-10 text-center text-sm sm:text-base text-slate-500 font-medium">
            Vous avez retrouvé la mémoire ? <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700 hover:underline transition-colors">Se connecter</Link>
          </p>
        )}
      </div>

      {/* ─── CSS Animations ─── */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes gradientXY {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-xy {
          animation: gradientXY 12s ease infinite;
        }

        .floating-shapes {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          overflow: hidden;
          margin: 0; padding: 0;
        }

        .floating-shapes li {
          position: absolute;
          display: block;
          list-style: none;
          width: 20px; height: 20px;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          backdrop-filter: blur(4px);
          animation: floatUp 25s linear infinite;
          bottom: -150px;
        }

        .floating-shapes li:nth-child(1) { left: 25%; width: 80px; height: 80px; animation-delay: 0s; }
        .floating-shapes li:nth-child(2) { left: 10%; width: 30px; height: 30px; animation-delay: 2s; animation-duration: 12s; }
        .floating-shapes li:nth-child(3) { left: 70%; width: 40px; height: 40px; animation-delay: 4s; }
        .floating-shapes li:nth-child(4) { left: 40%; width: 60px; height: 60px; animation-delay: 0s; animation-duration: 18s; }
        .floating-shapes li:nth-child(5) { left: 65%; width: 30px; height: 30px; animation-delay: 0s; }
        .floating-shapes li:nth-child(6) { left: 75%; width: 110px; height: 110px; animation-delay: 3s; }
        .floating-shapes li:nth-child(7) { left: 35%; width: 150px; height: 150px; animation-delay: 7s; }
        .floating-shapes li:nth-child(8) { left: 50%; width: 45px; height: 45px; animation-delay: 15s; animation-duration: 45s; }
        .floating-shapes li:nth-child(9) { left: 20%; width: 25px; height: 25px; animation-delay: 2s; animation-duration: 35s; }
        .floating-shapes li:nth-child(10) { left: 85%; width: 150px; height: 150px; animation-delay: 0s; animation-duration: 11s; }

        @keyframes floatUp {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
            border-radius: 0;
          }
          100% {
            transform: translateY(-100vh) rotate(720deg);
            opacity: 0;
            border-radius: 50%;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}} />
    </div>
  );
}
