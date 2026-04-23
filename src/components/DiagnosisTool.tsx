import { useState } from 'react';
import { analyzeSymptoms, NLPDiagnosisResult } from '../services/geminiService';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Thermometer, Info, AlertCircle } from 'lucide-react';

interface DiagnosisToolProps {
  patientId?: string;
  village?: string;
}

export default function DiagnosisTool({ patientId, village = "Village A" }: DiagnosisToolProps) {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NLPDiagnosisResult | null>(null);

  const handleDiagnosis = async () => {
    if (!symptoms.trim()) return;
    setLoading(true);
    try {
      const diagnosis = await analyzeSymptoms(symptoms);
      setResult(diagnosis);

      // Save to Firebase for real-time analytics
      await addDoc(collection(db, 'diagnostics'), {
        patientId: patientId || 'anon',
        village,
        type: 'NLP',
        rawInput: symptoms,
        prediction: diagnosis.prediction,
        probability: diagnosis.probability,
        urgency: diagnosis.urgency,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (u: string) => {
    switch (u) {
      case 'RED': return 'bg-red-600 text-white border-red-700';
      case 'ORANGE': return 'bg-orange-500 text-white border-orange-600';
      case 'GREEN': return 'bg-emerald-600 text-white border-emerald-700';
      default: return 'bg-slate-200 text-slate-700';
    }
  };

  return (
    <div id="diagnosis-tool" className="p-4 pb-24 max-w-lg mx-auto space-y-6">
      <header className="px-2">
        <h2 className="text-xl font-bold text-white">Diagnostic Assisté</h2>
        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-none">Moteur NLP Gemini Pro (Local Sync)</p>
      </header>

      <div className="bento-card space-y-5 mx-2">
        <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">Saisie des symptômes (Voix/Texte)</label>
        <textarea
          id="symptoms-input"
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="Ex: Fièvre persistante depuis 48h, refus de nourriture..."
          className="w-full text-sm p-4 bg-black/40 border border-slate-700/50 rounded-xl focus:border-blue-500 outline-none min-h-[120px] transition-all text-slate-300 italic placeholder:text-slate-600"
        />
        <button
          id="analyze-btn"
          onClick={handleDiagnosis}
          disabled={loading || !symptoms}
          className="w-full h-12 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:bg-slate-800 disabled:text-slate-500 transition-all active:scale-[0.98] shadow-lg shadow-blue-900/20"
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <>
              <Send size={18} /> Analyser le Cas
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            id="diagnosis-result"
            className="space-y-4 mx-2"
          >
            <div className={`p-6 rounded-2xl border ${getUrgencyColor(result.urgency)} relative overflow-hidden group`}>
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Thermometer size={80} />
               </div>
              <div className="relative z-10">
                <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest mb-1 font-mono">Prediction Gemini v0.9</p>
                <h3 className="text-2xl font-black mb-4">{result.prediction}</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between group/progress">
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Probabilité de Confiance</span>
                    <span className="text-xs font-mono font-bold">{Math.round(result.probability * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${result.probability * 100}%` }}
                      className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bento-card space-y-4">
              <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-[0.2em] text-[10px]">
                <Info size={14} />
                <h4>Extraction Structurée</h4>
              </div>
              <div className="bg-black/30 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-blue-300 leading-relaxed italic">
                "{result.reasoning}"
              </div>
              <div className="flex items-start gap-3 bg-red-400/5 p-3 rounded-lg border border-red-400/10">
                <AlertCircle className="text-red-400/50 shrink-0 mt-0.5" size={14} />
                <p className="text-[9px] text-slate-500 uppercase font-bold leading-tight">
                  Note : Systéme d'aide au triage rural. Validation clinique locale requise (Sud-Kivu Protocole A).
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
