import { Observable } from 'rxjs';

export type ValidatorStatusType = 'pending' | 'invalid' | 'valid' | 'undetermined';

export interface ValidatorResult {
  data: any;
  messages?: string[];
  status: ValidatorStatusType;
}

export interface Validator<T> {
  label: string;
  techLabel?: string;
  validator: Observable<ValidatorResult>;
}
