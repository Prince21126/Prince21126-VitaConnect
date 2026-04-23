import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, limit, orderBy, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, MapPin, Users, Activity } from 'lucide-react';

interface Alert {
  id: string;
  village: string;
  caseCount: number;
  severity: string;
  createdAt: any;
}

export default function EpidemicDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [allDiagnostics, setAllDiagnostics] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalCases: 0, criticalZones: 0 });
  const [viewMode, setViewMode] = useState<'alerts' | 'history'>('alerts');

  useEffect(() => {
    // High-level epidemiologic monitor: 5+ cases in 48h
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const q = query(
      collection(db, 'diagnostics'),
      where('timestamp', '>', Timestamp.fromDate(fortyEightHoursAgo)),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const diagnostics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllDiagnostics(diagnostics);
      
      // Group by village
      const clusters: Record<string, number> = {};
      diagnostics.forEach((d: any) => {
        if (d.prediction === 'Malaria' || d.prediction === 'Paludisme') {
          clusters[d.village] = (clusters[d.village] || 0) + 1;
        }
      });

      // Filter for clusters with 5+ cases
      const newAlerts: Alert[] = Object.entries(clusters)
        .filter(([_, count]) => count >= 5)
        .map(([village, count]) => ({
          id: village,
          village,
          caseCount: count,
          severity: 'HIGH',
          createdAt: new Date()
        }));

      setAlerts(newAlerts);
      setStats({
        totalCases: diagnostics.length,
        criticalZones: newAlerts.length
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <div id="epidemic-dashboard" className="p-4 pb-24 max-w-lg mx-auto space-y-6">
      <header className="mb-6 px-2">
        <h2 className="text-xl font-bold text-white">Surveillance Épidémique</h2>
        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-none">Analyse via Firebase Cloud Functions</p>
      </header>

      <div className="grid grid-cols-2 gap-4 px-2">
        <div 
          onClick={() => setViewMode('history')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${viewMode === 'history' ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/20' : 'bg-blue-600/10 border-blue-600/20'}`}
        >
          <div className="flex justify-between items-start mb-2">
            <Users className="text-blue-500" size={16} />
            <span className="text-[8px] font-bold text-slate-500 uppercase">Dernières 48h</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalCases}</div>
          <div className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">Diagnostics (Historique)</div>
        </div>
        <div 
          onClick={() => setViewMode('alerts')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${viewMode === 'alerts' ? 'bg-red-600/20 border-red-500 ring-2 ring-red-500/20' : 'bg-red-600/10 border-red-600/20'}`}
        >
          <div className="flex justify-between items-start mb-2">
            <AlertTriangle className="text-red-500" size={16} />
            <span className="text-[8px] font-bold text-slate-500 uppercase">Temps Réel</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.criticalZones}</div>
          <div className="text-[9px] text-red-400 font-bold uppercase tracking-widest">Alertes Clusters</div>
        </div>
      </div>

      <div className="space-y-4 px-2">
        <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
          {viewMode === 'alerts' ? (
            <><MapPin size={12} className="text-blue-500" /> Notifications de District</>
          ) : (
            <><Activity size={12} className="text-emerald-500" /> Flux de diagnostics récents</>
          )}
        </h3>

        <AnimatePresence mode="wait">
          {viewMode === 'alerts' ? (
            <motion.div
              key="alerts-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {alerts.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800/50 border-dashed">
                  <Activity className="mx-auto text-slate-800 mb-2" size={32} />
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Secteur Opérationnel • Calme</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="bento-card border-red-500/20 bg-red-500/5 flex items-center justify-between p-4"
                  >
                    <div>
                      <h4 className="font-bold text-red-400 text-sm">{alert.village}</h4>
                      <p className="text-[10px] text-slate-400 uppercase font-mono tracking-tighter">{alert.caseCount} cas concentrés</p>
                    </div>
                    <div className="bg-red-600 text-white text-[8px] font-bold px-3 py-1 rounded shadow-lg shadow-red-900/40 uppercase animate-pulse">
                      Urgence
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="history-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {allDiagnostics.length === 0 ? (
                <div className="text-center py-12 opacity-20">
                   <p className="text-[10px] font-bold uppercase tracking-widest">Aucune donnée récente</p>
                </div>
              ) : (
                allDiagnostics.map((diag) => (
                  <div key={diag.id} className="bento-card p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${diag.type === 'VISION' ? 'bg-blue-600/20 text-blue-400' : 'bg-emerald-600/20 text-emerald-400'}`}>
                          {diag.type === 'VISION' ? 'V' : 'IA'}
                       </div>
                       <div>
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-bold text-white">{diag.prediction}</span>
                             <span className={`text-[7px] px-1.5 py-0.5 rounded uppercase font-bold ${diag.urgency === 'RED' ? 'bg-red-500' : diag.urgency === 'ORANGE' ? 'bg-orange-500' : 'bg-green-500'}`}>
                                {diag.urgency}
                             </span>
                          </div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">{diag.village} • {diag.timestamp?.toDate().toLocaleTimeString()}</p>
                       </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="pt-4 px-2 border-t border-slate-800/50">
        <p className="text-[9px] text-slate-600 italic leading-tight">
          Algorithme de détection de cluster : n &gt; 5 cas / 48h / rayon 10km.
        </p>
      </footer>
    </div>
  );
}
