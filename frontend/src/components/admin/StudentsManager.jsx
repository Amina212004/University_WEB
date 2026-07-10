import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUsers, importStudentsExcel, toggleUserActive, resetUserPassword, getFaculties, getDepartments, getSpecialties, getLevels } from '../../api/services';
import { Users, Plus, Trash2, Mail, Lock, CheckCircle, XCircle, FileSpreadsheet, ChevronRight } from 'lucide-react';

export default function StudentsManager() {
  const [students, setStudents] = useState([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importResults, setImportResults] = useState(null);
  
  // Form states
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [levels, setLevels] = useState([]);
  
  const [selectedFac, setSelectedFac] = useState('');
  const [selectedDep, setSelectedDep] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [excelFile, setExcelFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const fileRef = useRef();

  const fetchStudents = async () => {
    try {
      const sRes = await getUsers('student');
      setStudents(sRes.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchStudents();
    loadFaculties();
  }, []);

  const loadFaculties = async () => {
    try {
      const res = await getFaculties();
      setFaculties(res.data);
    } catch (err) { console.error(err); }
  };

  const handleFacChange = async (e) => {
    const val = e.target.value;
    setSelectedFac(val);
    setSelectedDep(''); setSelectedSpec(''); setSelectedLevel('');
    setDepartments([]); setSpecialties([]); setLevels([]);
    if (val) {
      const res = await getDepartments(val);
      setDepartments(res.data);
    }
  };

  const handleDepChange = async (e) => {
    const val = e.target.value;
    setSelectedDep(val);
    setSelectedSpec(''); setSelectedLevel('');
    setSpecialties([]); setLevels([]);
    if (val) {
      const res = await getSpecialties(val);
      setSpecialties(res.data);
    }
  };

  const handleSpecChange = async (e) => {
    const val = e.target.value;
    setSelectedSpec(val);
    setSelectedLevel('');
    setLevels([]);
    if (val) {
      const res = await getLevels(val);
      setLevels(res.data);
    }
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!selectedLevel || !excelFile) return;
    setIsImporting(true);
    try {
      const res = await importStudentsExcel(excelFile, selectedLevel);
      setImportResults(res.data);
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Erreur lors de l'importation");
    } finally {
      setIsImporting(false);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await toggleUserActive(id);
      fetchStudents();
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
    setSelectedFac(''); setSelectedDep(''); setSelectedSpec(''); setSelectedLevel('');
    setDepartments([]); setSpecialties([]); setLevels([]);
    setExcelFile(null);
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-50">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Gestion des Étudiants</h2>
        
        <button 
          onClick={() => setIsImportModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <FileSpreadsheet size={18} /> Importer des étudiants (Excel)
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Étudiant</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold text-center">Statut</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {students.map(s => (
              <tr key={s.id} className={`hover:bg-slate-50/50 transition-colors ${!s.is_active ? 'opacity-60' : ''}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {s.avatar_url ? (
                      <img src={s.avatar_url} className="w-10 h-10 rounded-full object-cover border border-slate-200" alt="avatar" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">
                        {s.first_name[0]}{s.last_name[0]}
                      </div>
                    )}
                    <div className="font-semibold text-slate-900">{s.first_name} {s.last_name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500 text-sm">
                  <div className="flex items-center gap-2"><Mail size={14} /> {s.email}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  {s.is_active ? (
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
                  <button onClick={() => handleResetPassword(s.id)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Réinitialiser mot de passe">
                    <Lock size={18} />
                  </button>
                  <button onClick={() => handleToggleActive(s.id)} className={`p-2 rounded-lg transition-colors ${s.is_active ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={s.is_active ? "Désactiver" : "Activer"}>
                    {s.is_active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                  </button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400">Aucun étudiant trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet size={22} className="text-brand-600" /> Importation d'étudiants
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {!importResults ? (
                <form onSubmit={handleBulkImport} className="space-y-6">
                  {/* Hierarchy selection */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-3">1. Choisissez le niveau cible</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-500" value={selectedFac} onChange={handleFacChange} required>
                        <option value="">Sélectionnez une Faculté</option>
                        {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-500 disabled:opacity-50" value={selectedDep} onChange={handleDepChange} disabled={!selectedFac} required>
                        <option value="">Sélectionnez un Département</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-500 disabled:opacity-50" value={selectedSpec} onChange={handleSpecChange} disabled={!selectedDep} required>
                        <option value="">Sélectionnez une Spécialité</option>
                        {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <select className="w-full bg-brand-50 border border-brand-200 text-brand-900 font-medium rounded-xl px-4 py-2.5 outline-none focus:border-brand-500 disabled:opacity-50" value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} disabled={!selectedSpec} required>
                        <option value="">Sélectionnez un Niveau</option>
                        {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* File upload */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-3">2. Téléversez le fichier Excel</h3>
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:bg-slate-50 transition-colors">
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
                          <CheckCircle className="text-emerald-500 mb-2" size={32} />
                          <p className="text-slate-900 font-medium">{excelFile.name}</p>
                          <button type="button" onClick={() => setExcelFile(null)} className="text-rose-500 text-sm mt-2 hover:underline">Retirer</button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center cursor-pointer" onClick={() => fileRef.current?.click()}>
                          <FileSpreadsheet className="text-slate-400 mb-3" size={40} />
                          <p className="text-slate-600 font-medium mb-1">Cliquez ici pour choisir un fichier Excel</p>
                          <p className="text-slate-400 text-xs">Fichier .xlsx (Prénom, Nom, Email, Mot de passe)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button type="submit" disabled={isImporting || !excelFile || !selectedLevel} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-medium flex items-center gap-2">
                      {isImporting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={18} />}
                      Lancer l'importation
                    </button>
                  </div>
                </form>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-6 rounded-2xl mb-6 text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={32} className="text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-1">Importation Réussie !</h3>
                    <p className="text-emerald-600/80 font-medium">{importResults.imported} étudiants importés et inscrits au niveau sélectionné.</p>
                  </div>
                  
                  <h4 className="font-bold text-slate-800 mb-3">Étudiants ajoutés</h4>
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Nom complet</th>
                          <th className="px-4 py-3 font-semibold">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importResults.users.map((u, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3 font-medium text-slate-900">{u.first_name} {u.last_name}</td>
                            <td className="px-4 py-3 text-slate-500">{u.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-6 flex justify-center">
                    <button onClick={closeModal} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-medium">Terminer</button>
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
