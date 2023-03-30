import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { UnlockCredentialModalComponent } from './unlock-credential-modal.component';

describe('UnlockCredentialModalComponent', () => {
  let component: UnlockCredentialModalComponent;
  let fixture: ComponentFixture<UnlockCredentialModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [UnlockCredentialModalComponent],
      imports: [IonicModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(UnlockCredentialModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
