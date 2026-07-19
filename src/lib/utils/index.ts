import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(amount)
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateString))
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const AUTH_ERROR_TRANSLATIONS: Record<string, string> = {
  'User already registered': 'Użytkownik o tym adresie e-mail już istnieje',
  'Password should be at least 6 characters': 'Hasło musi mieć co najmniej 6 znaków',
  'Password should be at least 8 characters': 'Hasło musi mieć co najmniej 8 znaków',
  'Unable to validate email address: invalid format': 'Nieprawidłowy format adresu e-mail',
  'Signup requires a valid password': 'Podaj prawidłowe hasło',
  'Invalid login credentials': 'Nieprawidłowy e-mail lub hasło',
  'Email not confirmed': 'E-mail nie został potwierdzony',
  'Email rate limit exceeded': 'Zbyt wiele prób. Spróbuj ponownie za chwilę',
  'Email link is invalid or has expired': 'Link wygasł lub jest nieprawidłowy',
  'For security purposes, you can only request this after some time.':
    'Ze względów bezpieczeństwa możesz spróbować ponownie dopiero za chwilę',
}

export const BANNED_ACCOUNT_MESSAGE =
  'Twoje konto zostało zablokowane przez administratora. Skontaktuj się z pomocą, jeśli uważasz, że to pomyłka.'

export function translateAuthError(message: string): string {
  if (/banned/i.test(message)) return BANNED_ACCOUNT_MESSAGE
  return AUTH_ERROR_TRANSLATIONS[message] ?? message
}
