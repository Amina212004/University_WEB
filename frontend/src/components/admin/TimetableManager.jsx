import React, { useState, useEffect } from 'react';
import {
  getAcademicTree,
  getSemestersByLevel, getSemesterModules, getLevelSections,
  getSectionTimetable, addTimeSlot, deleteTimeSlot,
  getUsers, getExamsByLevel, addExam, deleteExam,
  getModuleTeachers, assignTeacherToModule, removeTeacherFromModule
} from '../../api/services';
import {
  Calendar, Plus, Trash2, Clock, ChevronRight, ChevronDown,
  AlertTriangle, X, BookOpen, ClipboardList, FileDown,
  Users, UserPlus, UserMinus, Search, GraduationCap,
  Layers, Building2, FolderOpen, MapPin
} from 'lucide-react';
import jsPDF from 'jspdf';
import { useAuth } from '../../context/AuthContext';

const DAYS       = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi'];
const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu'];
const MONTHS_FR  = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const TIME_SLOTS = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00'
];

const SESSION_STYLES = {
  cours: { bg: 'bg-gradient-to-br from-blue-500 to-blue-600',   dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700',   label: 'Cours' },
  td:    { bg: 'bg-gradient-to-br from-violet-500 to-violet-600', dot: 'bg-violet-500', badge: 'bg-violet-100 text-violet-700', label: 'TD' },
  tp:    { bg: 'bg-gradient-to-br from-amber-500 to-orange-500',  dot: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700',  label: 'TP' },
};

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h - 8) * 60 + m;
}

