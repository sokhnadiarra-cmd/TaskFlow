import { AbstractControl, AsyncValidatorFn, ValidationErrors } from "@angular/forms";
import { ProjetsService } from "../services/projets";
import { catchError, delay, map, Observable, of } from "rxjs";

export function uniqueProjectNameValidator(
  projectService: ProjetsService,
  excludeId?: number,
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const name = (control.value ?? '').trim().toLowerCase();
    if (!name) return of(null);

    return projectService.searchByName(name).pipe(
      map((matches) => {
        const exists = matches.some(
          (p) =>
            p.name.trim().toLowerCase() === name.toLowerCase() &&
            p.id !== excludeId,   // ← on ignore le projet en cours d'édition
        );
        return exists ? { nameTaken: true } : null;
      }),
      catchError(() => of(null)),
    );
  };
}
