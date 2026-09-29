import React, { useState, useEffect } from 'react';
import {
  FileText, Plus, X, Clock, Calendar, Trash2, AlertTriangle,
  CheckCircle2, AlertCircle, Upload, Download, BookOpen,
  Layers, FileClock, Eye
} from 'lucide-react';
import {
  getAdminExams, getUploadedExams, addExam, deleteExam, getAcademicTree
} from '../../api/services';

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_FR   = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function flattenModules(tree) {
  const mods = [];
  for (const fac of tree) {
    for (const dep of fac.departments || []) {
      for (const spec of dep.specialties || []) {
        for (const lvl of spec.levels || []) {
          for (const sem of lvl.semesters || []) {
            for (const mod of sem.modules || []) {
              mods.push({
                id:      mod.id,
                name:    mod.name,
                level:   lvl,
                semester: sem,
                specialty: spec,
              });
            }
          }
        }
      }
    }
  }
  return mods;
}

/* ─── ExamRow ────────────────────────────────────────────────────────────── */
function ExamRow({ exam, onDelete }) {
  const d       = new Date(exam.exam_date + 'T00:00:00');
  const day     = d.getDate();
  const month   = MONTHS_FR[d.getMonth()];
  const dayName = DAYS_FR[d.getDay()] || '';
  const isPast  = d < new Date();
  const hasFile = !!exam.exam_file_url;

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-5 group hover:shadow-md transition-all ${isPast ? 'opacity-70' : ''}`}>
      {/* Date badge */}
      <div className={`flex-shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center shadow-lg
        ${hasFile ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/30'
                  : 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-500/30'}`}
      >
        <span className="text-white/80 text-[10px] font-bold uppercase">{dayName.slice(0,3)}</span>
        <span className="text-white text-2xl font-black leading-none">{day}</span>
        <span className="text-white/80 text-[10px] font-bold">{month.slice(0,3)}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {hasFile ? (
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 size={10} /> Sujet reçu
            </span>
          ) : (
            <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertCircle size={10} /> En attente du sujet
            </span>
          )}
          {isPast && <span className="bg-slate-100 text-slate-400 text-[9px] font-bold px-2 py-0.5 rounded-full">Passé</span>}
        </div>

        <p className="font-black text-slate-900 text-base truncate">
          {exam.module?.name || `Module #${exam.module_id}`}
        </p>

        <div className="flex items-center gap-4 mt-1 flex-wrap">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Clock size={11}/> {exam.start_time?.slice(0,5)} – {exam.end_time?.slice(0,5)}
          </span>
          {exam.room && <span className="text-xs text-slate-500">📍 {exam.room}</span>}
          {exam.level && <span className="text-xs text-slate-400 font-medium">Niveau : {exam.level.name}</span>}
        </div>

        {/* Fichier joint */}
        {hasFile && (
          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-3 py-1.5">
              <FileText size={12} className="text-emerald-600 shrink-0" />
              <span className="text-xs font-bold text-emerald-700 truncate max-w-[200px]">
                {exam.exam_file_name || 'Fichier joint'}
              </span>
            </div>
            <a
              href={`http://localhost:8000${exam.exam_file_url}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-800 transition-colors"
            >
              <Download size={13}/> Télécharger
            </a>
            {exam.uploaded_by && (
              <span className="text-[11px] text-slate-400 font-medium">
                Uploadé par {exam.uploaded_by.first_name} {exam.uploaded_by.last_name}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(exam)}
        className="opacity-0 group-hover:opacity-100 p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all flex-shrink-0"
      >
        <Trash2 size={16}/>
      </button>
    </div>
  );
}

/* ─── ScheduleModal ──────────────────────────────────────────────────────── */
function ScheduleModal({ modules, onClose, onCreated }) {
  const [form, setForm] = useState({
    module_id: '', exam_date: '', start_time: '08:00', end_time: '10:00', room: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.module_id || !form.exam_date) return;
    setSubmitting(true);
    setError('');
    try {
      const mod = modules.find(m => m.id === parseInt(form.module_id));
      const res = await addExam({
        ...form,
        module_id: parseInt(form.module_id),
        level_id:  mod?.level?.id || null,
      });
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || "Erreur lors de la création.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100">
          <h2 className="text-lg font-black flex items-center gap-2 text-slate-800">
            <FileText size={18} className="text-rose-500" /> Programmer un examen
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={15}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Module</label>
            <select
              required
              value={form.module_id}
              onChange={e => setForm({...form, module_id: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-violet-500 transition-all"
            >
              <option value="">Sélectionner un module</option>
              {modules.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.level?.name || ''} ({m.specialty?.name || ''})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Date</label>
            <input
              required type="date"
              value={form.exam_date}
              onChange={e => setForm({...form, exam_date: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-violet-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Début</label>
              <input
                required type="time"
                value={form.start_time}
                onChange={e => setForm({...form, start_time: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-violet-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Fin</label>
              <input
                required type="time"
                value={form.end_time}
                onChange={e => setForm({...form, end_time: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-violet-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Salle (optionnel)</label>
            <input
              type="text"
              value={form.room}
              onChange={e => setForm({...form, room: e.target.value})}
              placeholder="Ex: Amphi A"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-violet-500 transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl px-4 py-3 border border-rose-100">
              <AlertTriangle size={14}/> {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={submitting}
              className="px-7 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 transition-all shadow-md shadow-rose-400/25">
              {submitting ? 'Création...' : 'Programmer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── ExamsManager ───────────────────────────────────────────────────────── */
export default function ExamsManager() {
  const [tab, setTab]             = useState('schedule');   // 'schedule' | 'uploaded'
  const [exams, setExams]         = useState([]);
  const [uploaded, setUploaded]   = useState([]);
  const [modules, setModules]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [confirmDel, setConfirmDel] = useState({ open: false, exam: null });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [examsRes, uploadedRes, treeRes] = await Promise.all([
        getAdminExams().catch(err => { console.error("Error loading admin exams:", err); return { data: [] }; }),
        getUploadedExams().catch(err => { console.error("Error loading uploaded exams:", err); return { data: [] }; }),
        getAcademicTree().catch(err => { console.error("Error loading academic tree:", err); return { data: [] }; }),
      ]);
      setExams(examsRes.data || []);
      setUploaded(uploadedRes.data || []);
      setModules(flattenModules(treeRes.data || []));
    } catch(e) {
      console.error("loadAll error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleCreated = (exam) => {
    setExams(prev => [...prev, exam]);
  };

  const handleDelete = async () => {
    if (!confirmDel.exam) return;
    try {
      await deleteExam(confirmDel.exam.id);
      setExams(prev => prev.filter(e => e.id !== confirmDel.exam.id));
      setUploaded(prev => prev.filter(e => e.id !== confirmDel.exam.id));
    } catch(e) { console.error(e); }
    setConfirmDel({ open: false, exam: null });
  };

  const totalExams    = exams.length;
  const receivedFiles = exams.filter(e => e.exam_file_url).length;
  const missingFiles  = exams.filter(e => !e.exam_file_url).length;
  const upcoming      = exams.filter(e => new Date(e.exam_date + 'T00:00:00') >= new Date()).length;

  const displayList = tab === 'schedule' ? exams : uploaded;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 md:px-10 py-5 sticky top-0 z-20 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Administration</span>
          <h1 className="text-xl font-black text-slate-800">Gestion des Examens</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-lg shadow-rose-500/30 transition-all"
        >
          <Plus size={15}/> Programmer un examen
        </button>
      </div>

      <div className="px-6 md:px-10 py-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: totalExams, from: 'from-rose-500', to: 'to-pink-500', icon: <FileText size={16}/> },
            { label: 'À venir', value: upcoming, from: 'from-sky-500', to: 'to-blue-600', icon: <Calendar size={16}/> },
            { label: 'Sujets reçus', value: receivedFiles, from: 'from-emerald-500', to: 'to-green-600', icon: <CheckCircle2 size={16}/> },
            { label: 'Sujets manquants', value: missingFiles, from: 'from-amber-500', to: 'to-orange-500', icon: <AlertCircle size={16}/> },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.from} ${s.to} flex items-center justify-center text-white shadow-sm`}>
                {s.icon}
              </div>
              <div>
                <p className="text-xl font-black text-slate-800">{s.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
          {[
            { key: 'schedule', label: 'Tous les examens', icon: <Layers size={14}/> },
            { key: 'uploaded', label: `Sujets reçus (${receivedFiles})`, icon: <FileClock size={14}/> },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all
                ${tab === t.key
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-rose-300 border-t-rose-600 rounded-full animate-spin mx-auto mb-3"/>
            <p className="text-xs font-bold text-slate-400">Chargement...</p>
          </div>
        ) : displayList.length === 0 ? (
          <div className="bg-white rounded-[28px] border border-slate-100 p-12 text-center shadow-sm">
            {tab === 'schedule' ? (
              <>
                <BookOpen size={36} className="mx-auto mb-3 text-slate-300"/>
                <p className="text-sm font-bold text-slate-500">Aucun examen programmé.</p>
                <p className="text-xs text-slate-400 mt-1">Cliquez sur "Programmer un examen" pour commencer.</p>
              </>
            ) : (
              <>
                <Upload size={36} className="mx-auto mb-3 text-slate-300"/>
                <p className="text-sm font-bold text-slate-500">Aucun sujet reçu pour le moment.</p>
                <p className="text-xs text-slate-400 mt-1">Les professeurs n&apos;ont pas encore uploadé leurs sujets.</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayList.map(ex => (
              <ExamRow key={ex.id} exam={ex} onDelete={(e) => setConfirmDel({ open: true, exam: e })} />
            ))}
          </div>
        )}
      </div>

      {/* Modal programmer */}
      {showModal && (
        <ScheduleModal
          modules={modules}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Confirm delete */}
      {confirmDel.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-sm border border-slate-100 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-rose-500"/>
            </div>
            <h3 className="text-base font-black text-slate-800 mb-1">Supprimer cet examen ?</h3>
            <p className="text-xs text-slate-500 mb-6">
              L&apos;examen pour <strong>{confirmDel.exam?.module?.name || 'ce module'}</strong> sera supprimé définitivement.
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setConfirmDel({ open: false, exam: null })}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
                Annuler
              </button>
              <button onClick={handleDelete}
                className="px-7 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-500 hover:bg-rose-600 transition-all shadow-md">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
