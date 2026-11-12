export const PASSWORD_MIN_LENGTH = 8;

export interface PasswordCheck {
  ok: boolean;
  errors: string[];
}

export function validatePassword(pw: string): PasswordCheck {
  const errors: string[] = [];
  if (pw.length < PASSWORD_MIN_LENGTH)
    errors.push(`At least ${PASSWORD_MIN_LENGTH} characters`);
  if (!/[a-z]/.test(pw)) errors.push('One lowercase letter');
  if (!/[A-Z]/.test(pw)) errors.push('One uppercase letter');
  if (!/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pw))
    errors.push('One number or symbol');
  return { ok: errors.length === 0, errors };
}

export function describePasswordRules(): string {
  return 'At least 8 characters, with 1 uppercase, 1 lowercase, and 1 number or symbol.';
}
