import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import {
  catchError,
  concatMap,
  map,
  shareReplay,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { forkJoin, from, merge, Observable, of } from 'rxjs';
import * as JSZip from 'jszip';
import {
  digestJson,
  PublicKey,
  Signature,
  SignedJson,
} from '@internet-of-people/sdk-wasm';
import { blake2b } from 'hash-wasm';
import {
  Layer1,
  Layer2,
  Network,
  NetworkConfig,
} from '@internet-of-people/sdk';
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

const networkConfig = NetworkConfig.fromNetwork(Network.Devnet);

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-inspect-proof',
  templateUrl: './inspect-proof.component.html',
})
export class InspectProofComponent implements OnInit {
  stepperOrientation = this.breakpoint
    .observe('(min-width: 600px)')
    .pipe(map(({ matches }) => (matches ? 'horizontal' : 'vertical')));

  fileValidator = () =>
    this.fileValidators['isValidArchive'].validator.pipe(
      map((result) => (result.status === 'valid' ? null : { invalid: true }))
    );

  inspectForm = new FormGroup({
    file: new FormControl(null, Validators.required, this.fileValidator),
  });

  proofForm = new FormGroup({
    fileNames: new FormControl(null, Validators.required),
  });

  readonly fileValidators: {
    [key: string]: Validator<any>;
  } = {};

  readonly proofValidators: {
    [key: string]: Validator<any>;
  } = {};

  constructor(
    readonly breakpoint: BreakpointObserver,
    readonly webService: SDKWebService
  ) {}

