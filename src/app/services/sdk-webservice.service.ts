import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SDKWebService {
  constructor(private readonly http: HttpClient) {}

  beforeProofExists(id: string) {
    return this.http.get<boolean>(`${environment.endpoints.webService}/before-proof/exists/${id}`);
  }

  hasRightAt(did: string, publicKey: string, atHeight?: number) {
    const suffix = !!atHeight ? `/${atHeight}` : '';

    return this.http.get<boolean>(
      `${environment.endpoints.webService}/dids/${did}/keys/${publicKey}/hasRight${suffix}`,
    );
  }
}
