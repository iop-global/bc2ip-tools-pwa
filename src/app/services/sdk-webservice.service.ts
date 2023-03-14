import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class SDKWebService {
  constructor(private readonly http: HttpClient) {}

  beforeProofExists(id: string) {
    return this.http.get<boolean>(
      // TODO
      //`${environment.endpoints.webService}/before-proof/exists/${id}`
      `https://dev-tools.bc2ip.com/webservice/before-proof/exists/${id}`
    );
  }

  hasRightAt(did: string, publicKey: string, atHeight?: number) {
    const suffix = !!atHeight ? `/${atHeight}` : '';

    return this.http.get<boolean>(
      // TODO
      //`${environment.endpoints.webService}/dids/${did}/keys/${publicKey}/hasRight${atHeight}`
      `https://dev-tools.bc2ip.com/webservice/dids/${did}/keys/${publicKey}/hasRight${suffix}`
    );
  }
}
