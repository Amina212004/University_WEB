import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUniversity, login, getMe } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';
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
    <div className="min-h-screen flex bg-slate-50 font-sans">
      <div className="hidden lg:flex flex-1 relative bg-slate-900 overflow-hidden items-center justify-center p-12">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/30 rounded-full blur-[100px]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent-500/20 rounded-full blur-[80px]" />
        <div className="relative z-10 text-center max-w-lg">
          <img src={logo} alt="Uniora" className="h-32 mx-auto mb-8 filter brightness-0 invert" />
          <h2 className="text-4xl font-extrabold text-white mb-4">Rejoignez Uniora</h2>
          <p className="text-lg text-slate-300">
            Créez l'espace de votre université en quelques clics. 
            Déployez instantanément un tableau de bord puissant pour vos équipes.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 mb-8 transition-colors">
            <ArrowLeft size={16} /> Retour à l'accueil
          </Link>
          
          <div className="lg:hidden mb-8">
            <img src={logo} alt="Uniora" className="h-16" />
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">Inscription</h1>
          <p className="text-slate-500 mb-8">Créez l'espace de votre université</p>

          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mb-6 border border-red-100">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">L'Université</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nom de l'Université</label>
                  <input type="text" required name="name" value={formData.name} onChange={handleNameChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sous-domaine</label>
                  <input type="text" required name="subdomain" value={formData.subdomain} onChange={e => setFormData({...formData, subdomain: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">L'Administrateur</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Prénom</label>
                    <input type="text" required value={formData.admin_first_name} onChange={e => setFormData({...formData, admin_first_name: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nom</label>
                    <input type="text" required value={formData.admin_last_name} onChange={e => setFormData({...formData, admin_last_name: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                  <input type="email" required value={formData.admin_email} onChange={e => setFormData({...formData, admin_email: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mot de passe</label>
                  <input type="password" required minLength={8} value={formData.admin_password} onChange={e => setFormData({...formData, admin_password: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl font-semibold shadow-[0_4px_14px_0_rgba(139,92,246,0.39)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.23)] hover:-translate-y-0.5 transition-all flex items-center justify-center">
              {loading ? <span className="spinner" /> : 'Créer l\'université'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Déjà inscrit ? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
