import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CreateProofPage } from './create-proof.page';

describe('CreateProofPage', () => {
  let component: CreateProofPage;
  let fixture: ComponentFixture<CreateProofPage>;

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(CreateProofPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
