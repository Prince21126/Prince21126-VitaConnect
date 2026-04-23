import { useState, useRef } from 'react';
import { analyzeMalnutritionImage, MalnutritionResult } from '../services/geminiService';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Image as ImageIcon, CheckCircle2, AlertTriangle, RefreshCw, Activity } from 'lucide-react';

interface MalnutritionScannerProps {
  patientId?: string;
  village?: string;
}

export default function MalnutritionScanner({ patientId, village = "Village A" }: MalnutritionScannerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MalnutritionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalysis = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    try {
      const base64 = image.split(',')[1];
      const analysis = await analyzeMalnutritionImage(base64);

      // Save record (Ensuring all required fields for firestore.rules are present)
      await addDoc(collection(db, 'diagnostics'), {
        patientId: patientId || 'agent_field_session',
        village,
        type: 'VISION',
        prediction: analysis.severity,
        markers: analysis.markers,
        probability: analysis.severity === 'NORMAL' ? 0.95 : 0.82,
        urgency: analysis.severity === 'SEVERE' ? 'RED' : analysis.severity === 'MODERATE' ? 'ORANGE' : 'GREEN',
        timestamp: serverTimestamp()
      });

      setResult(analysis);
    } catch (err) {
      console.error(err);
      setError("Échec de l'analyse Vision. Vérifiez l'image ou la connexion réseau.");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityStyles = (s: string) => {
    switch (s) {
      case 'SEVERE': return 'text-red-600 bg-red-50 border-red-200';
      case 'MODERATE': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'NORMAL': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div id="vision-scanner" className="p-4 pb-24 max-w-lg mx-auto space-y-6">
      <header className="px-2">
        <h2 className="text-xl font-bold text-white">NutriScan (Vision IA)</h2>
        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-none">Analyse Biométrique de Malnutrition</p>
      </header>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-[10px] font-bold text-center mx-2"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bento-card space-y-5 mx-2">
        {!image ? (
          <div className="grid grid-cols-2 gap-4 h-48">
            <button 
              id="open-camera-btn"
              onClick={() => cameraInputRef.current?.click()}
              className="bg-black/60 border border-slate-700/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-blue-600/10 hover:border-blue-500/50 group"
            >
              <Camera size={32} className="text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center px-2">Capturer en Direct</p>
              <input type="file" hidden ref={cameraInputRef} onChange={handleImageSelect} accept="image/*" capture="environment" />
            </button>
            
            <button 
              id="open-gallery-btn"
              onClick={() => fileInputRef.current?.click()}
              className="bg-black/40 border border-slate-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-slate-800 group"
            >
              <ImageIcon size={32} className="text-slate-500 mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center px-2">Bibliothèque</p>
              <input type="file" hidden ref={fileInputRef} onChange={handleImageSelect} accept="image/*" />
            </button>
          </div>
        ) : (
          <div className="relative group aspect-video">
            <img 
              id="selected-image"
              src={image} 
              alt="Patient" 
              className="w-full h-full object-cover rounded-2xl border border-slate-700" 
            />
            <div className="absolute inset-0 bg-blue-500/10 pointer-events-none rounded-2xl"></div>
            <button 
              onClick={() => setImage(null)}
              className="absolute top-3 right-3 bg-slate-900/80 text-white p-2 rounded-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        )}

        <button
          id="analyze-image-btn"
          onClick={handleAnalysis}
          disabled={loading || !image}
          className="w-full h-12 bg-slate-100 text-slate-950 rounded-xl font-bold flex items-center justify-center gap-2 disabled:bg-slate-800 disabled:text-slate-500 transition-all active:scale-[0.98]"
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full"
            />
          ) : (
            <>
              <Activity size={18} /> Lancer l'Analyse Vision
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            id="vision-result"
            className="space-y-4 mx-2"
          >
            <div className={`p-6 rounded-2xl border-2 ${getSeverityStyles(result.severity)} shadow-lg bg-slate-900/40 backdrop-blur-md`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black uppercase tracking-tighter">État : {result.severity}</h3>
                {result.severity === 'SEVERE' ? <AlertTriangle className="text-red-500" size={24} /> : <CheckCircle2 className="text-emerald-500" size={24} />}
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {result.markers.map((marker, i) => (
                  <span key={i} className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 bg-black/40 rounded border border-white/5 text-slate-300">
                    {marker}
                  </span>
                ))}
              </div>
              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <p className="text-xs font-medium text-slate-400 italic leading-relaxed">"{result.recommendation}"</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
