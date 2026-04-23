import { motion } from 'motion/react';
import { Stethoscope, Activity, Map, UserPlus } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const tabs = [
    { id: 'patients', label: 'Patients', icon: UserPlus },
    { id: 'diagnosis', label: 'Diagnostic', icon: Stethoscope },
    { id: 'vision', label: 'NutriScan', icon: Activity },
    { id: 'alerts', label: 'Alertes', icon: Map },
  ];

  return (
    <nav id="bottom-nav" className="fixed bottom-0 left-0 right-0 bg-slate-950/80 border-t border-slate-800 backdrop-blur-xl pb-safe z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => (
          <button
            id={`nav-tab-${tab.id}`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center w-full h-full transition-all ${
              activeTab === tab.id ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <tab.icon className={`w-5 h-5 transition-transform ${activeTab === tab.id ? 'scale-110' : ''}`} />
            <span className="text-[9px] mt-1.5 font-bold font-mono uppercase tracking-widest">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="nav-pill"
                className="absolute w-12 h-0.5 bg-blue-500 rounded-full bottom-0"
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
