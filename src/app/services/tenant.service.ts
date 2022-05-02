import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { TenantModel } from '../models/tenant.model';

@Injectable({
  providedIn: 'root',
})
export class TenantService {
  readonly settings$ = this.getTenantSettings(
    environment.endpoints.currentTenant
  ).pipe(
    catchError(() =>
      this.getTenantSettings(environment.endpoints.defaultTenant)
    ),
    shareReplay({
      bufferSize: 1,
      refCount: true,
    })
  );

  constructor(readonly http: HttpClient, readonly title: Title) {}

  getTenantSettings(tenantUrl: string) {
    return this.http.get<TenantModel>(`${tenantUrl}/settings.json`).pipe(
      map((settings) => ({
        ...settings,
        logoUrl: `${tenantUrl}/${settings.logoUrl}`,
      })),
      tap((settings) => this.title.setTitle(`${settings.name} tools`))
    );
  }
}