  ngOnInit() {
    this.fileValidators['isValidArchive'] = {
      label: 'Valid ZIP archive.',
      validator: this.inspectForm.get('file')!.valueChanges.pipe(
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

    this.proofValidators['isSignedPresentationFound'] = {
      label: 'Signed-presentation.json found.',
      validator: merge(
        of(<ValidatorResult>{
          data: null,
          status: 'pending',
        }),
        this.fileValidators['isValidArchive'].validator.pipe(
          map(
            (result) =>
              <ValidatorResult>{
                data: result.data,
                status:
                  result.status === 'valid' &&
                  Object.keys(result.data.files).includes(
                    'signed-presentation.json'
                  )
                    ? 'valid'
                    : 'invalid',
              }
          )
        )
      ).pipe(
        shareReplay({
          bufferSize: 1,
          refCount: true,
        })
      ),
    };

    this.proofValidators['isSignedPresentationValid'] = {
      label: 'Valid signed-presentation.json.',
      validator: this.proofValidators[
        'isSignedPresentationFound'
      ].validator.pipe(
        concatMap((result) =>
          result.status === 'pending'
            ? of(<ValidatorResult>{
                data: null,
                status: 'pending',
              })
            : result.status === 'invalid'
            ? of(<ValidatorResult>{
                data: null,
                status: 'invalid',
              })
            : from(
                result.data.files['signed-presentation.json'].async('text')
              ).pipe(
                map((fileText: any) => {
                  const fileJson = JSON.parse(fileText);

                  const pubKey = new PublicKey(fileJson.signature.publicKey);

                  const signature = new Signature(fileJson.signature.bytes);

                  const signedJson = new SignedJson(
                    pubKey,
                    fileJson.content,
                    signature
                  );

                  const isSignedPresentationValid = signedJson.validate();

                  if (!isSignedPresentationValid) {
                    return <ValidatorResult>{
                      data: null,
                      status: 'invalid',
                    };
                  }

                  const messages: string[] = [];

                  const validUntil = new Date(
                    signedJson.content.licenses[0].validUntil
                  );

                  const isExpired = validUntil < new Date();

                  if (isExpired) {
                    messages.push(
                      `Expired at ${new Intl.DateTimeFormat('en-US', {
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      }).format(validUntil)}`
                    );
                  }

                  messages.push(
                    `Project name: ${fileJson.content.provenClaims[0].claim.content.projectName}`,
                    `Project version Id: ${fileJson.content.provenClaims[0].claim.content.versionId}`,
                    `Purpose of license: ${fileJson.content.licenses[0].purpose}`
                  );
                  return <ValidatorResult>{
                    data: fileJson,
                    messages,
                    status: isExpired ? 'undetermined' : 'valid',
                  };
                })
              )
        ),
        shareReplay({
          bufferSize: 1,
          refCount: true,
        })
      ),
    };

    this.proofValidators['proofIntegrity'] = {
      label: 'Proof integrity.',
      validator: this.proofValidators[
        'isSignedPresentationValid'
      ].validator.pipe(
        withLatestFrom(this.fileValidators['isValidArchive'].validator),
        concatMap(([presentationResult, zipResult]) => {
          if (
            presentationResult.status !== 'valid' &&
            presentationResult.status !== 'undetermined'
          ) {
            return of(presentationResult);
          }

          const claimedFiles =
            presentationResult.data.content.provenClaims[0].claim.content.files;

          const nonCollapsedClaimFiles = Object.values(claimedFiles).filter(
            (f) => typeof f !== 'string'
          );

          if (
            Object.keys(nonCollapsedClaimFiles).length !==
            Object.keys(zipResult.data.files).length - 1 // -1, because the zip contains the statement, but the statement does not contain itself
          ) {
            return of(<ValidatorResult>{
              data: null,
              messages: ['Proof contains different amount of files.'],
              status: 'invalid',
            });
          }

          const sortedNotCollapsedClaimedFiles = nonCollapsedClaimFiles
            .map((f: any) => f.fileName)
            .sort();

          const filesInZip = Object.keys(zipResult.data.files)
            .filter((f) => f !== 'signed-presentation.json')
            .sort();

          if (
            JSON.stringify(sortedNotCollapsedClaimedFiles) !==
            JSON.stringify(filesInZip)
          ) {
            return of(<ValidatorResult>{
              data: null,
              messages: ['Contains different files.'],
              status: 'invalid',
            });
          }

          return forkJoin(
            nonCollapsedClaimFiles.map((file: any) =>
              from(
                zipResult.data.files[file.fileName].async('uint8array')
              ).pipe(
                concatMap((fileContent: any) => blake2b(fileContent)),
                map((fileHash) =>
                  fileHash !== file.hash ? file.fileName : null
                )
              )
            )
          ).pipe(
            map((hashChecks) => {
              const invalidHashes = hashChecks.filter((h) => h !== null);

              return invalidHashes.length > 0
                ? <ValidatorResult>{
                    data: null,
                    messages: [`Invalid hashes: ${invalidHashes.join(', ')}`],
                    status: 'invalid',
                  }
                : <ValidatorResult>{
                    data: presentationResult.data,
                    status: 'valid',
                  };
            })
          );
        }),
        shareReplay({
          bufferSize: 1,
          refCount: true,
        })
      ),
    };

    this.proofValidators['proofOnBlockChain'] = {
      label: 'Proof exists on blockchain.',
      validator: this.proofValidators['proofIntegrity'].validator.pipe(
        concatMap((result) => {
          if (result.status !== 'valid') {
            return of(<ValidatorResult>{
              data: null,
              status: 'invalid',
            });
          }

          const collapsedSignedWitnessStatement =
            result.data.content.provenClaims[0].statements[0];

          const proof = digestJson(collapsedSignedWitnessStatement);

          return from(
            Layer2.createMorpheusApi(networkConfig).getBeforeProofHistory(proof)
          ).pipe(
            withLatestFrom(this.fileValidators['isValidArchive'].validator),
            tap(([history, zipResult]) =>
              this.proofForm
                .get('fileNames')
                ?.setValue(
                  Object.keys(zipResult.data.files).filter(
                    (f) => f !== 'signed-presentation.json'
                  )
                )
            ),
            concatMap(([history]) =>
              from(Layer1.createApi(networkConfig)).pipe(
                concatMap((api) =>
                  from(api.getCurrentHeight()).pipe(
                    map(
                      (currentHeight) =>
                        <ValidatorResult>{
                          data: { ...history, currentHeight },
                          messages: [
                            `Exists since: block ${Intl.NumberFormat().format(
                              history.existsFromHeight!
                            )}`,
                            `Current height: ${Intl.NumberFormat().format(
                              currentHeight
                            )}`,
                          ],
                          status: 'valid',
                        }
                    )
                  )
                )
              )
            )
          );
        }),
        shareReplay({
          bufferSize: 1,
          refCount: true,
        })
      ),
    };

    this.proofValidators['proofRight'] = {
      label: 'Proof creator has impersonate right to the project now.',
      validator: this.proofValidators['proofOnBlockChain'].validator.pipe(
        withLatestFrom(
          this.proofValidators['isSignedPresentationValid'].validator
        ),
        concatMap(([proofResult, presentationResult]) => {
          if (proofResult.status !== 'valid') {
            return of(<ValidatorResult>{
              data: null,
              status: 'invalid',
            });
          }

          const subjectDid =
            presentationResult.data.content.provenClaims[0].claim.subject;

          return this.webService
            .hasRightAt(
              subjectDid,
              presentationResult.data.signature.publicKey,
              proofResult.data.currentHeight
            )
            .pipe(
              catchError(() => of(false)),
              map(
                (hasright) =>
                  <ValidatorResult>{
                    data: null,
                    status: hasright ? 'valid' : 'invalid',
                  }
              )
            );
        }),
        shareReplay({
          bufferSize: 1,
          refCount: true,
        })
      ),
    };

    //     const subjectDid =
    //       signedPresentationJson.content.provenClaims[0].claim.subject;
    //     const height = await this.layer1Api?.getCurrentHeight();
    //     this.currentHeight = height + '';
    //     const signerHasRightAtTheMoment = await firstValueFrom(
    //       this.sdkWebService.hasRightAt(
    //         subjectDid,
    //         signedPresentationJson.signature.publicKey,
    //         height!
    //       )
    //     );
  }

  selectFile(event: Event) {
    const files = (event.target as HTMLInputElement).files;

    if (!!files && files.length === 1) {
      this.inspectForm.get('file')?.setValue(files[0]);
      this.proofForm.get('fileNames')?.setValue(null);
    }
  }

  downloadFile(fileName: string) {
    this.fileValidators['isValidArchive'].validator
      .pipe(
        concatMap((result) =>
          from((result.data as JSZip).files[fileName].async('blob')).pipe(
            tap((blob) => {
              const a = document.createElement('a');
              a.href = window.URL.createObjectURL(blob);
              a.download = fileName;
              a.click();
            })
          )
        )
      )
      .subscribe();
  }

  clearFile() {
    this.inspectForm.get('file')?.setValue(null);
    this.proofForm.get('fileNames')?.setValue(null);
  }
}