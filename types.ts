
export enum TimelineScale {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY'
}

export interface Task {
  id: string;
  label: string;
  slots: number[]; // Array of indices representing active time slots
  color: string;
}

export interface HeaderGroup {
  id: string;
  label: string;
  start: number;
  end: number;
}

export interface TimelineTheme {
  name: string;
  bg: string;
  grid: string;
  text: string;
  accent: string;
}

export const THEMES: Record<string, TimelineTheme> = {
  modern: {
    name: 'Modern Blue',
    bg: 'bg-white',
    grid: 'border-slate-200',
    text: 'text-slate-800',
    accent: 'bg-blue-500',
  },
  dark: {
    name: 'Deep Dark',
    bg: 'bg-slate-900',
    grid: 'border-slate-700',
    text: 'text-slate-100',
    accent: 'bg-indigo-500',
  },
  minimal: {
    name: 'Soft Minimal',
    bg: 'bg-rose-50',
    grid: 'border-rose-200',
    text: 'text-rose-900',
    accent: 'bg-rose-400',
  },
  forest: {
    name: 'Nature Forest',
    bg: 'bg-emerald-50',
    grid: 'border-emerald-200',
    text: 'text-emerald-900',
    accent: 'bg-emerald-600',
  }
};
