import React, { useState, useEffect } from "react";
import { getMyUniversity, updateMyUniversity } from "../../api/services";
import {
  Building2, Globe, Calendar, Save, CheckCircle,
  AlertCircle, RefreshCw, Languages, ShieldAlert, Users, Sparkles
} from "lucide-react";

const Toggle = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer select-none">
    <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
    <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:bg-brand-600 transition-colors duration-300 relative">
      <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${checked ? "translate-x-6" : "translate-x-0"}`} />
    </div>
  </label>
);

const StatusBanner = ({ status }) => {
  if (!status) return null;
  const ok = status.type === "success";
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold border ${ok ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
      {ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
      {status.msg}
    </div>
  );
};

const Field = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
    {children}
    {hint && <p className="text-[10px] text-slate-400 font-medium">{hint}</p>}
  </div>
);

const inputCls = "w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all placeholder:text-slate-300";

export default function SettingsManager() {
  const [univName, setUnivName]         = useState("");
  const [subdomain, setSubdomain]       = useState("");
  const [academicYear, setAcademicYear] = useState(localStorage.getItem("settings_academic_year") || "2026-2027");
  const [semester, setSemester]         = useState(localStorage.getItem("settings_semester") || "Semestre 1");
  const [allowStudents, setAllowStudents] = useState(localStorage.getItem("settings_allow_student_reg") !== "false");
  const [allowTeachers, setAllowTeachers] = useState(localStorage.getItem("settings_allow_teacher_reg") !== "false");
  const [lang, setLang]                 = useState(localStorage.getItem("settings_lang") || "Français");

  const [tab, setTab]               = useState("general");
  const [loading, setLoading]       = useState(true);
  const [savingU, setSavingU]       = useState(false);
  const [savingP, setSavingP]       = useState(false);
  const [statusU, setStatusU]       = useState(null);
  const [statusP, setStatusP]       = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const r = await getMyUniversity();
      setUnivName(r.data.name || "");
      setSubdomain(r.data.subdomain || "");
    } catch (e) {
      setStatusU({ type: "error", msg: "Impossible de charger les données de l'université." });
    } finally { setLoading(false); }
  };

  const saveUniv = async (e) => {
    e.preventDefault(); setSavingU(true); setStatusU(null);
    try {
      await updateMyUniversity({ name: univName, subdomain });
      setStatusU({ type: "success", msg: "Modifications enregistrées avec succès !" });
    } catch (err) {
      setStatusU({ type: "error", msg: err.response?.data?.detail || "Erreur lors de la mise à jour." });
    } finally { setSavingU(false); }
  };

  const savePrefs = (e) => {
    e.preventDefault(); setSavingP(true); setStatusP(null);
    try {
      localStorage.setItem("settings_academic_year", academicYear);
      localStorage.setItem("settings_semester", semester);
      localStorage.setItem("settings_allow_student_reg", allowStudents.toString());
      localStorage.setItem("settings_allow_teacher_reg", allowTeachers.toString());
      localStorage.setItem("settings_lang", lang);
      setStatusP({ type: "success", msg: "Préférences sauvegardées !" });
    } catch { setStatusP({ type: "error", msg: "Erreur de sauvegarde." }); }
    finally { setSavingP(false); }
  };

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center" style={{ background: '#f4f5f9' }}>
      <RefreshCw className="animate-spin text-brand-500 mb-3" size={28} />
      <p className="text-slate-400 text-sm font-medium">Chargement…</p>
    </div>
  );

  const tabs = [
    { id: "general", label: "Établissement", icon: <Building2 size={14} /> },
    { id: "pedagogy", label: "Pédagogie", icon: <Calendar size={14} /> },
    { id: "access", label: "Inscriptions", icon: <Users size={14} /> },
  ];

  return (
    <div className="flex-1 min-h-screen flex flex-col overflow-hidden" style={{ background: '#f4f5f9' }}>

      {/* ── TOP HERO HEADER ── */}
      <div className="relative overflow-hidden shrink-0" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1e1b4b 100%)" }}>

        {/* Glow spots */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-[0.07]" style={{ background: "radial-gradient(circle, #818cf8, transparent)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-[0.06]" style={{ background: "radial-gradient(circle, #6366f1, transparent)", transform: "translate(-30%, 40%)" }} />

        {/* SVG Waves */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] pointer-events-none">
          <svg viewBox="0 0 1200 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-16">
            <path d="M0,40 C150,80 350,0 600,40 C850,80 1050,10 1200,40 L1200,80 L0,80 Z" fill="rgba(139,92,246,0.15)" />
            <path d="M0,55 C200,20 400,70 600,50 C800,30 1000,65 1200,45 L1200,80 L0,80 Z" fill="rgba(168,85,247,0.10)" />
            <path d="M0,65 C300,45 500,75 700,60 C900,45 1100,70 1200,60 L1200,80 L0,80 Z" fill="rgba(236,72,153,0.08)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-8 pt-10 pb-0">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-full px-3 py-1">
              <Sparkles size={10} className="text-indigo-300" />
              <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Administration</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-3 py-1">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              <span className="text-[10px] font-black text-emerald-300">{univName || "En ligne"}</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-black leading-tight mb-1"
            style={{ background: "linear-gradient(135deg, #fff 40%, #a5b4fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Paramètres du portail
          </h1>
          <p className="text-slate-400 text-sm mb-6">Configurez votre université, le calendrier académique et les droits d'accès.</p>

          {/* Tabs */}
          <div className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-t-xl transition-all duration-200 relative ${
                  tab === t.id
                    ? "bg-slate-50 text-slate-800 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <span className={tab === t.id ? "text-brand-600" : ""}>{t.icon}</span>
                {t.label}
                {tab === t.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">

          {/* ── TAB: General ── */}
          {tab === "general" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card: Identity */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                    <Building2 size={18} className="text-brand-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-sm">Identité de l'université</h3>
                    <p className="text-[10px] text-slate-400">Informations visibles par vos utilisateurs</p>
                  </div>
                </div>
                <form onSubmit={saveUniv} className="space-y-4">
                  <Field label="Nom officiel de l'établissement">
                    <input type="text" value={univName} onChange={e => setUnivName(e.target.value)}
                      placeholder="Ex: Université de Tlemcen" required className={inputCls} />
                  </Field>
                  <Field label="Sous-domaine d'accès" hint="Modifie l'URL d'accès au portail.">
                    <div className="relative flex items-center">
                      <Globe size={14} className="absolute left-3.5 text-slate-300 pointer-events-none" />
                      <input type="text" value={subdomain} onChange={e => setSubdomain(e.target.value.toLowerCase())}
                        placeholder="u-tlemcen" required
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-9 pr-28 text-sm font-medium text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all placeholder:text-slate-300" />
                      <span className="absolute right-3 text-[10px] font-black text-brand-600 bg-brand-50 border border-brand-100 px-2 py-1 rounded-lg">.uniora.dz</span>
                    </div>
                  </Field>
                  <StatusBanner status={statusU} />
                  <button type="submit" disabled={savingU}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all disabled:opacity-50">
                    {savingU ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                    {savingU ? "Enregistrement…" : "Enregistrer"}
                  </button>
                </form>
              </div>

              {/* Card: Info tip */}
              <div className="flex flex-col gap-5">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h4 className="text-xs font-black text-slate-700 mb-3">À propos du sous-domaine</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Le sous-domaine permet d'identifier votre établissement de manière unique sur la plateforme Uniora. Il est utilisé dans l'URL de connexion de vos étudiants et enseignants.
                  </p>
                  <div className="mt-4 bg-slate-50 rounded-xl border border-slate-100 p-3">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Exemple d'URL</p>
                    <p className="text-xs font-black text-brand-600">{subdomain || "votre-univ"}.uniora.dz</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-brand-50 to-indigo-50 rounded-2xl border border-brand-100 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-brand-600" />
                    <h4 className="text-xs font-black text-brand-800">Plateforme active</h4>
                  </div>
                  <p className="text-[11px] text-brand-600/80 leading-relaxed">
                    Votre portail est opérationnel. Toutes les modifications sont appliquées en temps réel.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Pedagogy ── */}
          {tab === "pedagogy" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Calendar size={18} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-sm">Calendrier académique</h3>
                    <p className="text-[10px] text-slate-400">Paramètres de l'année et du semestre actif</p>
                  </div>
                </div>
                <form onSubmit={savePrefs} className="space-y-4">
                  <Field label="Année académique active">
                    <select value={academicYear} onChange={e => setAcademicYear(e.target.value)} className={inputCls + " cursor-pointer"}>
                      <option value="2025-2026">2025-2026</option>
                      <option value="2026-2027">2026-2027</option>
                      <option value="2027-2028">2027-2028</option>
                    </select>
                  </Field>
                  <Field label="Semestre actif">
                    <select value={semester} onChange={e => setSemester(e.target.value)} className={inputCls + " cursor-pointer"}>
                      <option value="Semestre 1">Semestre 1</option>
                      <option value="Semestre 2">Semestre 2</option>
                    </select>
                  </Field>
                  <Field label="Langue de l'interface">
                    <div className="relative flex items-center">
                      <Languages size={14} className="absolute left-3.5 text-slate-300 pointer-events-none" />
                      <select value={lang} onChange={e => setLang(e.target.value)} className={inputCls + " pl-9 cursor-pointer"}>
                        <option value="Français">Français</option>
                        <option value="العربية">العربية (Arabe)</option>
                        <option value="English">English</option>
                      </select>
                    </div>
                  </Field>
                  <StatusBanner status={statusP} />
                  <button type="submit" disabled={savingP}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all disabled:opacity-50">
                    {savingP ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                    {savingP ? "Enregistrement…" : "Enregistrer la configuration"}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h4 className="text-xs font-black text-slate-700 mb-4">Période active</h4>
                <div className="space-y-3">
                  {[
                    { label: "Année", value: academicYear },
                    { label: "Semestre", value: semester },
                    { label: "Langue", value: lang },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-2.5 px-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                      <span className="text-xs font-black text-slate-700">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Access ── */}
          {tab === "access" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Users size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-sm">Droits d'inscription</h3>
                    <p className="text-[10px] text-slate-400">Contrôlez qui peut créer un compte</p>
                  </div>
                </div>

                <form onSubmit={savePrefs} className="space-y-4">
                  {/* Student toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-slate-700">Auto-inscription Étudiants</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Permettre l'inscription depuis le portail public</p>
                    </div>
                    <Toggle checked={allowStudents} onChange={() => setAllowStudents(!allowStudents)} />
                  </div>

                  {/* Teacher toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-slate-700">Auto-inscription Enseignants</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Permettre l'inscription depuis le portail public</p>
                    </div>
                    <Toggle checked={allowTeachers} onChange={() => setAllowTeachers(!allowTeachers)} />
                  </div>

                  <StatusBanner status={statusP} />

                  <button type="submit" disabled={savingP}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all disabled:opacity-50">
                    {savingP ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                    {savingP ? "Enregistrement…" : "Mettre à jour"}
                  </button>
                </form>
              </div>

              {/* Warning card */}
              <div className="flex flex-col gap-5">
                <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert size={16} className="text-amber-500" />
                    <h4 className="text-xs font-black text-amber-800">Recommandation de sécurité</h4>
                  </div>
                  <p className="text-[11px] text-amber-700/80 leading-relaxed">
                    Désactiver l'auto-inscription vous donne un contrôle total. Les comptes doivent être créés ou importés manuellement par vous.
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h4 className="text-xs font-black text-slate-700 mb-3">État actuel</h4>
                  <div className="space-y-2">
                    {[
                      { label: "Étudiants", active: allowStudents },
                      { label: "Enseignants", active: allowTeachers },
                    ].map(({ label, active }) => (
                      <div key={label} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-500">{label}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                          {active ? "Activé" : "Désactivé"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
