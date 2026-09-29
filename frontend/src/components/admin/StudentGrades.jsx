import React, { useState, useEffect } from 'react';
import { 
  Award, BookOpen, GraduationCap, CheckCircle2, AlertTriangle, 
  Sparkles, Calendar, ArrowUpRight, FileText, BarChart2,
  TrendingUp, Download, Printer
} from 'lucide-react';
import { getStudentGrades } from '../../api/services';

const GRADE_CONFIG = {
  exam: { label: 'Examen Final (60%)', badge: 'bg-purple-100 text-purple-700 border-purple-200' },
  td:   { label: 'Travaux Dirigés (TD)', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  tp:   { label: 'Travaux Pratiques (TP)', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
};

const getMention = (score) => {
  if (score === undefined || score === null) return { label: 'En attente', color: 'text-slate-400', bg: 'bg-slate-100 text-slate-600' };
  if (score >= 16) return { label: 'Très Bien', color: 'text-emerald-600', bg: 'bg-emerald-50 text-emerald-700' };
  if (score >= 14) return { label: 'Bien',      color: 'text-blue-600', bg: 'bg-blue-50 text-blue-700' };
  if (score >= 12) return { label: 'Assez Bien',color: 'text-brand-600', bg: 'bg-brand-50 text-brand-700' };
  if (score >= 10) return { label: 'Passable',  color: 'text-amber-600', bg: 'bg-amber-50 text-amber-700' };
  return { label: 'Ajourné', color: 'text-rose-600', bg: 'bg-rose-50 text-rose-700' };
};

export default function StudentGrades() {
  const [gradesData, setGradesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getStudentGrades()
      .then(r => setGradesData(r.data || []))
      .catch(() => setError('Impossible de charger votre bulletin de notes.'))
      .finally(() => setLoading(false));
  }, []);

  // Compute overall average across all modules
  const moduleAverages = gradesData.map(m => {
    const exam = m.grades?.exam?.score;
    const td = m.grades?.td?.score;
    const tp = m.grades?.tp?.score;

    let totalWeight = 0;
    let sum = 0;

    if (exam !== undefined && exam !== null) {
      sum += exam * 0.6;
      totalWeight += 0.6;
    }

    if (td !== undefined && td !== null && tp !== undefined && tp !== null) {
      sum += ((td + tp) / 2) * 0.4;
      totalWeight += 0.4;
    } else if (td !== undefined && td !== null) {
      sum += td * 0.4;
      totalWeight += 0.4;
    } else if (tp !== undefined && tp !== null) {
      sum += tp * 0.4;
      totalWeight += 0.4;
    }

    const avg = totalWeight > 0 ? sum / totalWeight : null;
    return { ...m, calculatedAvg: avg };
  });

  const validAvgs = moduleAverages.map(m => m.calculatedAvg).filter(a => a !== null);
  const overallAvg = validAvgs.length > 0 
    ? (validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length).toFixed(2) 
    : null;

  const passedModules = moduleAverages.filter(m => m.calculatedAvg !== null && m.calculatedAvg >= 10).length;
  const isSemesterValidated = overallAvg !== null && Number(overallAvg) >= 10;

  return (
    <div className="flex-1 overflow-y-auto min-h-screen bg-[#f5f3ff] p-6 md:p-10 font-sans relative">
      
      {/* Background ambient orbs */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute top-80 left-10 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-5xl mx-auto relative z-10 space-y-8 animate-fade-in-up">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 font-extrabold text-xs uppercase tracking-wider mb-2">
              <Award size={13} className="text-brand-600" />
              Relevé de Notes & Résultats
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Mes Résultats Académiques
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Consultez vos notes d'examens, TD et TP publiées en direct par vos professeurs.
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-brand-200 text-brand-700 font-bold text-xs rounded-2xl shadow-xs hover:shadow transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <Printer size={15} />
            Imprimer mon Relevé
          </button>
        </div>

        {/* ── SUMMARY BULLETIN HERO CARD ── */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-brand-950/5 p-6 md:p-8 overflow-hidden relative">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* Moyenne Générale */}
            <div className="flex items-center gap-5 p-4 rounded-2xl bg-gradient-to-br from-brand-50 to-purple-50/50 border border-brand-100">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center text-white text-2xl font-black shadow-md shadow-brand-600/25">
                {overallAvg ? overallAvg : '—'}
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-brand-700 uppercase tracking-wider">Moyenne Générale</p>
                <p className="text-sm font-black text-slate-800 mt-0.5">
                  {overallAvg ? `${overallAvg} / 20.00` : 'En attente de notes'}
                </p>
                {overallAvg && (
                  <span className={`inline-block text-[11px] font-bold mt-1 ${getMention(Number(overallAvg)).color}`}>
                    Mention : {getMention(Number(overallAvg)).label}
                  </span>
                )}
              </div>
            </div>

            {/* Statut de Validation */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
                isSemesterValidated ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {isSemesterValidated ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Statut Académique</p>
                <p className={`text-sm font-black mt-0.5 ${isSemesterValidated ? 'text-emerald-700' : 'text-slate-800'}`}>
                  {overallAvg 
                    ? (isSemesterValidated ? 'Semestre Validé 🎉' : 'En Session de Rattrapage')
                    : 'Notes en cours de saisie'}
                </p>
              </div>
            </div>

            {/* Modules Validés */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                <BookOpen size={24} />
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Modules Validés</p>
                <p className="text-sm font-black text-slate-800 mt-0.5">
                  {passedModules} / {gradesData.length} modules
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ── DETAIL PAR MODULE ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <BookOpen size={18} className="text-brand-600" />
              Détail des Évaluations par Module
            </h3>
            <span className="text-xs font-bold text-slate-400">{moduleAverages.length} Modules inscrits</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {moduleAverages.map((m) => {
              const exam = m.grades?.exam;
              const td = m.grades?.td;
              const tp = m.grades?.tp;
              const modAvg = m.calculatedAvg;
              const modMention = getMention(modAvg);

              return (
                <div 
                  key={m.module_id}
                  className="bg-white/90 backdrop-blur-xl rounded-3xl border border-brand-100/70 shadow-lg shadow-brand-950/5 p-6 space-y-5 hover:shadow-xl transition-all"
                >
                  {/* Module Title & Avg */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-base font-black text-slate-800 leading-snug">
                        {m.module_name}
                      </h4>
                      <p className="text-xs font-semibold text-slate-400 mt-0.5">
                        {m.semester_name || 'Semestre en cours'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`px-3 py-1 rounded-xl text-sm font-black ${
                        modAvg !== null 
                          ? (modAvg >= 10 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {modAvg !== null ? `${modAvg.toFixed(2)}/20` : '—/20'}
                      </div>
                      <span className={`text-[10px] font-extrabold uppercase mt-1 block ${modMention.color}`}>
                        {modMention.label}
                      </span>
                    </div>
                  </div>

                  {/* Breakdown of Exam, TD, TP */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    
                    {/* Examen */}
                    <div className="p-2.5 rounded-2xl bg-purple-50/50 border border-purple-100">
                      <p className="text-[10px] font-black text-purple-700 uppercase">Examen</p>
                      <p className="text-base font-black text-purple-900 mt-1">
                        {exam?.score !== undefined ? `${Number(exam.score).toFixed(2)}` : '—'}
                      </p>
                      <span className="text-[9px] font-bold text-purple-400">Coeff 60%</span>
                    </div>

                    {/* TD */}
                    <div className="p-2.5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                      <p className="text-[10px] font-black text-emerald-700 uppercase">TD</p>
                      <p className="text-base font-black text-emerald-900 mt-1">
                        {td?.score !== undefined ? `${Number(td.score).toFixed(2)}` : '—'}
                      </p>
                      <span className="text-[9px] font-bold text-emerald-400">Coeff 20%</span>
                    </div>

                    {/* TP */}
                    <div className="p-2.5 rounded-2xl bg-amber-50/50 border border-amber-100">
                      <p className="text-[10px] font-black text-amber-700 uppercase">TP</p>
                      <p className="text-base font-black text-amber-900 mt-1">
                        {tp?.score !== undefined ? `${Number(tp.score).toFixed(2)}` : '—'}
                      </p>
                      <span className="text-[9px] font-bold text-amber-400">Coeff 20%</span>
                    </div>

                  </div>

                  {/* Progress bar */}
                  {modAvg !== null && (
                    <div className="space-y-1">
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            modAvg >= 10 ? 'bg-gradient-to-r from-brand-500 to-emerald-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min((modAvg / 20) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {moduleAverages.length === 0 && (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-100">
              <Award size={40} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">Aucune note disponible</p>
              <p className="text-xs text-slate-400 mt-1">
                Vos enseignants n'ont pas encore publié les notes pour ce semestre.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
