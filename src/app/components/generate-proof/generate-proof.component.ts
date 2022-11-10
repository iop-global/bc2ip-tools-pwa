import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { combineLatest, forkJoin, from, merge, of } from 'rxjs';
import { SDKWebService } from 'src/app/services/sdk-webservice.service';
import { FlatTreeControl } from '@angular/cdk/tree';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';
import { SelectionModel } from '@angular/cdk/collections';
import {
  digestJson,
  MorpheusPlugin,
  selectiveDigestJson,
  Vault,
} from '@internet-of-people/sdk-wasm';

import { Crypto, Types } from '@internet-of-people/sdk';
import { blake2b } from 'hash-wasm';
import { endOfDay } from 'date-fns';
import { Validator, ValidatorResult } from '../../validation';
import {
  BlobReader,
  BlobWriter,
  Entry,
  TextReader,
  TextWriter,
  Uint8ArrayWriter,
  ZipReader,
  ZipWriter,
} from '@zip.js/zip.js';
import { MatDialog } from '@angular/material/dialog';
import { IopCertificatePasswordDialogComponent } from '../certificate-password-dialog/certificate-password-dialog.component';

type ItemNodeType =
  | 'file'
  | 'author'
  | 'owner'
  | 'uploader'
  | 'sealer'
  | 'projectName'
  | 'projectDescription'
  | 'versionDescription';

const SINGLE_SELECTABLE_ITEM_NODES: ItemNodeType[] = [
  'sealer',
  'projectName',
  'projectDescription',
  'versionDescription',
];

export interface ItemNode {
  children?: ItemNode[];
  item: string;
  type: ItemNodeType;
  index?: string;
  file?: string;
}

