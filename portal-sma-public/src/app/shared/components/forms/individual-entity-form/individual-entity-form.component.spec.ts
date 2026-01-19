import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualEntityFormComponent } from './individual-entity-form.component';

describe('IndividualEntityFormComponent', () => {
  let component: IndividualEntityFormComponent;
  let fixture: ComponentFixture<IndividualEntityFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndividualEntityFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IndividualEntityFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
