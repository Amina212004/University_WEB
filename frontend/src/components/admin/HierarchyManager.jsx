import React, { useState, useEffect } from 'react';
import { 
  Plus, Users, Layers, ChevronRight, ChevronDown, 
  BookOpen, Building2, GraduationCap, FileText, Calendar, Trash2, AlertTriangle
} from 'lucide-react';
import {
  getAcademicTree, createFaculty, createDepartment, 
  createSpecialty, createLevel, createModule,
  getUsers, enrollStudentToLevel, assignTeacherToModule,
  getLevelStudents, getModuleTeachers, importModulesExcel, deleteModule, deleteAllModules
} from '../../api/services';

export default function HierarchyManager() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  // Modals
  const [createModal, setCreateModal] = useState({ isOpen: false, type: '', parentId: null });
  const [createName, setCreateName] = useState('');
  
  const [assignModal, setAssignModal] = useState({ isOpen: false, type: null, targetId: null, targetName: '' });
  const [usersList, setUsersList] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', targetId: null, targetName: '' });

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

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
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

  const renderNode = (item, type, children, icon, childType, colorClass) => {
    const isExp = expanded[`${type}-${item.id}`];
    
    return (
      <div key={item.id} className="mb-3">
        <div 
          className={`flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm transition-all hover:border-${colorClass}-300 hover:shadow-md cursor-pointer`}
          onClick={() => toggleExpand(`${type}-${item.id}`)}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${colorClass}-50 text-${colorClass}-600`}>
              {icon}
            </div>
            <span className="font-semibold text-slate-800 text-lg">{item.name}</span>
            {children && (
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {children.length}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Contextual Action Buttons */}
            {type === 'Niveau' && (
              <button onClick={(e) => { e.stopPropagation(); openAssign('student', item); }} className="text-sm font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-2">
                <Users size={16} /> Affecter Étudiants
              </button>
            )}
            {type === 'Module' && (
              <button onClick={(e) => { e.stopPropagation(); openAssign('teacher', item); }} className="text-sm font-medium px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-2">
                <Users size={16} /> Affecter Professeur
              </button>
            )}
            
            {/* Add Child Button */}
            {childType && type !== 'Niveau' && (
              <button 
                onClick={(e) => { e.stopPropagation(); openCreate(childType, item.id); }}
                className={`p-1.5 rounded-lg text-slate-400 hover:bg-${colorClass}-50 hover:text-${colorClass}-600 transition-colors`}
                title={`Ajouter ${childType}`}
              >
                <Plus size={20} />
              </button>
            )}
            
            {/* Semester Actions: Import Excel and Delete All Modules */}
            {childType === 'Module' && (
              <div className="flex items-center">
                <label onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors cursor-pointer border border-emerald-100 bg-white ml-2 shadow-sm" title="Importer Modules depuis Excel">
                  <span className="text-xs font-bold px-1">EXCEL</span>
                  <input type="file" accept=".xlsx, .xls" className="hidden" onChange={(e) => handleFileUpload(e, item.id)} />
                </label>
                {children && children.length > 0 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, type: 'all', targetId: item.id, targetName: item.name }); }}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors ml-2 border border-rose-100 bg-white shadow-sm"
                    title="Supprimer tous les modules de ce semestre"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            )}
            
            {/* Delete Single Module */}
            {type === 'Module' && (
              <button 
                onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, type: 'single', targetId: item.id, targetName: item.name }); }}
                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors ml-1"
                title="Supprimer ce module"
              >
                <Trash2 size={18} />
              </button>
            )}
            
            {/* Expand Icon */}
            {children && (
              <div className="ml-2 text-slate-400">
                {isExp ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </div>
            )}
          </div>
        </div>

        {/* Children Render */}
        {isExp && children && (
          <div className={`mt-2 pl-6 ml-6 border-l-2 border-${colorClass}-100`}>
            {children.length === 0 ? (
              <div className="p-4 text-sm text-slate-400 italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                Aucun(e) {childType?.toLowerCase()} pour le moment.
              </div>
            ) : (
              (type === 'Niveau' ? children.slice().sort((a,b) => a.name.localeCompare(b.name)) : children).map(child => {
                if (childType === 'Département') return renderNode(child, 'Département', child.specialties, <Layers size={20}/>, 'Spécialité', 'teal');
                if (childType === 'Spécialité') return renderNode(child, 'Spécialité', child.levels, <GraduationCap size={20}/>, 'Niveau', 'sky');
                if (childType === 'Niveau') return renderNode(child, 'Niveau', child.semesters, <BookOpen size={20}/>, 'Semestre', 'brand');
                if (childType === 'Semestre') return renderNode(child, 'Semestre', child.modules, <Calendar size={20}/>, 'Module', 'amber');
                if (childType === 'Module') return renderNode(child, 'Module', null, <FileText size={20}/>, null, 'rose');
                return null;
              })
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-50">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Structure Académique</h2>
          <p className="text-slate-500 mt-1">Gérez facilement vos facultés, départements et niveaux.</p>
        </div>
        <button 
          onClick={() => openCreate('Faculté', null)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus size={18} /> Nouvelle Faculté
        </button>
      </div>

      {loading ? (
        <div className="text-center p-12">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Chargement de la structure...</p>
        </div>
      ) : (
        <div className="max-w-5xl">
          {tree.length === 0 ? (
            <div className="text-center p-16 bg-white rounded-2xl border border-dashed border-slate-300">
              <Building2 size={48} className="text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-2">Aucune structure définie</h3>
              <p className="text-slate-500 mb-6">Commencez par créer votre première faculté.</p>
              <button onClick={() => openCreate('Faculté', null)} className="bg-brand-100 text-brand-700 hover:bg-brand-200 px-6 py-2.5 rounded-xl font-medium transition-colors">
                Créer une Faculté
              </button>
            </div>
          ) : (
            tree.map(fac => renderNode(fac, 'Faculté', fac.departments, <Building2 size={20}/>, 'Département', 'brand'))
          )}
        </div>
      )}

      {/* CREATE MODAL */}
      {createModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">
                Ajouter : {createModal.type}
              </h2>
              <button onClick={() => setCreateModal({ isOpen: false, type: '', parentId: null })} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Nom</label>
              <input 
                type="text" 
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                placeholder={`Ex: ${createModal.type === 'Faculté' ? 'Sciences' : createModal.type === 'Niveau' ? 'L1 Info' : '...'}`}
                required autoFocus
              />
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setCreateModal({ isOpen: false, type: '', parentId: null })} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">
                  Annuler
                </button>
                <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 text-center">
            <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">
              Confirmation
            </h2>
            <p className="text-slate-500 mb-6 text-sm">
              {confirmModal.type === 'single' 
                ? `Êtes-vous sûr de vouloir supprimer définitivement le module "${confirmModal.targetName}" ?`
                : `Êtes-vous sûr de vouloir supprimer tous les modules du "${confirmModal.targetName}" ? Cette action est irréversible.`}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmModal({ isOpen: false, type: '', targetId: null, targetName: '' })} 
                className="flex-1 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={handleDeleteConfirm} 
                className="flex-1 py-3 text-white bg-rose-500 hover:bg-rose-600 rounded-xl font-semibold transition-colors shadow-lg shadow-rose-500/30"
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">
                Affectations : {assignModal.targetName}
              </h2>
              <button onClick={() => setAssignModal({ isOpen: false })} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex gap-2 mb-6">
                <select 
                  value={selectedUserId} 
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2 font-medium outline-none focus:border-brand-500"
                >
                  <option value="">Sélectionnez un {assignModal.type === 'student' ? 'étudiant' : 'enseignant'}...</option>
                  {usersList.filter(u => !assignedUsers.find(a => a.id === u.id)).map(u => (
                    <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                  ))}
                </select>
                <button onClick={handleAssign} disabled={!selectedUserId} className="bg-brand-600 disabled:opacity-50 hover:bg-brand-700 text-white px-5 py-2 rounded-xl font-medium transition-colors">
                  Ajouter
                </button>
              </div>

              <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wider">Déjà affectés ({assignedUsers.length})</h3>
              <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200">
                {assignedUsers.map(u => (
                  <div key={u.id} className="p-3.5 flex items-center justify-between">
                    <span className="font-medium text-slate-800">{u.first_name} {u.last_name}</span>
                    <span className="text-xs font-mono text-slate-500">{u.email}</span>
                  </div>
                ))}
                {assignedUsers.length === 0 && (
                  <div className="p-6 text-center text-slate-400 text-sm italic">Personne n'est affecté pour l'instant.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
