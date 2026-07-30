import React, { useState, useEffect, useRef } from 'react';
import {
  getFaculties, getDepartments, getSpecialties, getLevels,
  getSemestersByLevel, getSemesterModules, getLevelSections,
  getSectionTimetable, addTimeSlot, deleteTimeSlot,
  getUsers, getExamsByLevel, addExam, deleteExam
} from '../../api/services';
import {
  Calendar, Plus, Trash2, Clock, Printer, ChevronDown,
  AlertTriangle, X, BookOpen, ClipboardList
} from 'lucide-react';

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi'];
const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu'];
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const TIME_SLOTS = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00'
];

const SESSION_STYLES = {
  cours: { bg: 'bg-gradient-to-br from-blue-500 to-blue-600', dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700', label: 'Cours' },
  td:    { bg: 'bg-gradient-to-br from-violet-500 to-violet-600', dot: 'bg-violet-500', badge: 'bg-violet-100 text-violet-700', label: 'TD' },
  tp:    { bg: 'bg-gradient-to-br from-amber-500 to-orange-500', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', label: 'TP' },
};

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h - 8) * 60 + m;
}

function SessionCard({ slot, onDelete, groups }) {
  const style = SESSION_STYLES[slot.session_type] || SESSION_STYLES.cours;
  const group = slot.group_id ? groups.find(g => g.id === slot.group_id) : null;
  const top = (timeToMinutes(slot.start_time?.slice(0,5)) / 30) * 64;
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
            <button onClick={() => onDelete(slot.id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-white/20 hover:bg-white/40 text-white transition-all">
              <Trash2 size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FilterBar ─────────────────────────────────────────────────────────────────
function FilterBar({ faculties, departments, specialties, levels, semesters, sections,
  selFac, selDep, selSpec, selLevel, selSemester, selSection,
  onFac, onDep, onSpec, onLevel, onSemester, onSection, showSection = true, showSemester = true }) {
  const filters = [
    { label: 'Faculté', val: selFac, onChange: onFac, opts: faculties, disabled: false },
    { label: 'Département', val: selDep, onChange: onDep, opts: departments, disabled: !selFac },
    { label: 'Spécialité', val: selSpec, onChange: onSpec, opts: specialties, disabled: !selDep },
    { label: 'Niveau', val: selLevel, onChange: onLevel, opts: levels, disabled: !selSpec, accent: !showSection },
    ...(showSemester ? [{ label: 'Semestre', val: selSemester, onChange: onSemester, opts: semesters, disabled: !selLevel, accent: !showSection }] : []),
    ...(showSection ? [{ label: 'Section', val: selSection, onChange: onSection, opts: sections, disabled: !selLevel, accent: true }] : []),
  ];
  return (
    <div className="no-print bg-white rounded-3xl border border-slate-100 shadow-sm p-5 mb-6">
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Sélectionner</p>
      <div className="flex flex-wrap gap-3">
        {filters.map(({ label, val, onChange, opts, disabled, accent }) => (
          <div key={label} className="relative">
            <select value={val} onChange={onChange} disabled={disabled}
              className={`appearance-none pl-4 pr-10 py-2.5 text-sm font-bold rounded-xl border outline-none transition-all
                ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                ${accent && val ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-500/30' : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'}
              `}>
              <option value="">{label}...</option>
              {opts.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${accent && val ? 'text-white' : 'text-slate-400'}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ExamCard ──────────────────────────────────────────────────────────────────
function ExamCard({ exam, onDelete, sections, levels }) {
  const d = new Date(exam.exam_date);
  const day = d.getDate();
  const month = MONTHS_FR[d.getMonth()];
  const year = d.getFullYear();
  const dayName = DAYS[d.getDay() === 0 ? 0 : d.getDay() <= 4 ? d.getDay() : null] || '';
  const targetName = exam.section?.name ? `Section ${exam.section.name}` : exam.level?.name ? `Niveau ${exam.level.name}` : '';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-5 group hover:shadow-md transition-all">
      {/* Date badge */}
      <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex flex-col items-center justify-center shadow-lg shadow-rose-500/30">
        <span className="text-white/80 text-[10px] font-bold uppercase">{dayName}</span>
        <span className="text-white text-2xl font-black leading-none">{day}</span>
        <span className="text-white/80 text-[10px] font-bold">{month.slice(0,3)}</span>
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-rose-100 text-rose-700 text-xs font-black px-2 py-0.5 rounded-full uppercase tracking-wide">Examen</span>
          {targetName && <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{targetName}</span>}
        </div>
        <p className="font-black text-slate-900 text-base truncate">{exam.module?.name || `Module #${exam.module_id}`}</p>
        <div className="flex items-center gap-4 mt-1 flex-wrap">
          <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12} /> {exam.start_time?.slice(0,5)} – {exam.end_time?.slice(0,5)}</span>
          {exam.room && <span className="text-xs text-slate-500">📍 {exam.room}</span>}
          <span className="text-xs text-slate-400">{day} {month} {year}</span>
        </div>
      </div>
      <button onClick={() => onDelete(exam.id)}
        className="opacity-0 group-hover:opacity-100 p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
        <Trash2 size={18} />
      </button>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function TimetableManager() {
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' | 'exams'

  // Shared navigation state
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [levels, setLevels] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [sections, setSections] = useState([]);
  const [selFac, setSelFac] = useState('');
  const [selDep, setSelDep] = useState('');
  const [selSpec, setSelSpec] = useState('');
  const [selLevel, setSelLevel] = useState('');
  const [selSemester, setSelSemester] = useState('');
  const [selSection, setSelSection] = useState('');

  // Schedule tab state
  const [timeslots, setTimeslots] = useState([]);
  const [modules, setModules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [isSubmittingSlot, setIsSubmittingSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({ day_of_week: 0, start_time: '08:00', end_time: '09:30', session_type: 'cours', room: '', module_id: '', teacher_id: '', group_id: '' });

  // Exams tab state
  const [exams, setExams] = useState([]);
  const [isAddExamOpen, setIsAddExamOpen] = useState(false);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);
  const [newExam, setNewExam] = useState({ exam_date: '', start_time: '09:00', end_time: '11:00', room: '', module_id: '', target: 'level', section_id: '', level_id: '' });

  // Delete confirmations
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, type: '' });

  const selectedSectionObj = sections.find(s => String(s.id) === String(selSection));
  const sectionGroups = selectedSectionObj?.groups || [];
  const selSectionName = selectedSectionObj?.name || '';
  const selSemesterName = semesters.find(s => String(s.id) === String(selSemester))?.name || '';
  const selLevelName = levels.find(l => String(l.id) === String(selLevel))?.name || '';

  useEffect(() => {
    getFaculties().then(r => setFaculties(r.data)).catch(() => {});
    getUsers('teacher').then(r => setTeachers(r.data)).catch(() => {});
  }, []);

  // ── Navigation handlers ──
  const handleFacChange = async (e) => {
    const v = e.target.value; setSelFac(v);
    setSelDep(''); setSelSpec(''); setSelLevel(''); setSelSemester(''); setSelSection('');
    setDepartments([]); setSpecialties([]); setLevels([]); setSemesters([]); setSections([]);
    setTimeslots([]); setExams([]);
    if (v) { const r = await getDepartments(v); setDepartments(r.data); }
  };
  const handleDepChange = async (e) => {
    const v = e.target.value; setSelDep(v);
    setSelSpec(''); setSelLevel(''); setSelSemester(''); setSelSection('');
    setSpecialties([]); setLevels([]); setSemesters([]); setSections([]);
    setTimeslots([]); setExams([]);
    if (v) { const r = await getSpecialties(v); setSpecialties(r.data); }
  };
  const handleSpecChange = async (e) => {
    const v = e.target.value; setSelSpec(v);
    setSelLevel(''); setSelSemester(''); setSelSection('');
    setLevels([]); setSemesters([]); setSections([]);
    setTimeslots([]); setExams([]);
    if (v) { const r = await getLevels(v); setLevels(r.data); }
  };
  const handleLevelChange = async (e) => {
    const v = e.target.value; setSelLevel(v);
    setSelSemester(''); setSelSection('');
    setSemesters([]); setSections([]);
    setTimeslots([]); setExams([]);
    if (v) {
      const [semR, secR] = await Promise.all([getSemestersByLevel(v), getLevelSections(v)]);
      setSemesters(semR.data);
      setSections(Array.isArray(secR) ? secR : secR.data || []);
      // Load exams for this level
      const examR = await getExamsByLevel(v);
      setExams(examR.data);
    }
  };
  const handleSemesterChange = async (e) => {
    const v = e.target.value; setSelSemester(v);
    if (v) { const r = await getSemesterModules(v); setModules(r.data); }
  };
  const handleSectionChange = async (e) => {
    const v = e.target.value; setSelSection(v); setTimeslots([]);
    if (v) { const r = await getSectionTimetable(v); setTimeslots(r.data); }
  };

  const fetchTimetable = async () => {
    if (selSection) { const r = await getSectionTimetable(selSection); setTimeslots(r.data); }
  };
  const fetchExams = async () => {
    if (selLevel) { const r = await getExamsByLevel(selLevel); setExams(r.data); }
  };

  // ── Add Timeslot ──
  const handleAddSlot = async (e) => {
    e.preventDefault(); setIsSubmittingSlot(true);
    try {
      await addTimeSlot({
        day_of_week: parseInt(newSlot.day_of_week),
        start_time: newSlot.start_time, end_time: newSlot.end_time,
        session_type: newSlot.session_type, room: newSlot.room || null,
        module_id: parseInt(newSlot.module_id), teacher_id: parseInt(newSlot.teacher_id),
        section_id: newSlot.session_type === 'cours' ? parseInt(selSection) : null,
        group_id: newSlot.session_type !== 'cours' ? parseInt(newSlot.group_id) : null,
      });
      await fetchTimetable();
      setIsAddSlotOpen(false);
      setNewSlot({ day_of_week: 0, start_time: '08:00', end_time: '09:30', session_type: 'cours', room: '', module_id: '', teacher_id: '', group_id: '' });
    } catch (err) { alert(err.response?.data?.detail || "Erreur lors de l'ajout"); }
    finally { setIsSubmittingSlot(false); }
  };

  // ── Add Exam ──
  const handleAddExam = async (e) => {
    e.preventDefault(); setIsSubmittingExam(true);
    try {
      await addExam({
        exam_date: newExam.exam_date,
        start_time: newExam.start_time, end_time: newExam.end_time,
        room: newExam.room || null,
        module_id: parseInt(newExam.module_id),
        level_id: newExam.target === 'level' ? parseInt(selLevel) : null,
        section_id: newExam.target === 'section' ? parseInt(newExam.section_id) : null,
      });
      await fetchExams();
      setIsAddExamOpen(false);
      setNewExam({ exam_date: '', start_time: '09:00', end_time: '11:00', room: '', module_id: '', target: 'level', section_id: '' });
    } catch (err) { alert(err.response?.data?.detail || "Erreur lors de l'ajout"); }
    finally { setIsSubmittingExam(false); }
  };

  // ── Delete ──
  const handleDeleteConfirm = async () => {
    try {
      if (confirmDelete.type === 'slot') {
        await deleteTimeSlot(confirmDelete.id);
        await fetchTimetable();
      } else {
        await deleteExam(confirmDelete.id);
        await fetchExams();
      }
    } catch {}
    setConfirmDelete({ isOpen: false, id: null, type: '' });
  };

  const slotsByDay = DAYS.map((_, i) => timeslots.filter(s => s.day_of_week === i));
  const GRID_HEIGHT = TIME_SLOTS.length * 64;
  const canShowSchedule = selSection && selSemester;
  const canShowExams = !!selLevel;

  // Group exams by month
  const examsByMonth = exams.reduce((acc, ex) => {
    const d = new Date(ex.exam_date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
    if (!acc[key]) acc[key] = { label, exams: [] };
    acc[key].exams.push(ex);
    return acc;
  }, {});

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

      <div className="flex-1 overflow-y-auto bg-slate-50 min-h-screen">
        {/* ── Sticky Header ── */}
        <div className="no-print bg-white border-b border-slate-100 px-6 md:px-10 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Calendar size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Planning Académique</h2>
              {(selSectionName || selLevelName) && (
                <p className="text-xs text-slate-400 mt-0.5">{selLevelName}{selSectionName ? ` · ${selSectionName}` : ''}{selSemesterName ? ` · ${selSemesterName}` : ''}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
              <Printer size={15} /> Imprimer
            </button>
            {activeTab === 'schedule' && canShowSchedule && (
              <button onClick={() => setIsAddSlotOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-lg shadow-brand-500/30 transition-all">
                <Plus size={15} /> Ajouter une séance
              </button>
            )}
            {activeTab === 'exams' && canShowExams && (
              <button onClick={() => setIsAddExamOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-lg shadow-rose-500/30 transition-all">
                <Plus size={15} /> Ajouter un examen
              </button>
            )}
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* ── Tabs ── */}
          <div className="no-print flex gap-2 mb-6 bg-white rounded-2xl p-1.5 border border-slate-100 shadow-sm w-fit">
            {[
              { key: 'schedule', icon: <BookOpen size={16} />, label: 'Emploi du Temps' },
              { key: 'exams',    icon: <ClipboardList size={16} />, label: 'Calendrier des Examens' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === tab.key
                    ? tab.key === 'exams' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-brand-600 text-white shadow-lg shadow-brand-500/30'
                    : 'text-slate-500 hover:text-slate-700'
                }`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* ══ SCHEDULE TAB ══════════════════════════════════════════════════════ */}
          {activeTab === 'schedule' && (
            <>
              <FilterBar
                faculties={faculties} departments={departments} specialties={specialties}
                levels={levels} semesters={semesters} sections={sections}
                selFac={selFac} selDep={selDep} selSpec={selSpec} selLevel={selLevel}
                selSemester={selSemester} selSection={selSection}
                onFac={handleFacChange} onDep={handleDepChange} onSpec={handleSpecChange}
                onLevel={handleLevelChange} onSemester={handleSemesterChange} onSection={handleSectionChange}
                showSection={true} showSemester={true}
              />

              {canShowSchedule && (
                <div className="no-print flex items-center gap-3 mb-5 flex-wrap">
                  {Object.entries(SESSION_STYLES).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 border border-slate-100 shadow-sm">
                      <div className={`w-2 h-2 rounded-full ${v.dot}`}></div>
                      <span className="text-xs font-bold text-slate-600">{v.label}</span>
                    </div>
                  ))}
                  <span className="text-xs text-slate-400 ml-1">{timeslots.length} séance(s)</span>
                </div>
              )}

              {!canShowSchedule ? (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-20 text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-5"><Calendar size={36} className="text-slate-300" /></div>
                  <h3 className="text-xl font-black text-slate-700 mb-2">Sélectionnez une section</h3>
                  <p className="text-slate-400 max-w-sm mx-auto font-medium">Choisissez la faculté, département, spécialité, niveau, semestre et section pour afficher la grille.</p>
                </div>
              ) : (
                <div id="print-area" className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="hidden print:block p-6 border-b text-center">
                    <h1 className="text-xl font-black">Emploi du Temps — {selSectionName} · {selSemesterName}</h1>
                  </div>
                  {/* Day Headers */}
                  <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: '80px repeat(5, 1fr)' }}>
                    <div className="p-4 border-r border-slate-100 flex items-center justify-center"><Clock size={16} className="text-slate-200" /></div>
                    {DAYS.map((day, i) => (
                      <div key={day} className={`p-4 text-center border-r border-slate-100 last:border-r-0 ${i === 0 ? 'bg-brand-50' : ''}`}>
                        <p className={`text-xs font-black uppercase tracking-wider ${i === 0 ? 'text-brand-600' : 'text-slate-400'}`}>
                          <span className="hidden md:inline">{day}</span>
                          <span className="md:hidden">{DAYS_SHORT[i]}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                  {/* Grid */}
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
                      {DAYS.map((day, di) => (
                        <div key={day} className={`relative border-r border-slate-100 last:border-r-0 ${di === 0 ? 'bg-brand-50/20' : ''}`} style={{ height: `${GRID_HEIGHT}px` }}>
                          {TIME_SLOTS.map((t, i) => (
                            <div key={t} className={`absolute w-full ${t.endsWith(':00') ? 'border-b border-slate-100' : 'border-b border-slate-50'}`} style={{ top: `${i * 64}px`, height: '64px' }} />
                          ))}
                          {slotsByDay[di].map(slot => (
                            <SessionCard key={slot.id} slot={slot}
                              onDelete={(id) => setConfirmDelete({ isOpen: true, id, type: 'slot' })}
                              groups={sectionGroups} />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ══ EXAMS TAB ════════════════════════════════════════════════════════ */}
          {activeTab === 'exams' && (
            <>
              <FilterBar
                faculties={faculties} departments={departments} specialties={specialties}
                levels={levels} semesters={semesters} sections={sections}
                selFac={selFac} selDep={selDep} selSpec={selSpec} selLevel={selLevel}
                selSemester={selSemester} selSection={selSection}
                onFac={handleFacChange} onDep={handleDepChange} onSpec={handleSpecChange}
                onLevel={handleLevelChange} onSemester={handleSemesterChange} onSection={handleSectionChange}
                showSection={false} showSemester={false}
              />

              {!canShowExams ? (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-20 text-center">
                  <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-5"><ClipboardList size={36} className="text-rose-200" /></div>
                  <h3 className="text-xl font-black text-slate-700 mb-2">Sélectionnez un niveau</h3>
                  <p className="text-slate-400 max-w-sm mx-auto font-medium">Choisissez jusqu'au niveau pour afficher et gérer le calendrier des examens.</p>
                </div>
              ) : (
                <div id="print-area">
                  <div className="hidden print:block mb-6 text-center border-b pb-4">
                    <h1 className="text-xl font-black">Calendrier des Examens — {selLevelName}</h1>
                  </div>
                  {exams.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-16 text-center">
                      <div className="w-16 h-16 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-4"><ClipboardList size={28} className="text-rose-200" /></div>
                      <p className="font-bold text-slate-500">Aucun examen programmé.</p>
                      <p className="text-sm text-slate-400 mt-1">Cliquez sur "Ajouter un examen" pour commencer.</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {Object.values(examsByMonth).map(({ label, exams: monthExams }) => (
                        <div key={label}>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                            <h3 className="font-black text-slate-700 text-lg">{label}</h3>
                            <div className="flex-1 h-px bg-slate-100"></div>
                            <span className="text-xs text-slate-400 font-medium">{monthExams.length} examen(s)</span>
                          </div>
                          <div className="space-y-3">
                            {monthExams.map(ex => (
                              <ExamCard key={ex.id} exam={ex}
                                onDelete={(id) => setConfirmDelete({ isOpen: true, id, type: 'exam' })}
                                sections={sections} levels={levels} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── ADD SLOT MODAL ── */}
      {isAddSlotOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-brand-50 to-white">
              <div><h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><BookOpen size={18} className="text-brand-500" /> Nouvelle Séance</h2>
                <p className="text-xs text-slate-400 mt-0.5">Section : {selSectionName} · {selSemesterName}</p></div>
              <button onClick={() => setIsAddSlotOpen(false)} className="p-2 rounded-full bg-white border border-slate-100 text-slate-400 hover:text-slate-600 shadow-sm"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddSlot} className="p-6 overflow-y-auto space-y-5">
              {/* Type */}
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-brand-500 font-medium">
                    <option value="">Sélectionnez un groupe...</option>
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
                <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Début</label>
                  <input type="time" required value={newSlot.start_time} onChange={e => setNewSlot({...newSlot, start_time: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-brand-500 font-bold" /></div>
                <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Fin</label>
                  <input type="time" required value={newSlot.end_time} onChange={e => setNewSlot({...newSlot, end_time: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-brand-500 font-bold" /></div>
              </div>
              <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Matière *</label>
                <select required value={newSlot.module_id} onChange={e => setNewSlot({...newSlot, module_id: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-brand-500 font-medium">
                  <option value="">Matière...</option>{modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select></div>
              <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Professeur *</label>
                <select required value={newSlot.teacher_id} onChange={e => setNewSlot({...newSlot, teacher_id: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-brand-500 font-medium">
                  <option value="">Professeur...</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                </select></div>
              <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Salle</label>
                <input type="text" placeholder="Ex: Amphi A, Salle 201..." value={newSlot.room} onChange={e => setNewSlot({...newSlot, room: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-brand-500 font-medium" /></div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddSlotOpen(false)} className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold text-sm">Annuler</button>
                <button type="submit" disabled={isSubmittingSlot} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-8 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-brand-500/30">
                  {isSubmittingSlot ? 'Ajout...' : '+ Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD EXAM MODAL ── */}
      {isAddExamOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-rose-50 to-white">
              <div><h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><ClipboardList size={18} className="text-rose-500" /> Nouvel Examen</h2>
                <p className="text-xs text-slate-400 mt-0.5">Niveau : {selLevelName}</p></div>
              <button onClick={() => setIsAddExamOpen(false)} className="p-2 rounded-full bg-white border border-slate-100 text-slate-400 hover:text-slate-600 shadow-sm"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddExam} className="p-6 overflow-y-auto space-y-5">
              {/* Target */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Concerne</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setNewExam({...newExam, target: 'level'})}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${newExam.target === 'level' ? 'bg-rose-500 text-white border-transparent shadow-lg' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    Tout le niveau
                  </button>
                  <button type="button" onClick={() => setNewExam({...newExam, target: 'section'})}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${newExam.target === 'section' ? 'bg-rose-500 text-white border-transparent shadow-lg' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    Une section
                  </button>
                </div>
              </div>
              {newExam.target === 'section' && (
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Section *</label>
                  <select required value={newExam.section_id} onChange={e => setNewExam({...newExam, section_id: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-rose-500 font-medium">
                    <option value="">Section...</option>{sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Date de l'examen *</label>
                <input type="date" required value={newExam.exam_date} onChange={e => setNewExam({...newExam, exam_date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-rose-500 font-bold" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Heure de début</label>
                  <input type="time" required value={newExam.start_time} onChange={e => setNewExam({...newExam, start_time: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-rose-500 font-bold" /></div>
                <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Heure de fin</label>
                  <input type="time" required value={newExam.end_time} onChange={e => setNewExam({...newExam, end_time: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-rose-500 font-bold" /></div>
              </div>
              <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Matière *</label>
                <select required value={newExam.module_id} onChange={e => setNewExam({...newExam, module_id: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-rose-500 font-medium">
                  <option value="">Matière...</option>{modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                {modules.length === 0 && selLevel && (
                  <p className="text-xs text-amber-600 mt-1 font-medium">⚠️ Sélectionnez un semestre dans l'onglet "Emploi du Temps" d'abord pour charger les modules.</p>
                )}
              </div>
              <div><label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Salle / Amphi</label>
                <input type="text" placeholder="Ex: Amphi A, Salle 201..." value={newExam.room} onChange={e => setNewExam({...newExam, room: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-rose-500 font-medium" /></div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddExamOpen(false)} className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold text-sm">Annuler</button>
                <button type="submit" disabled={isSubmittingExam} className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white px-8 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-rose-500/30">
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
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">Supprimer ?</h2>
            <p className="text-slate-500 mb-6 text-sm">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete({ isOpen: false, id: null, type: '' })} className="flex-1 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold text-sm">Annuler</button>
              <button onClick={handleDeleteConfirm} className="flex-1 py-3 text-white bg-rose-500 hover:bg-rose-600 rounded-2xl font-bold shadow-lg shadow-rose-500/30 text-sm">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
