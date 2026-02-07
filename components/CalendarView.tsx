
import React, { useState, useMemo } from 'react';
import { 
  format, 
  endOfMonth, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  isToday 
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Milk as Bottle, 
  Beaker, 
  Trash2, 
  Clock, 
  FileText,
  StickyNote
} from 'lucide-react';
import { LogEntry, EntryType, Urgency, UserSettings } from '../types';

// Fix: parseISO, subMonths, startOfMonth and startOfWeek might not be exported from some versions of date-fns
const parseISO = (s: string) => new Date(s);
const subMonths = (d: Date | string, n: number) => addMonths(new Date(d), -n);
const startOfMonth = (d: Date | string) => {
  const date = new Date(d);
  return new Date(date.getFullYear(), date.getMonth(), 1);
};
const startOfWeek = (d: Date | string) => {
  const date = new Date(d);
  const day = date.getDay(); // 0 is Sunday
  const diff = date.getDate() - day;
  return new Date(date.setDate(diff));
};

interface CalendarViewProps {
  entries: LogEntry[];
  settings: UserSettings;
  onDeleteEntry: (id: string) => void;
  onEditEntry: (entry: LogEntry) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ entries, settings, onDeleteEntry, onEditEntry }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  const getDayTotals = (date: Date) => {
    const dayEntries = entries.filter(e => isSameDay(parseISO(e.timestamp), date));
    const intake = dayEntries.filter(e => e.type === EntryType.WATER).reduce((sum, e) => sum + e.amount, 0);
    const output = dayEntries.filter(e => e.type === EntryType.URINE).reduce((sum, e) => sum + e.amount, 0);
    return { intake, output, net: intake - output };
  };

  const selectedDayEntries = useMemo(() => {
    return entries
      .filter(e => isSameDay(parseISO(e.timestamp), selectedDate))
      .sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
  }, [entries, selectedDate]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getUrgencyColor = (u?: Urgency) => {
    switch (u) {
      case Urgency.LOW: return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case Urgency.MEDIUM: return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
      case Urgency.HIGH: return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={prevMonth}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-colors text-slate-600 dark:text-slate-400"
            >
              Today
            </button>
            <button 
              onClick={nextMonth}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            const totals = getDayTotals(day);
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isTodayDate = isToday(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`relative h-20 flex flex-col items-center justify-start p-1 rounded-xl transition-all border ${
                  isSelected 
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 ring-2 ring-blue-500/20 z-10' 
                    : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                } ${!isCurrentMonth ? 'opacity-30' : ''}`}
              >
                <span className={`text-xs font-bold mb-1 ${
                  isTodayDate 
                    ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' 
                    : isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {format(day, 'd')}
                </span>
                
                {(totals.intake > 0 || totals.output > 0) && (
                  <div className="flex flex-col gap-0.5 w-full items-center">
                    {totals.intake > 0 && (
                      <div className="flex items-center gap-0.5 px-1 bg-blue-100 dark:bg-blue-900/40 rounded w-full justify-center">
                        <span className="text-[8px] font-bold text-blue-700 dark:text-blue-300">{totals.intake}</span>
                      </div>
                    )}
                    {totals.output > 0 && (
                      <div className="flex items-center gap-0.5 px-1 bg-amber-100 dark:bg-amber-900/40 rounded w-full justify-center">
                        <span className="text-[8px] font-bold text-amber-700 dark:text-amber-300">{totals.output}</span>
                      </div>
                    )}
                    {totals.intake > 0 && totals.output > 0 && (
                      <div className="text-[7px] font-bold text-slate-400 dark:text-slate-500">
                        N: {totals.net > 0 ? '+' : ''}{totals.net}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM dd, yyyy')}
          </h3>
          {selectedDayEntries.length > 0 && (
            <div className="flex gap-2">
              <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                {selectedDayEntries.filter(e => e.type === EntryType.WATER).length} Intake
              </span>
              <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                {selectedDayEntries.filter(e => e.type === EntryType.URINE).length} Urine
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2 pb-6">
          {selectedDayEntries.length === 0 ? (
            <div className="bg-white/50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 rounded-2xl flex flex-col items-center justify-center text-slate-400 transition-colors">
              <Clock size={32} className="mb-2 opacity-30" />
              <p className="text-sm font-medium">No records for this day</p>
            </div>
          ) : (
            selectedDayEntries.map(entry => {
              const intakeCat = settings.intakeCategories.find(c => c.id === entry.intakeTypeId);
              return (
                <div 
                  key={entry.id} 
                  onClick={() => onEditEntry(entry)}
                  className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group active:bg-slate-50 dark:active:bg-slate-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      entry.type === EntryType.WATER ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 
                      entry.type === EntryType.URINE ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' :
                      'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                    }`}>
                      {entry.type === EntryType.WATER ? <Bottle size={20} /> : 
                       entry.type === EntryType.URINE ? <Beaker size={20} /> : <StickyNote size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {entry.type === EntryType.NOTE ? 'Note' : `${entry.amount} ml`}
                          </span>
                          {entry.type === EntryType.WATER && intakeCat && intakeCat.id !== 'none' && (
                            <span className="text-[9px] text-blue-500 dark:text-blue-400 font-bold uppercase tracking-tight">
                              {intakeCat.label}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                          {format(parseISO(entry.timestamp), 'HH:mm')}
                        </span>
                        {entry.urgency && entry.urgency !== Urgency.EMPTY && (
                          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${getUrgencyColor(entry.urgency)}`}>
                            {entry.urgency}
                          </span>
                        )}
                      </div>
                      {entry.notes && (
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                          <FileText size={12} />
                          <span className="italic line-clamp-1">{entry.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onDeleteEntry(entry.id); 
                    }} 
                    className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 opacity-100 transition-opacity"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
