
import React, { useState, useEffect, useMemo } from 'react';
import { Milk as Bottle, Beaker, Plus, Clock, FileText, Trash2, Waves, ChevronUp, ChevronDown, Scale, AlertCircle, CheckCircle2, XCircle, StickyNote, Coffee, Wine, Beer, CupSoda } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { EntryType, LogEntry, UserSettings, QuickButton, Urgency } from '../types';

// Fix: parseISO might not be exported from some versions of date-fns
const parseISO = (s: string) => new Date(s);

interface DashboardProps {
  entries: LogEntry[];
  settings: UserSettings;
  onAddEntry: (entry: Omit<LogEntry, 'id'>) => void;
  onDeleteEntry: (id: string) => void;
  onEditEntry: (entry: LogEntry) => void;
}

type SaveStatus = 'idle' | 'success' | 'error';

const Dashboard: React.FC<DashboardProps> = ({ entries, settings, onAddEntry, onDeleteEntry, onEditEntry }) => {
  const [type, setType] = useState<EntryType>(EntryType.WATER);
  const [intakeTypeId, setIntakeTypeId] = useState<string>('none');
  const [amount, setAmount] = useState<number>(settings.defaultWaterAmount);
  const [timestamp, setTimestamp] = useState<string>(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [notes, setNotes] = useState<string>('');
  const [urgency, setUrgency] = useState<Urgency>(Urgency.EMPTY);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  useEffect(() => {
    if (type === EntryType.WATER) {
      setAmount(settings.defaultWaterAmount);
      setUrgency(Urgency.EMPTY);
    } else if (type === EntryType.URINE) {
      setAmount(settings.defaultUrineAmount);
      setIntakeTypeId('none');
    } else {
      setAmount(0);
      setUrgency(Urgency.EMPTY);
      setIntakeTypeId('none');
    }
  }, [type, settings.defaultWaterAmount, settings.defaultUrineAmount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type !== EntryType.NOTE && amount <= 0) { setSaveStatus('error'); setTimeout(() => setSaveStatus('idle'), 2000); return; }
    if (type === EntryType.NOTE && !notes.trim()) { setSaveStatus('error'); setTimeout(() => setSaveStatus('idle'), 2000); return; }

    try {
      onAddEntry({
        type,
        intakeTypeId: type === EntryType.WATER ? intakeTypeId : undefined,
        amount: type === EntryType.NOTE ? 0 : amount,
        timestamp: new Date(timestamp).toISOString(),
        notes,
        urgency: type === EntryType.URINE ? urgency : undefined
      });
      setSaveStatus('success');
      setNotes('');
      setUrgency(Urgency.EMPTY);
      setIntakeTypeId('none');
      setTimestamp(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleQuickAdd = (btn: QuickButton) => {
    setType(btn.type);
    setAmount(btn.amount);
    setNotes(btn.label);
    const formEl = document.getElementById('log-form');
    formEl?.classList.add('ring-2', 'ring-blue-500/50');
    setTimeout(() => formEl?.classList.remove('ring-2', 'ring-blue-500/50'), 500);
  };

  const adjustAmount = (delta: number) => setAmount(prev => Math.max(0, prev + delta));

  const todayEntries = useMemo(() => 
    entries
      .filter(e => isToday(parseISO(e.timestamp)))
      .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime())
  , [entries]);

  const waterTotal = useMemo(() => todayEntries.filter(e => e.type === EntryType.WATER).reduce((sum, e) => sum + e.amount, 0), [todayEntries]);
  const waterCount = useMemo(() => todayEntries.filter(e => e.type === EntryType.WATER).length, [todayEntries]);
  const urineTotal = useMemo(() => todayEntries.filter(e => e.type === EntryType.URINE).reduce((sum, e) => sum + e.amount, 0), [todayEntries]);
  const urineCount = useMemo(() => todayEntries.filter(e => e.type === EntryType.URINE).length, [todayEntries]);

  const netVolume = useMemo(() => {
    const firstIntake = todayEntries.find(e => e.type === EntryType.WATER);
    if (!firstIntake) return 0;
    const firstIntakeTime = parseISO(firstIntake.timestamp).getTime();
    const validUrineSum = todayEntries.filter(e => e.type === EntryType.URINE && parseISO(e.timestamp).getTime() >= firstIntakeTime).reduce((sum, e) => sum + e.amount, 0);
    return waterTotal - validUrineSum;
  }, [todayEntries, waterTotal]);

  const activeQuickButtons = settings.quickButtons.filter(btn => btn.type === type);

  const getUrgencyColor = (u?: Urgency) => {
    switch (u) {
      case Urgency.LOW: return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case Urgency.MEDIUM: return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
      case Urgency.HIGH: return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const getBeverageIcon = (id: string) => {
    switch (id) {
      case 'coffee': return <Coffee size={10} />;
      case 'wine': return <Wine size={10} />;
      case 'beer': return <Beer size={10} />;
      case 'soda': return <CupSoda size={10} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-none ${saveStatus !== 'idle' ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
        <div className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 border ${saveStatus === 'success' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-red-600 text-white border-red-400'}`}>
          {saveStatus === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          <span className="font-bold text-sm">{saveStatus === 'success' ? 'Log entry saved!' : 'Failed to save entry.'}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Intake" value={waterTotal} unit="ml" count={waterCount} icon={<Bottle className="text-blue-600 dark:text-blue-400 mb-1" size={20} />} colorClass="bg-blue-50 dark:bg-blue-900/20 text-blue-800 border-blue-100 dark:border-blue-800" />
        <StatCard label="Output" value={urineTotal} unit="ml" count={urineCount} icon={<Beaker className="text-amber-600 dark:text-amber-400 mb-1" size={20} />} colorClass="bg-amber-50 dark:bg-amber-900/20 text-amber-800 border-amber-100 dark:border-amber-800" />
        <StatCard label="Net Vol" value={`${netVolume > 0 ? '+' : ''}${netVolume}`} unit="ml" count="Today" icon={<Scale className="text-emerald-600 dark:text-emerald-400 mb-1" size={20} />} colorClass="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 border-emerald-100 dark:border-emerald-800" />
      </div>

      <div id="log-form" className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border dark:border-slate-800 transition-all duration-300">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {(['WATER', 'URINE', 'NOTE'] as EntryType[]).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${type === t ? (t === 'WATER' ? 'bg-blue-600 text-white' : t === 'URINE' ? 'bg-amber-600 text-white' : 'bg-indigo-600 text-white') : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'}`}>
                {t === 'WATER' ? <Bottle size={16} /> : t === 'URINE' ? <Beaker size={16} /> : <StickyNote size={16} />} {t === 'WATER' ? 'Intake' : t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {type !== EntryType.NOTE && activeQuickButtons.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {activeQuickButtons.map(btn => (
                <button key={btn.id} type="button" onClick={() => handleQuickAdd(btn)} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors border dark:border-slate-700 flex flex-col items-center min-w-[64px] active:scale-90">
                  <span className="opacity-60">{btn.label}</span><span>{btn.amount}ml</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            {type !== EntryType.NOTE && (
              <div className="w-[120px] space-y-1 shrink-0">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Amount</label>
                <div className="flex items-center gap-1">
                  <input type="number" value={amount} onChange={(e) => setAmount(+e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl px-2 py-3 text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-center" required />
                  <div className="flex flex-col gap-1">
                    <button type="button" onClick={() => adjustAmount(settings.amountIncrement)} className="p-1 bg-slate-100 dark:bg-slate-800 rounded-md"><ChevronUp size={14} /></button>
                    <button type="button" onClick={() => adjustAmount(-settings.amountIncrement)} className="p-1 bg-slate-100 dark:bg-slate-800 rounded-md"><ChevronDown size={14} /></button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Time</label>
              <input type="datetime-local" value={timestamp} onChange={(e) => setTimestamp(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" required />
            </div>
          </div>

          {type === EntryType.URINE && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Urgency</label>
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                {[Urgency.EMPTY, Urgency.LOW, Urgency.MEDIUM, Urgency.HIGH].map((u) => (
                  <button key={u} type="button" onClick={() => setUrgency(u)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${urgency === u ? (u === 'EMPTY' ? 'bg-white text-slate-900 shadow-sm' : u === 'LOW' ? 'bg-blue-500 text-white' : u === 'MEDIUM' ? 'bg-orange-500 text-white' : 'bg-red-500 text-white') : 'text-slate-400'}`}>
                    {u === 'EMPTY' ? 'None' : u}
                  </button>
                ))}
              </div>
            </div>
          )}

          {type === EntryType.WATER && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Type of Intake</label>
              <select value={intakeTypeId} onChange={(e) => setIntakeTypeId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-colors">
                {settings.intakeCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Notes {type !== EntryType.NOTE && '(Optional)'}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={type === EntryType.NOTE ? "Type your note here..." : "Any details..."} className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[60px] dark:text-white" required={type === EntryType.NOTE} />
          </div>

          <button type="submit" className="w-full font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 bg-slate-900 dark:bg-blue-600 text-white">
            <Plus size={20} /> Save {type === EntryType.NOTE ? 'Note' : 'Log Entry'}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Today's History</h3>
        <div className="space-y-2">
          {todayEntries.length === 0 ? (
            <div className="bg-white/50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 rounded-2xl flex flex-col items-center justify-center text-slate-400">
              <Clock size={32} className="mb-2 opacity-30" /><p className="text-sm font-medium">No logs for today yet</p>
            </div>
          ) : (
            [...todayEntries].reverse().map(entry => {
              const intakeCategory = settings.intakeCategories.find(c => c.id === entry.intakeTypeId);
              return (
                <div key={entry.id} onClick={() => onEditEntry(entry)} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border dark:border-slate-800 flex items-center justify-between group active:bg-slate-50 dark:active:bg-slate-800 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${entry.type === EntryType.WATER ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' : entry.type === EntryType.URINE ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600'}`}>
                      {entry.type === EntryType.WATER ? <Bottle size={20} /> : entry.type === EntryType.URINE ? <Beaker size={20} /> : <StickyNote size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{entry.type === EntryType.NOTE ? 'Note' : `${entry.amount} ml`}</span>
                        {entry.type === EntryType.WATER && intakeCategory && intakeCategory.id !== 'none' && (
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                             {getBeverageIcon(intakeCategory.id)} {intakeCategory.label}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">{format(parseISO(entry.timestamp), 'HH:mm')}</span>
                      </div>
                      {entry.notes && <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5 italic line-clamp-1"><FileText size={12} /> {entry.notes}</div>}
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteEntry(entry.id); }} className="p-2 text-slate-300 hover:text-red-500 transition-opacity"><Trash2 size={18} /></button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string, value: any, unit: string, count: any, icon: any, colorClass: string }> = ({ label, value, unit, count, icon, colorClass }) => (
  <div className={`${colorClass} border p-2.5 rounded-2xl flex flex-col items-center text-center`}>
    {icon}
    <span className="text-[9px] font-bold uppercase tracking-tight">{label}</span>
    <span className="text-xl font-bold">{value}<small className="text-[10px] font-normal ml-0.5">{unit}</small></span>
    <span className="text-[8px] font-semibold uppercase mt-0.5 opacity-75">{typeof count === 'number' ? `${count} logs` : count}</span>
  </div>
);

export default Dashboard;
