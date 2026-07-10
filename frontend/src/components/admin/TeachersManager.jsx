import React, { useState, useEffect } from 'react';
import { getUsers, createUsersBulk, toggleUserActive, resetUserPassword } from '../../api/services';
import { Plus, Trash2, Mail, Lock, CheckCircle, XCircle } from 'lucide-react';

export default function TeachersManager() {
  const [teachers, setTeachers] = useState([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [importResults, setImportResults] = useState(null);

  const fetchTeachers = async () => {
    try {
      const res = await getUsers('teacher');
      setTeachers(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleBulkImport = async (e) => {
    e.preventDefault();
    try {
      const lines = importData.trim().split('\n');
      const payload = lines.map(line => {
        const [first_name, last_name, email] = line.split(',');
        return {
          first_name: first_name?.trim(),
          last_name: last_name?.trim(),
          email: email?.trim(),
          role: 'teacher'
        };
      }).filter(u => u.first_name && u.email);

      const res = await createUsersBulk(payload);
      setImportResults(res.data);
      fetchTeachers();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'importation');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await toggleUserActive(id);
      fetchTeachers();
    } catch (err) {
      alert("Erreur lors de l'activation/désactivation");
    }
  };

  const handleResetPassword = async (id) => {
    const newPwd = window.prompt("Entrez le nouveau mot de passe (min 8 caractères) :");
    if (!newPwd || newPwd.length < 8) {
      alert("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    try {
      await resetUserPassword(id, newPwd);
      alert("Mot de passe réinitialisé avec succès !");
    } catch (err) {
      alert("Erreur lors de la réinitialisation");
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Gestion des Professeurs</h2>
        <button 
          onClick={() => setIsImportModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus size={18} /> Ajouter / Importer (CSV)
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Professeur</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold text-center">Statut</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {teachers.map(t => (
              <tr key={t.id} className={`hover:bg-slate-50/50 transition-colors ${!t.is_active ? 'opacity-60' : ''}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">
                      {t.first_name[0]}{t.last_name[0]}
                    </div>
                    <div className="font-semibold text-slate-900">{t.first_name} {t.last_name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500 text-sm">
                  <div className="flex items-center gap-2"><Mail size={14} /> {t.email}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  {t.is_active ? (
                    <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                      <CheckCircle size={12} /> Actif
                    </span>
                  ) : (
                    <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                      <XCircle size={12} /> Inactif
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 flex justify-end gap-2">
                  <button 
                    onClick={() => handleResetPassword(t.id)}
                    className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    title="Réinitialiser mot de passe"
                  >
                    <Lock size={18} />
                  </button>
                  <button 
                    onClick={() => handleToggleActive(t.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      t.is_active 
                        ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' 
                        : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={t.is_active ? "Désactiver" : "Activer"}
                  >
                    {t.is_active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                  </button>
                </td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-slate-400">Aucun professeur trouvé.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Import en masse (Professeurs)</h2>
              <button onClick={() => { setIsImportModalOpen(false); setImportResults(null); }} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {!importResults ? (
                <form onSubmit={handleBulkImport}>
                  <p className="text-sm text-slate-500 mb-4">
                    Format (1 par ligne) : <code>Prénom,Nom,Email</code>
                  </p>
                  <textarea
                    className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 font-mono text-sm"
                    placeholder="Albert,Einstein,albert@mail.com&#10;Isaac,Newton,isaac@mail.com"
                    value={importData}
                    onChange={e => setImportData(e.target.value)}
                    required
                  />
                  <div className="mt-4 flex justify-end">
                    <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl font-medium">Lancer l'import</button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl mb-6 font-medium">
                    ✅ {importResults.imported} professeurs importés avec succès.
                  </div>
                  <h3 className="font-bold text-slate-800 mb-3">Mots de passe générés (Sauvegardez ceci !)</h3>
                  <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-sm overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-700">
                          <th className="pb-2">Nom</th>
                          <th className="pb-2">Email</th>
                          <th className="pb-2">Mot de passe</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResults.users.map((u, i) => (
                          <tr key={i}>
                            <td className="py-2">{u.first_name} {u.last_name}</td>
                            <td className="py-2">{u.email}</td>
                            <td className="py-2 font-bold text-emerald-400 select-all">{u.generated_password}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
