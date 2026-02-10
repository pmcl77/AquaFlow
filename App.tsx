import React, { useState, useEffect } from 'react';
import { 
  Milk as Bottle, 
  Settings as SettingsIcon, 
  Calendar,
  ChevronLeft,
  Sparkles,
  CalendarDays
} from 'lucide-react';
import { format } from 'date-fns';
import { EntryType, LogEntry, UserSettings, View, Theme, IntakeCategory } from './types';
import Dashboard from './components/Dashboard';
import ReportView from './components/ReportView';
import SettingsView from './components/SettingsView';
import InsightsView from './components/InsightsView';
import CalendarView from './components/CalendarView';
import EditEntryModal from './components/EditEntryModal';

// Fix: parseISO might not be exported from some versions of date-fns
const parseISO = (s: string) => new Date(s);

const STORAGE_KEY_ENTRIES = 'aquaflow_entries';
const STORAGE_KEY_SETTINGS = 'aquaflow_settings';

const DEFAULT_INTAKE_CATEGORIES: IntakeCategory[] = [
  { id: 'none', label: 'None', isDeletable: false },
  { id: 'water', label: 'Water', isDeletable: true },
  { id: 'coffee', label: 'Coffee', isDeletable: true },
  { id: 'tea', label: 'Tea', isDeletable: true },
  { id: 'juice', label: 'Juice', isDeletable: true },
  { id: 'milk', label: 'Milk', isDeletable: true },
  { id: 'soda', label: 'Soda', isDeletable: true },
  { id: 'beer', label: 'Beer', isDeletable: true },
  { id: 'wine', label: 'Wine', isDeletable: true },
  { id: 'spirits', label: 'Spirits', isDeletable: true },
  { id: 'other', label: 'Other', isDeletable: false },
];

const DEFAULT_SETTINGS: UserSettings = {
  defaultWaterAmount: 250,
  defaultUrineAmount: 400,
  amountIncrement: 50,
  theme: Theme.SYSTEM,
  age: 30,
  sex: 'UNSPECIFIED',
  intakeCategories: DEFAULT_INTAKE_CATEGORIES,
  quickButtons: [
    { id: '1', type: EntryType.WATER, label: 'Glass', amount: 250 },
    { id: '2', type: EntryType.WATER, label: 'Big Glass', amount: 350 },
    { id: '3', type: EntryType.WATER, label: 'Bottle', amount: 500 },
    { id: '4', type: EntryType.URINE, label: 'Small', amount: 200 },
    { id: '5', type: EntryType.URINE, label: 'Medium', amount: 400 },
    { id: '6', type: EntryType.URINE, label: 'Large', amount: 600 },
  ],
  dayParts: {
    night: { start: '00:00', end: '05:59' },
    morning: { start: '06:00', end: '11:59' },
    afternoon: { start: '12:00', end: '17:59' },
    evening: { start: '18:00', end: '23:59' },
  }
};

