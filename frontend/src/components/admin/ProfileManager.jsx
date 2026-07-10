import React, { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateMyProfile, uploadAvatar } from "../../api/services";
import { Camera, User, Mail, Lock, CheckCircle, AlertCircle, Save, Eye, EyeOff } from "lucide-react";

export default function ProfileManager() {
  const { user, setUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [infoStatus, setInfoStatus] = useState(null);
  const [pwdStatus, setPwdStatus] = useState(null);
  const [avatarStatus, setAvatarStatus] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [loadingPwd, setLoadingPwd] = useState(false);
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const fileRef = useRef();

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setLoadingInfo(true); setInfoStatus(null);
    try {
      const res = await updateMyProfile({ first_name: firstName, last_name: lastName, email });
      if (setUser) setUser(res.data);
      setInfoStatus({ type: "success", msg: "Profil mis a jour avec succes !" });
    } catch (err) {
      setInfoStatus({ type: "error", msg: err.response?.data?.detail || "Erreur." });
    } finally { setLoadingInfo(false); }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault(); setPwdStatus(null);
    if (newPassword !== confirmPassword) return setPwdStatus({ type: "error", msg: "Les mots de passe ne correspondent pas." });
    if (newPassword.length < 8) return setPwdStatus({ type: "error", msg: "Minimum 8 caracteres." });
    setLoadingPwd(true);
    try {
      await updateMyProfile({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setPwdStatus({ type: "success", msg: "Mot de passe change !" });
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
      setAvatarStatus({ type: "success", msg: "Photo mise a jour !" });
    } catch (err) {
      setAvatarStatus({ type: "error", msg: err.response?.data?.detail || "Erreur upload." });
    } finally { setLoadingAvatar(false); }
  };

  const StatusBanner = ({ status }) => {
    if (!status) return null;
    const ok = status.type === "success";
    return (
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium mt-3 ${ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
        {ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
        {status.msg}
      </div>
    );
  };

  const initials = ((user?.first_name?.[0] || "") + (user?.last_name?.[0] || "")).toUpperCase();
  const roleLabel = { admin: "Administrateur", teacher: "Enseignant", student: "Etudiant" };

  const getStrength = (pwd) => {
    if (!pwd) return 0; let s = 0;
    if (pwd.length >= 8) s++;
    if (pwd.length >= 12) s++;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return s;
  };
  const sColors = ["bg-rose-400","bg-orange-400","bg-yellow-400","bg-emerald-400"];
  const sLabels = ["","Faible","Acceptable","Bien","Fort"];

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-slate-50">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Mon Profil</h2>
          <p className="text-slate-500 mt-1">Gerez vos informations personnelles et votre securite</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="relative group cursor-pointer" onClick={() => fileRef.current.click()}>
              {avatarPreview
                ? <img src={avatarPreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-brand-100 shadow-md" />
                : <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-700 to-brand-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-brand-100 shadow-md">{initials || <User size={32} />}</div>
              }
              <div className="absolute inset-0 rounded-full bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {loadingAvatar ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera size={22} className="text-white" />}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900">{user?.first_name} {user?.last_name}</h3>
              <p className="text-slate-500 text-sm mt-0.5">{user?.email}</p>
              <span className="mt-2 inline-block bg-brand-100 text-brand-700 text-xs font-bold px-3 py-1 rounded-full">{roleLabel[user?.role] || user?.role}</span>
              <p className="text-xs text-slate-400 mt-2">Cliquez sur la photo pour changer votre avatar (JPEG, PNG, WebP, max 2MB)</p>
              <StatusBanner status={avatarStatus} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center"><User size={16} className="text-brand-600" /></div>
            Informations personnelles
          </h3>
          <form onSubmit={handleInfoSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prenom</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-500 transition text-slate-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-500 transition text-slate-900" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-500 transition text-slate-900" />
            </div>
            <StatusBanner status={infoStatus} />
            <div className="flex justify-end pt-1">
              <button type="submit" disabled={loadingInfo} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2">
                <Save size={15} />{loadingInfo ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center"><Lock size={16} className="text-brand-600" /></div>
            Changer le mot de passe
          </h3>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe actuel</label>
              <div className="relative">
                <input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="........" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-12 outline-none focus:border-brand-500 transition text-slate-900" />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe</label>
              <div className="relative">
                <input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 8 caracteres" required minLength={8} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-12 outline-none focus:border-brand-500 transition text-slate-900" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showNew ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
              {newPassword && (
                <div className="mt-2">
                  <div className="flex gap-1">{[0,1,2,3].map(i => { const s = getStrength(newPassword); return <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < s ? sColors[s-1] : "bg-slate-200"}`} />; })}</div>
                  <p className="text-xs text-slate-400 mt-1">{sLabels[getStrength(newPassword)]}</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirmer le mot de passe</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="........" required className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 outline-none transition text-slate-900 ${confirmPassword && confirmPassword !== newPassword ? "border-rose-300" : "border-slate-200 focus:border-brand-500"}`} />
              {confirmPassword && confirmPassword !== newPassword && <p className="text-xs text-rose-500 mt-1">Les mots de passe ne correspondent pas.</p>}
            </div>
            <StatusBanner status={pwdStatus} />
            <div className="flex justify-end pt-1">
              <button type="submit" disabled={loadingPwd || Boolean(confirmPassword && confirmPassword !== newPassword)} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2">
                <Lock size={15} />{loadingPwd ? "Changement..." : "Changer le mot de passe"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
