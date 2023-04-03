import { AbstractControl, ValidationErrors } from '@angular/forms';
import { passwordStrength } from 'check-password-strength';

export const passwordStrengthValidator = (control: AbstractControl): ValidationErrors | null => {
  if (!control.parent) {
    return null;
  }

  const result = passwordStrength(control.value);
  if (['Medium', 'Strong'].includes(result.value)) {
    return null;
  }

  return { weakPassword: true };
};

export const passwordRepeatValidator = (control: AbstractControl): ValidationErrors | null => {
  if (!control.parent) {
    return null;
  }

  const password = control.parent.get('password');

  if (password?.value !== control.value) {
    return { passwordsDoNotMatch: true };
  }

  return null;
};
