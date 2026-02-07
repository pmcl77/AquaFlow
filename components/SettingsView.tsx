
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Milk as Bottle, Beaker, Plus, Trash2, ChevronRight, GripVertical, Monitor, Sun, Moon, User, Upload, Database, Code, RefreshCw, Eraser, Clock, ListFilter, AlertTriangle, Smartphone, Download } from 'lucide-react';
import { UserSettings, EntryType, QuickButton, Theme, Sex, LogEntry, DayParts, IntakeCategory } from '../types';
import { format, addDays } from 'date-fns';

// Fix: parseISO, startOfDay and subDays might not be exported from some versions of date-fns
const parseISO = (s: string) => new Date(s);
const startOfDay = (d: Date | string) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};
const subDays = (d: Date | string, n: number) => addDays(new Date(d), -n);

interface SettingsViewProps {
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
  onImportEntries: (entries: LogEntry[]) => void;
  onBulkAddEntries?: (entries: LogEntry[]) => void;
  onRemoveRandomEntries?: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSaveSettings, onImportEntries, onBulkAddEntries, onRemoveRandomEntries }) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [draggedBtnIndex, setDraggedBtnIndex] = useState<number | null>(null);
  const [draggedCatIndex, setDraggedCatIndex] = useState<number | null>(null);
  
  const [newBtnType, setNewBtnType] = useState<EntryType>(EntryType.WATER);
  const [newBtnLabel, setNewBtnLabel] = useState('');
  const [newBtnAmount, setNewBtnAmount] = useState<number>(250);

  const [newCatLabel, setNewCatLabel] = useState('');

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert("To install locally:\n\n1. Tap the Browser Menu (3 dots or Share icon)\n2. Select 'Add to Home Screen' or 'Install App'.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(localSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleDayPartChange = (part: keyof DayParts, field: 'start' | 'end', value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      dayParts: { ...prev.dayParts, [part]: { ...prev.dayParts[part], [field]: value } }
    }));
  };

  const addQuickButton = () => {
    if (!newBtnLabel.trim()) return;
    const newBtn: QuickButton = {
      id: crypto.randomUUID(),
      type: newBtnType,
      label: newBtnLabel,
      amount: newBtnAmount
    };
    setLocalSettings(prev => ({ ...prev, quickButtons: [...prev.quickButtons, newBtn] }));
    setNewBtnLabel('');
  };

  const removeQuickButton = (id: string) => {
    setLocalSettings(prev => ({ ...prev, quickButtons: prev.quickButtons.filter(b => b.id !== id) }));
  };

  const addIntakeCategory = () => {
    if (!newCatLabel.trim()) return;
    const newCat: IntakeCategory = {
      id: crypto.randomUUID(),
      label: newCatLabel,
      isDeletable: true
    };
    const categories = [...localSettings.intakeCategories];
    const otherIndex = categories.findIndex(c => c.id === 'other');
    if (otherIndex !== -1) {
      categories.splice(otherIndex, 0, newCat);
    } else {
      categories.push(newCat);
    }
    setLocalSettings(prev => ({ ...prev, intakeCategories: categories }));
    setNewCatLabel('');
  };

  const removeIntakeCategory = (id: string) => {
    setLocalSettings(prev => ({ ...prev, intakeCategories: prev.intakeCategories.filter(c => c.id !== id) }));
  };

  const handleDragOverBtn = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedBtnIndex === null || draggedBtnIndex === index) return;
    const items = [...localSettings.quickButtons];
    const draggedItem = items[draggedBtnIndex];
    items.splice(draggedBtnIndex, 1);
    items.splice(index, 0, draggedItem);
    setDraggedBtnIndex(index);
    setLocalSettings(prev => ({ ...prev, quickButtons: items }));
  };

  const handleDragOverCat = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedCatIndex === null || draggedCatIndex === index) return;
    const items = [...localSettings.intakeCategories];
    const draggedItem = items[draggedCatIndex];
    items.splice(draggedCatIndex, 1);
    items.splice(index, 0, draggedItem);
    setDraggedCatIndex(index);
    setLocalSettings(prev => ({ ...prev, intakeCategories: items }));
  };

  const generateRandomData = () => {
    if (!onBulkAddEntries) return;
    const sampleLogs: LogEntry[] = [];
    const now = new Date();
    
    for (let i = 0; i < 30; i++) {
      const day = subDays(now, i);
      const waterCount = 4 + Math.floor(Math.random() * 3);
      for (let w = 0; w < waterCount; w++) {
        const hour = 7 + Math.floor(Math.random() * 14);
        const minute = Math.floor(Math.random() * 60);
        const logDate = new Date(day);
        logDate.setHours(hour, minute);
        
        sampleLogs.push({
          id: crypto.randomUUID(),
          type: EntryType.WATER,
          amount: 200 + Math.floor(Math.random() * 300),
          timestamp: logDate.toISOString(),
          notes: 'DEV_RANDOM',
          intakeTypeId: 'water'
        });
      }
      const urineCount = 3 + Math.floor(Math.random() * 3);
      for (let u = 0; u < urineCount; u++) {
        const hour = 8 + Math.floor(Math.random() * 15);
        const minute = Math.floor(Math.random() * 60);
        const logDate = new Date(day);
        logDate.setHours(hour, minute);
        
        sampleLogs.push({
          id: crypto.randomUUID(),
          type: EntryType.URINE,
          amount: 150 + Math.floor(Math.random() * 400),
          timestamp: logDate.toISOString(),
          notes: 'DEV_RANDOM'
        });
      }
    }
    onBulkAddEntries(sampleLogs);
    alert('Generated 30 days of sample data.');
  };

  const renderDayPartInput = (label: string, part: keyof DayParts) => (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">{label}</label>
      <div className="flex gap-2 items-center">
        <input type="time" value={localSettings.dayParts[part].start} onChange={(e) => handleDayPartChange(part, 'start', e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none dark:text-white" />
        <span className="text-slate-300">-</span>
        <input type="time" value={localSettings.dayParts[part].end} onChange={(e) => handleDayPartChange(part, 'end', e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none dark:text-white" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-24">
      {/* App Installation Section */}
      <div className="bg-blue-600 dark:bg-blue-800 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <Smartphone className="absolute -right-4 -bottom-4 opacity-10 rotate-12" size={120} />
        <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
          <Download size={20} /> Install Local App
        </h3>
        <p className="text-xs opacity-90 mb-4 max-w-[80%]">
          Install AquaFlow on your phone for offline use and a full-screen, native experience.
        </p>
        <button 
          onClick={handleInstallClick}
          className="bg-white text-blue-600 px-6 py-2.5 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-all"
        >
          {deferredPrompt ? 'Install Now' : 'Show Instructions'}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-2 mb-6">
          <SettingsIcon size={20} className="text-slate-400" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Settings</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ... existing profile/categories code ... */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b dark:border-slate-800 pb-2 flex items-center gap-2"><User size={14} /> Profile</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Age</label>
                <input type="number" value={localSettings.age} onChange={(e) => setLocalSettings(p => ({ ...p, age: +e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Sex</label>
                <select value={localSettings.sex} onChange={(e) => setLocalSettings(p => ({ ...p, sex: e.target.value as Sex }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white">
                  <option value="UNSPECIFIED">Select...</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b dark:border-slate-800 pb-2 flex items-center gap-2"><ListFilter size={14} /> Intake Categories</h3>
            <div className="space-y-2">
              {localSettings.intakeCategories.map((cat, index) => (
                <div key={cat.id} draggable onDragStart={() => setDraggedCatIndex(index)} onDragOver={(e) => handleDragOverCat(e, index)} onDragEnd={() => setDraggedCatIndex(null)} className={`flex items-center justify-between bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm cursor-move ${draggedCatIndex === index ? 'opacity-30' : ''}`}>
                  <div className="flex items-center gap-3">
                    <GripVertical size={14} className="text-slate-300 dark:text-slate-600" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{cat.label}</span>
                  </div>
                  {cat.isDeletable && (
                    <button type="button" onClick={() => removeIntakeCategory(cat.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="New Category" value={newCatLabel} onChange={(e) => setNewCatLabel(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none dark:text-white" />
              <button type="button" onClick={addIntakeCategory} className="bg-slate-800 dark:bg-blue-600 text-white p-2 rounded-xl active:scale-95"><Plus size={20} /></button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b dark:border-slate-800 pb-2 flex items-center gap-2"><ChevronRight size={14} /> Quick Buttons</h3>
            <div className="space-y-2">
              {localSettings.quickButtons.map((btn, index) => (
                <div key={btn.id} draggable onDragStart={() => setDraggedBtnIndex(index)} onDragOver={(e) => handleDragOverBtn(e, index)} onDragEnd={() => setDraggedBtnIndex(null)} className={`flex items-center justify-between bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm cursor-move ${draggedBtnIndex === index ? 'opacity-30' : ''}`}>
                   <div className="flex items-center gap-3">
                    <GripVertical size={14} className="text-slate-300 dark:text-slate-600" />
                    <div className={btn.type === EntryType.WATER ? 'text-blue-500' : 'text-amber-500'}><Bottle size={14} /></div>
                    <span className="text-xs font-bold">{btn.label} ({btn.amount}ml)</span>
                  </div>
                  <button type="button" onClick={() => removeQuickButton(btn.id)} className="p-1.5 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3">
              <div className="flex p-1 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg">
                <button type="button" onClick={() => setNewBtnType(EntryType.WATER)} className={`flex-1 py-1 rounded text-[10px] font-bold ${newBtnType === EntryType.WATER ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Intake</button>
                <button type="button" onClick={() => setNewBtnType(EntryType.URINE)} className={`flex-1 py-1 rounded text-[10px] font-bold ${newBtnType === EntryType.URINE ? 'bg-amber-600 text-white' : 'text-slate-400'}`}>Urine</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Label" value={newBtnLabel} onChange={(e) => setNewBtnLabel(e.target.value)} className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg px-3 py-2 text-xs outline-none dark:text-white" />
                <input type="number" placeholder="ml" value={newBtnAmount} onChange={(e) => setNewBtnAmount(+e.target.value)} className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg px-3 py-2 text-xs outline-none dark:text-white font-bold" />
              </div>
              <button type="button" onClick={addQuickButton} className="w-full bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold py-2 rounded-lg active:scale-95">Add Button</button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b dark:border-slate-800 pb-2 flex items-center gap-2"><Clock size={14} /> Chart Day Parts</h3>
            <div className="grid grid-cols-1 gap-3 bg-slate-50 dark:bg-slate-800/20 p-4 rounded-2xl border dark:border-slate-800">
              {renderDayPartInput('Night', 'night')}
              {renderDayPartInput('Morning', 'morning')}
              {renderDayPartInput('Afternoon', 'afternoon')}
              {renderDayPartInput('Evening', 'evening')}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b dark:border-slate-800 pb-2 flex items-center gap-2 text-amber-600"><Code size={14} /> Developer Options</h3>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={generateRandomData} className="flex items-center justify-center gap-2 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 py-3 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors">
                <Database size={16} /> Generate 30 Days Sample Data
              </button>
              {onRemoveRandomEntries && (
                <button type="button" onClick={onRemoveRandomEntries} className="flex items-center justify-center gap-2 w-full border border-red-100 dark:border-red-900/30 text-red-500 py-3 rounded-xl text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                  <RefreshCw size={16} /> Clear Sample Data
                </button>
              )}
            </div>
          </div>

          <button type="submit" className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 ${isSaved ? 'bg-emerald-600 text-white' : 'bg-slate-900 dark:bg-blue-600 text-white'}`}>
            {isSaved ? 'Preferences Saved!' : 'Save Preferences'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsView;