export interface ItemFlatNode {
  item: string;
  level: number;
  expandable: boolean;
  type: ItemNodeType;
  index?: string;
  file?: string;
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
    password: new FormControl(),
  });

  vaultForm = new FormGroup({
    file: new FormControl(null, Validators.required),
    password: new FormControl(null, Validators.required),
  });

  proofForm = new FormGroup({
    purpose: new FormControl(null, Validators.required),
    validUntil: new FormControl(endOfDay(new Date()), Validators.required),
  });

  certificateForm = new FormGroup({
    claim: new FormControl(null, Validators.required),
  });

  readonly fileValidators: {
    [key: string]: Validator<any>;
  } = {};

  readonly certificateValidators: {
    [key: string]: Validator<any>;
  } = {};

  readonly vaultValidators: {
    [key: string]: Validator<any>;
  } = {};

  flatNodeMap = new Map<ItemFlatNode, ItemNode>();

  nestedNodeMap = new Map<ItemNode, ItemFlatNode>();

  treeControl!: FlatTreeControl<ItemFlatNode>;

  treeFlattener!: MatTreeFlattener<ItemNode, ItemFlatNode>;

  dataSource!: MatTreeFlatDataSource<ItemNode, ItemFlatNode>;

  checklistSelection = new SelectionModel<ItemFlatNode>(true);

  constructor(
    readonly breakpoint: BreakpointObserver,
    readonly dialog: MatDialog,
    readonly webService: SDKWebService
  ) {
    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      this.getLevel,
      this.isExpandable,
      this.getChildren
    );
    this.treeControl = new FlatTreeControl<ItemFlatNode>(
      this.getLevel,
      this.isExpandable
    );
    this.dataSource = new MatTreeFlatDataSource(
      this.treeControl,
      this.treeFlattener
    );
  }

  requestCertificatePassword() {
    const password = this.fileForm.get('password')!.value;

    return password !== null
      ? of(password)
      : this.dialog
          .open(IopCertificatePasswordDialogComponent)
          .afterClosed()
          .pipe(
            filter((result) => typeof result === 'string' && result.length > 0),
            tap((password) => {
              this.fileForm.get('password')?.setValue(password);
            })
          );
  }

  getLevel = (node: ItemFlatNode) => node.level;

  isExpandable = (node: ItemFlatNode) => node.expandable;

  getChildren = (node: ItemNode) => node.children;

  hasChild = (_: number, _nodeData: ItemFlatNode) => _nodeData.expandable;

  transformer = (node: ItemNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node)!;

    const flatNode = {
      ...existingNode,
    };

    flatNode.item = node.item;
    flatNode.level = level;
    flatNode.type = node.type;
    flatNode.index = node.index;
    flatNode.file = node.file;
    flatNode.expandable = !!node.children?.length;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  };

  descendantsAllSelected(node: ItemFlatNode) {
    if (!!this.treeControl.dataNodes) {
      const descendants = this.treeControl.getDescendants(node);
      const descAllSelected =
        descendants.length > 0 &&
        descendants.every((child) => {
          return this.checklistSelection.isSelected(child);
        });
      return descAllSelected;
    }
    return false;
  }

  descendantsPartiallySelected(node: ItemFlatNode) {
    if (!!this.treeControl.dataNodes) {
      const descendants = this.treeControl.getDescendants(node);
      const result = descendants.some((child) =>
        this.checklistSelection.isSelected(child)
      );
      return result && !this.descendantsAllSelected(node);
    }
    return false;
  }

  todoItemSelectionToggle(node: ItemFlatNode) {
    this.checklistSelection.toggle(node);

    const isSelected = this.checklistSelection.isSelected(node);
    if (node.level > 0) {
      const descendants = this.treeControl.getDescendants(node);
      isSelected
        ? this.checklistSelection.select(...descendants)
        : this.checklistSelection.deselect(...descendants);

      descendants.forEach((child) => this.checklistSelection.isSelected(child));
      this.checkAllParentsSelection(node);
    } else {
      if (isSelected) {
        this.treeControl.expand(node);
      } else {
        this.treeControl.collapse(node);
      }
    }
  }

  todoLeafItemSelectionToggle(node: ItemFlatNode): void {
    this.checklistSelection.toggle(node);
    this.checkAllParentsSelection(node);
  }

  checkAllParentsSelection(node: ItemFlatNode) {
    let parent: ItemFlatNode | null = this.getParentNode(node);
    while (parent) {
      parent = this.getParentNode(parent);
    }
  }

  getParentNode(node: ItemFlatNode) {
    const currentLevel = this.getLevel(node);

    if (currentLevel < 1) {
      return null;
    }

    const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;

    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];

      if (this.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }

  toggleNode(node: ItemFlatNode) {
    if (node.level === 0) {
      this.todoItemSelectionToggle(node);
    }
  }

  ngOnInit() {
    this.fileValidators['isValidArchive'] = {
      label: $localize`Valid Certificate`,
      techLabel: $localize`The certificate is a valid ZIP archive`,
      validator: this.fileForm.valueChanges.pipe(
        switchMap(
          ({
            file,
            password,
          }: {
            file: File | null;
            password: string | null;
          }) => {
            if (file === null) {
              return of(null);
            }

            const zipFileReader = new BlobReader(file);

            return new ZipReader(zipFileReader, {
              ...(password !== null ? { password } : {}),
            }).getEntries();
          }
        ),
        map(
          (zipFile: Entry[] | null) =>
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

    this.certificateValidators['isSignedWitnessStatementFound'] = {
      label: $localize`Certificate Signature Found`,
      techLabel: $localize`The certificate contains the signed-witness-statement.json file`,
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
                  result.data.some(
                    (f: Entry) => f.filename === 'signed-witness-statement.json'
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

    this.certificateValidators['isSignedWitnessStatementValid'] = {
      label: $localize`Valid Certificate Signature`,
      techLabel: $localize`The signed-witness-statement.json file\'s content is cryptographically valid and consistent with the certificate\'s content`,
      validator: this.certificateValidators[
        'isSignedWitnessStatementFound'
      ].validator.pipe(
        switchMap((zipResult) =>
          zipResult.status !== 'valid'
            ? of(<ValidatorResult>{
                data: null,
                status: zipResult.status,
              })
            : from(
                zipResult.data
                  .find(
                    (e: Entry) => e.filename === 'signed-witness-statement.json'
                  )!
                  .getData(new TextWriter())
              ).pipe(
                catchError((err) => this.requestCertificatePassword()),
                switchMap((fileText: any) => {
                  const statement = JSON.parse(fileText);

                  const claim = (
                    statement.content as Types.Sdk.IWitnessStatement
                  ).claim as Types.Sdk.IClaim;

                  const claimFiles = (claim.content as any).files;

                  if (
                    Object.keys(claimFiles).length !==
                    Object.keys(zipResult.data).length - 1
                  ) {
                    return of(<ValidatorResult>{
                      data: null,
                      messages: [
                        $localize`Contains different amount of files than the zip has`,
                      ],
                      status: 'invalid',
                    });
                  }

                  return forkJoin(
                    Object.values(claimFiles).map((file: any) =>
                      from(
                        zipResult.data
                          .find((e: Entry) => e.filename === file.fileName)!
                          .getData(new Uint8ArrayWriter())
                      ).pipe(
                        switchMap((fileContent: any) => blake2b(fileContent)),
                        map((fileHash) =>
                          fileHash !== file.hash ? file.fileName : null
                        )
                      )
                    )
                  ).pipe(
                    map((hashChecks: any) => {
                      const invalidHashes = hashChecks.filter(
                        (h: any) => h !== null
                      );

                      return invalidHashes.length > 0
                        ? <ValidatorResult>{
                            data: null,
                            messages: [
                              `${$localize`Invalid hashes`}: ${invalidHashes.join(
                                ', '
                              )}`,
                            ],
                            status: 'invalid',
                          }
                        : <ValidatorResult>{
                            data: statement,
                            status: 'valid',
                          };
                    })
                  );
                }),
                catchError((err) =>
                  of(<ValidatorResult>{
                    data: null,
                    messages: [err],
                    status: 'invalid',
                  })
                )
              )
        ),
        shareReplay({
          bufferSize: 1,
          refCount: true,
        })
      ),
    };

    this.certificateValidators['proofValid'] = {
      label: $localize`Certificate\'s Timestamp Exists on Blockchain`,
      techLabel: $localize`The cryptographic hash (timestamp) exists on the Blockchain`,
      validator: this.certificateValidators[
        'isSignedWitnessStatementValid'
      ].validator.pipe(
        switchMap((certificateResult) =>
          certificateResult.status !== 'valid'
            ? of(<ValidatorResult>{
                data: null,
                status: 'invalid',
              })
            : this.webService
                .beforeProofExists(digestJson(certificateResult.data))
                .pipe(
                  map((exists) => {
                    if (exists) {
                      this.certificateForm
                        .get('claim')
                        ?.setValue(certificateResult.data.content.claim);

                      this.proofForm
                        .get('name')
                        ?.setValue(
                          certificateResult.data.content.claim.content
                            .projectName
                        );

                      this.dataSource.data = [
                        {
                          item: 'Project name',
                          type: 'projectName',
                        },
                        {
                          item: 'Project description',
                          type: 'projectDescription',
                        },
                        {
                          item: 'Project version description',
                          type: 'versionDescription',
                        },
                        {
                          item: 'Sealer',
                          type: 'sealer',
                        },
                        ...Object.values(
                          certificateResult.data.content.claim.content.files
                        ).map(
                          (file: any, fileIndex) =>
                            <ItemNode>{
                              children: [
                                {
                                  item: 'Authors',
                                  children: Object.values(file.authors).map(
                                    (author, authorIndex) =>
                                      <ItemNode>{
                                        item: (author as any).author,
                                        type: 'author',
                                        index: Object.keys(file.authors)[
                                          authorIndex
                                        ],
                                        file: file.fileName,
                                      }
                                  ),
                                },
                                {
                                  item: 'Owners',
                                  children: Object.values(file.owners).map(
                                    (owner, ownerIndex) =>
                                      <ItemNode>{
                                        item: (owner as any).owner,
                                        type: 'owner',
                                        index: Object.keys(file.owners)[
                                          ownerIndex
                                        ],
                                        file: file.fileName,
                                      }
                                  ),
                                },
                                {
                                  item: 'Uploader',
                                  type: 'uploader',
                                  file: file.fileName,
                                },
                              ],
                              item: file.fileName,
                              type: 'file',
                              index: Object.keys(
                                certificateResult.data.content.claim.content
                                  .files
                              )[fileIndex],
                            }
                        ),
                      ];
                    }

                    return exists
                      ? <ValidatorResult>{
                          data: certificateResult.data,
                          status: 'valid',
                        }
                      : <ValidatorResult>{
                          data: null,
                          status: 'invalid',
                        };
                  }),
                  catchError((err) =>
                    of(<ValidatorResult>{
                      data: null,
                      status: 'invalid',
                    })
                  )
                )
        ),
        shareReplay({
          bufferSize: 1,
          refCount: true,
        })
      ),
    };

    this.vaultValidators['isPasswordValid'] = {
      label: $localize`Password is valid`,
      validator: this.vaultForm.get('password')!.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((password) => {
          if (password === null || password === '') {
            return of(<ValidatorResult>{
              data: null,
              status: 'invalid',
            });
          }

          return from(this.vaultForm.get('file')!.value.text()).pipe(
            switchMap((vaultText: any) => {
              const vault = Vault.load(JSON.parse(vaultText));

              try {
                MorpheusPlugin.init(vault, password);
              } catch (e) {
                if (
                  typeof e === 'string' &&
                  (e as string).includes('Ciphertext was tampered with')
                ) {
                  return of(<ValidatorResult>{
                    data: null,
                    status: 'invalid',
                  });
                }
              }

              const morpheusPlugin = MorpheusPlugin.get(vault);
              let keyId: Crypto.KeyId | null = null;

              try {
                keyId = morpheusPlugin.pub.personas.key(0).keyId();
              } catch (e) {
                return of(<ValidatorResult>{
                  data: null,
                  status: 'invalid',
                });
              }

              return of(<ValidatorResult>{
                data: {
                  keyId,
                  morpheusPlugin,
                  password,
                },
                status: 'valid',
              });
            })
          );
        }),
        shareReplay({
          bufferSize: 1,
          refCount: true,
        })
      ),
    };

    this.vaultValidators['vaultHasRight'] = {
      label: $localize`Vault has impersonate right on the DID at the moment`,
      validator: combineLatest({
        isPasswordValid: this.vaultValidators['isPasswordValid'].validator,
        proofValid: this.certificateValidators['proofValid'].validator,
      }).pipe(
        switchMap(({ isPasswordValid, proofValid }) => {
          if (
            isPasswordValid.status !== 'valid' ||
            proofValid.status !== 'valid'
          ) {
            return of(<ValidatorResult>{
              data: null,
              status: 'invalid',
            });
          }

          const subjectDid = proofValid.data.content.claim.subject;

          return this.webService
            .hasRightAt(subjectDid, isPasswordValid.data.keyId)
            .pipe(
              map(
                (hasRight) =>
                  <ValidatorResult>{
                    data: null,
                    status: hasRight ? 'valid' : 'invalid',
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
  }

  selectFile(event: Event) {
    this.fileForm.get('password')?.reset();

    const files = (event.target as HTMLInputElement).files;

    if (!!files && files.length === 1) {
      this.certificateForm.get('claim')?.setValue(null);
      this.fileForm.get('file')?.setValue(files[0]);
    }
  }

  clearFile() {
    this.certificateForm.get('claim')?.setValue(null);
    this.fileForm.reset();
  }

  selectVault(event: Event) {
    const files = (event.target as HTMLInputElement).files;

    if (!!files && files.length === 1) {
      this.vaultForm.get('file')?.setValue(files[0]);
    }
  }

  clearVault() {
    this.vaultForm.reset();
  }

  downloadProof() {
    combineLatest({
      proofResult: this.certificateValidators['proofValid'].validator,
      passwordResult: this.vaultValidators['isPasswordValid'].validator,
      signedWitnessStatementResult:
        this.certificateValidators['isSignedWitnessStatementValid'].validator,
      zipFileResult: this.fileValidators['isValidArchive'].validator,
    })
      .pipe(
        filter(
          ({
            proofResult,
            passwordResult,
            signedWitnessStatementResult,
            zipFileResult,
          }) =>
            proofResult.status === 'valid' &&
            passwordResult.status === 'valid' &&
            signedWitnessStatementResult.status === 'valid' &&
            zipFileResult.status === 'valid'
        ),
        take(1),
        switchMap(
          ({
            passwordResult,
            proofResult,
            signedWitnessStatementResult,
            zipFileResult,
          }) => {
            const validFrom = new Date();

            const validUntil = endOfDay(this.proofForm.value.validUntil);

            const selectedFiles = [...this.flatNodeMap.keys()].filter(
              (node) =>
                node.type === 'file' && this.checklistSelection.isSelected(node)
            );

            const doNotCollapsProps: string[] = [];

            for (const fileNode of selectedFiles) {
              doNotCollapsProps.push(
                `.content.files.${fileNode.index}.fileName`
              );
              doNotCollapsProps.push(`.content.files.${fileNode.index}.hash`);

              const selectedAuthors = [...this.flatNodeMap.keys()].filter(
                (node) =>
                  node.file === fileNode.item &&
                  node.type === 'author' &&
                  this.checklistSelection.isSelected(node)
              );

              for (const author of selectedAuthors) {
                doNotCollapsProps.push(
                  `.content.files.${fileNode.index}.authors.${author.index}`
                );
              }

              const selectedOwners = [...this.flatNodeMap.keys()].filter(
                (node) =>
                  node.file === fileNode.item &&
                  node.type === 'owner' &&
                  this.checklistSelection.isSelected(node)
              );

              for (const owner of selectedOwners) {
                doNotCollapsProps.push(
                  `.content.files.${fileNode.index}.owners.${owner.index}`
                );
              }

              const selectedUploaders = [...this.flatNodeMap.keys()].filter(
                (node) =>
                  node.file === fileNode.item &&
                  node.type === 'uploader' &&
                  this.checklistSelection.isSelected(node)
              );

              if (selectedUploaders.length > 0) {
                doNotCollapsProps.push(
                  `.content.files.${fileNode.index}.uploader`
                );
              }
            }

            SINGLE_SELECTABLE_ITEM_NODES.forEach((t) => {
              if (this.isItemNodeTypeSelected(t)) {
                doNotCollapsProps.push(`.content.${t}`);
              }
            });

            const collapsedClaim = JSON.parse(
              selectiveDigestJson(
                proofResult.data.content.claim,
                doNotCollapsProps.join(',')
              )
            );

            const collapsedStatement = JSON.parse(
              selectiveDigestJson(
                signedWitnessStatementResult.data,
                ['.signature', '.content.constraints'].join(',')
              )
            );

            const presentation = {
              provenClaims: [
                {
                  claim: collapsedClaim,
                  statements: [collapsedStatement],
                },
              ],
              licenses: [
                {
                  issuedTo: proofResult.data.content.claim.subject,
                  purpose: this.proofForm.value.purpose,
                  validFrom: validFrom.toISOString(),
                  validUntil: validUntil.toISOString(),
                },
              ],
            };

            const signedPresentation = passwordResult.data.morpheusPlugin
              .priv(passwordResult.data.password)
              .signClaimPresentation(passwordResult.data.keyId, presentation)
              .toJSON();

            const signedPresentationJson = {
              content: signedPresentation.content,
              signature: signedPresentation.signature,
            };

            const zipFileWriter = new BlobWriter('application/zip');

            const zipWriter = new ZipWriter(zipFileWriter);

            return from(
              zipWriter.add(
                'signed-presentation.json',
                new TextReader(JSON.stringify(signedPresentationJson))
              )
            ).pipe(
              switchMap(() =>
                forkJoin(
                  (zipFileResult.data as Entry[])
                    .filter((e) =>
                      selectedFiles.some((f) => f.item === e.filename)
                    )
                    .map((e) =>
                      from(e.getData!(new BlobWriter())).pipe(
                        switchMap((blob) =>
                          zipWriter.add(e.filename, new BlobReader(blob))
                        )
                      )
                    )
                )
              ),
              switchMap(() => {
                zipWriter.close();

                return zipFileWriter.getData();
              }),
              tap((blob) => {
                const a = document.createElement('a');

                a.href = window.URL.createObjectURL(blob);
                a.download = `${
                  proofResult.data.content.claim.content.projectName.value
                } - ${
                  proofResult.data.content.claim.content.versionId
                }.${new Date().getTime()}.proof`;

                a.click();
              })
            );
          }
        )
      )
      .subscribe();
  }

  private isItemNodeTypeSelected(type: ItemNodeType): boolean {
    return [...this.flatNodeMap.keys()].some(
      (node) => node.type === type && this.checklistSelection.isSelected(node)
    );
  }
}
