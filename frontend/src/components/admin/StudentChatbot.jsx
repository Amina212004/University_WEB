import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot, Send, Sparkles, FileText, BookOpen, RefreshCw, Copy, Check,
  Layers, GraduationCap, Brain, Zap, ThumbsUp, ThumbsDown,
  RotateCcw, Square, Menu, X, ChevronDown, Key, ExternalLink, ShieldCheck, Settings
} from 'lucide-react';
import { getStudentMaterials, getStudentModules, summarizeStudentCourse, chatStudentAi } from '../../api/services';

/* streaming text hook */
function useStreamingText(fullText, active) {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);
  const timer = useRef(null);

  useEffect(() => {
    if (!active || !fullText) { setDisplayed(fullText || ''); idx.current = fullText ? fullText.length : 0; return; }
    setDisplayed(''); idx.current = 0;
    const speed = fullText.length > 800 ? 4 : fullText.length > 300 ? 8 : 12;
    const chunk = fullText.length > 800 ? 8 : 3;
    const tick = () => {
      if (idx.current < fullText.length) {
        idx.current = Math.min(idx.current + chunk, fullText.length);
        setDisplayed(fullText.slice(0, idx.current));
        timer.current = setTimeout(tick, speed);
      }
    };
    timer.current = setTimeout(tick, 60);
    return () => clearTimeout(timer.current);
  }, [fullText, active]);

  const skip = useCallback(() => { clearTimeout(timer.current); setDisplayed(fullText); idx.current = fullText ? fullText.length : 0; }, [fullText]);
  const done = displayed.length >= (fullText || '').length;
  return { displayed, done, skip };
}

/* inline markdown renderer */
function Inline({ text }) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\$.*?\$)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="font-bold text-slate-900">{p.slice(2,-2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`')) return <code key={i} className="bg-slate-100 text-rose-600 px-1.5 py-0.5 rounded text-[11px] font-mono">{p.slice(1,-1)}</code>;
    if (p.startsWith('$') && p.endsWith('$')) return <span key={i} className="font-mono bg-violet-50 text-violet-700 px-1 rounded text-[11px] font-bold">{p.slice(1,-1)}</span>;
    return p;
  });
}

/* markdown block renderer */
function MarkdownBlock({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  let inCode = false, codeBuf = [], tableBuf = [], out = [];

  const flushTable = () => {
    if (tableBuf.length < 2) { tableBuf.forEach((l,i) => out.push(<p key={`tbf${out.length}${i}`} className="text-sm text-slate-700">{l}</p>)); tableBuf=[]; return; }
    const rows = tableBuf.map(r => r.trim().split('|').map(c=>c.trim()).filter((_,i,a)=>i>0&&i<a.length-1));
    const head = rows[0]||[], body = rows.slice(1).filter(r=>!r.every(c=>/^[:\-\s]+$/.test(c)));
    out.push(<div key={`t${out.length}`} className="my-3 overflow-x-auto rounded-xl border border-violet-100 shadow-sm"><table className="w-full text-left text-xs border-collapse"><thead className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold"><tr>{head.map((c,i)=><th key={i} className="px-4 py-2">{c.replace(/\*\*/g,'')}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 bg-white">{body.map((r,ri)=><tr key={ri} className={ri%2?'bg-violet-50/20':''}>{r.map((c,ci)=><td key={ci} className="px-4 py-2 text-slate-700">{c}</td>)}</tr>)}</tbody></table></div>);
    tableBuf=[];
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (line.startsWith('```')) {
      if (inCode) {
        out.push(<pre key={idx} className="my-3 p-4 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800 shadow-inner"><code>{codeBuf.join('\n')}</code></pre>);
        codeBuf = []; inCode = false;
      } else { inCode = true; codeBuf = []; }
      return;
    }
    if (inCode) { codeBuf.push(raw); return; }
    if (line.startsWith('|')) { tableBuf.push(line); return; }
    if (tableBuf.length) flushTable();
    if (line.startsWith('### ')) { out.push(<h3 key={idx} className="text-base font-black text-slate-900 mt-4 mb-2 flex items-center gap-2"><Sparkles size={14} className="text-violet-500 shrink-0"/><Inline text={line.slice(4)}/></h3>); return; }
    if (line.startsWith('#### ')) { out.push(<h4 key={idx} className="text-sm font-bold text-slate-800 mt-3 mb-1 text-violet-700"><Inline text={line.slice(5)}/></h4>); return; }
    if (line.startsWith('##### ')) { out.push(<h5 key={idx} className="text-xs font-bold text-slate-700 mt-2 mb-1"><Inline text={line.slice(6)}/></h5>); return; }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      out.push(<div key={idx} className="flex gap-2.5 items-start my-1 text-sm text-slate-700 leading-relaxed"><span className="w-1.5 h-1.5 bg-violet-500 rounded-full mt-2 shrink-0"/><span className="flex-1"><Inline text={line.slice(2)}/></span></div>);
      return;
    }
    if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\.\s/)[1];
      out.push(<div key={idx} className="flex gap-2.5 items-start my-1 text-sm text-slate-700 leading-relaxed"><span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{num}</span><span className="flex-1"><Inline text={line.replace(/^\d+\.\s/,'')}/></span></div>);
      return;
    }
    if (line.startsWith('> ')) { out.push(<blockquote key={idx} className="my-3 pl-4 border-l-4 border-violet-400 bg-violet-50/60 py-2.5 pr-4 rounded-r-xl text-xs text-slate-600 italic font-medium"><Inline text={line.slice(2)}/></blockquote>); return; }
    if (line.startsWith('---')) { out.push(<hr key={idx} className="my-3 border-slate-200"/>); return; }
    if (!line.trim()) { out.push(<div key={idx} className="h-2"/>); return; }
    out.push(<p key={idx} className="text-sm text-slate-700 leading-relaxed my-1"><Inline text={line}/></p>);
  });
  if (tableBuf.length) flushTable();
  return <div className="space-y-0.5">{out}</div>;
}

