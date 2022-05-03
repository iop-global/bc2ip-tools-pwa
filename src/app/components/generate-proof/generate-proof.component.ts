import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { catchError, concatMap, map, shareReplay } from 'rxjs/operators';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { from, Observable, of } from 'rxjs';
import * as JSZip from 'jszip';
import { SDKWebService } from 'src/app/services/sdk-webservice.service';

type ValidatorStatusType = 'pending' | 'invalid' | 'valid' | 'undetermined';

interface ValidatorResult {
  data: any;
  messages?: string[];
  status: ValidatorStatusType;
}

interface Validator<T> {
  label: string;
  validator: Observable<ValidatorResult>;
}

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-generate-proof',
  templateUrl: './generate-proof.component.html',
})
export class GenerateProofComponent implements OnInit {
  stepperOrientation = this.breakpoint
    .observe('(min-width: 600px)')
    .pipe(map(({ matches }) => (matches ? 'horizontal' : 'vertical')));

  fileValidator = () =>
    this.fileValidators['isValidArchive'].validator.pipe(
      map((result) => (result.status === 'valid' ? null : { invalid: true }))
    );

  fileForm = new FormGroup({
    file: new FormControl(null, Validators.required, this.fileValidator),
  });

  readonly fileValidators: {
    [key: string]: Validator<any>;
  } = {};

  constructor(
    readonly breakpoint: BreakpointObserver,
    readonly webService: SDKWebService
  ) {}

  ngOnInit() {
    this.fileValidators['isValidArchive'] = {
      label: 'Valid ZIP archive.',
      validator: this.fileForm.get('file')!.valueChanges.pipe(
        concatMap((file: File | null) =>
          file === null
            ? of(null)
            : from(new JSZip().loadAsync(file)).pipe(catchError(() => of(null)))
        ),
        map(
          (zipFile: JSZip | null) =>
            <ValidatorResult>{
              data: zipFile,
              status: zipFile === null ? 'invalid' : 'valid',
            }
        ),
        shareReplay({
          bufferSize: 1,
          refCount: true,
        })
      ),
    };
  }

  selectFile(event: Event) {
    const files = (event.target as HTMLInputElement).files;

    if (!!files && files.length === 1) {
      this.fileForm.get('file')?.setValue(files[0]);
    }
  }

  clearFile() {
    this.fileForm.get('file')?.setValue(null);
  }
}
