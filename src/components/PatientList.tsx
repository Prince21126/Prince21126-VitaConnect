import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, User, Search, MapPin, ChevronRight, X, Clock, Activity, Stethoscope } from 'lucide-react';

interface Patient {
  id: string;
  fullName: string;
  age: number;
  village: string;
}

interface PatientListProps {
  onStartDiagnostic: (patientId: string, village: string, type: 'NLP' | 'VISION') => void;
}

export default function PatientList({ onStartDiagnostic }: PatientListProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [newPatient, setNewPatient] = useState({ fullName: '', age: '', village: '' });

  useEffect(() => {
    const q = query(collection(db, 'patients'), orderBy('fullName'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPatients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedPatient) {
      setHistory([]);
      return;
    }
    const q = query(
      collection(db, 'diagnostics'), 
      where('patientId', '==', selectedPatient.id),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [selectedPatient]);

  const handleAddPatient = async () => {
    if (!newPatient.fullName || !newPatient.age || !newPatient.village) return;
    await addDoc(collection(db, 'patients'), {
      ...newPatient,
      age: Number(newPatient.age),
      createdAt: serverTimestamp()
    });
    setNewPatient({ fullName: '', age: '', village: '' });
    setShowAdd(false);
  };

  const filtered = patients.filter(p => p.fullName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div id="patient-management" className="p-4 pb-24 max-w-lg mx-auto space-y-6">
      <header className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-xl font-bold text-white font-sans">Patients</h2>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Registre District v2.4</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
        >
          <UserPlus size={20} />
        </button>
      </header>

      <div className="relative px-2">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
        <input 
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 pl-12 pr-4 bg-slate-900/50 border border-slate-800 rounded-xl focus:border-blue-500 outline-none transition-all shadow-inner text-sm font-medium"
        />
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-blue-900/10 rounded-2xl border border-blue-900/20 p-5 space-y-4 mx-2"
          >
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Nouveau Dossier</h3>
            <div className="grid gap-3">
              <input 
                placeholder="Nom complet" 
                value={newPatient.fullName}
                onChange={e => setNewPatient({...newPatient, fullName: e.target.value})}
                className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 text-sm focus:border-blue-500 outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input 
                  placeholder="Âge" 
                  type="number"
                  value={newPatient.age}
                  onChange={e => setNewPatient({...newPatient, age: e.target.value})}
                  className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 text-sm focus:border-blue-500 outline-none"
                />
                <input 
                  placeholder="Village" 
                  value={newPatient.village}
                  onChange={e => setNewPatient({...newPatient, village: e.target.value})}
                  className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <button 
                onClick={handleAddPatient}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg mt-2 text-sm shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-transform"
              >
                Enregistrer le Patient
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3 px-2">
        {filtered.map((patient) => (
          <motion.div
            id={`patient-card-${patient.id}`}
            key={patient.id}
            onClick={() => setSelectedPatient(patient)}
            className="bento-card flex items-center justify-between group active:bg-slate-800/80 transition-colors py-4 cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 border border-slate-700">
                <User size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-100 text-sm">{patient.fullName}</h4>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono font-bold uppercase tracking-tighter">
                  <span>{patient.age} ans</span>
                  <span className="w-1 h-1 bg-slate-700 rounded-full" />
                  <MapPin size={10} className="text-blue-500" />
                  <span>{patient.village}</span>
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-700 group-hover:text-blue-500 transition-colors" />
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
        {selectedPatient && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-0 bg-[#0A0F1D] z-50 overflow-y-auto pb-safe"
          >
            <div className="max-w-lg mx-auto">
              <nav className="p-4 flex items-center gap-4 sticky top-0 bg-[#0A0F1D]/80 backdrop-blur-md z-10 border-b border-slate-800">
                <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                  <X size={24} />
                </button>
                <h2 className="font-bold text-lg">Détails du Patient</h2>
              </nav>

              <div className="p-6 space-y-8">
                {/* Patient Profile Header */}
                <div className="flex flex-col items-center text-center space-y-4">
                   <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-2xl shadow-blue-500/10">
                      <User size={40} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-white">{selectedPatient.fullName}</h3>
                      <div className="flex items-center justify-center gap-3 text-xs text-slate-500 font-mono font-bold uppercase tracking-widest mt-1">
                        <span>{selectedPatient.age} ans</span>
                        <span className="w-1 h-1 bg-slate-800 rounded-full" />
                        <span className="text-blue-400">{selectedPatient.village}</span>
                      </div>
                   </div>
                </div>

                {/* Patient Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                   <div className="bento-card p-4 space-y-1">
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">Visites</p>
                      <p className="text-xl font-mono font-bold">{history.length}</p>
                   </div>
                   <div className="bento-card p-4 space-y-1">
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">Dernière Analyse</p>
                      <p className="text-xs font-mono font-bold text-blue-400">
                        {history[0] ? new Date(history[0].timestamp?.toDate()).toLocaleDateString() : 'N/A'}
                      </p>
                   </div>
                </div>

                {/* Actions de Diagnostic */}
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => onStartDiagnostic(selectedPatient.id, selectedPatient.village, 'NLP')}
                    className="flex flex-col items-center justify-center p-4 bg-emerald-600/10 border border-emerald-600/20 rounded-2xl hover:bg-emerald-600/20 transition-all group"
                  >
                    <Stethoscope size={24} className="text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Diagnostic IA</span>
                  </button>
                  <button 
                    onClick={() => onStartDiagnostic(selectedPatient.id, selectedPatient.village, 'VISION')}
                    className="flex flex-col items-center justify-center p-4 bg-blue-600/10 border border-blue-600/20 rounded-2xl hover:bg-blue-600/20 transition-all group"
                  >
                    <Activity size={24} className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">NutriScan</span>
                  </button>
                </div>

                {/* Medical History */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                    <Clock size={12} /> Historique des Diagnostics
                  </h4>
                  
                  <div className="space-y-3">
                    {history.length === 0 ? (
                      <div className="text-center py-10 opacity-20 border-2 border-dashed border-slate-800 rounded-2xl">
                         <Activity size={32} className="mx-auto mb-2" />
                         <p className="text-[10px] font-bold uppercase tracking-widest">Aucun historique</p>
                      </div>
                    ) : (
                      history.map((item) => (
                        <div key={item.id} className="bento-card p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                               {item.type === 'VISION' ? <Activity size={14} className="text-blue-500" /> : <Stethoscope size={14} className="text-emerald-500" />}
                               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-100">{item.type}</span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-500">
                               {item.timestamp?.toDate().toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                             <div className="flex items-center justify-between">
                               <p className="text-sm font-bold text-white">{item.prediction}</p>
                               <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase ${
                                 item.urgency === 'RED' ? 'bg-red-500 text-white' : 
                                 item.urgency === 'ORANGE' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
                               }`}>
                                 {item.urgency}
                               </span>
                             </div>
                             <p className="text-[10px] text-slate-500 italic leading-relaxed line-clamp-2">
                               {item.markers?.join(', ') || item.reasoning}
                             </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
