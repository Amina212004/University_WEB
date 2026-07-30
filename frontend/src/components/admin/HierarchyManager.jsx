import React, { useState, useEffect } from 'react';
import { 
  Plus, Users, Layers, ChevronRight, ChevronDown, 
  BookOpen, Building2, GraduationCap, FileText, Calendar, Trash2, AlertTriangle, FileUp, Wand2, Network
} from 'lucide-react';
import {
  getAcademicTree, createFaculty, createDepartment, 
  createSpecialty, createLevel, createModule,
  getUsers, enrollStudentToLevel, assignTeacherToModule,
  getLevelStudents, getModuleTeachers, importModulesExcel, deleteModule, deleteAllModules,
  getLevelSections, autoDistributeStudents
} from '../../api/services';

export default function HierarchyManager() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // To keep track of expanded nodes at different levels
  const [expandedFaculties, setExpandedFaculties] = useState({});
  const [expandedDepts, setExpandedDepts] = useState({});
  const [expandedSpecs, setExpandedSpecs] = useState({});
  const [expandedLevels, setExpandedLevels] = useState({});

  // Modals
  const [createModal, setCreateModal] = useState({ isOpen: false, type: '', parentId: null });
  const [createName, setCreateName] = useState('');
  
  const [assignModal, setAssignModal] = useState({ isOpen: false, type: null, targetId: null, targetName: '' });
  const [usersList, setUsersList] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', targetId: null, targetName: '' });

  const [sectionsModal, setSectionsModal] = useState({ isOpen: false, levelId: null, levelName: '', sections: [] });
  const [distribConfig, setDistribConfig] = useState({ group_size: 24, section_size: 150 });
  const [isDistributing, setIsDistributing] = useState(false);

  useEffect(() => {
    fetchTree();
  }, []);

  const fetchTree = async () => {
    setLoading(true);
    try {
      const res = await getAcademicTree();
      setTree(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const toggleState = (setState, id) => {
    setState(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreate = (type, parentId) => {
    setCreateModal({ isOpen: true, type, parentId });
    setCreateName('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createName) return;
    try {
      const { type, parentId } = createModal;
      if (type === 'Faculté') await createFaculty({ name: createName });
      else if (type === 'Département') await createDepartment({ name: createName, faculty_id: parentId });
      else if (type === 'Spécialité') await createSpecialty({ name: createName, department_id: parentId });
      else if (type === 'Niveau') await createLevel({ name: createName, specialty_id: parentId });
      else if (type === 'Module') await createModule({ name: createName, semester_id: parentId });
      
      setCreateModal({ isOpen: false, type: '', parentId: null });
      fetchTree(); // Refresh
    } catch (err) {
      alert("Erreur de création.");
    }
  };

  const openAssign = async (type, item) => {
    setAssignModal({ isOpen: true, type, targetId: item.id, targetName: item.name });
    setUsersList([]); setAssignedUsers([]); setSelectedUserId('');
    try {
      if (type === 'student') {
        const [uRes, aRes] = await Promise.all([getUsers('student'), getLevelStudents(item.id)]);
        setUsersList(uRes.data);
        setAssignedUsers(aRes.data);
      } else {
        const [uRes, aRes] = await Promise.all([getUsers('teacher'), getModuleTeachers(item.id)]);
        setUsersList(uRes.data);
        setAssignedUsers(aRes.data);
      }
    } catch (err) { console.error(err); }
  };

  const handleAssign = async () => {
    if (!selectedUserId) return;
    try {
      if (assignModal.type === 'student') {
        await enrollStudentToLevel(selectedUserId, assignModal.targetId);
        const aRes = await getLevelStudents(assignModal.targetId);
        setAssignedUsers(aRes.data);
      } else {
        await assignTeacherToModule(selectedUserId, assignModal.targetId);
        const aRes = await getModuleTeachers(assignModal.targetId);
        setAssignedUsers(aRes.data);
      }
      setSelectedUserId('');
    } catch (err) { alert("Erreur d'affectation."); }
  };

  const handleFileUpload = async (e, semesterId) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await importModulesExcel(semesterId, file);
      alert(res.data.message);
      fetchTree();
    } catch(err) {
      alert("Erreur lors de l'importation.");
    }
    e.target.value = null; // reset
  };

  const handleDeleteConfirm = async () => {
    try {
      if (confirmModal.type === 'single') {
        await deleteModule(confirmModal.targetId);
      } else if (confirmModal.type === 'all') {
        await deleteAllModules(confirmModal.targetId);
      }
      fetchTree();
      setConfirmModal({ isOpen: false, type: '', targetId: null, targetName: '' });
    } catch (err) {
      alert("Erreur lors de la suppression.");
    }
  };

  const openSections = async (lvl) => {
    try {
      const res = await getLevelSections(lvl.id);
      setSectionsModal({ isOpen: true, levelId: lvl.id, levelName: lvl.name, sections: res.data });
    } catch(err) { alert("Erreur chargement sections"); }
  };

  const handleAutoDistribute = async () => {
    if (!sectionsModal.levelId) return;
    setIsDistributing(true);
    try {
      await autoDistributeStudents(sectionsModal.levelId, distribConfig);
      const res = await getLevelSections(sectionsModal.levelId);
      setSectionsModal(prev => ({ ...prev, sections: res.data }));
      alert("Distribution terminée !");
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur lors de la distribution.");
    }
    setIsDistributing(false);
  };

  // --- Rendering Helpers ---

  const renderModule = (module) => (
    <div key={module.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm hover:border-rose-300 hover:shadow-md transition-all group">
      <div className="flex items-center gap-3">
        <div className="bg-rose-50 text-rose-500 p-2 rounded-lg">
          <FileText size={16} />
        </div>
        <span className="font-semibold text-sm text-slate-700">{module.name}</span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => openAssign('teacher', module)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="Affecter Professeur">
          <Users size={16} />
        </button>
        <button onClick={() => setConfirmModal({isOpen:true, type:'single', targetId:module.id, targetName:module.name})} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Supprimer module">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  const renderSemester = (sem) => (
    <div key={sem.id} className="bg-amber-50/50 rounded-2xl border border-amber-100 p-5 mb-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-amber-100 text-amber-600 p-2 rounded-xl">
            <Calendar size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-lg">{sem.name}</h4>
            <p className="text-xs text-amber-600 font-medium">{sem.modules.length} modules existants</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Import Excel */}
          <label className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-sm">
            <FileUp size={16} /> <span className="hidden sm:inline">Excel</span>
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={(e) => handleFileUpload(e, sem.id)} />
          </label>
          {sem.modules.length > 0 && (
            <button onClick={() => setConfirmModal({ isOpen: true, type: 'all', targetId: sem.id, targetName: sem.name })} className="bg-rose-100 hover:bg-rose-200 text-rose-600 p-1.5 rounded-lg transition-colors" title="Vider ce semestre">
              <Trash2 size={18} />
            </button>
          )}
          <button onClick={() => openCreate('Module', sem.id)} className="bg-amber-200 hover:bg-amber-300 text-amber-700 p-1.5 rounded-lg transition-colors" title="Nouveau Module">
            <Plus size={18} />
          </button>
        </div>
      </div>
      
      {sem.modules.length === 0 ? (
        <div className="text-sm text-amber-600/60 bg-white/50 border border-dashed border-amber-200 rounded-xl p-6 text-center italic">
          Aucun module dans ce semestre. Vous pouvez en créer un manuellement ou importer une liste Excel.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sem.modules.map(renderModule)}
        </div>
      )}
    </div>
  );

  const renderLevel = (lvl) => {
    const isExp = expandedLevels[lvl.id];
    return (
      <div key={lvl.id} className="mb-4 bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-sky-50 transition-colors"
          onClick={() => toggleState(setExpandedLevels, lvl.id)}
        >
          <div className="flex items-center gap-3">
            <div className="bg-sky-100 text-sky-600 p-2 rounded-xl">
              <BookOpen size={20} />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-lg">{lvl.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); openSections(lvl); }} className="text-sm font-medium px-4 py-1.5 rounded-xl bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors flex items-center gap-2 shadow-sm">
              <Network size={16} /> Groupes & Sections
            </button>
            <button onClick={(e) => { e.stopPropagation(); openAssign('student', lvl); }} className="text-sm font-medium px-4 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors flex items-center gap-2 shadow-sm">
              <Plus size={16} /> Affecter Étudiants
            </button>
            <div className="text-slate-400 ml-3 bg-white p-1 rounded-full shadow-sm">
              {isExp ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </div>
        </div>
        
        {isExp && (
          <div className="p-5 bg-sky-50/30 border-t border-sky-50">
            {lvl.semesters.length === 0 ? (
              <div className="text-sm text-slate-400 italic text-center p-4">Les semestres S1 et S2 devraient apparaître ici.</div>
            ) : (
              lvl.semesters.slice().sort((a,b) => a.name.localeCompare(b.name)).map(renderSemester)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSpecialty = (spec) => {
    const isExp = expandedSpecs[spec.id];
    return (
      <div key={spec.id} className="mb-4 bg-white rounded-2xl border border-teal-100 shadow-sm overflow-hidden">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-teal-50 transition-colors"
          onClick={() => toggleState(setExpandedSpecs, spec.id)}
        >
          <div className="flex items-center gap-3">
            <div className="bg-teal-100 text-teal-600 p-2 rounded-xl">
              <GraduationCap size={20} />
            </div>
            <span className="font-bold text-slate-700 text-lg">{spec.name}</span>
            <span className="text-xs font-bold text-teal-600 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full">
              {spec.levels.length} Niveaux
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); openCreate('Niveau', spec.id); }} className="p-1.5 rounded-lg text-teal-500 hover:bg-teal-100 transition-colors bg-white shadow-sm" title="Ajouter Niveau">
              <Plus size={20} />
            </button>
            <div className="text-slate-400 ml-2 bg-white p-1 rounded-full shadow-sm">
              {isExp ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </div>
        </div>
        
        {isExp && (
          <div className="p-5 bg-slate-50 border-t border-slate-100">
            {spec.levels.length === 0 ? (
              <div className="text-sm text-slate-400 italic text-center p-4">Aucun niveau défini.</div>
            ) : (
              spec.levels.slice().sort((a,b) => a.name.localeCompare(b.name)).map(renderLevel)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDepartment = (dept) => {
    const isExp = expandedDepts[dept.id];
    return (
      <div key={dept.id} className="mb-4 bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden ml-0 lg:ml-6">
        <div 
          className="flex items-center justify-between p-5 cursor-pointer hover:bg-indigo-50 transition-colors"
          onClick={() => toggleState(setExpandedDepts, dept.id)}
        >
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 text-indigo-600 p-2.5 rounded-xl">
              <Layers size={22} />
            </div>
            <span className="font-bold text-slate-800 text-xl">{dept.name}</span>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
              {dept.specialties.length} Spécialités
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={(e) => { e.stopPropagation(); openCreate('Spécialité', dept.id); }} className="px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-100 hover:bg-indigo-200 transition-colors font-medium text-sm flex items-center gap-1 shadow-sm">
              <Plus size={16} /> Spécialité
            </button>
            <div className="text-slate-400 bg-white p-1.5 rounded-full shadow-sm">
              {isExp ? <ChevronDown size={22} /> : <ChevronRight size={22} />}
            </div>
          </div>
        </div>
        
        {isExp && (
          <div className="p-5 md:p-6 bg-indigo-50/30 border-t border-indigo-50">
            {dept.specialties.length === 0 ? (
              <div className="text-sm text-slate-400 italic text-center p-4">Aucune spécialité définie.</div>
            ) : (
              dept.specialties.map(renderSpecialty)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderFaculty = (fac) => {
    const isExp = expandedFaculties[fac.id];
    return (
      <div key={fac.id} className="mb-8 bg-white rounded-3xl border border-brand-200 shadow-md overflow-hidden">
        <div 
          className="flex items-center justify-between p-6 bg-gradient-to-r from-brand-50 to-white cursor-pointer hover:from-brand-100 transition-colors"
          onClick={() => toggleState(setExpandedFaculties, fac.id)}
        >
          <div className="flex items-center gap-4">
            <div className="bg-brand-600 text-white p-3 rounded-2xl shadow-sm">
              <Building2 size={28} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-2xl">{fac.name}</h3>
              <p className="text-brand-600 font-medium text-sm mt-0.5">{fac.departments.length} Départements rattachés</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={(e) => { e.stopPropagation(); openCreate('Département', fac.id); }} className="px-4 py-2 rounded-xl text-white bg-brand-600 hover:bg-brand-700 transition-colors font-semibold text-sm flex items-center gap-2 shadow-sm">
              <Plus size={18} /> Département
            </button>
            <div className="text-brand-400 bg-white p-2 rounded-full shadow-sm border border-brand-100">
              {isExp ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
            </div>
          </div>
        </div>
        
        {isExp && (
          <div className="p-6 md:p-8 bg-slate-50/50 border-t border-brand-100">
            {fac.departments.length === 0 ? (
              <div className="text-base text-slate-500 text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                Aucun département dans cette faculté.
              </div>
            ) : (
              fac.departments.map(renderDepartment)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Structure Académique</h2>
            <p className="text-slate-500 mt-2 text-lg">Visualisez et gérez l'arborescence complète de l'université.</p>
          </div>
          <button 
            onClick={() => openCreate('Faculté', null)}
            className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 transform hover:-translate-y-0.5"
          >
            <Plus size={20} /> Nouvelle Faculté
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20">
            <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4 shadow-sm"></div>
            <p className="text-slate-500 font-medium">Chargement de la structure...</p>
          </div>
        ) : (
          <div className="pb-20">
            {tree.length === 0 ? (
              <div className="text-center p-20 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Building2 size={48} className="text-slate-400" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-3">Aucune structure définie</h3>
                <p className="text-slate-500 mb-8 text-lg">Commencez à structurer votre université en ajoutant votre première faculté.</p>
                <button onClick={() => openCreate('Faculté', null)} className="bg-brand-100 text-brand-700 hover:bg-brand-200 px-8 py-3.5 rounded-2xl font-bold transition-all shadow-sm">
                  Créer une Faculté
                </button>
              </div>
            ) : (
              tree.map(renderFaculty)
            )}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {createModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col transform transition-all">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Plus className="text-brand-500" /> Ajouter : {createModal.type}
              </h2>
              <button onClick={() => setCreateModal({ isOpen: false, type: '', parentId: null })} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Nom de l'élément</label>
              <input 
                type="text" 
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all font-medium text-slate-800"
                placeholder={`Ex: ${createModal.type === 'Faculté' ? 'Sciences' : createModal.type === 'Niveau' ? 'L1 Info' : '...'}`}
                required autoFocus
              />
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setCreateModal({ isOpen: false, type: '', parentId: null })} className="px-6 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold transition-colors">
                  Annuler
                </button>
                <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-2xl font-bold transition-colors shadow-lg shadow-brand-500/30">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-8 text-center transform transition-all">
            <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <AlertTriangle size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-3">
              Êtes-vous sûr ?
            </h2>
            <p className="text-slate-500 mb-8 text-sm font-medium leading-relaxed">
              {confirmModal.type === 'single' 
                ? `Voulez-vous vraiment supprimer le module "${confirmModal.targetName}" ?`
                : `Voulez-vous vraiment supprimer tous les modules du "${confirmModal.targetName}" ? Cette action est irréversible.`}
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setConfirmModal({ isOpen: false, type: '', targetId: null, targetName: '' })} 
                className="flex-1 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={handleDeleteConfirm} 
                className="flex-1 py-3 text-white bg-rose-500 hover:bg-rose-600 rounded-2xl font-bold transition-colors shadow-lg shadow-rose-500/30"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN MODAL */}
      {assignModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] transform transition-all">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-800">
                Affectations : <span className="text-brand-600">{assignModal.targetName}</span>
              </h2>
              <button onClick={() => setAssignModal({ isOpen: false })} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex flex-col sm:flex-row gap-3 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <select 
                  value={selectedUserId} 
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all text-slate-700"
                >
                  <option value="">Sélectionnez un {assignModal.type === 'student' ? 'étudiant' : 'enseignant'}...</option>
                  {usersList.filter(u => !assignedUsers.find(a => a.id === u.id)).map(u => (
                    <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                  ))}
                </select>
                <button onClick={handleAssign} disabled={!selectedUserId} className="bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-sm">
                  Ajouter
                </button>
              </div>

              <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                <Users size={16} /> Déjà affectés ({assignedUsers.length})
              </h3>
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
                {assignedUsers.map(u => (
                  <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <span className="font-bold text-slate-800">{u.first_name} {u.last_name}</span>
                    <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{u.email}</span>
                  </div>
                ))}
                {assignedUsers.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-sm font-medium">Personne n'est affecté pour l'instant.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTIONS MODAL */}
      {sectionsModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] transform transition-all">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Network className="text-violet-500" /> Sections & Groupes : <span className="text-violet-600">{sectionsModal.levelName}</span>
              </h2>
              <button onClick={() => setSectionsModal({ isOpen: false, levelId: null, levelName: '', sections: [] })} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm border border-slate-200">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg mb-2 flex items-center gap-2">
                    <Wand2 className="text-brand-500" size={20} /> Distribution Automatique
                  </h3>
                  <p className="text-slate-500 text-sm max-w-md">Le système va répartir tous les étudiants inscrits à ce niveau dans des sections et des groupes de TD/TP automatiquement.</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Étd / Section</label>
                    <input type="number" min="50" max="500" value={distribConfig.section_size} onChange={e => setDistribConfig({...distribConfig, section_size: parseInt(e.target.value) || 150})} className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold outline-none focus:border-brand-500 text-slate-700" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Étd / Groupe</label>
                    <input type="number" min="10" max="100" value={distribConfig.group_size} onChange={e => setDistribConfig({...distribConfig, group_size: parseInt(e.target.value) || 24})} className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold outline-none focus:border-brand-500 text-slate-700" />
                  </div>
                  <button onClick={handleAutoDistribute} disabled={isDistributing} className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-violet-500/30 flex items-center gap-2 mt-5">
                    {isDistributing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Distribuer"}
                  </button>
                </div>
              </div>

              {sectionsModal.sections.length === 0 ? (
                <div className="text-center p-10 bg-white rounded-2xl border border-dashed border-slate-300">
                  <Network className="text-slate-300 mx-auto mb-4" size={48} />
                  <p className="text-slate-500 font-medium">Aucune section n'a été créée pour ce niveau.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sectionsModal.sections.map(sec => (
                    <div key={sec.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="bg-slate-100/50 px-6 py-4 border-b border-slate-200">
                        <h4 className="font-black text-slate-800 text-lg">{sec.name}</h4>
                      </div>
                      <div className="p-6">
                        {sec.groups.length === 0 ? (
                          <div className="text-slate-400 italic text-sm">Aucun groupe.</div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {sec.groups.map(grp => (
                              <div key={grp.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-violet-300 hover:bg-violet-50 transition-colors">
                                <span className="font-bold text-slate-700">{grp.name}</span>
                                <span className="text-xs font-semibold text-slate-500 mt-1 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">{grp.students_count} étudiants</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
