import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Building, GraduationCap, MapPin, Phone, Mail, CheckCircle2 } from 'lucide-react';
import logo from '../assets/Logo.svg';

import universityImg from '../assets/university.jpg';
import studentsImg from '../assets/students.jpg';
import university32Img from '../assets/university32.jpg';

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const platformImages = [university32Img, studentsImg, universityImg];

  // Slideshow effect for the platform section
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % platformImages.length);
    }, 4000); // Change image every 4 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-white selection:bg-brand-500 selection:text-white overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/40 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:scale-105 transition-transform duration-300">
            <img src={logo} alt="Uniora Logo" className="h-16 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
          </Link>
          <div className="hidden md:flex items-center gap-8 bg-white/5 px-6 py-3 rounded-full border border-white/10 backdrop-blur-md">
            <a href="#about" className="text-slate-300 hover:text-white font-medium text-sm transition-colors">La Plateforme</a>
            <a href="#features" className="text-slate-300 hover:text-white font-medium text-sm transition-colors">Fonctionnalités</a>
            <a href="#contact" className="text-slate-300 hover:text-white font-medium text-sm transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-slate-300 hover:text-white font-bold text-sm transition-colors hidden sm:block">
              Connexion
            </Link>
            <Link to="/register" className="bg-white text-slate-900 hover:bg-brand-50 px-6 py-3 rounded-full font-bold text-sm shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all">
              Créer mon Université
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Full Bleed 3D Immersive Design (No icons) */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden perspective-2000">
        
        {/* Full Viewport 3D Background Image */}
        <div className="absolute inset-0 w-full h-full animate-tilt-3d-bg preserve-3d z-0">
          <img src={universityImg} alt="Université" className="absolute inset-0 w-full h-full object-cover scale-110" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent" />
          <div className="absolute inset-0 bg-brand-900/20 mix-blend-overlay" />
        </div>

        {/* Floating Glass Content Container */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col justify-center min-h-[60vh] transform translate-z-40">
          <div className="max-w-3xl animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/10 border border-white/20 text-brand-300 font-bold text-sm mb-8 backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.3)]">
              <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
              L'excellence universitaire sans limite
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[1.05] drop-shadow-2xl text-white">
              L'écosystème <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                parfait
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-200 mb-12 font-light leading-relaxed drop-shadow-md max-w-2xl">
              Immergez-vous dans une plateforme majestueuse. Connectez votre administration, vos professeurs et vos étudiants dans un espace numérique infini et ultra-performant.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Link to="/register" className="group flex items-center justify-between gap-6 w-full sm:w-auto bg-gradient-to-r from-brand-600 to-accent-600 p-2 pr-6 rounded-full font-bold text-lg hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(168,85,247,0.6)] border border-white/10">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-brand-600 shadow-inner">
                  <ArrowRight size={28} className="group-hover:translate-x-1 transition-transform" />
                </div>
                <span className="text-white">Ouvrir les portes</span>
              </Link>
            </div>
          </div>
        </div>

      </section>

      {/* About (La Plateforme) Section - Slideshow */}
      <section id="about" className="relative z-10 py-32 bg-slate-950/80 border-t border-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-brand-900/50 border border-brand-500/30 text-brand-300 font-bold text-sm mb-6">
                Pourquoi nous choisir ?
              </div>
              <h2 className="text-4xl lg:text-5xl font-black mb-8 leading-tight">Une synergie parfaite <br/><span className="text-white/50">pour votre établissement.</span></h2>
              <p className="text-lg text-slate-300 mb-10 font-light leading-relaxed">
                Notre mission est d'effacer la complexité administrative pour vous permettre de vous concentrer sur l'essentiel : la réussite académique. 
                Uniora rassemble des outils puissants dans une interface d'une simplicité absolue.
              </p>
              <div className="space-y-6">
                {[
                  "Adaptabilité totale à vos cursus et facultés",
                  "Mises à jour et nouveautés régulières gratuites",
                  "Espaces de travail collaboratifs en temps réel",
                  "Hébergement cloud souverain et sécurisé"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white/5 border border-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="text-brand-400" size={20} />
                    </div>
                    <span className="font-medium text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="order-1 lg:order-2 relative group perspective-1000 h-[600px]">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-600 to-accent-600 rounded-[2rem] blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-700 animate-tilt-3d" />
              <div className="relative w-full h-full rounded-[2rem] overflow-hidden border border-white/20 shadow-[0_30px_60px_rgba(0,0,0,0.6)] animate-tilt-3d preserve-3d bg-slate-900">
                
                {/* Image Slideshow */}
                {platformImages.map((img, idx) => (
                  <img 
                    key={idx}
                    src={img} 
                    alt={`Slideshow ${idx}`} 
                    className={`absolute inset-0 w-full h-full object-cover transform translate-z-10 transition-all duration-1000 ease-in-out mix-blend-screen
                      ${idx === currentImageIndex ? 'opacity-90 scale-100' : 'opacity-0 scale-105'}
                    `} 
                  />
                ))}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent pointer-events-none" />
                <div className="absolute bottom-8 left-8 transform translate-z-40">
                  <h3 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Campus Digital</h3>
                  <p className="text-slate-200 font-medium drop-shadow-md">Des infrastructures augmentées par la technologie.</p>
                  
                  {/* Slideshow Indicators */}
                  <div className="flex gap-2 mt-4">
                    {platformImages.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`h-1 rounded-full transition-all duration-500 ${idx === currentImageIndex ? 'w-8 bg-brand-400' : 'w-2 bg-white/30'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-6xl font-black mb-6">Tout l'écosystème <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-400">réuni</span></h2>
            <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">
              Une seule plateforme pour remplacer des dizaines de logiciels obsolètes. Uniora unifie l'expérience académique de A à Z.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BookOpen, color: 'from-blue-500 to-indigo-600', title: 'Pédagogie', desc: 'Gestion des modules, notes, rattrapages et emplois du temps automatisés.' },
              { icon: Users, color: 'from-brand-500 to-purple-600', title: 'Administration', desc: 'Gestion du personnel, annuaires, et communication officielle ciblée.' },
              { icon: GraduationCap, color: 'from-accent-500 to-rose-600', title: 'Scolarité', desc: 'Suivi individuel, inscriptions académiques et édition de documents officiels.' },
              { icon: Building, color: 'from-emerald-500 to-teal-600', title: 'Multi-Campus', desc: 'Gestion hiérarchisée des départements, instituts et facultés sans limite.' },
            ].map((feat, i) => (
              <div key={i} className="group bg-white/5 border border-white/5 backdrop-blur-sm p-8 rounded-3xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-2">
                <div className={`w-16 h-16 bg-gradient-to-br ${feat.color} rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feat.icon size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feat.title}</h3>
                <p className="text-slate-400 font-light leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative z-10 py-32 bg-slate-950 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[3rem] overflow-hidden flex flex-col lg:flex-row shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            
            <div className="flex-1 p-12 lg:p-20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/20 rounded-full blur-[80px]" />
              <h2 className="text-4xl font-black mb-4 relative z-10">Passez à l'action.</h2>
              <p className="text-slate-300 mb-12 text-lg font-light relative z-10">
                Nos équipes sont prêtes à vous aider à déployer Uniora au sein de votre établissement universitaire en un temps record.
              </p>
              
              <div className="space-y-8 relative z-10">
                <div className="flex items-center gap-6 group">
                  <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-brand-500/20 transition-colors">
                    <Phone className="text-brand-400" size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">Appelez-nous</p>
                    <p className="text-slate-400 font-light">+213 (0) 555 123 456</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 group">
                  <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-brand-500/20 transition-colors">
                    <Mail className="text-brand-400" size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">Email</p>
                    <p className="text-slate-400 font-light">contact@uniora.dz</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 group">
                  <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-brand-500/20 transition-colors">
                    <MapPin className="text-brand-400" size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">Siège Social</p>
                    <p className="text-slate-400 font-light">Technoparc, Alger, Algérie</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 bg-slate-900 p-12 lg:p-20">
              <h3 className="text-3xl font-bold mb-8">Laissez-nous un message</h3>
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-400">Nom complet</label>
                    <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-400">Nom de l'Université</label>
                    <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-400">Email professionnel</label>
                  <input type="email" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-400">Votre message</label>
                  <textarea rows={4} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-none" />
                </div>
                <button className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-xl transition-colors shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                  Envoyer ma demande
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-950 py-10 text-center border-t border-white/5">
        <img src={logo} alt="Uniora" className="h-8 mx-auto mb-6 opacity-50 grayscale" />
        <p className="text-slate-500 text-sm">© 2026 Uniora. Tous droits réservés.</p>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        .perspective-2000 { perspective: 2000px; }
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .translate-z-10 { transform: translateZ(20px); }
        .translate-z-40 { transform: translateZ(60px); }
        .translate-z-60 { transform: translateZ(100px); }
        
        @keyframes tilt-3d-bg {
          0% { transform: perspective(2000px) rotateX(2deg) rotateY(-2deg) scale(1.05); }
          50% { transform: perspective(2000px) rotateX(-2deg) rotateY(2deg) scale(1.05); }
          100% { transform: perspective(2000px) rotateX(2deg) rotateY(-2deg) scale(1.05); }
        }
        @keyframes tilt-3d {
          0% { transform: perspective(1000px) rotateX(5deg) rotateY(-5deg); }
          50% { transform: perspective(1000px) rotateX(-5deg) rotateY(5deg); }
          100% { transform: perspective(1000px) rotateX(5deg) rotateY(-5deg); }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(40px) translateZ(40px); }
          100% { opacity: 1; transform: translateY(0) translateZ(40px); }
        }
        
        .animate-tilt-3d-bg { animation: tilt-3d-bg 20s ease-in-out infinite; }
        .animate-tilt-3d { animation: tilt-3d 8s ease-in-out infinite; }
        .animate-fade-in-up { animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) both; }
      `}} />

    </div>
  );
}
