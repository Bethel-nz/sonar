import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// just cn renamed to cx, sounds wayy cooler
export function cx(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
