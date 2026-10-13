import { FormBuilder } from '@angular/forms';
import { passwordsMatchValidator } from './passwords-match.validators';

describe('passwordsMatchValidator', () => {
  const fb = new FormBuilder();

  /** Petit helper pour construire un groupe avec les 2 champs. */
  function buildGroup(password: string, confirmPassword: string) {
    return fb.nonNullable.group(
      { password: [password], confirmPassword: [confirmPassword] },
      { validators: [passwordsMatchValidator] },
    );
  }

  it('retourne null si les deux mots de passe correspondent', () => {
    const group = buildGroup('secret123', 'secret123');
    expect(group.errors).toBeNull();
  });

  it('retourne passwordsMismatch si les mots de passe diffèrent', () => {
    const group = buildGroup('secret123', 'autre-chose');
    expect(group.errors).toEqual({ passwordsMismatch: true });
  });

  it('retourne null si un des deux champs est vide (required s\'en charge)', () => {
    expect(buildGroup('', 'secret123').errors).toBeNull();
    expect(buildGroup('secret123', '').errors).toBeNull();
    expect(buildGroup('', '').errors).toBeNull();
  });

  it('est sensible à la casse', () => {
    const group = buildGroup('Secret123', 'secret123');
    expect(group.errors).toEqual({ passwordsMismatch: true });
  });
});