const App: React.FC = () => {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [currentView, setCurrentView] = useState<View>('HOME');
  const [editingEntry, setEditingEntry] = useState<LogEntry | null>(null);

  useEffect(() => {
    const savedEntries = localStorage.getItem(STORAGE_KEY_ENTRIES);
    const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);

    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      if (!parsed.intakeCategories) {
        parsed.intakeCategories = DEFAULT_INTAKE_CATEGORIES;
      }
      setSettings({ ...DEFAULT_SETTINGS, ...parsed });
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
      let isDark = false;
      if (settings.theme === Theme.DARK) {
        isDark = true;
      } else if (settings.theme === Theme.SYSTEM) {
        isDark = mediaQuery.matches;
      }
      root.classList.toggle('dark', isDark);
    };

    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [settings.theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  const addEntry = (entry: Omit<LogEntry, 'id'>) => {
    const newEntry = { ...entry, id: crypto.randomUUID() };
    setEntries(prev => [newEntry, ...prev].sort((a, b) => 
      parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()
    ));
  };

  const addBulkEntries = (newEntries: LogEntry[]) => {
    setEntries(prev => [...newEntries, ...prev].sort((a, b) => 
      parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()
    ));
  };

  const removeRandomEntries = () => {
    setEntries(prev => prev.filter(e => e.notes !== 'DEV_RANDOM'));
  };

  const importEntries = (newEntries: LogEntry[]) => {
    setEntries(prev => {
      const existingIds = new Set(prev.map(e => e.id));
      const filteredNew = newEntries.filter(n => !existingIds.has(n.id));
      
      const filteredByContent = filteredNew.filter(n => {
        const isDuplicate = prev.some(e => 
          e.timestamp === n.timestamp && 
          e.type === n.type && 
          e.amount === n.amount
        );
        return !isDuplicate;
      });

      return [...filteredByContent, ...prev].sort((a, b) => 
        parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()
      );
    });
  };

  const updateEntry = (id: string, updatedData: Omit<LogEntry, 'id'>) => {
    setEntries(prev => prev.map(e => (e.id === id ? { ...updatedData, id } : e)));
    setEditingEntry(null);
  };

  const deleteEntry = (id: string) => {
    if (window.confirm('Delete this entry?')) {
      setEntries(prev => prev.filter(e => e.id !== id));
      if (editingEntry?.id === id) setEditingEntry(null);
    }
  };

  const exportCSV = (dataToExport: LogEntry[] = entries) => {
    if (dataToExport.length === 0) {
      alert("No data to export.");
      return;
    }
    // Headers without ID
    const headers = ['Type', 'Intake Type', 'Amount (ml)', 'Timestamp', 'Notes'];
    const rows = dataToExport.map(e => {
      const intakeType = settings.intakeCategories.find(c => c.id === e.intakeTypeId);
      const intakeTypeLabel = (intakeType && intakeType.id !== 'none') ? intakeType.label : '';
      const displayType = e.type === EntryType.WATER ? 'Intake' : e.type === EntryType.URINE ? 'Urine' : 'Note';
      const displayAmount = e.type === EntryType.NOTE ? '' : e.amount.toString();
      
      return [
        displayType,
        intakeTypeLabel,
        displayAmount,
        format(parseISO(e.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        `"${(e.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `aquaflow_export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-white dark:bg-slate-900 shadow-xl relative overflow-hidden transition-colors">
      <header className="bg-blue-600 dark:bg-blue-800 text-white p-4 pt-6 shadow-md z-10 transition-colors shrink-0 print:hidden">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {currentView !== 'HOME' && (
              <button onClick={() => setCurrentView('HOME')} className="p-1 -ml-1 hover:bg-blue-700 dark:hover:bg-blue-700 rounded-full transition-colors">
                <ChevronLeft size={24} />
              </button>
            )}
            <h1 className="text-xl font-bold tracking-tight">AquaFlow</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4 bg-slate-50 dark:bg-slate-950 no-scrollbar transition-colors print:p-0 print:bg-white print:dark:bg-white print:overflow-visible print:pb-0">
        {currentView === 'HOME' && (
          <Dashboard 
            entries={entries} 
            settings={settings} 
            onAddEntry={addEntry} 
            onDeleteEntry={deleteEntry}
            onEditEntry={setEditingEntry}
          />
        )}
        {currentView === 'CALENDAR' && (
          <CalendarView 
            entries={entries} 
            settings={settings}
            onDeleteEntry={deleteEntry}
            onEditEntry={setEditingEntry}
          />
        )}
        {currentView === 'REPORT' && (
          <ReportView 
            entries={entries} 
            settings={settings}
            onEditEntry={setEditingEntry} 
            onExportCSV={exportCSV}
          />
        )}
        {currentView === 'INSIGHTS' && (
          <InsightsView
            entries={entries}
            settings={settings}
          />
        )}
        {currentView === 'SETTINGS' && (
          <SettingsView 
            settings={settings} 
            onSaveSettings={setSettings} 
            onImportEntries={importEntries}
            onBulkAddEntries={addBulkEntries}
            onRemoveRandomEntries={removeRandomEntries}
          />
        )}
      </main>

      <nav className="absolute bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-2 flex justify-around items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20 transition-colors print:hidden">
        <NavButton 
          active={currentView === 'HOME'} 
          onClick={() => setCurrentView('HOME')} 
          icon={<Bottle size={24} />} 
          label="Track" 
        />
        <NavButton 
          active={currentView === 'CALENDAR'} 
          onClick={() => setCurrentView('CALENDAR')} 
          icon={<CalendarDays size={24} />} 
          label="Calendar" 
        />
        <NavButton 
          active={currentView === 'REPORT'} 
          onClick={() => setCurrentView('REPORT')} 
          icon={<Calendar size={24} />} 
          label="Reports" 
        />
        <NavButton 
          active={currentView === 'INSIGHTS'} 
          onClick={() => setCurrentView('INSIGHTS')} 
          icon={<Sparkles size={24} />} 
          label="AI Insights" 
        />
        <NavButton 
          active={currentView === 'SETTINGS'} 
          onClick={() => setCurrentView('SETTINGS')} 
          icon={<SettingsIcon size={24} />} 
          label="Settings" 
        />
      </nav>

      {editingEntry && (
        <EditEntryModal 
          entry={editingEntry} 
          settings={settings}
          onClose={() => setEditingEntry(null)} 
          onUpdate={updateEntry}
          onDelete={deleteEntry}
        />
      )}
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 transition-all duration-200 ${
      active ? 'text-blue-600 dark:text-blue-400 scale-110 font-semibold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
    }`}
  >
    {icon}
    <span className="text-[10px] uppercase tracking-wider">{label}</span>
  </button>
);

export default App;