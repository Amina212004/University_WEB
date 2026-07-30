import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUsers, importTeachersExcel, toggleUserActive, resetUserPassword, createUser, deleteUser } from '../../api/services';
import { Users, Plus, Trash2, Mail, Lock, CheckCircle, XCircle, FileSpreadsheet, UserPlus, AlertTriangle, GraduationCap } from 'lucide-react';

export default function TeachersManager() {
  const [teachers, setTeachers] = useState([]);
  
  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, targetId: null, targetName: '' });

  const [importResults, setImportResults] = useState(null);
  
  // Single Create Form States
  const [createData, setCreateData] = useState({ first_name: '', last_name: '', email: '', password: '', role: 'teacher' });
  
  // Import Form states
  const [excelFile, setExcelFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const fileRef = useRef();

  const fetchTeachers = async () => {
    try {
      const sRes = await getUsers('teacher');
      setTeachers(sRes.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!excelFile) return;
    setIsImporting(true);
    try {
      const res = await importTeachersExcel(excelFile);
      setImportResults(res.data);
      fetchTeachers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Erreur lors de l'importation");
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    try {
      await createUser(createData);
      setIsCreateModalOpen(false);
      setCreateData({ first_name: '', last_name: '', email: '', password: '', role: 'teacher' });
      fetchTeachers();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la création");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteUser(confirmDelete.targetId);
      setConfirmDelete({ isOpen: false, targetId: null, targetName: '' });
      fetchTeachers();
    } catch (err) {
      alert("Erreur lors de la suppression");
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

  const closeModal = () => {
    setIsImportModalOpen(false);
    setImportResults(null);
    setExcelFile(null);
  };

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Gestion des Professeurs</h2>
            <p className="text-slate-500 mt-2 text-lg">Gérez vos professeurs, importez des listes ou ajoutez-les manuellement.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-white hover:bg-slate-100 text-slate-700 px-5 py-3 rounded-2xl font-bold transition-all shadow-sm border border-slate-200 flex items-center gap-2"
            >
              <UserPlus size={18} /> Ajouter Manuel
            </button>
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-brand-500/30 flex items-center gap-2"
            >
              <FileSpreadsheet size={18} /> Import Excel
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                  <th className="px-6 py-5">Professeur</th>
                  <th className="px-6 py-5">Email</th>
                  <th className="px-6 py-5 text-center">Statut</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {teachers.map(s => (
                  <tr key={s.id} className={`hover:bg-slate-50/50 transition-colors ${!s.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {s.avatar_url ? (
                          <img src={s.avatar_url} className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm" alt="avatar" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-lg shadow-sm border border-violet-100">
                            {s.first_name[0]}{s.last_name[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 text-lg">{s.first_name} {s.last_name}</div>
                          <div className="text-xs font-semibold text-violet-500 uppercase tracking-wide">Professeur</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm font-medium">
                      <div className="flex items-center gap-2"><Mail size={16} className="text-slate-400" /> {s.email}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {s.is_active ? (
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1 shadow-sm border border-emerald-200">
                          <CheckCircle size={14} /> Actif
                        </span>
                      ) : (
                        <span className="bg-rose-100 text-rose-700 px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1 shadow-sm border border-rose-200">
                          <XCircle size={14} /> Inactif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-2 items-center">
                      <button onClick={() => handleResetPassword(s.id)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors" title="Réinitialiser mot de passe">
                        <Lock size={18} />
                      </button>
                      <button onClick={() => handleToggleActive(s.id)} className={`p-2.5 rounded-xl transition-colors ${s.is_active ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={s.is_active ? "Désactiver" : "Activer"}>
                        {s.is_active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                      </button>
                      <div className="w-px h-6 bg-slate-200 mx-1"></div>
                      <button onClick={() => setConfirmDelete({ isOpen: true, targetId: s.id, targetName: `${s.first_name} ${s.last_name}` })} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors" title="Supprimer ce professeur">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {teachers.length === 0 && (
                  <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-medium">Aucun professeur trouvé.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col transform transition-all">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <UserPlus className="text-brand-500" /> Nouveau Professeur
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm border border-slate-100">✕</button>
            </div>
            <form onSubmit={handleCreateTeacher} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Prénom</label>
                    <input type="text" required value={createData.first_name} onChange={e => setCreateData({...createData, first_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-brand-500 font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Nom</label>
                    <input type="text" required value={createData.last_name} onChange={e => setCreateData({...createData, last_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-brand-500 font-medium" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Email</label>
                  <input type="email" required value={createData.email} onChange={e => setCreateData({...createData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-brand-500 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Mot de passe</label>
                  <input type="password" required minLength={8} value={createData.password} onChange={e => setCreateData({...createData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-brand-500 font-medium" />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-6 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold transition-colors">Annuler</button>
                <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-2xl font-bold transition-colors shadow-lg shadow-brand-500/30">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDelete.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-8 text-center transform transition-all">
            <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <AlertTriangle size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-3">Suppression</h2>
            <p className="text-slate-500 mb-8 text-sm font-medium leading-relaxed">
              Voulez-vous vraiment supprimer définitivement le professeur <strong>{confirmDelete.targetName}</strong> ?
            </p>
            <div className="flex gap-4">
              <button onClick={() => setConfirmDelete({ isOpen: false, targetId: null, targetName: '' })} className="flex-1 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold transition-colors">Annuler</button>
              <button onClick={handleDeleteConfirm} className="flex-1 py-3 text-white bg-rose-500 hover:bg-rose-600 rounded-2xl font-bold transition-colors shadow-lg shadow-rose-500/30">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl">
                  <FileSpreadsheet size={24} /> 
                </div>
                Importation de professeurs
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm border border-slate-100">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {!importResults ? (
                <form onSubmit={handleBulkImport} className="space-y-6">
                  {/* File upload */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                      Téléversez le fichier Excel
                    </h3>
                    <div className="border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => !excelFile && fileRef.current?.click()}>
                      <input 
                        type="file" 
                        ref={fileRef}
                        accept=".xlsx, .xls"
                        className="hidden"
                        onChange={(e) => setExcelFile(e.target.files[0])}
                        required
                      />
                      {excelFile ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle className="text-emerald-500 mb-3" size={48} />
                          <p className="text-slate-900 font-bold text-lg">{excelFile.name}</p>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setExcelFile(null); }} className="bg-rose-100 text-rose-600 px-4 py-2 rounded-xl text-sm mt-4 hover:bg-rose-200 font-semibold transition-colors">Choisir un autre fichier</button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <FileSpreadsheet className="text-slate-300 mb-4" size={56} />
                          <p className="text-slate-700 font-bold mb-2 text-lg">Cliquez ici pour choisir un fichier Excel</p>
                          <p className="text-slate-500 text-sm font-medium">Format attendu : .xlsx (Prénom, Nom, Email, Mot de passe)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-6 border-t border-slate-100">
                    <button type="submit" disabled={isImporting || !excelFile} className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all">
                      {isImporting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={20} />}
                      Lancer l'importation
                    </button>
                  </div>
                </form>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-8 rounded-3xl mb-8 text-center shadow-inner">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-100">
                      <CheckCircle size={40} className="text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-black mb-2">Importation Réussie !</h3>
                    <p className="text-emerald-700 font-medium text-lg">{importResults.imported} professeurs ont été créés.</p>
                  </div>
                  
                  <h4 className="font-bold text-slate-800 mb-4 text-lg">Professeurs ajoutés</h4>
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 font-bold">Nom complet</th>
                          <th className="px-6 py-4 font-bold">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importResults.users.map((u, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-bold text-slate-900">{u.first_name} {u.last_name}</td>
                            <td className="px-6 py-4 font-medium text-slate-500">{u.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button onClick={closeModal} className="bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg">Terminer</button>
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