/* message bubble */
function Bubble({ msg, isLatest, onRegen }) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const { displayed, done, skip } = useStreamingText(msg.text, msg.sender==='bot' && isLatest && msg.streaming);

  const copy = () => { navigator.clipboard.writeText(msg.text); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  if (msg.sender !== 'bot') {
    return (
      <div className="flex justify-end mb-4 px-4 md:px-8">
        <div className="max-w-[75%] bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-2xl rounded-tr-sm px-5 py-3.5 shadow-lg shadow-violet-500/20">
          <p className="text-sm leading-relaxed font-medium whitespace-pre-wrap">{msg.text}</p>
          <span className="block text-[10px] text-white/50 text-right mt-2">{msg.timestamp}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 px-4 md:px-8 group">
      <div className="flex gap-3 items-start">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-violet-500/20 mt-0.5">
          <Bot size={18}/>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-black text-slate-700">Study Buddy</span>
            <span className="text-[9px] bg-gradient-to-r from-violet-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full font-bold">AI</span>
            <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-sm shadow-sm overflow-hidden">
            {msg.streaming && !done && (
              <div className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-50 to-transparent border-b border-violet-100/60">
                <div className="flex gap-1">
                  {[0,150,300].map(d=><span key={d} className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}/>)}
                </div>
                <span className="text-[10px] text-violet-600 font-bold">Study Buddy écrit...</span>
                <button onClick={skip} className="ml-auto text-[10px] text-slate-400 hover:text-rose-500 font-bold flex items-center gap-1">
                  <Square size={9}/> Arrêter
                </button>
              </div>
            )}
            <div className="px-5 py-4">
              <MarkdownBlock text={displayed}/>
              {msg.streaming && !done && <span className="inline-block w-0.5 h-4 bg-violet-500 ml-0.5 animate-pulse"/>}
            </div>
            {done && (
              <div className="flex items-center gap-1 px-4 pb-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={copy} className={`p-1.5 rounded-lg transition-all ${copied?'text-emerald-500 bg-emerald-50':'text-slate-400 hover:text-violet-600 hover:bg-violet-50'}`}>{copied?<Check size={14}/>:<Copy size={14}/>}</button>
                <button onClick={()=>setFeedback('up')} className={`p-1.5 rounded-lg transition-all ${feedback==='up'?'text-emerald-500 bg-emerald-50':'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'}`}><ThumbsUp size={14}/></button>
                <button onClick={()=>setFeedback('down')} className={`p-1.5 rounded-lg transition-all ${feedback==='down'?'text-rose-500 bg-rose-50':'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`}><ThumbsDown size={14}/></button>
                {onRegen && <button onClick={onRegen} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><RotateCcw size={14}/></button>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* typing indicator */
function Typing() {
  return (
    <div className="mb-6 px-4 md:px-8">
      <div className="flex gap-3 items-center">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center text-white shrink-0 shadow-md">
          <Bot size={18}/>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 shadow-sm flex items-center gap-2">
          <div className="flex gap-1.5">
            {[0,150,300].map(d=><span key={d} className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}/>)}
          </div>
          <span className="text-xs text-slate-400 font-medium ml-1">Study Buddy réfléchit...</span>
        </div>
      </div>
    </div>
  );
}

export default function StudentChatbot({ initialMaterialId = null }) {
  const [msgs, setMsgs] = useState([
    {
      id: 'init',
      sender: 'bot',
      streaming: false,
      text: "👋 Salut ! Je suis **Study Buddy**, ton compagnon d'études et ton tuteur IA.\n\nJe suis là pour t'expliquer des cours, répondre à n'importe quelle question, te faire réviser avec des quiz, ou tout simplement discuter librement si tu as besoin de décompresser !\n\nDe quoi aimerais-tu parler ?",
      timestamp: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [modules, setModules] = useState([]);
  const [selMat, setSelMat] = useState(initialMaterialId ? String(initialMaterialId) : '');
  const [selMod, setSelMod] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('study_buddy_api_key') || '');
  const [showSettings, setShowSettings] = useState(false);
  const [tempKey, setTempKey] = useState('');

  const endRef = useRef(null);
  const taRef = useRef(null);
  const lastMsg = useRef('');

  useEffect(() => {
    getStudentMaterials().then(r=>setMaterials(r.data||[])).catch(()=>{});
    getStudentModules().then(r=>setModules(r.data||[])).catch(()=>{});
  },[]);

  useEffect(() => {
    if(initialMaterialId) setSelMat(String(initialMaterialId));
  },[initialMaterialId]);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}); },[msgs,loading]);

  const addBot = (text, streaming=true) => {
    const id = Date.now()+Math.random();
    setMsgs(p=>[...p,{id,sender:'bot',streaming,text,timestamp:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}]);
    return id;
  };

  const send = async (textOverride=null) => {
    const msg = (textOverride||input).trim();
    if(!msg||loading) return;
    lastMsg.current = msg; setInput(''); setLoading(true);
    if(taRef.current){taRef.current.style.height='52px';}
    setMsgs(p=>[...p,{id:Date.now(),sender:'user',text:msg,timestamp:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}]);
    try{
      const currentApiKey = localStorage.getItem('study_buddy_api_key') || undefined;
      const r = await chatStudentAi({
        message: msg,
        material_id: selMat ? parseInt(selMat) : null,
        module_id: selMod ? parseInt(selMod) : null,
        history: msgs.slice(-12).map(m=>({sender:m.sender, text:m.text})),
        api_key: currentApiKey
      });
      addBot(r.data.reply, true);
    }catch{
      addBot("Oups, j'ai eu un souci de connexion 😕 Réessaie dans un instant !", true);
    }finally{
      setLoading(false);
    }
  };

  const regen = async () => {
    if(!lastMsg.current||loading) return; setLoading(true);
    try{
      const currentApiKey = localStorage.getItem('study_buddy_api_key') || undefined;
      const r = await chatStudentAi({
        message: lastMsg.current,
        material_id: selMat ? parseInt(selMat) : null,
        module_id: selMod ? parseInt(selMod) : null,
        history: msgs.slice(-10).map(m=>({sender:m.sender, text:m.text})),
        api_key: currentApiKey
      });
      addBot(r.data.reply, true);
    }catch{
      addBot("Impossible de régénérer, réessaie.", true);
    }finally{
      setLoading(false);
    }
  };

  const quickSummary = async (type) => {
    if(!selMat&&!selMod){addBot("⚠️ Sélectionne d'abord un cours dans le panneau de gauche !",true);return;}
    const labels={general:'Résumé Théorique',practical:'Fiche Calculs & TD',strategy:'Guide Stratégique',quiz:"Quiz d'Examen",key_concepts:'Formules Clés',simplified:'Explication Simple'};
    setMsgs(p=>[...p,{id:Date.now(),sender:'user',text:`Génère le **${labels[type]||type}** pour ce cours.`,timestamp:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}]);
    setLoading(true);
    try{const r=await summarizeStudentCourse({material_id:selMat?parseInt(selMat):null,module_id:selMod?parseInt(selMod):null,summary_type:type});addBot(r.data.summary,true);}
    catch{addBot("❌ Erreur lors de la génération. Réessaie !",true);}finally{setLoading(false);}
  };

  const clear = ()=>{setMsgs([{id:'w'+Date.now(),sender:'bot',streaming:false,text:"Nouvelle conversation ! 🎉 De quoi veux-tu parler ?",timestamp:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}]);lastMsg.current='';};

  const saveApiKey = () => {
    const clean = tempKey.trim();
    setApiKey(clean);
    if(clean) {
      localStorage.setItem('study_buddy_api_key', clean);
    } else {
      localStorage.removeItem('study_buddy_api_key');
    }
    setShowSettings(false);
  };

  const selectedMat = materials.find(m=>String(m.id)===String(selMat));
  const selectedMod = modules.find(m=>String(m.id)===String(selMod));

  const QUICK_ACTIONS = [
    {type:'general',icon:'📚',label:'Résumé Théorique'},{type:'practical',icon:'🔢',label:'Calculs & TD'},
    {type:'strategy',icon:'⚖️',label:'Guide Stratégique'},{type:'quiz',icon:'✅',label:"Quiz d'Examen"},
    {type:'key_concepts',icon:'💡',label:'Formules Clés'},{type:'simplified',icon:'🔥',label:'Explication Simple'},
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">

      {/* SIDEBAR */}
      <aside className={`${sidebarOpen?'w-72':'w-0'} transition-all duration-300 bg-white border-r border-slate-100 flex flex-col overflow-hidden shrink-0 shadow-sm`}>
        <div className="p-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/25"><GraduationCap size={20}/></div>
            <div>
              <h2 className="text-sm font-black text-slate-800">Study Buddy</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
                <span className="text-[10px] text-emerald-600 font-bold">IA Générative Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1"><FileText size={10} className="text-violet-500"/> Document</label>
            <select value={selMat} onChange={e=>{setSelMat(e.target.value);if(e.target.value){const m=materials.find(x=>String(x.id)===String(e.target.value));if(m)setSelMod(String(m.module_id));}}} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] font-bold text-slate-700 outline-none focus:border-violet-500 transition-all">
              <option value="">Aucun document</option>
              {materials.map(m=><option key={m.id} value={m.id}>{m.title} ({m.module_name})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1"><Layers size={10} className="text-indigo-500"/> Module</label>
            <select value={selMod} onChange={e=>{setSelMod(e.target.value);setSelMat('');}} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] font-bold text-slate-700 outline-none focus:border-violet-500 transition-all">
              <option value="">Tous les modules</option>
              {modules.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          {/* AI KEY BADGE IN SIDEBAR */}
          <div className="p-3 bg-gradient-to-br from-violet-50 to-indigo-50/50 rounded-2xl border border-violet-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black text-violet-800 flex items-center gap-1">
                <Sparkles size={11} className="text-violet-600"/> Modèle IA
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black ${apiKey ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                {apiKey ? 'Actif' : 'Local'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight mb-2">
              {apiKey ? 'Connecté à Gemini AI : réponses 100% dynamiques et naturelles.' : 'Ajoutez une clé Gemini gratuite pour discuter comme ChatGPT.'}
            </p>
            <button
              onClick={() => { setTempKey(apiKey); setShowSettings(true); }}
              className="w-full py-1.5 px-2.5 bg-white hover:bg-violet-100 text-violet-700 text-[10px] font-bold rounded-xl border border-violet-200 transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Key size={11}/> {apiKey ? 'Modifier la clé IA' : 'Activer Gemini (Gratuit)'}
            </button>
          </div>

          <hr className="border-slate-100"/>
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1"><Zap size={10} className="text-amber-500"/> Génération rapide</label>
            <div className="space-y-1">
              {QUICK_ACTIONS.map(({type,icon,label})=>(
                <button key={type} onClick={()=>quickSummary(type)} disabled={loading} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-[11px] font-bold text-slate-600 hover:bg-violet-50 hover:text-violet-700 transition-all group disabled:opacity-40">
                  <span className="text-base">{icon}</span><span className="flex-1">{label}</span><span className="opacity-0 group-hover:opacity-100 text-violet-400 transition-opacity">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 shrink-0">
          <button onClick={clear} className="w-full flex items-center justify-center gap-2 py-2.5 text-[11px] font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
            <RefreshCw size={12}/> Nouvelle conversation
          </button>
        </div>
      </aside>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* HEADER */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center gap-3 shadow-sm z-10 shrink-0">
          <button onClick={()=>setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all"><Menu size={18}/></button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow"><Brain size={16}/></div>
            <div>
              <h1 className="text-sm font-black text-slate-800 leading-none">Study Buddy</h1>
              <p className="text-[10px] text-slate-400 font-medium">Assistant & Ami d'études • Toujours à l'écoute</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {(selectedMat||selectedMod) && (
              <div className="flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-xl px-3 py-1.5">
                <BookOpen size={12} className="text-violet-500"/>
                <span className="text-[10px] font-bold text-violet-700 max-w-[150px] truncate">{selectedMat?.title||selectedMod?.name}</span>
                <button onClick={()=>{setSelMat('');setSelMod('');}} className="text-violet-300 hover:text-rose-400 transition-colors"><X size={12}/></button>
              </div>
            )}

            {/* AI CONFIG BUTTON */}
            <button
              onClick={() => { setTempKey(apiKey); setShowSettings(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
            >
              <Sparkles size={13} className="text-emerald-500" />
              <span className="hidden sm:inline">IA Générative Active</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </button>
          </div>
        </header>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto py-6">
          {msgs.map((m,i)=>(
            <Bubble key={m.id} msg={m} isLatest={i===msgs.length-1}
              onRegen={i===msgs.length-1&&m.sender==='bot'?regen:null}/>
          ))}
          {loading && <Typing/>}
          <div ref={endRef} className="h-4"/>
        </div>

        {/* SUGGESTIONS (only at start) */}
        {msgs.length<=2&&!loading&&(
          <div className="px-4 md:px-8 pb-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                {icon:'📚',text:'Résume ce cours',fn:()=>send('Fais-moi un résumé complet du cours')},
                {icon:'✅',text:"Quiz d'examen",fn:()=>send("Génère un quiz d'examen complet")},
                {icon:'💬',text:'Comment tu vas ?',fn:()=>send('Comment tu vas ?')},
                {icon:'🧮',text:'Formules maths',fn:()=>send('Donne-moi toutes les formules importantes')},
              ].map((s,i)=>(
                <button key={i} onClick={s.fn} className="flex items-center gap-2 bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50 rounded-2xl px-3 py-3 text-left transition-all group shadow-xs">
                  <span className="text-lg">{s.icon}</span><span className="text-[11px] font-bold text-slate-600 group-hover:text-violet-700">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* INPUT */}
        <div className="bg-white/80 backdrop-blur-md border-t border-slate-100 p-4 shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-end gap-2 bg-white border border-slate-200 rounded-2xl shadow-sm focus-within:border-violet-400 focus-within:shadow-md focus-within:shadow-violet-100/50 transition-all">
              <textarea
                ref={taRef}
                value={input}
                onChange={e=>{setInput(e.target.value);e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,160)+'px';}}
                onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}
                placeholder="Discute avec Study Buddy... (Shift+Entrée pour nouvelle ligne)"
                rows={1}
                style={{height:'52px'}}
                className="flex-1 resize-none bg-transparent px-5 py-4 text-sm text-slate-800 placeholder-slate-400 outline-none leading-relaxed font-medium max-h-40"
              />
              <div className="flex items-center gap-1 p-2 shrink-0">
                <button onClick={()=>send()} disabled={loading||!input.trim()} className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 hover:opacity-90 active:scale-95 text-white flex items-center justify-center shadow-md shadow-violet-500/30 disabled:opacity-30 transition-all">
                  <Send size={16}/>
                </button>
              </div>
            </div>
            <p className="text-center text-[10px] text-slate-400 mt-2 font-medium">
              Study Buddy comprend la fatigue, les émotions et répond avec précision à tes cours
            </p>
          </div>
        </div>
      </div>

      {/* MODAL CONFIGURATION IA (GEMINI / GROQ / OPENAI) */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
                  <Sparkles size={20}/>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Intelligence Artificielle</h3>
                  <p className="text-xs text-slate-400">Google Gemini & Modèles IA en Direct</p>
                </div>
              </div>
              <button onClick={()=>setShowSettings(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={18}/>
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3.5 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl space-y-2">
                <p className="font-bold text-violet-900 flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-violet-600"/> Pourquoi ajouter une clé IA ?
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Avec une clé d'API, Study Buddy devient un <strong>vrai modèle LLM comme ChatGPT ou Gemini</strong> : il peut converser avec vous sur n'importe quel sujet sans aucune limite, créer des exemples sur-mesure et réagir avec une totale humanité !
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Clé d'API (Google Gemini / Groq / OpenAI) :
                </label>
                <input
                  type="password"
                  value={tempKey}
                  onChange={e=>setTempKey(e.target.value)}
                  placeholder="Collez votre clé ici (ex: AIzaSy... ou gsk_...)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono text-slate-800 outline-none focus:border-violet-500 transition-all"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <p className="font-bold text-slate-700">🎁 Obtenir une clé 100% GRATUITE en 30 secondes :</p>
                <div className="flex flex-col gap-1.5">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl border border-violet-200 bg-violet-50/50 hover:bg-violet-100/70 text-violet-700 font-bold transition-all"
                  >
                    <span className="flex items-center gap-1.5">⚡ Obtenir ma clé Google Gemini (Gratuit)</span>
                    <ExternalLink size={14}/>
                  </a>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition-all"
                  >
                    <span className="flex items-center gap-1.5">🚀 Ou obtenir une clé Groq (Llama-3-70B Gratuit)</span>
                    <ExternalLink size={14}/>
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              {apiKey && (
                <button
                  onClick={() => { setTempKey(''); setApiKey(''); localStorage.removeItem('study_buddy_api_key'); setShowSettings(false); }}
                  className="px-4 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-all mr-auto"
                >
                  Supprimer la clé
                </button>
              )}
              <button
                onClick={()=>setShowSettings(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
              >
                Annuler
              </button>
              <button
                onClick={saveApiKey}
                className="px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white rounded-xl shadow-md shadow-violet-500/25 transition-all"
              >
                Enregistrer la clé
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
