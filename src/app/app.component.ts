import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { fromEvent } from 'rxjs';
import { pluck, startWith, tap } from 'rxjs/operators';
import { TenantService } from './services/tenant.service';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  readonly darkModeMediaQuery = window.matchMedia(
    '(prefers-color-scheme: dark)'
  );

  constructor(
    @Inject(DOCUMENT) readonly document: Document,
    readonly tenant: TenantService
  ) {}

  ngOnInit() {
    const themeElement = this.document.getElementById(
      'app-theme'
    ) as HTMLLinkElement | null;

    if (!!themeElement)
      fromEvent(this.darkModeMediaQuery, 'change')
        .pipe(
          startWith(this.darkModeMediaQuery),
          pluck('matches'),
          //mapTo(true),
          tap((isDarkMode) => {
            themeElement.href = `${isDarkMode ? 'dark' : 'light'}-theme.css`;
          })
        )
        .subscribe();
  }
}
