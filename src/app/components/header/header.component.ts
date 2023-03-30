import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { I18nService } from '../../services/i18n.service';
import { TenantService } from '../../services/tenant.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class HeaderComponent {
  constructor(private readonly i18: I18nService, readonly tenant: TenantService) {}

  setLocale(language: string) {
    this.i18.setLocale(language);
  }
}
