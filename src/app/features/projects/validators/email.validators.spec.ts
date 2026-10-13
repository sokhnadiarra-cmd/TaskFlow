import { FormControl } from '@angular/forms';
import { strictEmailValidator } from './email.validators';

describe('strictEmailValidator', () => {
  function validate(value: string) {
    return strictEmailValidator(new FormControl(value));
  }

  it('retourne null si le champ est vide (required s\'en charge)', () => {
    expect(validate('')).toBeNull();
    expect(validate('   ')).toBeNull();
  });

  it('accepte une adresse email valide', () => {
    expect(validate('user@gmail.com')).toBeNull();
    expect(validate('prenom.nom@outlook.fr')).toBeNull();
    expect(validate('a+tag@sub.domain.co.uk')).toBeNull();
  });

  it('rejette les emails sans TLD', () => {
    expect(validate('user@domain')).toEqual({ strictEmail: true });
  });

  it('rejette les emails sans @', () => {
    expect(validate('user.domain.com')).toEqual({ strictEmail: true });
  });

  it('rejette les emails avec un début par un point', () => {
    expect(validate('.user@domain.com')).toEqual({ strictEmail: true });
  });

  it('rejette les emails avec un domaine commençant par un tiret', () => {
    expect(validate('user@-domain.com')).toEqual({ strictEmail: true });
  });

  it('rejette les emails avec un TLD de 1 caractère', () => {
    expect(validate('user@domain.c')).toEqual({ strictEmail: true });
  });

  it('ignore les espaces autour de la valeur', () => {
    expect(validate('   user@gmail.com   ')).toBeNull();
  });
});
