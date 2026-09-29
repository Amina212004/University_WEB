import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Clock, Calendar, Sparkles, BookOpen,
  Upload, CheckCircle2, AlertCircle, X, Download,
  Info, FileUp
} from 'lucide-react';
import { getTeacherExams, uploadExamFile } from '../../api/services';

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_FR   = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

/* ─── UploadModal ────────────────────────────────────────────────────────── */
function UploadModal({ exam, onClose, onUploaded }) {
  const [file, setFile]           = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');
  const inputRef                  = useRef();

  const ACCEPTED = '.pdf,.doc,.docx,.odt,.zip,.rar';

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const res = await uploadExamFile(exam.id, file);
      onUploaded(res.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Erreur lors de l\'upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
              <FileUp size={18} className="text-violet-600" />
              Uploader le sujet d&apos;examen
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium truncate max-w-xs">
              {exam.module?.name || `Module #${exam.module_id}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Drop zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
              ${file
                ? 'border-violet-400 bg-violet-50'
                : 'border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/40'}`}
          >
            {file ? (
              <div>
                <CheckCircle2 size={32} className="mx-auto mb-2 text-violet-600" />
                <p className="font-bold text-sm text-violet-700 break-all">{file.name}</p>
                <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} Ko</p>
              </div>
            ) : (
              <div>
                <Upload size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-sm text-slate-500">Glissez votre fichier ici</p>
                <p className="text-xs text-slate-400 mt-1">ou cliquez pour parcourir</p>
                <p className="text-[10px] text-slate-300 mt-3 font-medium uppercase tracking-wide">
                  PDF · DOC · DOCX · ODT · ZIP · RAR
                </p>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl px-4 py-3 border border-rose-100">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={!file || uploading}
              className="px-7 py-2.5 rounded-xl font-bold text-xs text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 transition-all shadow-md shadow-violet-400/25">
              {uploading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Upload en cours...
                </span>
              ) : 'Envoyer le sujet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── ExamCard ───────────────────────────────────────────────────────────── */
function ExamCard({ exam, onUpload }) {
  const d       = new Date(exam.exam_date + 'T00:00:00');
  const day     = d.getDate();
  const month   = MONTHS_FR[d.getMonth()];
  const dayName = DAYS_FR[d.getDay()] || '';
  const isPast  = d < new Date();
  const hasFile = !!exam.exam_file_url;

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-5 hover:shadow-md transition-all group ${isPast ? 'opacity-70' : ''}`}>
      {/* Date badge */}
      <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex flex-col items-center justify-center shadow-lg shadow-indigo-500/30">
        <span className="text-white/80 text-[10px] font-bold uppercase">{dayName.slice(0,3)}</span>
        <span className="text-white text-2xl font-black leading-none">{day}</span>
        <span className="text-white/80 text-[10px] font-bold">{month.slice(0,3)}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="bg-indigo-100 text-indigo-700 text-xs font-black px-2 py-0.5 rounded-full uppercase tracking-wide">Examen</span>
          {isPast && <span className="bg-slate-100 text-slate-400 text-[9px] font-bold px-2 py-0.5 rounded-full">Passé</span>}
          {hasFile ? (
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 size={10} /> Sujet envoyé
            </span>
          ) : (
            <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertCircle size={10} /> Sujet manquant
            </span>
          )}
        </div>

        <p className="font-black text-slate-900 text-base truncate">
          {exam.module?.name || `Module #${exam.module_id}`}
        </p>

        <div className="flex items-center gap-4 mt-1 flex-wrap">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Clock size={11} /> {exam.start_time?.slice(0,5)} – {exam.end_time?.slice(0,5)}
          </span>
          {exam.room && (
            <span className="text-xs text-slate-500">📍 {exam.room}</span>
          )}
          {exam.level && (
            <span className="text-xs text-slate-400 font-medium">Niveau : {exam.level.name}</span>
          )}
        </div>

        {/* Fichier uploadé */}
        {hasFile && (
          <div className="mt-2 flex items-center gap-2 bg-emerald-50 rounded-xl px-3 py-1.5 w-fit">
            <FileText size={12} className="text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-emerald-700 truncate max-w-[200px]">
              {exam.exam_file_name || 'Fichier joint'}
            </span>
            {exam.uploaded_by && (
              <span className="text-[10px] text-emerald-500 font-medium">
                par {exam.uploaded_by.first_name} {exam.uploaded_by.last_name}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action */}
      {!isPast && (
        <button
          onClick={() => onUpload(exam)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm
            ${hasFile
              ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              : 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-400/25'}`}
        >
          <Upload size={13} />
          {hasFile ? 'Remplacer' : 'Uploader'}
        </button>
      )}
    </div>
  );
}

/* ─── TeacherExams ────────────────────────────────────────────────────────── */
export default function TeacherExams() {
  const [exams, setExams]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [uploadTarget, setUploadTarget] = useState(null); // exam en cours d'upload

  const fetchExams = () => {
    setLoading(true);
    getTeacherExams()
      .then(r => setExams(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchExams(); }, []);

  const handleUploaded = (updatedExam) => {
    setExams(prev => prev.map(e => e.id === updatedExam.id ? updatedExam : e));
  };

  // Stats
  const total    = exams.length;
  const uploaded = exams.filter(e => e.exam_file_url).length;
  const pending  = exams.filter(e => !e.exam_file_url && new Date(e.exam_date + 'T00:00:00') >= new Date()).length;
  const upcoming = exams.filter(e => new Date(e.exam_date + 'T00:00:00') >= new Date()).length;

  // Group by month
  const byMonth = exams.reduce((acc, ex) => {
    const d   = new Date(ex.exam_date + 'T00:00:00');
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const lbl = `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
    if (!acc[key]) acc[key] = { label: lbl, exams: [] };
    acc[key].exams.push(ex);
    return acc;
  }, {});

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 md:px-10 py-5 sticky top-0 z-20 shadow-sm">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-violet-600">Espace Enseignant</span>
          <h1 className="text-xl font-black text-slate-800">Mes Examens</h1>
        </div>
      </div>

      <div className="px-6 md:px-10 py-6 space-y-6">

        {/* Bandeau info */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 flex items-start gap-3">
          <Info size={18} className="text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-indigo-800">Vos examens sont programmés par l&apos;administration</p>
            <p className="text-xs text-indigo-500 mt-0.5">
              Votre rôle est d&apos;uploader le fichier sujet avant la date de l&apos;examen.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: total, from: 'from-indigo-500', to: 'to-violet-600', icon: <FileText size={16}/> },
            { label: 'À venir', value: upcoming, from: 'from-sky-500', to: 'to-blue-600', icon: <Calendar size={16}/> },
            { label: 'Sujets envoyés', value: uploaded, from: 'from-emerald-500', to: 'to-green-600', icon: <CheckCircle2 size={16}/> },
            { label: 'Sujets manquants', value: pending, from: 'from-amber-500', to: 'to-orange-500', icon: <AlertCircle size={16}/> },
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

        {/* Contenu */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-violet-300 border-t-violet-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-400">Chargement...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-white rounded-[28px] border border-slate-100 p-12 text-center shadow-sm">
            <Sparkles size={36} className="mx-auto mb-3 text-slate-300 animate-pulse" />
            <p className="text-sm font-bold text-slate-500">Aucun examen programmé.</p>
            <p className="text-xs text-slate-400 mt-1">
              L&apos;administration n&apos;a pas encore programmé d&apos;examens pour vos modules.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.values(byMonth).map(({ label, exams: monthExams }) => (
              <div key={label}>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-sm font-black text-slate-700">{label}</h3>
                  <span className="text-xs text-slate-400 font-medium">{monthExams.length} examen(s)</span>
                </div>
                <div className="space-y-3">
                  {monthExams.map(ex => (
                    <ExamCard key={ex.id} exam={ex} onUpload={setUploadTarget} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal upload */}
      {uploadTarget && (
        <UploadModal
          exam={uploadTarget}
          onClose={() => setUploadTarget(null)}
          onUploaded={handleUploaded}
        />
      )}
    </div>
  );
}
