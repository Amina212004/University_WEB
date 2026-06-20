import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUsers, createUser, deleteUser } from '../api/services';
import { Users, Plus, Trash2, Mail, LayoutDashboard, Settings, LogOut } from 'lucide-react';
import logo from '../assets/Logo.svg';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', password: '', role: 'teacher'
  });
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (user) fetchUsers();
  }, [user]);

  const stats = [
    { label: 'Total', value: users.length, color: 'bg-blue-500' },
    { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: 'bg-brand-500' },
    { label: 'Professeurs', value: users.filter(u => u.role === 'teacher').length, color: 'bg-accent-500' },
    { label: 'Étudiants', value: users.filter(u => u.role === 'student').length, color: 'bg-emerald-500' },
  ];

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createUser(formData);
      setIsModalOpen(false);
      fetchUsers();
      setFormData({ first_name: '', last_name: '', email: '', password: '', role: 'teacher' });
    } catch (err) {
      setError(typeof err.response?.data?.detail === 'string' ? err.response.data.detail : 'Erreur');
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Voulez-vous vraiment désactiver cet utilisateur ?')) {
      try {
        await deleteUser(id);
        fetchUsers();
      } catch (err) { console.error(err); }
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-slate-100">
          <img src={logo} alt="Uniora" className="h-10" />
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-brand-50 text-brand-600 rounded-xl font-medium">
            <LayoutDashboard size={20} /> Tableau de bord
          </a>
          {user?.role === 'admin' && (
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl font-medium transition-colors">
              <Settings size={20} /> Paramètres
            </a>
          )}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button onClick={logout} className="flex items-center gap-3 px-4 py-3 w-full text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl font-medium transition-colors">
            <LogOut size={20} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-bold text-slate-800">
            Espace {user?.role === 'admin' ? 'Administration' : user?.role === 'teacher' ? 'Professeur' : 'Étudiant'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-bold text-slate-900">{user?.first_name} {user?.last_name}</div>
              <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-accent-500 text-white flex items-center justify-center font-bold shadow-md">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-8">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((s, i) => (
              <div key={i} className="glass-card p-6 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${s.color} text-white flex items-center justify-center shadow-lg`}>
                  <Users size={24} />
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-slate-900">{s.value}</div>
                  <div className="text-sm font-medium text-slate-500">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Table Area */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <h2 className="text-lg font-bold text-slate-800">Membres de l'Université</h2>
              {user?.role === 'admin' && (
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
                  <Plus size={18} /> Ajouter
                </button>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Utilisateur</th>
                    <th className="px-6 py-4 font-semibold">Email</th>
                    <th className="px-6 py-4 font-semibold">Rôle</th>
                    <th className="px-6 py-4 font-semibold">Statut</th>
                    {user?.role === 'admin' && <th className="px-6 py-4 font-semibold text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">
                            {u.first_name[0]}{u.last_name[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{u.first_name} {u.last_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        <div className="flex items-center gap-2"><Mail size={14} /> {u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                          u.role === 'admin' ? 'bg-amber-100 text-amber-700' :
                          u.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {u.role === 'admin' ? 'Admin' : u.role === 'teacher' ? 'Professeur' : 'Étudiant'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <span className="text-sm text-slate-600 font-medium">{u.is_active ? 'Actif' : 'Inactif'}</span>
                        </div>
                      </td>
                      {user?.role === 'admin' && (
                        <td className="px-6 py-4 text-right">
                          {u.id !== user.id && (
                            <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={18} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Nouvel Utilisateur</h2>
            </div>
            
            <div className="p-6">
              {error && <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Rôle</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="teacher">Professeur</option>
                    <option value="student">Étudiant</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Prénom</label>
                    <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nom</label>
                    <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" required value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input type="email" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Mot de passe</label>
                  <input type="password" minLength={8} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                <div className="pt-4 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">Annuler</button>
                  <button type="submit" className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl transition-colors shadow-sm">Créer l'utilisateur</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
