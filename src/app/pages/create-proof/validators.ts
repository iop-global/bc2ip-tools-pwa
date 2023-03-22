import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';

export const passwordRequiredValidator = (
  control: AbstractControl
): ValidationErrors | null => {
  if (!control.parent) {
    return null;
  }
  if (control.parent.get('protectWithPassword')?.value) {
    return Validators.required(control);
  }

  return null;
};

export const passwordRepeatValidator = (
  control: AbstractControl
): ValidationErrors | null => {
  if (!control.parent) {
    return null;
  }

  const checkbox = control.parent.get('protectWithPassword');
  const password = control.parent.get('password');

  if (checkbox?.value && password?.value !== control.value) {
    return { passwordsDoNotMatch: true };
  }

  return null;
};
