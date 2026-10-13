/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

/**
 * Configuration Vitest pour Angular 22.
 * On limite le parallélisme pour éviter les timeouts de démarrage
 * de workers sur les machines un peu lentes.
 */
export default defineConfig({
  test: {
    pool: 'forks',
    testTimeout: 20000,
    hookTimeout: 20000,
    reporters: ['default'],
  },
});
