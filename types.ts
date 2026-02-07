
export enum EntryType {
  WATER = 'WATER',
  URINE = 'URINE',
  NOTE = 'NOTE'
}

export interface IntakeCategory {
  id: string;
  label: string;
  isDeletable: boolean;
}

export enum Urgency {
  EMPTY = 'EMPTY',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum Theme {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  SYSTEM = 'SYSTEM'
}

export type Sex = 'MALE' | 'FEMALE' | 'OTHER' | 'UNSPECIFIED';

export interface QuickButton {
  id: string;
  type: EntryType;
  label: string;
  amount: number;
}

export interface LogEntry {
  id: string;
  type: EntryType;
  intakeTypeId?: string; // ID from IntakeCategory
  amount: number;
  timestamp: string; // ISO string
  notes: string;
  urgency?: Urgency;
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface DayParts {
  night: TimeRange;
  morning: TimeRange;
  afternoon: TimeRange;
  evening: TimeRange;
}

export interface UserSettings {
  defaultWaterAmount: number;
  defaultUrineAmount: number;
  amountIncrement: number;
  quickButtons: QuickButton[];
  intakeCategories: IntakeCategory[];
  theme: Theme;
  age: number;
  sex: Sex;
  dayParts: DayParts;
}

export type View = 'HOME' | 'CALENDAR' | 'REPORT' | 'INSIGHTS' | 'SETTINGS';
