import { AbstractControl, AsyncValidator, AsyncValidatorFn, ValidationErrors } from "@angular/forms";
import { ProjetsService } from "../../../shared/services/projets";
import { delay, map, Observable, of, retry } from "rxjs";
import { ValidationError } from "@angular/forms/signals";

export function uniqueProjectNameValidator(projectService: ProjetsService): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
        const name = (control.value ?? '').trim().toLowerCase();

        if(!name) return of(null);

        return of(name).pipe(
            delay(400),
            map(value => {
                const exists = projectService.projects().some(p => p.name.trim().toLowerCase === value);
                return exists ? { nameTaken: true } : null;
            })
        )
    }


}