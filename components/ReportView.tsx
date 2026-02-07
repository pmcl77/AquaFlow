
import React, { useState, useMemo } from 'react';
import { format, isWithinInterval, endOfDay, eachDayOfInterval, addDays } from 'date-fns';
import { Milk as Bottle, Beaker, FileText, Filter, TrendingUp, Activity, Clock, Printer, FileDown, BarChart3, AlertCircle, Hash, Info, StickyNote } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { EntryType, LogEntry, UserSettings, Urgency } from '../types';

// Fix: parseISO and startOfDay might not be exported from some versions of date-fns
const parseISO = (s: string) => new Date(s);
const startOfDay = (d: Date | string) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

interface ReportViewProps {
  entries: LogEntry[];
  settings: UserSettings;
  onEditEntry: (entry: LogEntry) => void;
  onExportCSV: (dataToExport: LogEntry[]) => void;
}

const ReportView: React.FC<ReportViewProps> = ({ entries, settings, onEditEntry, onExportCSV }) => {
  const [startDate, setStartDate] = useState<string>(format(addDays(new Date(), -7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState<string>('00:00');
  const [endTime, setEndTime] = useState<string>('23:59');

  const setRange = (days: number) => {
    const end = new Date();
    const start = addDays(end, -days);
    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
  };

  const filteredEntries = useMemo(() => {
    return entries
      .filter(e => {
        const entryDate = parseISO(e.timestamp);
        const dateInRange = isWithinInterval(entryDate, {
          start: startOfDay(parseISO(startDate)),
          end: endOfDay(parseISO(endDate))
        });
        if (!dateInRange) return false;
        const entryTimeStr = format(entryDate, 'HH:mm');
        return entryTimeStr >= startTime && entryTimeStr <= endTime;
      })
      .sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
  }, [entries, startDate, endDate, startTime, endTime]);

  const activeDaysCount = useMemo(() => {
    const activeDates = new Set(
      filteredEntries
        .filter(e => e.type === EntryType.WATER || e.type === EntryType.URINE)
        .map(e => format(parseISO(e.timestamp), 'yyyy-MM-dd'))
    );
    return Math.max(1, activeDates.size);
  }, [filteredEntries]);

  const dailyTrendsData = useMemo(() => {
    const days = eachDayOfInterval({
      start: parseISO(startDate),
      end: parseISO(endDate)
    });
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayEntries = filteredEntries.filter(e => format(parseISO(e.timestamp), 'yyyy-MM-dd') === dayStr);
      const intake = dayEntries.filter(e => e.type === EntryType.WATER).reduce((s, e) => s + e.amount, 0);
      const output = dayEntries.filter(e => e.type === EntryType.URINE).reduce((s, e) => s + e.amount, 0);
      return { date: format(day, 'MMM dd'), intake, output, net: intake - output };
    });
  }, [filteredEntries, startDate, endDate]);

  const partOfDayData = useMemo(() => {
    const { dayParts } = settings;
    const parts = [
      { name: 'Night', range: [dayParts.night.start, dayParts.night.end], water: 0, urine: 0 },
      { name: 'Morning', range: [dayParts.morning.start, dayParts.morning.end], water: 0, urine: 0 },
      { name: 'Afternoon', range: [dayParts.afternoon.start, dayParts.afternoon.end], water: 0, urine: 0 },
      { name: 'Evening', range: [dayParts.evening.start, dayParts.evening.end], water: 0, urine: 0 },
    ];
    filteredEntries.forEach(e => {
      if (e.type === EntryType.NOTE) return;
      const timeStr = format(parseISO(e.timestamp), 'HH:mm');
      const part = parts.find(p => timeStr >= p.range[0] && timeStr <= p.range[1]);
      if (part) {
        if (e.type === EntryType.WATER) part.water += e.amount;
        else part.urine += e.amount;
      }
    });
    return parts.map(p => ({
      name: p.name,
      Intake: Math.round(p.water / activeDaysCount),
      Urine: Math.round(p.urine / activeDaysCount)
    }));
  }, [filteredEntries, activeDaysCount, settings.dayParts]);

  const stats = useMemo(() => {
    const waterEntries = filteredEntries.filter(e => e.type === EntryType.WATER);
    const urineEntries = filteredEntries.filter(e => e.type === EntryType.URINE);
    
    const totalWaterVol = waterEntries.reduce((s, e) => s + e.amount, 0);
    const totalUrineVol = urineEntries.reduce((s, e) => s + e.amount, 0);
    
    return { 
      avgIntakePerDay: Math.round(totalWaterVol / activeDaysCount),
      avgUrinePerDay: Math.round(totalUrineVol / activeDaysCount),
      avgNetPerDay: Math.round((totalWaterVol - totalUrineVol) / activeDaysCount),
      avgIntakeEntriesPerDay: Number((waterEntries.length / activeDaysCount).toFixed(1)),
      avgUrineEntriesPerDay: Number((urineEntries.length / activeDaysCount).toFixed(1))
    };
  }, [filteredEntries, activeDaysCount]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    onExportCSV(filteredEntries);
  };

  const getUrgencyColor = (u?: Urgency) => {
    switch (u) {
      case Urgency.LOW: return 'text-blue-500';
      case Urgency.MEDIUM: return 'text-orange-500';
      case Urgency.HIGH: return 'text-red-500';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6 print:space-y-10">
      <div className="hidden print:block text-center border-b pb-4">
        <h1 className="text-2xl font-bold">AquaFlow Health Report</h1>
        <p className="text-sm text-slate-500">Period: {format(parseISO(startDate), 'MMM dd, yyyy')} to {format(parseISO(endDate), 'MMM dd, yyyy')}</p>
        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Averages calculated over {activeDaysCount} active days</p>
        <p className="text-xs text-slate-400 mt-1">Generated on {format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4 transition-colors print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-blue-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Report Settings</h2>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setRange(0)} className="px-2 py-1 text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded hover:bg-slate-200 transition-colors">Today</button>
            <button onClick={() => setRange(7)} className="px-2 py-1 text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded hover:bg-slate-200 transition-colors">7D</button>
            <button onClick={() => setRange(30)} className="px-2 py-1 text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded hover:bg-slate-200 transition-colors">30D</button>
          </div>
        </div>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Activity size={10} /> Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Activity size={10} /> End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none dark:text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-slate-50 dark:border-slate-800 pt-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1"><Clock size={10} /> Day Starts</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1"><Clock size={10} /> Day Ends</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none dark:text-white" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-[0.98] text-sm"
          >
            <Printer size={18} /> PDF / Print
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-[0.98] text-sm"
          >
            <FileDown size={18} /> Save as CSV
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 py-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 px-4 transition-colors">
        <Info size={14} className="text-blue-500" />
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Averages calculated over {activeDaysCount} active days in this range</span>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors overflow-hidden print:border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-slate-400" />
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Daily Trends</h2>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyTrendsData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
              <XAxis dataKey="date" fontSize={10} stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis fontSize={10} stroke="#94a3b8" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'rgba(0,0,0,0.8)', color: '#fff' }} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px' }} />
              <Line type="monotone" dataKey="intake" stroke="#3b82f6" strokeWidth={3} dot={false} name="Intake" />
              <Line type="monotone" dataKey="output" stroke="#f59e0b" strokeWidth={3} dot={false} name="Urine" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors overflow-hidden print:border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-slate-400" />
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Daily Distribution (Avg)</h2>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={partOfDayData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
              <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis fontSize={10} stroke="#94a3b8" tickLine={false} axisLine={false} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'rgba(0,0,0,0.8)', color: '#fff' }} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="Intake" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Urine" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-3 print:break-before-page">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Detailed Metrics (per active day)</h3>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 print:border-slate-200 transition-colors">
          <MetricRow label="Avg Intake Volume" value={`${stats.avgIntakePerDay} ml`} icon={<Bottle size={12} className="text-blue-500" />} />
          <MetricRow label="Avg Urine Volume" value={`${stats.avgUrinePerDay} ml`} icon={<Beaker size={12} className="text-amber-500" />} />
          <MetricRow label="Avg Net Balance" value={`${stats.avgNetPerDay} ml`} icon={<Activity size={12} className="text-emerald-500" />} />
          <MetricRow label="Avg Intake Entries" value={stats.avgIntakeEntriesPerDay} icon={<Hash size={12} className="text-blue-400" />} />
          <MetricRow label="Avg Urine Entries" value={stats.avgUrineEntriesPerDay} icon={<Hash size={12} className="text-amber-400" />} />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Log Entries ({filteredEntries.length})</h3>
        {filteredEntries.length === 0 ? (
          <p className="text-center py-10 text-slate-400 text-sm italic bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 transition-colors">No entries match your filters</p>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden print:border-slate-200 transition-colors">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Date/Time</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Type</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px] text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800 transition-colors">
                {filteredEntries.map(e => {
                  const intakeCat = settings.intakeCategories.find(c => c.id === e.intakeTypeId);
                  return (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => onEditEntry(e)}>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-600 dark:text-slate-300">{format(parseISO(e.timestamp), 'HH:mm')}</span>
                          <span className="text-[9px] text-slate-400 uppercase font-bold">{format(parseISO(e.timestamp), 'MMM dd')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-semibold">
                          {e.type === EntryType.WATER ? <Bottle size={14} className="text-blue-500" /> : 
                           e.type === EntryType.URINE ? <Beaker size={14} className="text-amber-500" /> :
                           <StickyNote size={14} className="text-indigo-500" />}
                          <div className="flex flex-col">
                            <span className={
                              e.type === EntryType.WATER ? 'text-blue-700 dark:text-blue-400' : 
                              e.type === EntryType.URINE ? 'text-amber-700 dark:text-amber-400' :
                              'text-indigo-700 dark:text-indigo-400'
                            }>
                              {e.type === EntryType.WATER ? 'Intake' : e.type === EntryType.URINE ? 'Urine' : 'Note'}
                            </span>
                            {e.type === EntryType.WATER && intakeCat && intakeCat.id !== 'none' && (
                              <span className="text-[9px] text-blue-500/70 font-bold uppercase">{intakeCat.label}</span>
                            )}
                          </div>
                          {e.urgency && e.urgency !== Urgency.EMPTY && (
                            <AlertCircle size={12} className={`ml-1 ${getUrgencyColor(e.urgency)}`} title={`Urgency: ${e.urgency}`} />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                        {e.type === EntryType.NOTE ? '—' : `${e.amount} ml`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const MetricRow: React.FC<{ label: string, value: string | number, icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="flex items-center justify-between px-4 py-3">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
    </div>
    <span className="font-bold text-slate-900 dark:text-slate-100">{value}</span>
  </div>
);

export default ReportView;
