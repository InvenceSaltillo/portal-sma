import { Component, OnInit, inject } from '@angular/core';
import { TitleBarComponent } from '../../../shared/title-bar/title-bar.component';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PopoverIconComponent } from '../../../shared/components/popover-icon/popover-icon.component';
import { RequestLocationFormComponent } from '../../../shared/components/forms/request-location-form/request-location-form.component';
import { GeneralDataFormComponent } from '../../../shared/components/forms/general-data-form/general-data-form.component';
import { IndividualEntityFormComponent } from '../../../shared/components/forms/individual-entity-form/individual-entity-form.component';

@Component({
  selector: 'app-request',
  standalone: true,
  imports: [
    TitleBarComponent,
    ReactiveFormsModule,
    PopoverIconComponent,
    RequestLocationFormComponent,
    GeneralDataFormComponent,
    IndividualEntityFormComponent,
  ],
  templateUrl: './request.component.html',
  styleUrl: './request.component.css'
})
export default class RequestComponent implements OnInit {

  formBuilder = inject(FormBuilder)
  processForm!: FormGroup;
  requestLocationForm!: FormGroup;
  generalDataForm!: FormGroup;
  individualEntityForm!: FormGroup;

  ngOnInit() {
    this.processForm = this.formBuilder.group({
      serviceType: new FormControl('', [Validators.required,]),
      service: new FormControl('', [Validators.required,]),
    });
  }

  async onSubmitForm(): Promise<void> {
    console.log('DEBUG: processformvalue', this.processForm.value);
  }

  submit(): void {
    console.log('DEBUG: submit', this.requestLocationForm.markAllAsTouched());
  }

}
