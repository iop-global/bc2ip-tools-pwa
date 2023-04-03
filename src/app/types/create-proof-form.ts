export interface IndexedBooleanMap {
  [idx: string]: boolean;
}

interface ValidatedCreateProofFormFiles {
  [idx: string]: {
    authors: IndexedBooleanMap;
    owners: IndexedBooleanMap;
    shareFile: boolean;
    fileName: string;
    uploader: boolean;
  };
}

export interface ValidatedCreateProofFormResult {
  purpose: string;
  validUntil: string;
  password: string;
  passwordRepeat: string;
  shareProjectName: boolean;
  shareProjectDescription: boolean;
  shareVersionDescription: boolean;
  shareVersionSealer: boolean;
  files: ValidatedCreateProofFormFiles;
}
