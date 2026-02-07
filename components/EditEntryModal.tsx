
import React, { useState } from 'react';
import { X, Trash2, Milk as Bottle, Beaker, Check, AlertCircle, StickyNote } from 'lucide-react';
import { format } from 'date-fns';
import { EntryType, LogEntry, Urgency, UserSettings } from '../types';

// Fix: parseISO might not be exported from some versions of date-fns
const parseISO = (s: string) => new Date(s);

interface EditEntryModalProps {
  entry: LogEntry;
  settings: UserSettings;
  onClose: () => void;
  onUpdate: (id: string, updatedData: Omit<LogEntry, 'id'>) => void;
  onDelete: (id: string) => void;
}

const EditEntryModal: React.FC<EditEntryModalProps> = ({ entry, settings, onClose, onUpdate, onDelete }) => {
  const [type, setType] = useState<EntryType>(entry.type);
  const [intakeTypeId, setIntakeTypeId] = useState<string>(entry.intakeTypeId || 'none');
  const [amount, setAmount] = useState<number>(entry.amount);
  const [timestamp, setTimestamp] = useState<string>(format(parseISO(entry.timestamp), "yyyy-MM-dd'T'HH:mm"));
  const [notes, setNotes] = useState<string>(entry.notes);
  const [urgency, setUrgency] = useState<Urgency>(entry.urgency || Urgency.EMPTY);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(entry.id, {
      type,
      intakeTypeId: type === EntryType.WATER ? intakeTypeId : undefined,
      amount: type === EntryType.NOTE ? 0 : amount,
      timestamp: new Date(timestamp).toISOString(),
      notes,
      urgency: type === EntryType.URINE ? urgency : undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border dark:border-slate-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Edit Log</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"><X size={20} /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {(['WATER', 'URINE', 'NOTE'] as EntryType[]).map((t) => (
                <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${type === t ? 'bg-slate-900 dark:bg-blue-600 text-white' : 'text-slate-500'}`}>
                  {t === 'WATER' ? 'Intake' : t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className={`grid ${type === EntryType.NOTE ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
              {type !== EntryType.NOTE && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Amount (ml)</label>
                  <input type="number" value={amount} onChange={(e) => setAmount(+e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl px-4 py-3 text-lg font-bold outline-none dark:text-white" required />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Time</label>
                <input type="datetime-local" value={timestamp} onChange={(e) => setTimestamp(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none dark:text-white" required />
              </div>
            </div>

            {type === EntryType.URINE && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Urgency</label>
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  {[Urgency.EMPTY, Urgency.LOW, Urgency.MEDIUM, Urgency.HIGH].map((u) => (
                    <button key={u} type="button" onClick={() => setUrgency(u)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${urgency === u ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-400'}`}>
                      {u === 'EMPTY' ? 'None' : u}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {type === EntryType.WATER && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Type of Intake</label>
                <select value={intakeTypeId} onChange={(e) => setIntakeTypeId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none dark:text-white">
                  {settings.intakeCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Details..." className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none min-h-[80px] dark:text-white" required={type === EntryType.NOTE} />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { onDelete(entry.id); onClose(); }} className="p-4 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl active:scale-95"><Trash2 size={20} /></button>
              <button type="submit" className="flex-1 bg-slate-900 dark:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95">Update Entry</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditEntryModal;
