import React, { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateMyProfile, uploadAvatar } from "../../api/services";
import {
  Camera, User, Mail, Lock, CheckCircle, AlertCircle,
  Save, Eye, EyeOff, Shield, Sparkles, AtSign, Calendar,
  GraduationCap, Building2, Check, KeyRound, UserCheck
} from "lucide-react";

/* ─── Role Configuration (Harmonized with Uniora Theme) ─── */
const ROLE_THEME = {
  admin: {
    label: "Administrateur",
    badgeBg: "bg-purple-100 text-brand-700 border-purple-200",
    gradient: "from-brand-600 to-accent-500",
    icon: Shield,
    roleTitle: "Espace Administration",
    accentBorder: "border-brand-500",
    accentLight: "bg-brand-50 text-brand-700",
  },
  teacher: {
    label: "Enseignant",
    badgeBg: "bg-indigo-100 text-indigo-700 border-indigo-200",
    gradient: "from-brand-600 to-indigo-600",
    icon: GraduationCap,
    roleTitle: "Corps Professoral",
    accentBorder: "border-indigo-500",
    accentLight: "bg-indigo-50 text-indigo-700",
  },
  student: {
    label: "Étudiant",
    badgeBg: "bg-violet-100 text-violet-700 border-violet-200",
    gradient: "from-brand-600 to-purple-500",
    icon: UserCheck,
    roleTitle: "Espace Étudiant",
    accentBorder: "border-brand-500",
    accentLight: "bg-violet-50 text-violet-700",
  },
};

/* ─── Password Strength Evaluator ─── */
const getStrength = (pwd) => {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};

const STRENGTH_LEVELS = [
  { label: "Très faible", color: "bg-rose-500", text: "text-rose-600", width: "w-1/4" },
  { label: "Moyen", color: "bg-amber-500", text: "text-amber-600", width: "w-2/4" },
  { label: "Bon", color: "bg-brand-500", text: "text-brand-600", width: "w-3/4" },
  { label: "Excellent 🔒", color: "bg-emerald-500", text: "text-emerald-600", width: "w-full" },
];

