import { useState, useEffect } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Navigation from './components/Navigation';
import PatientList from './components/PatientList';
import DiagnosisTool from './components/DiagnosisTool';
import MalnutritionScanner from './components/MalnutritionScanner';
import EpidemicDashboard from './components/EpidemicDashboard';
import Login from './components/Login';
import { motion, AnimatePresence } from 'motion/react';
import { HeartPulse, LogOut } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('patients');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'patients': return <PatientList />;
      case 'diagnosis': return <DiagnosisTool />;
      case 'vision': return <MalnutritionScanner />;
      case 'alerts': return <EpidemicDashboard />;
      default: return <PatientList />;
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0F1D]">
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="text-blue-500">
        <HeartPulse size={48} />
      </motion.div>
    </div>
  );

  if (!user) return <Login />;

  return (
    <div id="vita-connect-app" className="min-h-screen bg-[#0A0F1D] font-sans text-slate-200 selection:bg-blue-500/30 scroll-smooth">
      <header className="bg-slate-900/50 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-lg mx-auto h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-tighter">
              VITA
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white font-sans">VitaConnect v2026</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
               <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest leading-none">Diagnostic</span>
               {isOnline ? (
                 <span className="text-[10px] text-green-400 font-mono flex items-center gap-1">
                   <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
                   Connecté
                 </span>
               ) : (
                 <span className="text-[10px] text-orange-400 font-mono flex items-center gap-1">
                   <div className="w-1 h-1 bg-orange-400 rounded-full" />
                   Mode Hors Ligne
                 </span>
               )}
            </div>
            <button onClick={() => auth.signOut()} className="text-slate-500 hover:text-red-400 transition-colors p-1.5 hover:bg-slate-800 rounded-lg">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.08)_0%,transparent_50%)]" />
    </div>
  );
}
