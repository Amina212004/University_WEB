import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, getMe } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';
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
    <div className="min-h-screen flex bg-slate-50 font-sans">
      <div className="hidden lg:flex flex-1 relative bg-slate-900 overflow-hidden items-center justify-center p-12">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/30 rounded-full blur-[100px]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent-500/20 rounded-full blur-[80px]" />
        <div className="relative z-10 text-center max-w-lg">
          <img src={logo} alt="Uniora" className="h-32 mx-auto mb-8 filter brightness-0 invert" />
          <h2 className="text-4xl font-extrabold text-white mb-4">Bienvenue sur Uniora</h2>
          <p className="text-lg text-slate-300">
            Le portail unifié pour l'administration, les professeurs et les étudiants. 
            Connectez-vous pour accéder à votre espace de travail.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 mb-8 transition-colors">
            <ArrowLeft size={16} /> Retour à l'accueil
          </Link>
          
          <div className="lg:hidden mb-8">
            <img src={logo} alt="Uniora" className="h-16" />
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">Connexion</h1>
          <p className="text-slate-500 mb-8">Entrez vos identifiants pour continuer</p>

          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mb-6 border border-red-100">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Adresse Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all" 
                placeholder="votre@email.com" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">Mot de passe</label>
                <a href="#" className="text-sm font-semibold text-brand-600 hover:text-brand-700">Oublié ?</a>
              </div>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all" 
                placeholder="••••••••" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl font-semibold shadow-[0_4px_14px_0_rgba(139,92,246,0.39)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.23)] hover:-translate-y-0.5 transition-all flex items-center justify-center">
              {loading ? <span className="spinner" /> : 'Se Connecter'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Vous êtes directeur ? <Link to="/register" className="font-semibold text-brand-600 hover:underline">Inscrivez votre université</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
