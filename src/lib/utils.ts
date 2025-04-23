import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeSince(createdAt: string | Date): string {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();
  
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 5) return "Just now";
  if (diffHours < 1) return `${diffMins} mins ago`;
  if (diffDays < 1) {
    const remainingMins = diffMins % 60;
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}${remainingMins ? ` and ${remainingMins} min${remainingMins > 1 ? 's' : ''}` : ''} ago`;
  }
  
  const remainingHours = diffHours % 24;
  return `${diffDays} day${diffDays > 1 ? 's' : ''}${remainingHours ? ` and ${remainingHours} hour${remainingHours > 1 ? 's' : ''}` : ''} ago`;
}
