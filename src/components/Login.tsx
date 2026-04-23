import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { motion } from 'motion/react';
import { HeartPulse, LogIn } from 'lucide-react';

export default function Login() {
  const handleLogin = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(console.error);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0A0F1D] text-slate-200 selection:bg-blue-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.1)_0%,transparent_70%)] pointer-events-none" />
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm text-center space-y-10 relative"
      >
        <div className="inline-block bg-slate-900 p-5 rounded-[2rem] text-blue-500 shadow-2xl border border-slate-800 ring-4 ring-blue-500/10">
          <HeartPulse size={64} className="animate-pulse" />
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="bg-blue-600 px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-tighter">VITA</span>
            <span className="text-slate-500 font-mono text-[10px] uppercase tracking-widest font-bold">Connect v2026</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tighter text-white">VitaConnect</h1>
          <p className="text-slate-400 font-medium text-lg leading-snug px-4">
            Intelligence Artificielle & Triage de Proximité.
          </p>
        </div>

        <button
          onClick={handleLogin}
          className="w-full h-16 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-blue-900/40 hover:bg-blue-500 active:scale-95 transition-all text-xl"
        >
          <LogIn size={24} /> Accès Agent District
        </button>

        <div className="pt-8 border-t border-slate-800/50 flex justify-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
          <div className="text-[9px] font-bold uppercase tracking-widest text-blue-400">Vertex AI</div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-orange-400">Firebase</div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-green-400">Real-time</div>
        </div>
      </motion.div>
    </div>
  );
}
