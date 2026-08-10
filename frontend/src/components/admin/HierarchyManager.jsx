import React, { useState, useEffect } from 'react';
import { 
  Plus, Users, Layers, ChevronRight, ChevronDown, 
  BookOpen, Building2, GraduationCap, FileText, Calendar, Trash2,
  AlertTriangle, FileUp, Wand2, Network, X, Sparkles
} from 'lucide-react';
import {
  getAcademicTree, createFaculty, createDepartment, 
  createSpecialty, createLevel, createModule,
  getUsers, enrollStudentToLevel, assignTeacherToModule,
  getLevelStudents, getModuleTeachers, importModulesExcel, deleteModule, deleteAllModules,
  getLevelSections, autoDistributeStudents, removeTeacherFromModule
} from '../../api/services';

/* ─── Design tokens per depth ─────────────────── */
const DEPTH_CONFIG = {
  faculty: {
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    light: '#f5f3ff', border: '#ede9fe', text: '#6d28d9',
    badge: 'bg-violet-100 text-violet-700 border-violet-200',
    dot: '#7c3aed', icon: Building2, label: 'Faculté',
  },
  department: {
    gradient: 'linear-gradient(135deg, #5c4df1 0%, #4338ca 100%)',
    light: '#eef2ff', border: '#e0e7ff', text: '#4338ca',
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    dot: '#5c4df1', icon: Layers, label: 'Département',
  },
  specialty: {
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    light: '#f0f9ff', border: '#bae6fd', text: '#0284c7',
    badge: 'bg-sky-100 text-sky-700 border-sky-200',
    dot: '#0ea5e9', icon: GraduationCap, label: 'Spécialité',
  },
  level: {
    gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    light: '#f0fdf4', border: '#d1fae5', text: '#047857',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: '#059669', icon: BookOpen, label: 'Niveau',
  },
  module: {
    gradient: 'linear-gradient(135deg, #d946ef 0%, #a21caf 100%)',
    light: '#fdf4ff', border: '#f0abfc', text: '#a21caf',
    badge: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
    dot: '#d946ef', icon: FileText, label: 'Module',
  },
};

