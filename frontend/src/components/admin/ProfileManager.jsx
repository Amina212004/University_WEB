import React, { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateMyProfile, uploadAvatar } from "../../api/services";
import {
  Camera, User, Mail, Lock, CheckCircle, AlertCircle,
  Save, Eye, EyeOff, Shield, Sparkles, AtSign
} from "lucide-react";

export default function ProfileManager() {
  const { user, setUser } = useAuth();

  const [firstName, setFirstName]           = useState(user?.first_name || "");
  const [lastName, setLastName]             = useState(user?.last_name || "");
  const [email, setEmail]                   = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]       = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent]       = useState(false);
  const [showNew, setShowNew]               = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [infoStatus, setInfoStatus]         = useState(null);
  const [pwdStatus, setPwdStatus]           = useState(null);
  const [avatarStatus, setAvatarStatus]     = useState(null);
  const [avatarPreview, setAvatarPreview]   = useState(user?.avatar_url || null);
  const [loadingInfo, setLoadingInfo]       = useState(false);
  const [loadingPwd, setLoadingPwd]         = useState(false);
  const [loadingAvatar, setLoadingAvatar]   = useState(false);
  const fileRef = useRef();

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setLoadingInfo(true); setInfoStatus(null);
    try {
      const res = await updateMyProfile({ first_name: firstName, last_name: lastName, email });
      if (setUser) setUser(res.data);
      setInfoStatus({ type: "success", msg: "Profil mis à jour avec succès !" });
    } catch (err) {
      setInfoStatus({ type: "error", msg: err.response?.data?.detail || "Erreur." });
    } finally { setLoadingInfo(false); }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault(); setPwdStatus(null);
    if (newPassword !== confirmPassword) return setPwdStatus({ type: "error", msg: "Les mots de passe ne correspondent pas." });
    if (newPassword.length < 8) return setPwdStatus({ type: "error", msg: "Minimum 8 caractères." });
    setLoadingPwd(true);
    try {
      await updateMyProfile({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setPwdStatus({ type: "success", msg: "Mot de passe changé avec succès !" });
    } catch (err) {
      setPwdStatus({ type: "error", msg: err.response?.data?.detail || "Erreur." });
    } finally { setLoadingPwd(false); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setAvatarStatus(null);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
    setLoadingAvatar(true);
    try {
      const res = await uploadAvatar(file);
      if (setUser) setUser(res.data);
      setAvatarPreview(res.data.avatar_url);
      setAvatarStatus({ type: "success", msg: "Photo mise à jour !" });
    } catch (err) {
      setAvatarStatus({ type: "error", msg: err.response?.data?.detail || "Erreur upload." });
    } finally { setLoadingAvatar(false); }
  };

  /* ─── Helpers ─── */
  const initials = ((user?.first_name?.[0] || "") + (user?.last_name?.[0] || "")).toUpperCase();
  const roleLabel = { admin: "Administrateur", teacher: "Enseignant", student: "Étudiant" };
  const roleBadgeStyle = {
  admin:   { bg: "#e5e7eb", color: "#111827", border: "#d1d5db" },
  teacher: { bg: "#e5e7eb", color: "#111827", border: "#d1d5db" },
  student: { bg: "#e5e7eb", color: "#111827", border: "#d1d5db" },
}

  const getStrength = (pwd) => {
    if (!pwd) return 0; let s = 0;
    if (pwd.length >= 8) s++;
    if (pwd.length >= 12) s++;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return s;
  };
  const strength = getStrength(newPassword);
  const strengthData = [
    { color: "#f87171", label: "Très faible", width: "25%" },
    { color: "#fb923c", label: "Faible",      width: "50%" },
    { color: "#facc15", label: "Acceptable",  width: "75%" },
    { color: "#4ade80", label: "Fort",         width: "100%" },
  ];

  const StatusBanner = ({ status }) => {
    if (!status) return null;
    const ok = status.type === "success";
    return (
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold mt-3 border ${
        ok ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
      }`}>
        {ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
        {status.msg}
      </div>
    );
  };

  const InputField = ({ label, type = "text", value, onChange, placeholder, required, minLength, icon: Icon, rightSlot }) => (
    <div>
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            <Icon size={14} />
          </div>
        )}
        <input
          type={type} value={value} onChange={onChange}
          placeholder={placeholder} required={required} minLength={minLength}
          className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-400/10 transition-all ${Icon ? 'pl-10 pr-4' : 'px-4'} ${rightSlot ? 'pr-12' : ''}`}
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto min-h-screen relative" style={{ background: "#f4f5f9" }}>

      <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-8 pt-10 pb-16 space-y-5">
        {/* Simplified Hero Banner */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center gap-6">
          {/* Avatar */}
          <div className="relative group cursor-pointer shrink-0" onClick={() => fileRef.current.click()}>
            {avatarPreview
              ? <img src={avatarPreview} alt="Avatar" className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-200" />
              : <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black text-slate-600 bg-slate-100">
                  {initials || <User size={32} />}
                </div>
            }
            <div className="absolute inset-0 rounded-2xl bg-slate-900/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
              {loadingAvatar
                ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Camera size={22} className="text-white" />}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white shadow-sm" />
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* User info */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800 leading-tight">
              {user?.first_name} {user?.last_name}
            </h2>
            <p className="text-slate-500 text-sm font-medium mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[10px] font-black px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                <Sparkles size={9} className="inline mr-1 mb-0.5" />
                {roleLabel[user?.role] || user?.role}
              </span>
              {avatarStatus && (
                <span className={`text-[10px] font-black px-3 py-1.5 rounded-full inline-flex items-center gap-1 ${
                  avatarStatus.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}>
                  {avatarStatus.type === "success" ? <CheckCircle size={9} /> : <AlertCircle size={9} />}
                  {avatarStatus.msg}
                </span>
              )}
            </div>
          </div>
        </div>


        {/* ── Card: Informations personnelles ── */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
          {/* Card top accent */}
          <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #d1d5db, #d1d5db)" }} />

          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#f5f3ff" }}>
                <User size={16} style={{ color: "#7c3aed" }} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-sm">Informations personnelles</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Nom, prénom et adresse email</p>
              </div>
            </div>

            <form onSubmit={handleInfoSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  placeholder="ex: Amina" required icon={User} />
                <InputField label="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)}
                  placeholder="ex: Benali" required icon={User} />
              </div>
              <InputField label="Adresse Email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="ex: a.benali@univ.edu" required icon={AtSign} />
              <StatusBanner status={infoStatus} />
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button type="submit" disabled={loadingInfo}
                  className="flex items-center gap-2 text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-md shadow-brand-500/20 hover:opacity-90 disabled:opacity-50 transition-all"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
                  {loadingInfo
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Save size={13} />}
                  {loadingInfo ? "Enregistrement…" : "Enregistrer les modifications"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Card: Sécurité ── */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #d1d5db, #d1d5db)" }} />

          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#eef2ff" }}>
                <Shield size={16} style={{ color: "#5c4df1" }} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-sm">Sécurité du compte</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Changez votre mot de passe régulièrement</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Current password */}
              <InputField
                label="Mot de passe actuel" type={showCurrent ? "text" : "password"}
                value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Votre mot de passe actuel" required icon={Lock}
                rightSlot={
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                    className="text-slate-400 hover:text-slate-600 transition-colors">
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />

              {/* New password */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nouveau mot de passe</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none"><Lock size={14} /></div>
                  <input
                    type={showNew ? "text" : "password"} value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 caractères" required minLength={8}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-12 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-400/10 transition-all"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Strength bar */}
                {newPassword && (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex gap-1.5">
                      {[0,1,2,3].map(i => (
                        <div key={i} className="h-1.5 flex-1 rounded-full overflow-hidden bg-slate-100">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: i < strength ? "100%" : "0%", background: strengthData[strength-1]?.color || "transparent" }} />
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] font-bold" style={{ color: strengthData[strength-1]?.color || "#94a3b8" }}>
                      {strengthData[strength-1]?.label || ""}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Confirmer le mot de passe</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none"><Lock size={14} /></div>
                  <input
                    type={showConfirm ? "text" : "password"} value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Répétez le nouveau mot de passe" required
                    className={`w-full bg-slate-50 border rounded-xl py-3 pl-10 pr-12 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 transition-all ${
                      confirmPassword && confirmPassword !== newPassword
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-400/10"
                        : "border-slate-200 focus:border-violet-400 focus:ring-violet-400/10"
                    }`}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  {confirmPassword && confirmPassword === newPassword && (
                    <CheckCircle size={15} className="absolute right-10 text-emerald-500" />
                  )}
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-[10px] text-rose-500 font-bold mt-1.5 flex items-center gap-1">
                    <AlertCircle size={11} /> Les mots de passe ne correspondent pas.
                  </p>
                )}
              </div>

              <StatusBanner status={pwdStatus} />

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button type="submit"
                  disabled={loadingPwd || Boolean(confirmPassword && confirmPassword !== newPassword)}
                  className="flex items-center gap-2 text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-md hover:opacity-90 disabled:opacity-50 transition-all"
                  style={{ background: "linear-gradient(135deg, #5c4df1, #ec4899)", boxShadow: "0 4px 14px rgba(92,77,241,0.25)" }}>
                  {loadingPwd
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Shield size={13} />}
                  {loadingPwd ? "Changement en cours…" : "Mettre à jour le mot de passe"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Card: Conseils de sécurité ── */}
        <div className="rounded-[28px] border border-violet-100 p-5 flex items-start gap-4"
          style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #eef2ff 100%)" }}>
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm border border-violet-100 shrink-0">
            <Sparkles size={16} style={{ color: "#7c3aed" }} />
          </div>
          <div>
            <h4 className="font-black text-violet-900 text-xs mb-1">Conseils de sécurité</h4>
            <ul className="space-y-1">
              {[
                "Utilisez au moins 12 caractères avec des chiffres et symboles",
                "Ne réutilisez jamais un mot de passe déjà utilisé",
                "Changez votre mot de passe tous les 3 mois",
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[10px] font-semibold text-violet-700">
                  <CheckCircle size={10} className="mt-0.5 shrink-0 text-violet-500" /> {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
