import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AlertController } from '@ionic/angular';
import { from, throwError } from 'rxjs';
import { catchError, map, mergeMap, shareReplay, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { TenantModel } from '../types/tenant.model';

@Injectable({
  providedIn: 'root',
})
export class TenantService {
  readonly settings$ = this.getTenantSettings(environment.endpoints.currentTenant).pipe(
    catchError(() => this.getTenantSettings(environment.endpoints.defaultTenant, true)),
    shareReplay({
      bufferSize: 1,
      refCount: true,
    }),
  );

  constructor(
    private readonly http: HttpClient,
    private readonly title: Title,
    private readonly alertController: AlertController,
  ) {}

  private getTenantSettings(tenantUrl: string, throwIfNotFound = false) {
    return this.http.get<TenantModel>(`${tenantUrl}/settings.json`).pipe(
      map((settings) => ({
        ...settings,
        assets: {
          ...settings.assets,
          logo: `${tenantUrl}/${settings.assets.logo}`,
        },
      })),
      tap((settings) => this.title.setTitle(`${settings.name} Tools`)),
      catchError((e: any) => {
        if (throwIfNotFound) {
          return from(
            this.alertController.create({
              header: $localize`Tenant Config Error`,
              message: $localize`Could not load your tenant default configuration from ${tenantUrl}/settings.json`,
              buttons: [$localize`OK`],
            }),
          ).pipe(
            map((alert) => alert.present()),
            mergeMap(() => throwError(() => new Error(e))),
          );
        }

        throw e;
      }),
    );
  }
}