export default function HierarchyManager() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [expandedFaculties, setExpandedFaculties] = useState({});
  const [expandedDepts, setExpandedDepts]         = useState({});
  const [expandedSpecs, setExpandedSpecs]         = useState({});
  const [expandedLevels, setExpandedLevels]       = useState({});

  const [createModal, setCreateModal] = useState({ isOpen: false, type: '', parentId: null });
  const [createName, setCreateName]   = useState('');
  
  const [assignModal, setAssignModal]     = useState({ isOpen: false, type: null, targetId: null, targetName: '' });
  const [usersList, setUsersList]         = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', targetId: null, targetName: '' });
  const [sectionsModal, setSectionsModal] = useState({ isOpen: false, levelId: null, levelName: '', sections: [] });
  const [distribConfig, setDistribConfig] = useState({ group_size: 24, section_size: 150 });
  const [isDistributing, setIsDistributing] = useState(false);

  useEffect(() => { fetchTree(); }, []);

  const fetchTree = async () => {
    setLoading(true);
    try { const res = await getAcademicTree(); setTree(res.data); }
    catch (err) { console.error(err); }
    setLoading(false);
  };

  const toggle = (setState, id) => setState(prev => ({ ...prev, [id]: !prev[id] }));

  const openCreate = (type, parentId) => {
    setCreateModal({ isOpen: true, type, parentId });
    setCreateName('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createName) return;
    try {
      const { type, parentId } = createModal;
      if (type === 'Faculté')    await createFaculty({ name: createName });
      else if (type === 'Département') await createDepartment({ name: createName, faculty_id: parentId });
      else if (type === 'Spécialité')  await createSpecialty({ name: createName, department_id: parentId });
      else if (type === 'Niveau')      await createLevel({ name: createName, specialty_id: parentId });
      else if (type === 'Module')      await createModule({ name: createName, semester_id: parentId });
      setCreateModal({ isOpen: false, type: '', parentId: null });
      fetchTree();
    } catch { alert('Erreur de création.'); }
  };

  const openAssign = async (type, item) => {
    setAssignModal({ isOpen: true, type, targetId: item.id, targetName: item.name });
    setUsersList([]); setAssignedUsers([]); setSelectedUserId('');
    try {
      if (type === 'student') {
        const [uRes, aRes] = await Promise.all([getUsers('student'), getLevelStudents(item.id)]);
        setUsersList(uRes.data); setAssignedUsers(aRes.data);
      } else {
        const [uRes, aRes] = await Promise.all([getUsers('teacher'), getModuleTeachers(item.id)]);
        setUsersList(uRes.data); setAssignedUsers(aRes.data);
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
    } catch { alert("Erreur d'affectation."); }
  };

  const handleFileUpload = async (e, semesterId) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await importModulesExcel(semesterId, file);
      alert(res.data.message);
      fetchTree();
    } catch { alert("Erreur lors de l'importation."); }
    e.target.value = null;
  };

  const handleDeleteConfirm = async () => {
    try {
      if (confirmModal.type === 'single') await deleteModule(confirmModal.targetId);
      else if (confirmModal.type === 'all') await deleteAllModules(confirmModal.targetId);
      fetchTree();
      setConfirmModal({ isOpen: false, type: '', targetId: null, targetName: '' });
    } catch { alert('Erreur lors de la suppression.'); }
  };

  const openSections = async (lvl) => {
    try {
      const res = await getLevelSections(lvl.id);
      setSectionsModal({ isOpen: true, levelId: lvl.id, levelName: lvl.name, sections: res.data });
    } catch { alert('Erreur chargement sections'); }
  };

  const handleAutoDistribute = async () => {
    if (!sectionsModal.levelId) return;
    setIsDistributing(true);
    try {
      await autoDistributeStudents(sectionsModal.levelId, distribConfig);
      const res = await getLevelSections(sectionsModal.levelId);
      setSectionsModal(prev => ({ ...prev, sections: res.data }));
      alert('Distribution terminée !');
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur lors de la distribution.');
    }
    setIsDistributing(false);
  };

  const handleRemoveTeacher = async (moduleId, teacherId) => {
    if (window.confirm('Retirer ce professeur de ce module ?')) {
      try { await removeTeacherFromModule(moduleId, teacherId); fetchTree(); }
      catch { alert('Erreur lors du retrait.'); }
    }
  };

  /* ─── Render helpers ─────────────────────────── */

  const renderModule = (mod) => (
    <div key={mod.id}
      className="group relative rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{ background: '#fff', borderColor: DEPTH_CONFIG.module.border }}
    >
      {/* Top accent bar */}
      <div className="h-0.5 w-full" style={{ background: DEPTH_CONFIG.module.gradient }} />
      
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: DEPTH_CONFIG.module.light, color: DEPTH_CONFIG.module.text }}>
              <FileText size={13} />
            </div>
            <span className="font-bold text-slate-800 text-xs leading-snug">{mod.name}</span>
          </div>
          {/* Actions on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={() => openAssign('teacher', mod)}
              className="p-1.5 rounded-lg transition-colors hover:bg-indigo-50 text-indigo-500" title="Affecter prof">
              <Users size={13} />
            </button>
            <button onClick={() => setConfirmModal({ isOpen: true, type: 'single', targetId: mod.id, targetName: mod.name })}
              className="p-1.5 rounded-lg transition-colors hover:bg-rose-50 text-rose-400" title="Supprimer">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Teachers chips */}
        {mod.teachers?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {mod.teachers.map(t => (
              <span key={t.id}
                className="inline-flex items-center gap-1 text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">
                {t.first_name[0]}.{t.last_name}
                <button onClick={() => handleRemoveTeacher(mod.id, t.id)}
                  className="hover:text-rose-500 transition-colors"><X size={8} /></button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSemester = (sem) => (
    <div key={sem.id} className="mb-6 rounded-2xl overflow-hidden border"
      style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
      {/* Semester header */}
      <div className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: '#fde68a', background: '#fef3c7' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-400 text-white shadow-sm">
            <Calendar size={16} />
          </div>
          <div>
            <h4 className="font-black text-amber-900 text-sm">{sem.name}</h4>
            <p className="text-[10px] text-amber-600 font-bold">{sem.modules.length} modules</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black transition-colors cursor-pointer shadow-sm">
            <FileUp size={12} /> Excel
            <input type="file" accept=".xlsx,.xls" className="hidden"
              onChange={(e) => handleFileUpload(e, sem.id)} />
          </label>
          {sem.modules.length > 0 && (
            <button onClick={() => setConfirmModal({ isOpen: true, type: 'all', targetId: sem.id, targetName: sem.name })}
              className="p-1.5 bg-rose-100 text-rose-500 hover:bg-rose-200 rounded-xl transition-colors" title="Vider semestre">
              <Trash2 size={14} />
            </button>
          )}
          <button onClick={() => openCreate('Module', sem.id)}
            className="p-1.5 bg-amber-200 text-amber-700 hover:bg-amber-300 rounded-xl transition-colors" title="Nouveau module">
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="p-5">
        {sem.modules.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-amber-200 rounded-xl text-amber-500 text-xs font-bold">
            Aucun module — importez un Excel ou créez manuellement
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {sem.modules.map(renderModule)}
          </div>
        )}
      </div>
    </div>
  );

  const renderLevel = (lvl) => {
    const isExp = expandedLevels[lvl.id];
    const cfg = DEPTH_CONFIG.level;
    return (
      <div key={lvl.id} className="mb-3 rounded-2xl border overflow-hidden transition-all duration-200"
        style={{ borderColor: cfg.border, background: '#fff' }}>
        {/* Level row */}
        <div className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-emerald-50 transition-colors"
          onClick={() => toggle(setExpandedLevels, lvl.id)}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: cfg.gradient, color: '#fff' }}>
              <BookOpen size={15} />
            </div>
            <span className="font-black text-slate-800 text-sm">{lvl.name}</span>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${cfg.badge}`}>
              {lvl.semesters?.reduce((acc, s) => acc + (s.modules?.length || 0), 0)} modules
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); openSections(lvl); }}
              className="text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors bg-violet-100 text-violet-700 hover:bg-violet-200">
              <Network size={12} /> Sections
            </button>
            <button onClick={(e) => { e.stopPropagation(); openAssign('student', lvl); }}
              className="text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
              <Plus size={12} /> Étudiants
            </button>
            <div className="text-slate-400 ml-1">
              {isExp ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
          </div>
        </div>

        {isExp && (
          <div className="p-5 border-t" style={{ borderColor: cfg.border, background: cfg.light }}>
            {lvl.semesters?.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-4">Aucun semestre défini.</div>
            ) : (
              lvl.semesters.slice().sort((a, b) => a.name.localeCompare(b.name)).map(renderSemester)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSpecialty = (spec) => {
    const isExp = expandedSpecs[spec.id];
    const cfg = DEPTH_CONFIG.specialty;
    return (
      <div key={spec.id} className="mb-3 rounded-2xl border overflow-hidden"
        style={{ borderColor: cfg.border, background: '#fff' }}>
        <div className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-sky-50 transition-colors"
          onClick={() => toggle(setExpandedSpecs, spec.id)}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: cfg.gradient, color: '#fff' }}>
              <GraduationCap size={15} />
            </div>
            <span className="font-black text-slate-800 text-sm">{spec.name}</span>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${cfg.badge}`}>
              {spec.levels.length} niveaux
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); openCreate('Niveau', spec.id); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors bg-sky-100 text-sky-600 hover:bg-sky-200" title="Ajouter niveau">
              <Plus size={16} />
            </button>
            <div className="text-slate-400">
              {isExp ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
          </div>
        </div>

        {isExp && (
          <div className="p-5 border-t" style={{ borderColor: cfg.border, background: cfg.light }}>
            {spec.levels.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-4">Aucun niveau défini.</div>
            ) : (
              spec.levels.slice().sort((a, b) => a.name.localeCompare(b.name)).map(renderLevel)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDepartment = (dept) => {
    const isExp = expandedDepts[dept.id];
    const cfg = DEPTH_CONFIG.department;
    return (
      <div key={dept.id} className="mb-3 ml-0 lg:ml-4 rounded-2xl border overflow-hidden"
        style={{ borderColor: cfg.border, background: '#fff' }}>
        <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-indigo-50 transition-colors"
          onClick={() => toggle(setExpandedDepts, dept.id)}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: cfg.gradient, color: '#fff' }}>
              <Layers size={17} />
            </div>
            <div>
              <span className="font-black text-slate-800 text-base block">{dept.name}</span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border inline-block mt-0.5 ${cfg.badge}`}>
                {dept.specialties.length} spécialités
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); openCreate('Spécialité', dept.id); }}
              className="text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
              style={{ background: cfg.light, color: cfg.text }}>
              <Plus size={12} /> Spécialité
            </button>
            <div className="text-slate-400 ml-1">
              {isExp ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </div>
        </div>

        {isExp && (
          <div className="p-5 border-t" style={{ borderColor: cfg.border, background: cfg.light }}>
            {dept.specialties.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-4">Aucune spécialité définie.</div>
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
      <div key={fac.id} className="mb-6 rounded-3xl overflow-hidden border shadow-sm"
        style={{ borderColor: '#ddd6fe', background: '#fff' }}>
        
        {/* Faculty Hero Header */}
        <div className="relative overflow-hidden cursor-pointer"
          onClick={() => toggle(setExpandedFaculties, fac.id)}>
          {/* Gradient background */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5c4df1 60%, #4338ca 100%)' }} />
          {/* Decorative SVG Waves */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 900 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,30 C150,65 300,0 450,35 C600,70 750,10 900,40 L900,80 L0,80 Z" fill="rgba(255,255,255,0.06)" />
            <path d="M0,50 C120,20 280,70 440,45 C600,20 760,65 900,30 L900,80 L0,80 Z" fill="rgba(255,255,255,0.04)" />
            <path d="M0,62 C200,35 400,75 600,55 C750,40 850,60 900,50 L900,80 L0,80 Z" fill="rgba(255,255,255,0.07)" />
          </svg>

          <div className="relative flex items-center justify-between px-7 py-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/30 shadow-inner">
                <Building2 size={22} className="text-white" />
              </div>
              <div>
                <p className="text-violet-200 text-[10px] font-black uppercase tracking-widest mb-0.5">Faculté</p>
                <h3 className="font-black text-white text-xl leading-tight">{fac.name}</h3>
                <p className="text-violet-200 text-[10px] font-bold mt-0.5">{fac.departments.length} département{fac.departments.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={(e) => { e.stopPropagation(); openCreate('Département', fac.id); }}
                className="flex items-center gap-2 text-[10px] font-black bg-white/15 hover:bg-white/25 text-white border border-white/20 px-4 py-2 rounded-xl transition-all backdrop-blur-sm">
                <Plus size={13} /> Département
              </button>
              <div className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center border border-white/20">
                {isExp ? <ChevronDown size={18} className="text-white" /> : <ChevronRight size={18} className="text-white" />}
              </div>
            </div>
          </div>
        </div>

        {/* Faculty children */}
        {isExp && (
          <div className="p-6 bg-violet-50/30 border-t border-violet-100">
            {fac.departments.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-violet-200 rounded-2xl">
                <Building2 size={32} className="mx-auto mb-3 text-violet-300" />
                <p className="text-xs font-bold text-violet-400">Aucun département. Créez le premier !</p>
              </div>
            ) : (
              fac.departments.map(renderDepartment)
            )}
          </div>
        )}
      </div>
    );
  };

  /* ─── Legend chips ───────────────────────────── */
  const LegendItem = ({ label, color, Icon }) => (
    <div className="flex items-center gap-1.5">
      <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: color }}>
        <Icon size={11} className="text-white" />
      </div>
      <span className="text-[10px] font-bold text-slate-500">{label}</span>
    </div>
  );

  /* ─── MAIN RENDER ────────────────────────────── */
  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto min-h-screen relative" style={{ background: '#f4f5f9' }}>

      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full blur-[120px] opacity-[0.10]"
          style={{ background: 'radial-gradient(circle, #7c3aed, #a855f7)' }} />
        <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full blur-[100px] opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, #0ea5e9, #5c4df1)' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-8">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#7c3aed]">Administration</span>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight mt-0.5">Structure Académique</h2>
            <p className="text-slate-400 mt-1 text-sm font-medium">Gérez l'arborescence complète de votre université.</p>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {Object.entries(DEPTH_CONFIG).map(([key, cfg]) => (
                <LegendItem key={key} label={cfg.label} color={cfg.dot} Icon={cfg.icon} />
              ))}
            </div>
          </div>

          <button onClick={() => openCreate('Faculté', null)}
            className="flex items-center gap-2 text-white px-5 py-3 rounded-2xl font-black text-sm transition-all hover:opacity-90 hover:scale-[1.02] active:scale-95 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 6px 20px rgba(124,58,237,0.3)' }}>
            <Plus size={18} /> Nouvelle Faculté
          </button>
        </div>

        {/* ── TREE ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-14 h-14 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin mb-4" />
            <p className="text-slate-400 font-bold text-sm">Chargement de la structure…</p>
          </div>
        ) : tree.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-violet-200 shadow-sm">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
              <Building2 size={36} className="text-white" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Aucune structure définie</h3>
            <p className="text-slate-400 text-sm font-medium mb-8">Commencez par créer votre première faculté.</p>
            <button onClick={() => openCreate('Faculté', null)}
              className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
              <Sparkles size={16} /> Créer une Faculté
            </button>
          </div>
        ) : (
          <div className="pb-20 space-y-0">{tree.map(renderFaculty)}</div>
        )}
      </div>

      {/* ── MODAL: Créer ── */}
      {createModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #7c3aed, #ec4899)' }} />
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#f5f3ff' }}>
                  <Plus size={16} style={{ color: '#7c3aed' }} />
                </div>
                Ajouter : {createModal.type}
              </h2>
              <button onClick={() => setCreateModal({ isOpen: false, type: '', parentId: null })}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 transition-colors">
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nom</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder={createModal.type === 'Faculté' ? 'ex: Sciences & Technologies' : createModal.type === 'Niveau' ? 'ex: L1 Informatique' : `Nom du ${createModal.type}`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-violet-400 transition-all"
                  required autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setCreateModal({ isOpen: false, type: '', parentId: null })}
                  className="px-5 py-2.5 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs transition-colors">
                  Annuler
                </button>
                <button type="submit"
                  className="text-white px-7 py-2.5 rounded-xl font-bold text-xs shadow-md hover:opacity-90 transition-all"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Confirmer suppression ── */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-sm border border-slate-100 p-6 text-center">
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">Confirmer la suppression</h2>
            <p className="text-slate-500 mb-6 text-xs font-semibold leading-relaxed">
              {confirmModal.type === 'single'
                ? <>Supprimer le module <span className="font-black text-slate-700">"{confirmModal.targetName}"</span> définitivement ?</>
                : <>Supprimer <span className="font-black text-rose-600">tous les modules</span> de <span className="font-black text-slate-700">"{confirmModal.targetName}"</span> ? Action irréversible.</>}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal({ isOpen: false, type: '', targetId: null, targetName: '' })}
                className="flex-1 py-2.5 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs transition-colors">
                Annuler
              </button>
              <button onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 text-white bg-rose-500 hover:bg-rose-600 rounded-xl font-bold text-xs shadow-md transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Affecter ── */}
      {assignModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
            <div className="h-1 w-full shrink-0" style={{ background: 'linear-gradient(90deg, #7c3aed, #ec4899)' }} />
            <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-base font-black text-slate-800 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-violet-50">
                  <Users size={15} style={{ color: '#7c3aed' }} />
                </div>
                Affectations — <span className="text-violet-600 truncate max-w-[160px]">{assignModal.targetName}</span>
              </h2>
              <button onClick={() => setAssignModal({ isOpen: false })}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 transition-colors">
                <X size={15} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              {/* Add user */}
              <div className="flex gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-violet-400 text-slate-700">
                  <option value="">Sélectionnez un {assignModal.type === 'student' ? 'étudiant' : 'enseignant'}…</option>
                  {usersList.filter(u => !assignedUsers.find(a => a.id === u.id)).map(u => (
                    <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                  ))}
                </select>
                <button onClick={handleAssign} disabled={!selectedUserId}
                  className="px-4 py-2.5 text-white rounded-xl font-black text-xs shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                  Ajouter
                </button>
              </div>

              {/* Already assigned */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                  <Users size={11} /> Déjà affectés ({assignedUsers.length})
                </p>
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
                  {assignedUsers.length === 0 ? (
                    <div className="py-10 text-center text-xs font-bold text-slate-300">Aucune affectation pour l'instant.</div>
                  ) : (
                    assignedUsers.map(u => (
                      <div key={u.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                            {u.first_name[0]}{u.last_name[0]}
                          </div>
                          <span className="font-bold text-slate-800 text-xs">{u.first_name} {u.last_name}</span>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{u.email}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Sections & Groupes ── */}
      {sectionsModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="h-1 w-full shrink-0" style={{ background: 'linear-gradient(90deg, #7c3aed, #ec4899)' }} />
            <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-base font-black text-slate-800 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-violet-50">
                  <Network size={15} style={{ color: '#7c3aed' }} />
                </div>
                Sections & Groupes — <span className="text-violet-600">{sectionsModal.levelName}</span>
              </h2>
              <button onClick={() => setSectionsModal({ isOpen: false, levelId: null, levelName: '', sections: [] })}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 transition-colors">
                <X size={15} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              {/* Auto-distribute panel */}
              <div className="bg-violet-50 rounded-2xl border border-violet-100 p-5 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Wand2 size={16} className="text-violet-600" />
                    <h3 className="font-black text-violet-900 text-sm">Distribution Automatique</h3>
                  </div>
                  <p className="text-violet-600 text-xs font-medium leading-relaxed max-w-sm">
                    Répartit automatiquement tous les étudiants inscrits dans des sections et groupes de TD/TP.
                  </p>
                </div>
                <div className="flex items-end gap-3 shrink-0">
                  <div>
                    <label className="block text-[9px] font-black text-violet-500 uppercase tracking-wider mb-1">Étd / Section</label>
                    <input type="number" min="50" max="500" value={distribConfig.section_size}
                      onChange={e => setDistribConfig({ ...distribConfig, section_size: parseInt(e.target.value) || 150 })}
                      className="w-20 bg-white border border-violet-200 rounded-xl px-3 py-2 font-black text-xs outline-none focus:border-violet-400 text-slate-700" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-violet-500 uppercase tracking-wider mb-1">Étd / Groupe</label>
                    <input type="number" min="10" max="100" value={distribConfig.group_size}
                      onChange={e => setDistribConfig({ ...distribConfig, group_size: parseInt(e.target.value) || 24 })}
                      className="w-20 bg-white border border-violet-200 rounded-xl px-3 py-2 font-black text-xs outline-none focus:border-violet-400 text-slate-700" />
                  </div>
                  <button onClick={handleAutoDistribute} disabled={isDistributing}
                    className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-black text-xs disabled:opacity-50 shadow-md transition-all"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                    {isDistributing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Wand2 size={13} />}
                    {isDistributing ? 'En cours…' : 'Distribuer'}
                  </button>
                </div>
              </div>

              {/* Sections list */}
              {sectionsModal.sections.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
                  <Network size={36} className="mx-auto mb-3 text-slate-200" />
                  <p className="text-xs font-bold text-slate-400">Aucune section. Lancez la distribution automatique.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sectionsModal.sections.map(sec => (
                    <div key={sec.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100"
                        style={{ background: 'linear-gradient(90deg, #f5f3ff, #fff)' }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-violet-100 text-violet-700">
                          <Layers size={13} />
                        </div>
                        <h4 className="font-black text-slate-800 text-sm">{sec.name}</h4>
                        <span className="text-[9px] font-black bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full border border-violet-200 ml-auto">
                          {sec.groups.length} groupe{sec.groups.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="p-5">
                        {sec.groups.length === 0 ? (
                          <p className="text-xs text-slate-400 italic text-center py-2">Aucun groupe.</p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {sec.groups.map(grp => (
                              <div key={grp.id}
                                className="rounded-xl border border-violet-100 bg-violet-50/50 px-4 py-3 text-center hover:bg-violet-100 hover:border-violet-200 transition-all hover:-translate-y-0.5">
                                <span className="font-black text-slate-700 text-xs block">{grp.name}</span>
                                <span className="text-[9px] font-bold text-violet-600 mt-1 block">{grp.students_count} étudiants</span>
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
