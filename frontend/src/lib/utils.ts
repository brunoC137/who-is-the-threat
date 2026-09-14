import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Lowercased and stripped of accents, for matching search text: "amem" finds
 * "amém" and "joao" finds "João".
 */
export function normalizeSearch(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * A CSS url() for an arbitrary image address. Quoted and escaped, so an
 * address with spaces, parentheses or quotes (common in uploaded file names)
 * cannot silently break the declaration and drop the image.
 */
export function cssUrl(url: string): string {
  return `url(${JSON.stringify(url)})`;
}
