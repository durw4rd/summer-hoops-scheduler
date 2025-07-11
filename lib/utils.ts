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
