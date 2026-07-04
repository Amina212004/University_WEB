import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, verifyCode, confirmResetPassword } from '../api/services';
import { ArrowLeft, Mail, Lock, ShieldCheck, Sparkles, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/Logo.svg';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: Code 6 chiffres, 3: New Password, 4: Success
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [debugCode, setDebugCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const codeInputRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Auto-focus first code input when step 2 is reached
  useEffect(() => {
    if (step === 2 && codeInputRefs.current[0]) {
      setTimeout(() => codeInputRefs.current[0]?.focus(), 150);
    }
  }, [step]);

  // ─── STEP 1: Request Code ───
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      if (res.data.debug_code) {
        setDebugCode(res.data.debug_code);
      }
      setStep(2);
      setCountdown(60);
    } catch (err) {
      setError(err.response?.data?.detail || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  // ─── STEP 2: Verify 6-digit Code ───
  const handleCodeChange = (index, value) => {
    // Allow only digits
    if (value && !/^\d$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      codeInputRefs.current[5]?.focus();
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Veuillez saisir le code complet à 6 chiffres.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await verifyCode(email, fullCode);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.detail || 'Code incorrect.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    setError('');
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      if (res.data.debug_code) {
        setDebugCode(res.data.debug_code);
      }
      setCode(['', '', '', '', '', '']);
      setCountdown(60);
      codeInputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du renvoi.');
    } finally {
      setLoading(false);
    }
  };

  // ─── STEP 3: New Password ───
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await confirmResetPassword(email, code.join(''), newPassword);
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la réinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step indicator titles ───
  const stepTitles = ['', 'Votre Email', 'Code de vérification', 'Nouveau mot de passe', 'Terminé !'];

  return (
    <div className="h-screen flex overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      
      {/* ─── Left: 3D Animated Panel (Same as Register/Login) ─── */}
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
            Récupération <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-brand-400 to-violet-300">sécurisée</span>
          </h2>
          <p className="text-slate-300/80 text-base font-light max-w-xs leading-relaxed">
            Retrouvez l'accès à votre espace universitaire en quelques étapes simples.
          </p>
        </div>
      </div>

      {/* ─── Right: Form Panel ─── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 bg-white relative">
        <div className="w-full max-w-md">
          
          {/* Back button */}
          {step < 4 ? (
            <button
              onClick={() => {
                if (step === 1) navigate('/login');
                else setStep(step - 1);
              }}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-brand-50 text-brand-600 hover:bg-brand-100 hover:text-brand-700 mb-6 transition-all group shadow-sm"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
          ) : <div className="h-10 mb-6" />}

          {/* Logo on mobile */}
          <div className="lg:hidden mb-4 flex justify-center">
            <img src={logo} alt="Uniora" className="h-16 filter drop-shadow-[0_4px_12px_rgba(139,92,246,0.25)]" />
          </div>

          {/* Step Progress Indicator */}
          {step < 4 && (
            <div className="flex items-center gap-3 mb-8">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center gap-3 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                    s < step ? 'bg-brand-500 text-white scale-90' :
                    s === step ? 'bg-brand-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.5)] scale-110' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {s < step ? <CheckCircle2 size={16} /> : s}
                  </div>
                  {s < 3 && (
                    <div className={`flex-1 h-[3px] rounded-full transition-all duration-500 ${
                      s < step ? 'bg-brand-500' : 'bg-slate-100'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ═══ STEP 1: Email ═══ */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h1 className="text-3xl font-extrabold text-brand-600 mb-1 tracking-tight">Mot de passe oublié ?</h1>
              <p className="text-slate-400 text-sm mb-6">Entrez votre email pour recevoir un code de vérification à 6 chiffres.</p>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium mb-4 border border-red-100">{error}</div>
              )}

              <form onSubmit={handleRequestCode} className="space-y-4">
                <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-brand-700 mb-1.5">Adresse Email</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com"
                        className="w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all text-slate-800 placeholder:text-slate-300" />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl font-bold text-sm shadow-[0_6px_20px_rgba(139,92,246,0.35)] hover:shadow-[0_10px_30px_rgba(139,92,246,0.5)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? <span className="spinner" /> : (<><Sparkles size={16} /> Envoyer le code</>)}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-slate-400">
                Vous avez retrouvé la mémoire ? <Link to="/login" className="font-bold text-brand-600 hover:underline">Se connecter</Link>
              </p>
            </div>
          )}

          {/* ═══ STEP 2: 6-digit Code ═══ */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h1 className="text-3xl font-extrabold text-brand-600 mb-1 tracking-tight">Vérification</h1>
              <p className="text-slate-400 text-sm mb-2">
                Un code à 6 chiffres a été envoyé à <span className="font-semibold text-slate-600">{email}</span>
              </p>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium mb-4 border border-red-100">{error}</div>
              )}

              <form onSubmit={handleVerifyCode} className="space-y-6">
                {/* 6-digit Code Inputs */}
                <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-5">
                  <label className="block text-sm font-semibold text-brand-700 mb-4 text-center">Saisissez votre code</label>
                  <div className="flex justify-center gap-3" onPaste={handleCodePaste}>
                    {code.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => codeInputRefs.current[i] = el}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleCodeChange(i, e.target.value)}
                        onKeyDown={e => handleCodeKeyDown(i, e)}
                        className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all duration-300 bg-white
                          ${digit ? 'border-brand-500 text-brand-700 shadow-[0_0_12px_rgba(139,92,246,0.15)]' : 'border-slate-200 text-slate-800'}
                          focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:shadow-[0_0_15px_rgba(139,92,246,0.2)]`}
                      />
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={loading || code.join('').length !== 6}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl font-bold text-sm shadow-[0_6px_20px_rgba(139,92,246,0.35)] hover:shadow-[0_10px_30px_rgba(139,92,246,0.5)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? <span className="spinner" /> : (<><ShieldCheck size={16} /> Vérifier le code</>)}
                </button>
              </form>

              {/* Resend code */}
              <div className="mt-5 text-center">
                {countdown > 0 ? (
                  <p className="text-xs text-slate-400">Renvoyer le code dans <span className="font-bold text-brand-600">{countdown}s</span></p>
                ) : (
                  <button onClick={handleResendCode} disabled={loading} className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline transition-colors disabled:opacity-50">
                    Renvoyer un nouveau code
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ═══ STEP 3: New Password ═══ */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h1 className="text-3xl font-extrabold text-brand-600 mb-1 tracking-tight">Nouveau mot de passe</h1>
              <p className="text-slate-400 text-sm mb-6">Choisissez un nouveau mot de passe sécurisé pour votre compte.</p>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium mb-4 border border-red-100">{error}</div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-brand-700 mb-1.5">Nouveau mot de passe</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input type={showPassword ? 'text' : 'password'} required minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 8 caractères"
                        className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all text-slate-800 placeholder:text-slate-300" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-500 transition-colors">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-brand-700 mb-1.5">Confirmer le mot de passe</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input type={showConfirm ? 'text' : 'password'} required minLength={8} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Retapez le mot de passe"
                        className={`w-full pl-10 pr-10 py-3 bg-white border rounded-lg text-sm outline-none focus:ring-2 transition-all text-slate-800 placeholder:text-slate-300 ${
                          confirmPassword && confirmPassword !== newPassword
                            ? 'border-red-300 focus:border-red-400 focus:ring-red-500/10'
                            : confirmPassword && confirmPassword === newPassword
                              ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-500/10'
                              : 'border-slate-200 focus:border-brand-500 focus:ring-brand-500/10'
                        }`} />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-500 transition-colors">
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword === newPassword && (
                      <p className="text-emerald-500 text-xs mt-1.5 font-medium flex items-center gap-1"><CheckCircle2 size={12} /> Les mots de passe correspondent</p>
                    )}
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-red-500 text-xs mt-1.5 font-medium">Les mots de passe ne correspondent pas</p>
                    )}
                  </div>

                  {/* Password strength indicator */}
                  {newPassword && (
                    <div className="space-y-2">
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            newPassword.length >= i * 3
                              ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-amber-400' : i <= 3 ? 'bg-brand-400' : 'bg-emerald-400'
                              : 'bg-slate-100'
                          }`} />
                        ))}
                      </div>
                      <p className="text-xs text-slate-400">
                        {newPassword.length < 4 ? 'Très faible' : newPassword.length < 7 ? 'Faible' : newPassword.length < 10 ? 'Bon' : 'Excellent'}
                      </p>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl font-bold text-sm shadow-[0_6px_20px_rgba(139,92,246,0.35)] hover:shadow-[0_10px_30px_rgba(139,92,246,0.5)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? <span className="spinner" /> : (<><CheckCircle2 size={16} /> Réinitialiser le mot de passe</>)}
                </button>
              </form>
            </div>
          )}

          {/* ═══ STEP 4: Success ═══ */}
          {step === 4 && (
            <div className="text-center animate-fade-in">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">C'est fait !</h1>
              <p className="text-slate-400 text-sm mb-8">Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
              
              <Link to="/login"
                className="block w-full py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl font-bold text-sm text-center shadow-[0_6px_20px_rgba(139,92,246,0.35)] hover:shadow-[0_10px_30px_rgba(139,92,246,0.5)] hover:-translate-y-0.5 transition-all duration-300">
                Se connecter
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 3D CSS Animations (Same as Register/Login) */}
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

        /* ── Fade In Animation ── */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}} />
    </div>
  );
}
