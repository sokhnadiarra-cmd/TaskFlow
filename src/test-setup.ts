import { getTestBed } from '@angular/core/testing';
import { afterEach } from 'vitest';

/**
 * Reset le TestBed après CHAQUE test.
 *
 * Note : le builder Angular 22 (@angular/build:unit-test) initialise
 * DÉJÀ l'environnement de test (initTestEnvironment).
 * On ne doit donc PAS le refaire ici, sinon on obtient :
 *   "Cannot set base providers because it has already been called"
 */
afterEach(() => {
  getTestBed().resetTestingModule();
});
