import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestLocationFormComponent } from './request-location-form.component';

describe('RequestLocationFormComponent', () => {
  let component: RequestLocationFormComponent;
  let fixture: ComponentFixture<RequestLocationFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestLocationFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RequestLocationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
