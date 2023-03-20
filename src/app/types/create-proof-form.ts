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
  protectWithPassword: boolean;
  password: string | null;
  passwordRepeat: string | null;
  shareProjectName: boolean;
  shareProjectDescription: boolean;
  shareVersionDescription: boolean;
  shareVersionSealer: boolean;
  files: ValidatedCreateProofFormFiles;
}
