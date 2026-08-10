import React, { useState, useEffect, useRef } from 'react';
import { getUsers, importStudentsExcel, toggleUserActive, resetUserPassword, getFaculties, getDepartments, getSpecialties, getLevels, createUser, deleteUser } from '../../api/services';
import { 
  Users, Trash2, Mail, CheckCircle, XCircle, X,
  FileSpreadsheet, UserPlus, AlertTriangle, Search, ToggleLeft, ToggleRight, Key,
  GraduationCap, ChevronRight, Filter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function StudentsManager() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState('all'); // 'all' | 'active' | 'inactive'
  
  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, targetId: null, targetName: '' });
  const [importResults, setImportResults] = useState(null);
  
  // Create form
  const [createData, setCreateData] = useState({ first_name: '', last_name: '', email: '', password: '', role: 'student' });
  
  // Import hierarchy
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

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      await createUser(createData);
      setIsCreateModalOpen(false);
      setCreateData({ first_name: '', last_name: '', email: '', password: '', role: 'student' });
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la création");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteUser(confirmDelete.targetId);
      setConfirmDelete({ isOpen: false, targetId: null, targetName: '' });
      fetchStudents();
    } catch (err) {
      alert("Erreur lors de la suppression");
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

  // Filtering
  const filteredStudents = students.filter(s => {
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    const email = s.email.toLowerCase();
    const matchesQuery = fullName.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
    const matchesFilter = filterActive === 'all' || (filterActive === 'active' ? s.is_active : !s.is_active);
    return matchesQuery && matchesFilter;
  });

  const avatarColors = [
    ['#7c3aed', '#a855f7'],
    ['#5c4df1', '#7c3aed'],
    ['#ec4899', '#f472b6'],
    ['#2563eb', '#60a5fa'],
    ['#9333ea', '#d946ef'],
  ];

  const importSteps = [
    { label: 'Faculté', value: selectedFac, options: faculties, onChange: handleFacChange, placeholder: 'Sélectionnez une Faculté' },
    { label: 'Département', value: selectedDep, options: departments, onChange: handleDepChange, placeholder: 'Sélectionnez un Département', disabled: !selectedFac },
    { label: 'Spécialité', value: selectedSpec, options: specialties, onChange: handleSpecChange, placeholder: 'Sélectionnez une Spécialité', disabled: !selectedDep },
    { label: 'Niveau', value: selectedLevel, options: levels, onChange: (e) => setSelectedLevel(e.target.value), placeholder: 'Sélectionnez un Niveau', disabled: !selectedSpec },
  ];

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto min-h-screen relative" style={{ background: '#f4f5f9' }}>

      {/* Background aurora blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute -top-20 right-10 w-80 h-80 rounded-full blur-[130px] opacity-15"
          style={{ background: 'radial-gradient(circle, #a855f7 0%, #ec4899 100%)' }} />
        <div className="absolute bottom-10 left-20 w-96 h-96 rounded-full blur-[130px] opacity-15"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, #5c4df1 100%)' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-6">

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#7c3aed]">Portail Académique</span>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight mt-0.5">Gestion des Étudiants</h2>
            <p className="text-slate-400 mt-1 text-sm font-medium">Inscrivez, gérez et suivez les comptes étudiants de l'université.</p>
          </div>
          
          {/* Action Buttons */}
          {user?.role === 'admin' && (
            <div className="flex items-center gap-3 shrink-0">
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm border border-slate-200/60 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 duration-200"
              >
                <UserPlus size={15} /> Ajouter Manuel
              </button>
              <button 
                onClick={() => setIsImportModalOpen(true)}
                className="text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all hover:opacity-90 hover:scale-[1.02] active:scale-95 duration-200"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}
              >
                <FileSpreadsheet size={15} /> Importer Excel
              </button>
            </div>
          )}
        </div>

        {/* ── STAT MINI CARDS ROW ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Inscrits', value: students.length, color: '#7c3aed', bg: '#f5f3ff', border: '#ede9fe' },
            { label: 'Actifs', value: students.filter(s => s.is_active).length, color: '#059669', bg: '#f0fdf4', border: '#d1fae5' },
            { label: 'Inactifs', value: students.filter(s => !s.is_active).length, color: '#dc2626', bg: '#fff1f2', border: '#fecdd3' },
            { label: 'Résultats filtrés', value: filteredStudents.length, color: '#5c4df1', bg: '#eef2ff', border: '#e0e7ff' },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border shadow-sm flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:shadow-md duration-200"
              style={{ borderColor: card.border }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: card.bg }}>
                <GraduationCap size={18} style={{ color: card.color }} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{card.label}</div>
                <div className="text-xl font-black leading-none mt-0.5" style={{ color: card.color }}>{card.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── MAIN DATA PANEL ── */}
        <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm space-y-5">
          
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 md:max-w-sm bg-slate-50 rounded-xl px-4 py-2.5 flex items-center gap-2 border border-slate-200/50 focus-within:border-brand-400 focus-within:bg-white transition-all">
              <Search size={15} className="text-slate-400 shrink-0" />
              <input 
                type="text"
                placeholder="Rechercher par nom, email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 w-full placeholder-slate-350"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/30">
              {[
                { id: 'all', label: 'Tous' },
                { id: 'active', label: 'Actifs' },
                { id: 'inactive', label: 'Inactifs' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterActive(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                    filterActive === tab.id 
                      ? 'bg-white shadow-sm text-slate-800 border border-slate-100' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase tracking-wider font-black text-slate-400 border-b border-slate-100">
                  <th className="px-6 py-4">Étudiant</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4 text-center">État</th>
                  {user?.role === 'admin' && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50/80 bg-white">
                {filteredStudents.map((s, idx) => {
                  const [c1, c2] = avatarColors[idx % avatarColors.length];
                  return (
                    <tr 
                      key={s.id} 
                      className={`hover:bg-slate-50/40 transition-colors group ${!s.is_active ? 'opacity-60' : ''}`}
                    >
                      {/* Avatar + Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          {s.avatar_url ? (
                            <img src={s.avatar_url} className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm" alt="avatar" />
                          ) : (
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xs text-white shadow-sm shrink-0"
                              style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                            >
                              {s.first_name[0].toUpperCase()}{s.last_name[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-800 text-sm leading-tight">{s.first_name} {s.last_name}</div>
                            <span className="text-[9px] font-black bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md inline-block mt-1 border border-violet-100">
                              Étudiant
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                          <Mail size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{s.email}</span>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="px-6 py-4 text-center">
                        {s.is_active ? (
                          <span className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-[10px] font-black inline-flex items-center gap-1.5 border border-emerald-100 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Actif
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full text-[10px] font-black inline-flex items-center gap-1.5 border border-slate-200 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Inactif
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      {user?.role === 'admin' && (
                        <td className="px-6 py-4">
                          <div className="flex justify-end items-center gap-2">
                            <button 
                              onClick={() => handleResetPassword(s.id)} 
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                              title="Réinitialiser le mot de passe"
                            >
                              <Key size={15} />
                            </button>
                            <button 
                              onClick={() => handleToggleActive(s.id)} 
                              className={`p-2 rounded-lg transition-colors ${
                                s.is_active 
                                  ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' 
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={s.is_active ? "Désactiver" : "Activer"}
                            >
                              {s.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            </button>
                            <div className="w-px h-5 bg-slate-100 mx-1" />
                            <button 
                              onClick={() => setConfirmDelete({ isOpen: true, targetId: s.id, targetName: `${s.first_name} ${s.last_name}` })} 
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" 
                              title="Supprimer cet étudiant"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-20 text-center">
                      <GraduationCap size={36} className="mx-auto mb-3 text-slate-200" />
                      <p className="text-xs font-bold text-slate-400">Aucun étudiant trouvé.</p>
                      <p className="text-[10px] text-slate-350 mt-1 font-medium">Essayez d'ajuster la recherche ou le filtre.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── MODAL: Créer un étudiant ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            
            {/* Modal Header with gradient strip */}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #7c3aed, #ec4899)' }} />
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#f5f3ff' }}>
                  <UserPlus size={16} style={{ color: '#7c3aed' }} />
                </div>
                Nouvel Étudiant
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 transition-colors">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Prénom</label>
                  <input 
                    type="text" required 
                    value={createData.first_name} 
                    onChange={e => setCreateData({...createData, first_name: e.target.value})}
                    placeholder="ex: Amina"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-brand-500 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nom</label>
                  <input 
                    type="text" required 
                    value={createData.last_name} 
                    onChange={e => setCreateData({...createData, last_name: e.target.value})}
                    placeholder="ex: Benali"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-brand-500 transition-all" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
                <input 
                  type="email" required 
                  value={createData.email} 
                  onChange={e => setCreateData({...createData, email: e.target.value})}
                  placeholder="ex: a.benali@univ.edu"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-brand-500 transition-all" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mot de passe</label>
                <input 
                  type="password" required minLength={8}
                  value={createData.password} 
                  onChange={e => setCreateData({...createData, password: e.target.value})}
                  placeholder="Minimum 8 caractères"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-brand-500 transition-all" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs transition-colors">
                  Annuler
                </button>
                <button type="submit" className="text-white px-7 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-brand-500/20 hover:opacity-90 transition-all"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                  Créer l'étudiant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Confirmer suppression ── */}
      {confirmDelete.isOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 p-6 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
              <AlertTriangle size={30} />
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">Supprimer ?</h2>
            <p className="text-slate-500 mb-6 text-xs font-semibold leading-relaxed">
              Cette action va supprimer définitivement l'étudiant&nbsp;
              <span className="font-black text-slate-700">{confirmDelete.targetName}</span>.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete({ isOpen: false, targetId: null, targetName: '' })} 
                className="flex-1 py-2.5 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs transition-colors">
                Annuler
              </button>
              <button onClick={handleDeleteConfirm} 
                className="flex-1 py-2.5 text-white bg-rose-500 hover:bg-rose-600 rounded-xl font-bold text-xs shadow-md shadow-rose-400/20 transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Importer Excel ── */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col">
            
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #7c3aed, #ec4899)' }} />
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-black text-slate-850 flex items-center gap-3">
                <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-100">
                  <FileSpreadsheet size={18} />
                </div>
                Importation Excel
              </h2>
              <button onClick={closeModal} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 transition-colors">
                <X size={15} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {!importResults ? (
                <form onSubmit={handleBulkImport} className="space-y-6">

                  {/* Step 1: Hierarchy Selection */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center text-white"
                        style={{ background: '#7c3aed' }}>1</span>
                      <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Cible académique</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {importSteps.map((step, i) => (
                        <div key={i}>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{step.label}</label>
                          <select 
                            value={step.value} 
                            onChange={step.onChange}
                            disabled={step.disabled}
                            className={`w-full rounded-xl px-3 py-2.5 text-xs font-bold outline-none border transition-all ${
                              step.disabled 
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60' 
                                : 'bg-slate-50 text-slate-700 border-slate-200 focus:bg-white focus:border-brand-500'
                            } ${i === 3 && step.value ? 'border-brand-300 bg-brand-50 text-brand-800' : ''}`}
                            required
                          >
                            <option value="">{step.placeholder}</option>
                            {step.options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>

                    {/* Breadcrumb Progress */}
                    {(selectedFac || selectedDep || selectedSpec || selectedLevel) && (
                      <div className="mt-3 flex items-center gap-1 flex-wrap">
                        {[faculties.find(f => f.id == selectedFac)?.name, departments.find(d => d.id == selectedDep)?.name, specialties.find(s => s.id == selectedSpec)?.name, levels.find(l => l.id == selectedLevel)?.name]
                          .filter(Boolean).map((name, i, arr) => (
                            <React.Fragment key={i}>
                              <span className="text-[9px] font-black px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-100">{name}</span>
                              {i < arr.length - 1 && <ChevronRight size={10} className="text-slate-300" />}
                            </React.Fragment>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Step 2: File Upload */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center text-white"
                        style={{ background: '#059669' }}>2</span>
                      <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Fichier Excel</h3>
                    </div>
                    <div 
                      className="border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-[20px] p-10 text-center hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => !excelFile && fileRef.current?.click()}
                    >
                      <input type="file" ref={fileRef} accept=".xlsx, .xls" className="hidden"
                        onChange={(e) => setExcelFile(e.target.files[0])} required />
                      {excelFile ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle className="text-emerald-500 mb-2" size={36} />
                          <p className="text-slate-800 font-black text-sm">{excelFile.name}</p>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setExcelFile(null); }}
                            className="bg-rose-50 border border-rose-100 text-rose-600 px-3 py-1.5 rounded-lg text-[10px] mt-3 hover:bg-rose-100 font-black transition-colors">
                            Changer de fichier
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <FileSpreadsheet className="text-slate-300 mb-3" size={44} />
                          <p className="text-slate-700 font-bold text-sm">Cliquez pour choisir un fichier</p>
                          <p className="text-slate-400 text-[10px] font-semibold mt-1">Format : .xlsx — colonnes: Prénom, Nom, Email, Mot de passe</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-5 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400">
                      {!selectedLevel ? '⚠ Sélectionnez tous les niveaux d\'abord' : excelFile ? '✓ Prêt à importer' : '⚠ Ajoutez un fichier Excel'}
                    </p>
                    <button 
                      type="submit" 
                      disabled={isImporting || !excelFile || !selectedLevel}
                      className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-7 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all"
                    >
                      {isImporting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={14} />}
                      {isImporting ? 'Importation...' : 'Lancer l\'importation'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-5">
                  <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl text-center">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-emerald-100">
                      <CheckCircle size={28} className="text-emerald-500" />
                    </div>
                    <h3 className="text-base font-black text-emerald-800 mb-1">Importation Réussie !</h3>
                    <p className="text-emerald-700 font-bold text-xs">{importResults.imported} étudiant(s) créés et inscrits au niveau sélectionné.</p>
                  </div>

                  <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-widest">Comptes créés</h4>
                  <div className="bg-white border border-slate-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-400 font-black sticky top-0 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3">Nom complet</th>
                          <th className="px-4 py-3">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {importResults.users.map((u, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-bold text-slate-700">{u.first_name} {u.last_name}</td>
                            <td className="px-4 py-2.5 font-medium text-slate-500">{u.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button onClick={closeModal} className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md">
                      Terminer
                    </button>
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