/* ─── SessionCard ────────────────────────────────────────────────────────── */
function SessionCard({ slot, onDelete, groups, userRole }) {
  const style = SESSION_STYLES[slot.session_type] || SESSION_STYLES.cours;
  const group = slot.group_id ? groups.find(g => g.id === slot.group_id) : null;
  const top    = (timeToMinutes(slot.start_time?.slice(0,5)) / 30) * 64;
  const height = Math.max(((timeToMinutes(slot.end_time?.slice(0,5)) - timeToMinutes(slot.start_time?.slice(0,5))) / 30) * 64 - 4, 40);

  return (
    <div className={`absolute left-1 right-1 rounded-2xl shadow-md overflow-hidden group z-10 ${style.bg}`}
      style={{ top: `${top}px`, height: `${height}px` }}>
      <div className="p-2 h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1 mb-0.5 flex-wrap">
            <span className="text-[10px] font-black uppercase bg-white/20 text-white px-1.5 py-0.5 rounded-full">{style.label}</span>
            {group && <span className="text-[10px] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded-full">{group.name}</span>}
          </div>
          <p className="font-bold text-xs text-white leading-tight truncate">{slot.module?.name || `Module #${slot.module_id}`}</p>
        </div>
        <div>
          {slot.teacher && <p className="text-[10px] text-white/80 truncate">{slot.teacher.first_name} {slot.teacher.last_name}</p>}
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-[10px] text-white/70">{slot.start_time?.slice(0,5)} – {slot.end_time?.slice(0,5)}{slot.room && ` · ${slot.room}`}</p>
            {userRole === 'admin' && (
              <button onClick={() => onDelete(slot.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-white/20 hover:bg-white/40 text-white transition-all">
                <Trash2 size={11} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── AcademicTree ───────────────────────────────────────────────────────── */
function AcademicTree({ tree, activeTab, selLevelId, selSectionId, onSelectLevel, onSelectSection }) {
  const [openFac,  setOpenFac]  = useState({});
  const [openDep,  setOpenDep]  = useState({});
  const [openSpec, setOpenSpec] = useState({});
  const [openLvl,  setOpenLvl]  = useState({});

  const toggle = (setter, id) => setter(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-1">
      {tree.map(fac => (
        <div key={fac.id}>
          {/* Faculty */}
          <button
            onClick={() => toggle(setOpenFac, fac.id)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors text-left group"
          >
            <Building2 size={14} className="text-violet-500 shrink-0" />
            <span className="flex-1 text-xs font-bold text-slate-700 truncate">{fac.name}</span>
            <ChevronRight size={12} className={`text-slate-400 transition-transform shrink-0 ${openFac[fac.id] ? 'rotate-90' : ''}`} />
          </button>

          {openFac[fac.id] && (
            <div className="ml-4 space-y-0.5">
              {(fac.departments || []).map(dep => (
                <div key={dep.id}>
                  {/* Department */}
                  <button
                    onClick={() => toggle(setOpenDep, dep.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors text-left"
                  >
                    <FolderOpen size={13} className="text-amber-500 shrink-0" />
                    <span className="flex-1 text-xs font-bold text-slate-600 truncate">{dep.name}</span>
                    <ChevronRight size={12} className={`text-slate-400 transition-transform shrink-0 ${openDep[dep.id] ? 'rotate-90' : ''}`} />
                  </button>

                  {openDep[dep.id] && (
                    <div className="ml-4 space-y-0.5">
                      {(dep.specialties || []).map(spec => (
                        <div key={spec.id}>
                          {/* Specialty */}
                          <button
                            onClick={() => toggle(setOpenSpec, spec.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors text-left"
                          >
                            <Layers size={12} className="text-emerald-500 shrink-0" />
                            <span className="flex-1 text-xs font-bold text-slate-600 truncate">{spec.name}</span>
                            <ChevronRight size={12} className={`text-slate-400 transition-transform shrink-0 ${openSpec[spec.id] ? 'rotate-90' : ''}`} />
                          </button>

                          {openSpec[spec.id] && (
                            <div className="ml-4 space-y-0.5">
                              {(spec.levels || []).map(lvl => (
                                <div key={lvl.id}>
                                  {/* Level */}
                                  <button
                                    onClick={() => {
                                      toggle(setOpenLvl, lvl.id);
                                      onSelectLevel(lvl);
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-left
                                      ${selLevelId === lvl.id
                                        ? 'bg-rose-50 border border-rose-200 text-rose-700'
                                        : 'hover:bg-slate-100 text-slate-600'}`}
                                  >
                                    <GraduationCap size={12} className={selLevelId === lvl.id ? 'text-rose-500' : 'text-slate-400'} />
                                    <span className="flex-1 text-xs font-bold truncate">{lvl.name}</span>
                                    {activeTab === 'schedule' && (
                                      <ChevronRight size={11} className={`text-slate-400 transition-transform shrink-0 ${openLvl[lvl.id] ? 'rotate-90' : ''}`} />
                                    )}
                                  </button>

                                  {/* Sections (only for schedule tab) */}
                                  {activeTab === 'schedule' && openLvl[lvl.id] && (
                                    <div className="ml-4 space-y-0.5">
                                      {(lvl._sections || []).length === 0 ? (
                                        <p className="text-[10px] text-slate-400 px-3 py-1 italic">Aucune section</p>
                                      ) : (
                                        (lvl._sections || []).map(sec => (
                                          <button
                                            key={sec.id}
                                            onClick={() => onSelectSection(sec, lvl)}
                                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-left
                                              ${selSectionId === sec.id
                                                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30'
                                                : 'hover:bg-slate-100 text-slate-600'}`}
                                          >
                                            <MapPin size={11} className={selSectionId === sec.id ? 'text-white/80' : 'text-slate-400'} />
                                            <span className="text-xs font-bold truncate">{sec.name}</span>
                                            {sec.students_count !== undefined && (
                                              <span className={`text-[10px] ml-auto px-1.5 py-0.5 rounded-full font-bold
                                                ${selSectionId === sec.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                {sec.students_count}
                                              </span>
                                            )}
                                          </button>
                                        ))
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function TimetableManager() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('schedule');

  // Academic tree
  const [tree, setTree]           = useState([]);
  const [treeWithSec, setTreeWithSec] = useState([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [treeSearch, setTreeSearch]   = useState('');

  // Selection
  const [selLevel,   setSelLevel]   = useState(null);
  const [selSection, setSelSection] = useState(null);
  const [selSemester, setSelSemester] = useState(null);
  const [semesters, setSemesters]   = useState([]);
  const [sections,  setSections]    = useState([]);
  const [modules,   setModules]     = useState([]);
  const [teachers,  setTeachers]    = useState([]);

  // Schedule
  const [timeslots, setTimeslots] = useState([]);
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [isSubmittingSlot, setIsSubmittingSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({ day_of_week: 1, start_time: '08:00', end_time: '09:30', session_type: 'cours', room: '', module_id: '', teacher_id: '', group_id: '' });

  // Exams
  const [exams, setExams]           = useState([]);
  const [isAddExamOpen, setIsAddExamOpen] = useState(false);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);
  const [newExam, setNewExam] = useState({ exam_date: '', start_time: '09:00', end_time: '11:00', room: '', module_id: '', target: 'level', section_id: '' });

  // Delete
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, type: '' });

  // Assignments
  const [assignModuleTeachers, setAssignModuleTeachers] = useState({});
  const [assignLoadingId, setAssignLoadingId]           = useState(null);
  const [assignSelModule, setAssignSelModule]           = useState(null);
  const [assignSearch, setAssignSearch]                 = useState('');

  const selectedSectionObj = sections.find(s => String(s.id) === String(selSection?.id));
  const sectionGroups      = selectedSectionObj?.groups || [];

  /* ── Load tree ── */
  useEffect(() => {
    setTreeLoading(true);
    Promise.all([
      getAcademicTree(),
      getUsers('teacher'),
    ]).then(([treeRes, teachersRes]) => {
      setTree(treeRes.data || []);
      setTeachers(teachersRes.data || []);
    }).catch(console.error)
    .finally(() => setTreeLoading(false));
  }, []);

  /* ── Enrich tree with sections ── */
  useEffect(() => {
    if (!tree.length) return;

    // For schedule tab: load sections for every level
    const enrichTree = async () => {
      const enriched = await Promise.all(
        tree.map(async fac => ({
          ...fac,
          departments: await Promise.all(
            (fac.departments || []).map(async dep => ({
              ...dep,
              specialties: await Promise.all(
                (dep.specialties || []).map(async spec => ({
                  ...spec,
                  levels: await Promise.all(
                    (spec.levels || []).map(async lvl => {
                      try {
                        const secRes = await getLevelSections(lvl.id);
                        const secs = Array.isArray(secRes) ? secRes : secRes.data || [];
                        return { ...lvl, _sections: secs };
                      } catch {
                        return { ...lvl, _sections: [] };
                      }
                    })
                  ),
                }))
              ),
            }))
          ),
        }))
      );
      setTreeWithSec(enriched);
    };

    enrichTree();
  }, [tree]);

  /* ── Select level ── */
  const handleSelectLevel = async (lvl) => {
    setSelLevel(lvl);
    setSelSection(null);
    setTimeslots([]);
    setSelSemester(null);
    setModules([]);
    setExams([]);
    setAssignSelModule(null);
    setAssignModuleTeachers({});

    try {
      const [semRes, secRes, examRes] = await Promise.all([
        getSemestersByLevel(lvl.id),
        getLevelSections(lvl.id),
        getExamsByLevel(lvl.id),
      ]);
      setSemesters(semRes.data || []);
      const secs = Array.isArray(secRes) ? secRes : secRes.data || [];
      setSections(secs);
      setExams(examRes.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  /* ── Select section ── */
  const handleSelectSection = async (sec, lvl) => {
    if (!lvl && selLevel) lvl = selLevel;
    setSelSection(sec);
    if (lvl) setSelLevel(lvl);
    setTimeslots([]);

    try {
      const r = await getSectionTimetable(sec.id);
      setTimeslots(r.data || []);
    } catch (e) { console.error(e); }
  };

  /* ── Select semester ── */
  const handleSelectSemester = async (semId) => {
    setSelSemester(semId);
    setAssignSelModule(null);
    setModules([]);
    if (!semId) return;
    try {
      const r = await getSemesterModules(semId);
      setModules(r.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchTimetable = async () => {
    if (!selSection) return;
    const r = await getSectionTimetable(selSection.id);
    setTimeslots(r.data || []);
  };

  const fetchExams = async () => {
    if (!selLevel) return;
    const r = await getExamsByLevel(selLevel.id);
    setExams(r.data || []);
  };

  /* ── Add timeslot ── */
  const handleAddSlot = async (e) => {
    e.preventDefault();
    setIsSubmittingSlot(true);
    try {
      await addTimeSlot({
        day_of_week:  parseInt(newSlot.day_of_week),
        start_time:   newSlot.start_time,
        end_time:     newSlot.end_time,
        session_type: newSlot.session_type,
        room:         newSlot.room || null,
        module_id:    parseInt(newSlot.module_id),
        teacher_id:   parseInt(newSlot.teacher_id),
        section_id:   newSlot.session_type === 'cours' ? selSection?.id : null,
        group_id:     newSlot.session_type !== 'cours' ? parseInt(newSlot.group_id) : null,
      });
      await fetchTimetable();
      setIsAddSlotOpen(false);
      setNewSlot({ day_of_week: 1, start_time: '08:00', end_time: '09:30', session_type: 'cours', room: '', module_id: '', teacher_id: '', group_id: '' });
    } catch (err) { alert(err.response?.data?.detail || "Erreur lors de l'ajout"); }
    finally { setIsSubmittingSlot(false); }
  };

  /* ── Add exam ── */
  const handleAddExam = async (e) => {
    e.preventDefault();
    setIsSubmittingExam(true);
    try {
      await addExam({
        exam_date:  newExam.exam_date,
        start_time: newExam.start_time,
        end_time:   newExam.end_time,
        room:       newExam.room || null,
        module_id:  parseInt(newExam.module_id),
        level_id:   newExam.target === 'level' ? selLevel?.id : null,
        section_id: newExam.target === 'section' ? parseInt(newExam.section_id) : null,
      });
      await fetchExams();
      setIsAddExamOpen(false);
      setNewExam({ exam_date: '', start_time: '09:00', end_time: '11:00', room: '', module_id: '', target: 'level', section_id: '' });
    } catch (err) { alert(err.response?.data?.detail || "Erreur lors de l'ajout"); }
    finally { setIsSubmittingExam(false); }
  };

  /* ── Delete ── */
  const handleDeleteConfirm = async () => {
    try {
      if (confirmDelete.type === 'slot') { await deleteTimeSlot(confirmDelete.id); await fetchTimetable(); }
      else { await deleteExam(confirmDelete.id); await fetchExams(); }
    } catch {}
    setConfirmDelete({ isOpen: false, id: null, type: '' });
  };

  /* ── Assignments ── */
  const loadModuleTeachers = async (moduleId) => {
    setAssignLoadingId(moduleId);
    try {
      const res = await getModuleTeachers(moduleId);
      setAssignModuleTeachers(prev => ({ ...prev, [moduleId]: res.data }));
    } finally { setAssignLoadingId(null); }
  };

  const handleAssignTeacher = async (moduleId, teacherId) => {
    try {
      await assignTeacherToModule(teacherId, moduleId);
      await loadModuleTeachers(moduleId);
    } catch (err) { alert(err.response?.data?.detail || "Erreur d'affectation"); }
  };

  const handleRemoveTeacher = async (moduleId, teacherId) => {
    if (!window.confirm('Retirer ce professeur ?')) return;
    try {
      await removeTeacherFromModule(moduleId, teacherId);
      await loadModuleTeachers(moduleId);
    } catch { alert("Erreur"); }
  };

  /* ── PDF Schedule ── */
  const exportSchedulePDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageW, 18, 'F');
    doc.setTextColor(255,255,255); doc.setFontSize(13); doc.setFont('helvetica','bold');
    doc.text('EMPLOI DU TEMPS', margin, 11);
    doc.setFontSize(9); doc.setFont('helvetica','normal');
    const sub = `${selSection?.name || ''} · ${selLevel?.name || ''}`;
    doc.text(sub, pageW - margin - doc.getTextWidth(sub), 11);
    doc.setTextColor(0,0,0);
    const allTimes = [...new Set(timeslots.map(s => `${s.start_time?.slice(0,5)}-${s.end_time?.slice(0,5)}`))]
      .sort();
    if (allTimes.length === 0) { doc.text('Aucune séance.', margin, 40); doc.save('emploi_du_temps.pdf'); return; }
    const tableW = pageW - margin * 2;
    const timeColW = 38;
    const dayColW = (tableW - timeColW) / 5;
    const rowH = 14; let y = 24;
    doc.setFillColor(241,245,249); doc.rect(margin, y, tableW, rowH, 'F');
    doc.setFontSize(8.5); doc.setFont('helvetica','bold'); doc.setTextColor(71,85,105);
    doc.text('Horaire', margin + 3, y + 9);
    DAYS.forEach((d, i) => { const x = margin + timeColW + i * dayColW; doc.text(d, x + dayColW/2 - doc.getTextWidth(d)/2, y + 9); });
    y += rowH;
    allTimes.forEach((tr, ri) => {
      const [startT, endT] = tr.split('-');
      doc.setFillColor(...(ri % 2 === 0 ? [255,255,255] : [248,250,252]));
      doc.rect(margin, y, tableW, rowH, 'F');
      doc.setDrawColor(226,232,240); doc.rect(margin, y, tableW, rowH, 'S');
      doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(51,65,85);
      doc.text(`${startT} – ${endT}`, margin + 3, y + 9);
      DAYS.forEach((_, di) => {
        const cell = timeslots.find(s => s.day_of_week === di && s.start_time?.slice(0,5) === startT && s.end_time?.slice(0,5) === endT);
        if (cell) {
          const cx = margin + timeColW + di * dayColW;
          const cols = { cours: [219,234,254], td: [237,233,254], tp: [254,243,199] };
          const txts = { cours: [30,64,175], td: [91,33,182], tp: [146,64,14] };
          doc.setFillColor(...(cols[cell.session_type] || cols.cours));
          doc.rect(cx+1, y+1, dayColW-2, rowH-2, 'F');
          doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...(txts[cell.session_type] || txts.cours));
          const tr2 = (s, n) => s.length > n ? s.slice(0,n-1)+'…' : s;
          doc.text(`[${(cell.session_type||'').toUpperCase()}] ${tr2(cell.module?.name||'',18)}`, cx+2, y+5);
          doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(100,116,139);
          if (cell.teacher) doc.text(tr2(`${cell.teacher.first_name} ${cell.teacher.last_name}`,22), cx+2, y+9);
          if (cell.room) doc.text(cell.room, cx+2, y+12.5);
        }
      });
      y += rowH;
      if (y > pageH - 20) { doc.addPage(); y = 20; }
    });
    doc.setFont('helvetica','italic'); doc.setFontSize(7); doc.setTextColor(148,163,184);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, margin, pageH - 6);
    doc.save(`emploi_${selSection?.name || 'section'}.pdf`);
  };

  /* ── derived ── */
  const slotsByDay    = DAYS.map((_, i) => timeslots.filter(s => s.day_of_week === i));
  const GRID_HEIGHT   = TIME_SLOTS.length * 64;
  const canShowSchedule = !!selSection;
  const canShowExams    = !!selLevel;
  const examsByMonth    = exams.reduce((acc, ex) => {
    const d   = new Date(ex.exam_date + 'T00:00:00');
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const lbl = `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
    if (!acc[key]) acc[key] = { label: lbl, exams: [] };
    acc[key].exams.push(ex);
    return acc;
  }, {});

  /* ── Filter tree by search ── */
  const displayTree = treeSearch.trim()
    ? (treeWithSec.length ? treeWithSec : tree)
    : (treeWithSec.length ? treeWithSec : tree);

  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: fixed; left: 0; top: 0; width: 100%; padding: 24px; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="flex-1 flex overflow-hidden bg-slate-50">

        {/* ══ LEFT SIDEBAR — Academic Tree ══════════════════════════════════ */}
        <div className="no-print w-64 shrink-0 bg-white border-r border-slate-100 flex flex-col overflow-hidden shadow-sm">
          {/* Sidebar Header */}
          <div className="px-4 pt-5 pb-3 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-800 mb-3">Structure Académique</h2>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={treeSearch}
                onChange={e => setTreeSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-violet-400 transition-colors"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="px-3 pt-3 flex gap-1">
            {[
              { key: 'schedule', label: 'Emplois', icon: <BookOpen size={12}/> },
              { key: 'exams',    label: 'Examens', icon: <ClipboardList size={12}/> },
              { key: 'assign',   label: 'Profs',   icon: <Users size={12}/> },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-black transition-all
                  ${activeTab === t.key
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                    : 'text-slate-500 hover:bg-slate-100'}`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Tree */}
          <div className="flex-1 overflow-y-auto px-2 py-3">
            {treeLoading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-[10px] text-slate-400 font-medium">Chargement...</p>
              </div>
            ) : (
              <AcademicTree
                tree={displayTree}
                activeTab={activeTab}
                selLevelId={selLevel?.id}
                selSectionId={selSection?.id}
                onSelectLevel={handleSelectLevel}
                onSelectSection={handleSelectSection}
              />
            )}
          </div>

          {/* Selection indicator */}
          {(selLevel || selSection) && (
            <div className="px-3 py-3 border-t border-slate-100 bg-slate-50">
              {selLevel && (
                <div className="flex items-center gap-2 mb-1">
                  <GraduationCap size={11} className="text-rose-500 shrink-0" />
                  <span className="text-[10px] font-bold text-slate-600 truncate">{selLevel.name}</span>
                </div>
              )}
              {selSection && (
                <div className="flex items-center gap-2">
                  <MapPin size={11} className="text-violet-500 shrink-0" />
                  <span className="text-[10px] font-bold text-violet-700 truncate">{selSection.name}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══ RIGHT PANEL — Content ══════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Panel Header */}
          <div className="no-print bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm">
            <div>
              <h1 className="text-xl font-black text-slate-900">
                {activeTab === 'schedule' ? 'Emploi du Temps' : activeTab === 'exams' ? 'Calendrier des Examens' : 'Affectation Professeurs'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {selSection ? `${selLevel?.name || ''} · ${selSection.name}` : selLevel ? selLevel.name : 'Sélectionnez dans l\'arbre à gauche'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'schedule' && canShowSchedule && (
                <>
                  <button onClick={exportSchedulePDF}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-violet-700 bg-violet-50 border border-violet-200 rounded-xl hover:bg-violet-100 transition-all">
                    <FileDown size={14}/> PDF
                  </button>
                  <button onClick={() => setIsAddSlotOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-lg shadow-violet-500/30 transition-all">
                    <Plus size={14}/> Séance
                  </button>
                </>
              )}
              {activeTab === 'exams' && canShowExams && (
                <button onClick={() => setIsAddExamOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-lg shadow-rose-500/30 transition-all">
                  <Plus size={14}/> Examen
                </button>
              )}
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-6">

            {/* ═══ SCHEDULE TAB ═══════════════════════════════════════════════ */}
            {activeTab === 'schedule' && (
              <>
                {/* ── Semester picker : visible dès qu'un niveau est sélectionné ── */}
                {selLevel && semesters.length > 0 && (
                  <div className="no-print flex items-center gap-3 mb-5 flex-wrap">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Semestre :</span>
                    {semesters.map(sem => (
                      <button
                        key={sem.id}
                        onClick={() => handleSelectSemester(selSemester === sem.id ? null : sem.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all
                          ${selSemester === sem.id
                            ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                            : 'bg-white border border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-700'}`}
                      >
                        {sem.name}
                      </button>
                    ))}
                    {canShowSchedule && (
                      <div className="ml-auto flex items-center gap-3">
                        {Object.entries(SESSION_STYLES).map(([k, v]) => (
                          <div key={k} className="flex items-center gap-1.5 bg-white rounded-xl px-3 py-1.5 border border-slate-100">
                            <div className={`w-2 h-2 rounded-full ${v.dot}`}/>
                            <span className="text-xs font-bold text-slate-600">{v.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Empty state : no section selected yet ── */}
                {!canShowSchedule ? (
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-16 text-center flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-violet-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
                      <BookOpen size={36} className="text-violet-200" />
                    </div>
                    {!selLevel ? (
                      <>
                        <h3 className="text-xl font-black text-slate-700 mb-2">Sélectionnez un niveau</h3>
                        <p className="text-slate-400 max-w-sm font-medium text-sm">
                          Naviguez dans l'arbre à gauche, puis choisissez une section.
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-black text-slate-700 mb-2">Sélectionnez une section</h3>
                        <p className="text-slate-400 max-w-sm font-medium text-sm">
                          Cliquez sur une section dans l'arbre à gauche pour afficher sa grille.
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  /* ── Timetable grid ── */
                  <div id="print-area" className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: '80px repeat(5, 1fr)' }}>
                      <div className="p-4 border-r border-slate-100 flex items-center justify-center">
                        <Clock size={16} className="text-slate-200" />
                      </div>
                      {DAYS.map((day, i) => (
                        <div key={day} className="p-4 text-center border-r border-slate-100 last:border-r-0">
                          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                            <span className="hidden md:inline">{day}</span>
                            <span className="md:hidden">{DAYS_SHORT[i]}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="flex">
                      <div className="flex-shrink-0 w-20 border-r border-slate-100">
                        {TIME_SLOTS.map(t => (
                          <div key={t} className="flex items-start justify-end pr-3 border-b border-slate-50" style={{ height: '64px' }}>
                            <span className={`text-xs font-bold mt-1.5 ${t.endsWith(':00') ? 'text-slate-400' : 'text-slate-100'}`}>
                              {t.endsWith(':00') ? t : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex-1 grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                        {DAYS.map((_, di) => (
                          <div key={di} className="relative border-r border-slate-100 last:border-r-0" style={{ height: `${GRID_HEIGHT}px` }}>
                            {TIME_SLOTS.map((t, i) => (
                              <div key={t} className={`absolute w-full ${t.endsWith(':00') ? 'border-b border-slate-100' : 'border-b border-slate-50'}`}
                                style={{ top: `${i * 64}px`, height: '64px' }} />
                            ))}
                            {slotsByDay[di].map(slot => (
                              <SessionCard key={slot.id} slot={slot}
                                onDelete={id => setConfirmDelete({ isOpen: true, id, type: 'slot' })}
                                groups={sectionGroups} userRole={user?.role} />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ═══ EXAMS TAB ══════════════════════════════════════════════════ */}
            {activeTab === 'exams' && (
              !canShowExams ? (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-20 text-center flex flex-col items-center justify-center h-full">
                  <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
                    <ClipboardList size={36} className="text-rose-200" />
                  </div>
                  <h3 className="text-xl font-black text-slate-700 mb-2">Sélectionnez un niveau</h3>
                  <p className="text-slate-400 max-w-sm font-medium text-sm">
                    Cliquez sur un niveau dans l'arbre à gauche pour voir et gérer ses examens.
                  </p>
                </div>
              ) : exams.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-16 text-center">
                  <ClipboardList size={36} className="mx-auto text-slate-200 mb-4" />
                  <p className="font-bold text-slate-500">Aucun examen programmé pour {selLevel?.name}.</p>
                  <button onClick={() => setIsAddExamOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-rose-500 rounded-xl hover:bg-rose-600 transition-all shadow-md">
                    <Plus size={14}/> Ajouter un examen
                  </button>
                </div>
              ) : (
                <div id="print-area" className="space-y-8">
                  {Object.values(examsByMonth).map(({ label, exams: monthExams }) => (
                    <div key={label}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <h3 className="font-black text-slate-700 text-base">{label}</h3>
                        <div className="flex-1 h-px bg-slate-100" />
                        <span className="text-xs text-slate-400 font-medium">{monthExams.length} examen(s)</span>
                      </div>
                      <div className="space-y-3">
                        {monthExams.map(ex => {
                          const d       = new Date(ex.exam_date + 'T00:00:00');
                          const dayName = DAYS[d.getDay()] || '';
                          const target  = ex.section?.name ? `Section ${ex.section.name}` : ex.level?.name ? `Niveau ${ex.level.name}` : '';
                          return (
                            <div key={ex.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-5 group hover:shadow-md transition-all">
                              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex flex-col items-center justify-center shadow-lg shadow-rose-500/30">
                                <span className="text-white/80 text-[10px] font-bold uppercase">{dayName.slice(0,3)}</span>
                                <span className="text-white text-2xl font-black leading-none">{d.getDate()}</span>
                                <span className="text-white/80 text-[10px] font-bold">{MONTHS_FR[d.getMonth()].slice(0,3)}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="bg-rose-100 text-rose-700 text-xs font-black px-2 py-0.5 rounded-full uppercase">Examen</span>
                                  {target && <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{target}</span>}
                                </div>
                                <p className="font-black text-slate-900 text-base truncate">{ex.module?.name || `Module #${ex.module_id}`}</p>
                                <div className="flex items-center gap-4 mt-1 flex-wrap">
                                  <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={11}/> {ex.start_time?.slice(0,5)} – {ex.end_time?.slice(0,5)}</span>
                                  {ex.room && <span className="text-xs text-slate-500">📍 {ex.room}</span>}
                                </div>
                              </div>
                              <button onClick={() => setConfirmDelete({ isOpen: true, id: ex.id, type: 'exam' })}
                                className="opacity-0 group-hover:opacity-100 p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                <Trash2 size={18}/>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ═══ ASSIGNMENTS TAB ════════════════════════════════════════════ */}
            {activeTab === 'assign' && (
              !selLevel ? (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-20 text-center flex flex-col items-center justify-center h-full">
                  <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
                    <Users size={36} className="text-emerald-200" />
                  </div>
                  <h3 className="text-xl font-black text-slate-700 mb-2">Sélectionnez un niveau</h3>
                  <p className="text-slate-400 max-w-sm font-medium text-sm">
                    Choisissez un niveau puis un semestre pour affecter les professeurs aux modules.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Semester picker */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Semestre :</span>
                    {semesters.map(sem => (
                      <button key={sem.id} onClick={() => handleSelectSemester(selSemester === sem.id ? null : sem.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all
                          ${selSemester === sem.id
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                            : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'}`}>
                        {sem.name}
                      </button>
                    ))}
                  </div>

                  {!selSemester ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
                      <p className="text-sm font-bold text-slate-400">Sélectionnez un semestre ci-dessus.</p>
                    </div>
                  ) : modules.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
                      <p className="text-sm font-bold text-slate-400">Aucun module dans ce semestre.</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-base font-black text-slate-800">
                          Modules · {semesters.find(s => s.id === selSemester)?.name || ''}
                        </h3>
                        <div className="relative">
                          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input type="text" placeholder="Filtrer..." value={assignSearch}
                            onChange={e => setAssignSearch(e.target.value)}
                            className="pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold w-48 focus:border-emerald-500 outline-none" />
                        </div>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {modules.filter(m => m.name.toLowerCase().includes(assignSearch.toLowerCase())).map(module => {
                          const isExpanded     = assignSelModule === module.id;
                          const moduleTeachers = assignModuleTeachers[module.id] || [];
                          const isLoading      = assignLoadingId === module.id;
                          const availTeachers  = teachers.filter(t => !moduleTeachers.find(mt => mt.id === t.id));
                          return (
                            <div key={module.id} className={`transition-all ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>
                              <div onClick={() => { if (isExpanded) setAssignSelModule(null); else { setAssignSelModule(module.id); loadModuleTeachers(module.id); } }}
                                className="p-5 flex items-center justify-between cursor-pointer">
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${moduleTeachers.length > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                    <BookOpen size={18}/>
                                  </div>
                                  <div>
                                    <h4 className="font-black text-slate-800 text-sm">{module.name}</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">{moduleTeachers.length} prof(s)</p>
                                  </div>
                                </div>
                                <ChevronDown size={18} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                              {isExpanded && (
                                <div className="px-8 pb-5">
                                  <div className="bg-white border border-slate-200 rounded-2xl p-4">
                                    {isLoading ? (
                                      <p className="text-xs text-slate-400 animate-pulse">Chargement...</p>
                                    ) : (
                                      <>
                                        {moduleTeachers.length === 0 ? (
                                          <p className="text-xs text-amber-600 font-bold bg-amber-50 p-3 rounded-xl border border-amber-100">
                                            Aucun professeur affecté.
                                          </p>
                                        ) : (
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                                            {moduleTeachers.map(t => (
                                              <div key={t.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                                                <div className="flex items-center gap-2.5">
                                                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-[10px]">
                                                    {t.first_name[0]}{t.last_name[0]}
                                                  </div>
                                                  <div>
                                                    <p className="text-xs font-bold text-slate-800">{t.first_name} {t.last_name}</p>
                                                    <p className="text-[10px] text-slate-400">{t.email}</p>
                                                  </div>
                                                </div>
                                                <button onClick={() => handleRemoveTeacher(module.id, t.id)}
                                                  className="w-7 h-7 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors">
                                                  <UserMinus size={14}/>
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                                          <select id={`sel-t-${module.id}`}
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500">
                                            <option value="">Ajouter un professeur...</option>
                                            {availTeachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                                          </select>
                                          <button onClick={() => { const s = document.getElementById(`sel-t-${module.id}`); if (s.value) { handleAssignTeacher(module.id, s.value); s.value = ''; } }}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl font-bold text-xs shadow-md transition-colors flex items-center gap-1">
                                            <UserPlus size={13}/> Affecter
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL : Ajouter Séance ── */}
      {isAddSlotOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-violet-50 to-white">
              <div>
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><BookOpen size={17} className="text-violet-500"/> Nouvelle Séance</h2>
                <p className="text-xs text-slate-400 mt-0.5">{selLevel?.name} · {selSection?.name}</p>
              </div>
              <button onClick={() => setIsAddSlotOpen(false)} className="p-2 rounded-full bg-white border border-slate-100 text-slate-400 hover:text-slate-600 shadow-sm"><X size={16}/></button>
            </div>
            <form onSubmit={handleAddSlot} className="p-6 overflow-y-auto space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Type</label>
                <div className="flex gap-2">
                  {Object.entries(SESSION_STYLES).map(([k, v]) => (
                    <button key={k} type="button" onClick={() => setNewSlot({...newSlot, session_type: k, group_id: ''})}
                      className={`flex-1 py-3 rounded-2xl text-sm font-black border-2 transition-all ${newSlot.session_type === k ? `${v.bg} text-white border-transparent shadow-lg` : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {v.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">{newSlot.session_type === 'cours' ? '📢 Toute la section' : '👥 Pour un groupe'}</p>
              </div>
              {newSlot.session_type !== 'cours' && (
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Groupe *</label>
                  <select required value={newSlot.group_id} onChange={e => setNewSlot({...newSlot, group_id: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-violet-500 font-medium">
                    <option value="">Groupe...</option>
                    {sectionGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Jour</label>
                <div className="flex gap-2">
                  {DAYS_SHORT.map((d, i) => (
                    <button key={i} type="button" onClick={() => setNewSlot({...newSlot, day_of_week: i})}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${parseInt(newSlot.day_of_week) === i ? 'bg-slate-900 text-white shadow' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{d}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Début</label>
                  <input type="time" required value={newSlot.start_time} onChange={e => setNewSlot({...newSlot, start_time: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-violet-500 font-bold"/>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Fin</label>
                  <input type="time" required value={newSlot.end_time} onChange={e => setNewSlot({...newSlot, end_time: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-violet-500 font-bold"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Matière *</label>
                <select required value={newSlot.module_id} onChange={e => setNewSlot({...newSlot, module_id: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-violet-500 font-medium">
                  <option value="">Sélectionner une matière...</option>
                  {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                {modules.length === 0 && <p className="text-xs text-amber-600 mt-1 font-medium">⚠️ Sélectionnez un semestre d'abord pour charger les matières.</p>}
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Professeur *</label>
                <select required value={newSlot.teacher_id} onChange={e => setNewSlot({...newSlot, teacher_id: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-violet-500 font-medium">
                  <option value="">Sélectionner un professeur...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Salle</label>
                <input type="text" placeholder="Ex: Amphi A, Salle 201..." value={newSlot.room}
                  onChange={e => setNewSlot({...newSlot, room: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-violet-500 font-medium"/>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddSlotOpen(false)} className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold text-sm">Annuler</button>
                <button type="submit" disabled={isSubmittingSlot}
                  className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-8 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-violet-500/30">
                  {isSubmittingSlot ? 'Ajout...' : '+ Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL : Ajouter Examen ── */}
      {isAddExamOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-rose-50 to-white">
              <div>
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><ClipboardList size={17} className="text-rose-500"/> Nouvel Examen</h2>
                <p className="text-xs text-slate-400 mt-0.5">Niveau : {selLevel?.name}</p>
              </div>
              <button onClick={() => setIsAddExamOpen(false)} className="p-2 rounded-full bg-white border border-slate-100 text-slate-400 hover:text-slate-600 shadow-sm"><X size={16}/></button>
            </div>
            <form onSubmit={handleAddExam} className="p-6 overflow-y-auto space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Concerne</label>
                <div className="flex gap-2">
                  {[['level','Tout le niveau'],['section','Une section']].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setNewExam({...newExam, target: v})}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${newExam.target === v ? 'bg-rose-500 text-white border-transparent shadow-lg' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {newExam.target === 'section' && (
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Section *</label>
                  <select required value={newExam.section_id} onChange={e => setNewExam({...newExam, section_id: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-rose-500 font-medium">
                    <option value="">Section...</option>
                    {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Date *</label>
                <input type="date" required value={newExam.exam_date} onChange={e => setNewExam({...newExam, exam_date: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-rose-500 font-bold"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Début</label>
                  <input type="time" required value={newExam.start_time} onChange={e => setNewExam({...newExam, start_time: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-rose-500 font-bold"/>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Fin</label>
                  <input type="time" required value={newExam.end_time} onChange={e => setNewExam({...newExam, end_time: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-rose-500 font-bold"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Matière *</label>
                <select required value={newExam.module_id} onChange={e => setNewExam({...newExam, module_id: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-rose-500 font-medium">
                  <option value="">Sélectionner une matière...</option>
                  {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Salle / Amphi</label>
                <input type="text" placeholder="Ex: Amphi A..." value={newExam.room}
                  onChange={e => setNewExam({...newExam, room: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-rose-500 font-medium"/>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddExamOpen(false)} className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold text-sm">Annuler</button>
                <button type="submit" disabled={isSubmittingExam}
                  className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white px-8 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-rose-500/30">
                  {isSubmittingExam ? 'Ajout...' : '+ Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ── */}
      {confirmDelete.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmDelete.type === 'exam' ? 'bg-rose-100 text-rose-500' : 'bg-amber-100 text-amber-500'}`}>
              <AlertTriangle size={32}/>
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">Supprimer ?</h2>
            <p className="text-slate-500 mb-6 text-sm">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete({ isOpen: false, id: null, type: '' })}
                className="flex-1 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold text-sm">Annuler</button>
              <button onClick={handleDeleteConfirm}
                className="flex-1 py-3 text-white bg-rose-500 hover:bg-rose-600 rounded-2xl font-bold shadow-lg shadow-rose-500/30 text-sm">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