export default function ProfileManager() {
  const { user, setUser } = useAuth();

  const [firstName, setFirstName]             = useState(user?.first_name || "");
  const [lastName, setLastName]               = useState(user?.last_name || "");
  const [email, setEmail]                     = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);

  const [infoStatus, setInfoStatus]           = useState(null);
  const [pwdStatus, setPwdStatus]             = useState(null);
  const [avatarStatus, setAvatarStatus]       = useState(null);

  const [avatarPreview, setAvatarPreview]     = useState(user?.avatar_url || null);
  const [loadingInfo, setLoadingInfo]         = useState(false);
  const [loadingPwd, setLoadingPwd]           = useState(false);
  const [loadingAvatar, setLoadingAvatar]     = useState(false);

  const [activeTab, setActiveTab]             = useState("info");
  const fileInputRef = useRef(null);

  const roleConfig = ROLE_THEME[user?.role] || ROLE_THEME.student;
  const RoleIcon = roleConfig.icon;
  const initials = ((user?.first_name?.[0] || "") + (user?.last_name?.[0] || "")).toUpperCase() || "U";
  const pwdStrength = getStrength(newPassword);

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })
    : "Récemment";

  /* ─── Handlers ─── */
  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setLoadingInfo(true);
    setInfoStatus(null);
    try {
      const res = await updateMyProfile({ first_name: firstName, last_name: lastName, email });
      if (setUser) setUser(res.data);
      setInfoStatus({ type: "success", msg: "Vos informations ont été mises à jour avec succès !" });
    } catch (err) {
      setInfoStatus({ type: "error", msg: err.response?.data?.detail || "Impossible de mettre à jour le profil." });
    } finally {
      setLoadingInfo(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdStatus(null);
    if (newPassword !== confirmPassword) {
      return setPwdStatus({ type: "error", msg: "Les deux nouveaux mots de passe ne correspondent pas." });
    }
    if (newPassword.length < 8) {
      return setPwdStatus({ type: "error", msg: "Le mot de passe doit comporter au moins 8 caractères." });
    }
    setLoadingPwd(true);
    try {
      await updateMyProfile({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwdStatus({ type: "success", msg: "Votre mot de passe a été modifié avec succès !" });
    } catch (err) {
      setPwdStatus({ type: "error", msg: err.response?.data?.detail || "Erreur lors de la modification du mot de passe." });
    } finally {
      setLoadingPwd(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarStatus(null);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);

    setLoadingAvatar(true);
    try {
      const res = await uploadAvatar(file);
      if (setUser) setUser(res.data);
      setAvatarPreview(res.data.avatar_url);
      setAvatarStatus({ type: "success", msg: "Photo de profil mise à jour !" });
    } catch (err) {
      setAvatarStatus({ type: "error", msg: err.response?.data?.detail || "Échec de l'upload de la photo." });
    } finally {
      setLoadingAvatar(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto min-h-screen bg-[#f5f3ff] p-6 md:p-10 font-sans relative">
      {/* Background Decorative Ambient Circles (Brand Purple & Warm Accent) */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute top-60 left-10 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-4xl mx-auto relative z-10 space-y-8 animate-fade-in-up">

        {/* ── HEADER TITLE ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100/80 border border-brand-200 text-brand-700 font-bold text-xs uppercase tracking-wider mb-2">
              <Sparkles size={13} className="text-brand-600" />
              Mon Espace Personnel
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Profil Utilisateur
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Gérez vos données personnelles, votre avatar et vos préférences de sécurité.
            </p>
          </div>
        </div>

        {/* ── HERO PROFILE CARD (Modern Theme-Compliant Glassmorphism) ── */}
        <div className="relative rounded-3xl bg-white/90 backdrop-blur-xl border border-white/60 shadow-xl shadow-brand-950/5 overflow-hidden transition-all duration-300">
          {/* Top Banner Gradient (Uniora Purple to Warm Orange) */}
          <div className="h-32 bg-gradient-to-r from-brand-600 via-brand-700 to-accent-500 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_2px,transparent_2px)] [background-size:16px_16px]" />
            <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-white/10 rounded-full blur-xl" />
          </div>

          <div className="px-6 md:px-10 pb-8 pt-0 relative">
            <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 -mt-16 mb-6">
              
              {/* Avatar with Dual-Gradient Ring & Camera Overlay */}
              <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  title="Cliquez pour modifier la photo"
                >
                  {/* Glowing Animated Ring */}
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-brand-600 to-accent-500 opacity-80 group-hover:opacity-100 blur-[2px] transition duration-300 animate-spin-slow" />
                  
                  <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white bg-slate-100 shadow-md flex items-center justify-center">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Avatar" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white text-3xl font-black">
                        {initials}
                      </div>
                    )}

                    {/* Hover Camera Overlay */}
                    <div className="absolute inset-0 bg-brand-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white gap-1">
                      {loadingAvatar ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Camera size={22} />
                          <span className="text-[10px] font-bold">Changer</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Online Status Indicator */}
                  <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>

                {/* Identity & Badges */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                      {user?.first_name} {user?.last_name}
                    </h2>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black border shadow-xs ${roleConfig.badgeBg}`}>
                      <RoleIcon size={13} />
                      {roleConfig.label}
                    </span>
                  </div>

                  <p className="text-slate-500 text-xs font-semibold flex items-center justify-center sm:justify-start gap-1.5">
                    <Mail size={13} className="text-brand-500" />
                    {user?.email}
                  </p>
                </div>
              </div>

              {/* Action Button: Edit Avatar */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-700 font-bold text-xs rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-2 shrink-0"
              >
                <Camera size={15} />
                Changer la photo
              </button>
            </div>

            {/* Avatar Status Banner */}
            {avatarStatus && (
              <div className={`p-3 rounded-xl mb-6 text-xs font-bold flex items-center gap-2 ${
                avatarStatus.type === "success" 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}>
                {avatarStatus.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                {avatarStatus.msg}
              </div>
            )}

            {/* Quick Stat Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
              <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Statut</p>
                <p className="text-xs font-black text-emerald-600 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {user?.is_active !== false ? "Compte Actif" : "Inactif"}
                </p>
              </div>

              <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rôle</p>
                <p className="text-xs font-black text-brand-700 mt-0.5">
                  {roleConfig.roleTitle}
                </p>
              </div>

              <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Membre Depuis</p>
                <p className="text-xs font-black text-slate-700 mt-0.5 flex items-center gap-1">
                  <Calendar size={12} className="text-slate-400" />
                  {formattedDate}
                </p>
              </div>

              <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Plateforme</p>
                <p className="text-xs font-black text-slate-700 mt-0.5 flex items-center gap-1">
                  <Building2 size={12} className="text-brand-500" />
                  Uniora Écosystème
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── INTERACTIVE TAB NAVIGATION ── */}
        <div className="flex p-1 bg-white/70 backdrop-blur-md rounded-2xl border border-brand-100 shadow-sm max-w-md">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all ${
              activeTab === "info"
                ? "bg-brand-600 text-white shadow-md shadow-brand-600/25"
                : "text-slate-600 hover:text-brand-700 hover:bg-brand-50/50"
            }`}
          >
            <User size={15} />
            Informations Générales
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all ${
              activeTab === "security"
                ? "bg-brand-600 text-white shadow-md shadow-brand-600/25"
                : "text-slate-600 hover:text-brand-700 hover:bg-brand-50/50"
            }`}
          >
            <Lock size={15} />
            Sécurité & Mot de passe
          </button>
        </div>

        {/* ── TAB CONTENT ── */}
        {activeTab === "info" && (
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-brand-950/5 p-6 md:p-8 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                <User size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Informations Personnelles</h3>
                <p className="text-xs text-slate-500 font-medium">Modifiez votre nom, prénom et votre adresse email de contact.</p>
              </div>
            </div>

            <form onSubmit={handleInfoSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Prénom */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    Prénom
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Votre prénom"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                  </div>
                </div>

                {/* Nom */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    Nom de famille
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Votre nom"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Adresse Email
                </label>
                <div className="relative">
                  <AtSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
              </div>

              {/* Status feedback */}
              {infoStatus && (
                <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
                  infoStatus.type === "success" 
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}>
                  {infoStatus.type === "success" ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
                  <span>{infoStatus.msg}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loadingInfo}
                  className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-accent-500 hover:from-brand-700 hover:to-accent-600 text-white font-black text-xs rounded-xl shadow-lg shadow-brand-600/20 hover:shadow-brand-600/35 hover:scale-[1.01] transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loadingInfo ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {loadingInfo ? "Enregistrement..." : "Enregistrer les modifications"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── SECURITY TAB ── */}
        {activeTab === "security" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-brand-950/5 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-accent-500/10 text-accent-600 flex items-center justify-center font-bold">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Changer de Mot de Passe</h3>
                  <p className="text-xs text-slate-500 font-medium">Assurez la sécurité de votre compte en choisissant un mot de passe robuste.</p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    Mot de passe actuel
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showCurrent ? "text" : "password"}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showNew ? "text" : "password"}
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 8 caractères"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    {newPassword && (
                      <div className="mt-2.5 space-y-1">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${STRENGTH_LEVELS[pwdStrength - 1]?.color || "bg-slate-300"} ${STRENGTH_LEVELS[pwdStrength - 1]?.width || "w-1/12"}`}
                          />
                        </div>
                        <p className={`text-[11px] font-bold ${STRENGTH_LEVELS[pwdStrength - 1]?.text || "text-slate-400"}`}>
                          Sécurité : {STRENGTH_LEVELS[pwdStrength - 1]?.label || "Trop court"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                      Confirmer le mot de passe
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Répétez le nouveau mot de passe"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status feedback */}
                {pwdStatus && (
                  <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
                    pwdStatus.type === "success" 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}>
                    {pwdStatus.type === "success" ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
                    <span>{pwdStatus.msg}</span>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={loadingPwd}
                    className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-accent-500 hover:from-brand-700 hover:to-accent-600 text-white font-black text-xs rounded-xl shadow-lg shadow-brand-600/20 hover:shadow-brand-600/35 hover:scale-[1.01] transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loadingPwd ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    {loadingPwd ? "Modification..." : "Mettre à jour le mot de passe"}
                  </button>
                </div>
              </form>
            </div>

            {/* Security Recommendations Card */}
            <div className="bg-brand-50/80 border border-brand-200/60 rounded-3xl p-6">
              <h4 className="text-xs font-black text-brand-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Shield size={16} className="text-brand-600" />
                Conseils pour un mot de passe inviolable
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-brand-800">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-200/60 text-brand-700 flex items-center justify-center shrink-0">
                    <Check size={12} />
                  </span>
                  Au moins 8 caractères (12+ recommandé)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-200/60 text-brand-700 flex items-center justify-center shrink-0">
                    <Check size={12} />
                  </span>
                  Mélange de majuscules et de minuscules
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-200/60 text-brand-700 flex items-center justify-center shrink-0">
                    <Check size={12} />
                  </span>
                  Contient des chiffres (0-9)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-200/60 text-brand-700 flex items-center justify-center shrink-0">
                    <Check size={12} />
                  </span>
                  Contient des symboles spéciaux (!@#$%^&*)
                </li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
