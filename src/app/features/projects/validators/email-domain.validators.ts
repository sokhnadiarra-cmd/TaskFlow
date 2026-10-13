import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Liste des domaines email de confiance.
 * Bloque les domaines manifestement fictifs (test.com, example.com, fake.dev…)
 * sans pouvoir vérifier l'existence réelle de la boîte mail.
 */
const TRUSTED_DOMAINS = new Set<string>([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'outlook.fr',
  'hotmail.com',
  'hotmail.fr',
  'live.com',
  'live.fr',
  'yahoo.com',
  'yahoo.fr',
  'icloud.com',
  'me.com',
  'protonmail.com',
  'proton.me',
  'zoho.com',
  'gmx.com',
  'gmx.fr',
  'free.fr',
  'orange.fr',
  'sfr.fr',
  'laposte.net',
  'wanadoo.fr',
]);

export const trustedEmailDomainValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = (control.value ?? '').trim().toLowerCase();
  if (!value) return null;

  const parts = value.split('@');
  if (parts.length !== 2) return null; // laisse `email` gérer

  const domain = parts[1];
  return TRUSTED_DOMAINS.has(domain) ? null : { untrustedDomain: true };
};
