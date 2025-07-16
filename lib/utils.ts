import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDayOfWeek(dateStr: string) {
  const [day, month] = dateStr.split('.').map(Number);
  const date = new Date(new Date().getFullYear(), month - 1, day);
  return date.toLocaleDateString(undefined, { weekday: 'short' }); // e.g., 'Mon', 'Tue'
}

export function compareSlotsByDateTime(a: { Date: string, Time: string }, b: { Date: string, Time: string }) {
  // Date format: DD.MM, Time format: HH:MM - HH:MM
  const [dayA, monthA] = a.Date.split('.').map(Number);
  const [dayB, monthB] = b.Date.split('.').map(Number);
  const dateA = new Date(new Date().getFullYear(), monthA - 1, dayA);
  const dateB = new Date(new Date().getFullYear(), monthB - 1, dayB);
  if (dateA < dateB) return -1;
  if (dateA > dateB) return 1;
  // If dates are equal, compare start time (HH:MM)
  const startTimeA = a.Time.split('-')[0].trim();
  const startTimeB = b.Time.split('-')[0].trim();
  const [hourA, minA] = startTimeA.split(':').map(Number);
  const [hourB, minB] = startTimeB.split(':').map(Number);
  if (hourA !== hourB) return hourA - hourB;
  return minA - minB;
}
