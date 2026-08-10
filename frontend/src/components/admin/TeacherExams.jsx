import React, { useState, useEffect } from 'react';
import { FileText, Plus, X, Clock, Calendar, Trash2, Sparkles, AlertTriangle, BookOpen } from 'lucide-react';
import { getTeacherExams, getTeacherModules, addExam, deleteExam } from '../../api/services';

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function TeacherExams() {
  const [exams, setExams] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, name: '' });
  const [newExam, setNewExam] = useState({
    exam_date: '', start_time: '08:00', end_time: '10:00', room: '', module_id: ''
  });

  const fetchExams = () => {
    setLoading(true);
    getTeacherExams()
      .then(r => setExams(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchExams();
    getTeacherModules().then(r => setModules(r.data || [])).catch(console.error);
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newExam.module_id || !newExam.exam_date) return;
    setIsSubmitting(true);
    try {
      // Find level_id from the module
      const mod = modules.find(m => m.id === parseInt(newExam.module_id));
      await addExam({
        ...newExam,
        module_id: parseInt(newExam.module_id),
        level_id: mod?.level?.id || null,
      });
      setIsAddOpen(false);
      setNewExam({ exam_date: '', start_time: '08:00', end_time: '10:00', room: '', module_id: '' });
      fetchExams();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'ajout de l'examen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      await deleteExam(confirmDelete.id);
      fetchExams();
    } catch (err) {
      console.error(err);
    }
    setConfirmDelete({ isOpen: false, id: null, name: '' });
  };

  // Group by month
  const examsByMonth = exams.reduce((acc, ex) => {
    const d = new Date(ex.exam_date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
    if (!acc[key]) acc[key] = { label, exams: [] };
    acc[key].exams.push(ex);
    return acc;
  }, {});

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 md:px-10 py-5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#7c3aed]">Espace Enseignant</span>
          <h1 className="text-xl font-black text-slate-800">Mes Examens</h1>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          disabled={modules.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 rounded-xl shadow-lg shadow-rose-500/30 transition-all"
        >
          <Plus size={15} /> Programmer un examen
        </button>
      </div>

      <div className="px-6 md:px-10 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-sm"><FileText size={16} /></div>
            <div>
              <p className="text-xl font-black text-slate-800">{exams.length}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total examens</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-sm"><BookOpen size={16} /></div>
            <div>
              <p className="text-xl font-black text-slate-800">{modules.length}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Modules</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-sm"><Calendar size={16} /></div>
            <div>
              <p className="text-xl font-black text-slate-800">
                {exams.filter(e => new Date(e.exam_date) >= new Date()).length}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">À venir</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-rose-300 border-t-rose-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-400">Chargement...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-white rounded-[28px] border border-slate-100 p-12 text-center shadow-sm">
            <Sparkles size={36} className="mx-auto mb-3 text-slate-300 animate-pulse" />
            <p className="text-sm font-bold text-slate-500">Aucun examen programmé.</p>
            <p className="text-xs text-slate-400 mt-1">Cliquez sur "Programmer un examen" pour commencer.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.values(examsByMonth).map(({ label, exams: monthExams }) => (
              <div key={label}>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-sm font-black text-slate-700">{label}</h3>
                  <span className="text-xs text-slate-400 font-medium">{monthExams.length} examen(s)</span>
                </div>
                <div className="space-y-3">
                  {monthExams.map(ex => {
                    const d = new Date(ex.exam_date);
                    const day = d.getDate();
                    const month = MONTHS_FR[d.getMonth()];
                    const dayName = DAYS[d.getDay()] || '';
                    const isPast = d < new Date();

                    return (
                      <div key={ex.id} className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-5 group hover:shadow-md transition-all ${isPast ? 'opacity-60' : ''}`}>
                        {/* Date badge */}
                        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex flex-col items-center justify-center shadow-lg shadow-rose-500/30">
                          <span className="text-white/80 text-[10px] font-bold uppercase">{dayName.slice(0,3)}</span>
                          <span className="text-white text-2xl font-black leading-none">{day}</span>
                          <span className="text-white/80 text-[10px] font-bold">{month.slice(0,3)}</span>
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-rose-100 text-rose-700 text-xs font-black px-2 py-0.5 rounded-full uppercase tracking-wide">Examen</span>
                            {isPast && <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-full">Passé</span>}
                          </div>
                          <p className="font-black text-slate-900 text-base truncate">{ex.module?.name || `Module #${ex.module_id}`}</p>
                          <div className="flex items-center gap-4 mt-1 flex-wrap">
                            <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12} /> {ex.start_time?.slice(0,5)} – {ex.end_time?.slice(0,5)}</span>
                            {ex.room && <span className="text-xs text-slate-500">📍 {ex.room}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => setConfirmDelete({ isOpen: true, id: ex.id, name: ex.module?.name || 'cet examen' })}
                          className="opacity-0 group-hover:opacity-100 p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Exam Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100">
              <h2 className="text-lg font-black flex items-center gap-2 text-slate-800">
                <FileText size={18} className="text-rose-500" /> Programmer un examen
              </h2>
              <button onClick={() => setIsAddOpen(false)} className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Module</label>
                <select required value={newExam.module_id} onChange={e => setNewExam({...newExam, module_id: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-[#7c3aed] transition-all">
                  <option value="">Sélectionner un module</option>
                  {modules.map(m => <option key={m.id} value={m.id}>{m.name} — {m.level?.name || ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Date</label>
                <input required type="date" value={newExam.exam_date} onChange={e => setNewExam({...newExam, exam_date: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-[#7c3aed] transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Début</label>
                  <input required type="time" value={newExam.start_time} onChange={e => setNewExam({...newExam, start_time: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-[#7c3aed] transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Fin</label>
                  <input required type="time" value={newExam.end_time} onChange={e => setNewExam({...newExam, end_time: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-[#7c3aed] transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Salle (optionnel)</label>
                <input type="text" value={newExam.room} onChange={e => setNewExam({...newExam, room: e.target.value})} placeholder="Ex: Amphi A"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-[#7c3aed] transition-all" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">Annuler</button>
                <button type="submit" disabled={isSubmitting}
                  className="px-7 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 transition-all shadow-md shadow-rose-400/25">
                  {isSubmitting ? 'Ajout...' : 'Programmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-rose-500" />
            </div>
            <h3 className="text-base font-black text-slate-800 mb-1">Supprimer cet examen ?</h3>
            <p className="text-xs text-slate-500 mb-6">L'examen pour <strong>{confirmDelete.name}</strong> sera supprimé définitivement.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setConfirmDelete({ isOpen: false, id: null, name: '' })} className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">Annuler</button>
              <button onClick={handleDelete} className="px-7 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-500 hover:bg-rose-600 transition-all shadow-md">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
