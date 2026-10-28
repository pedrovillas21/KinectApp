/** Primeiro nome ("Ana Maria Souza" → "Ana"). */
export const firstNameOf = (fullName: string): string => fullName.trim().split(/\s+/)[0] ?? fullName;
