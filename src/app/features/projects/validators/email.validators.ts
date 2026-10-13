import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Regex volontairement stricte :
 * - partie locale : lettres/chiffres + . _ % + - (pas de début/fin par un point)
 * - domaine : lettres/chiffres + . - (pas de début/fin par un point ni un tiret)
 * - TLD : au moins 2 lettres
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

export const strictEmailValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = (control.value ?? '').trim();
  if (!value) return null;   // laisse `required` gérer le vide
  return EMAIL_REGEX.test(value) ? null : { strictEmail: true };
};
