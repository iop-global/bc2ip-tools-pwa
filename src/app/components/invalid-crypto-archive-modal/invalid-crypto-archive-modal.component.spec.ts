import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { InvalidCryptoArchiveModalComponent } from './invalid-crypto-archive-modal.component';

describe('InvalidCryptoArchiveModalComponent', () => {
  let component: InvalidCryptoArchiveModalComponent;
  let fixture: ComponentFixture<InvalidCryptoArchiveModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [InvalidCryptoArchiveModalComponent],
      imports: [IonicModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(InvalidCryptoArchiveModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
