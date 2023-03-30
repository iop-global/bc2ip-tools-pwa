import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { InspectProofPage } from './inspect-proof.page';

describe('InspectProofPage', () => {
  let component: InspectProofPage;
  let fixture: ComponentFixture<InspectProofPage>;

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(InspectProofPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
