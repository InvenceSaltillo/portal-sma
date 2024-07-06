import { Component, OnInit, inject } from '@angular/core';
import { TitleBarComponent } from '../../../shared/title-bar/title-bar.component';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PopoverIconComponent } from '../../../shared/components/popover-icon/popover-icon.component';
import { RequestLocationFormComponent } from '../../../shared/components/forms/request-location-form/request-location-form.component';
import { GeneralDataFormComponent } from '../../../shared/components/forms/general-data-form/general-data-form.component';
import { IndividualEntityFormComponent } from '../../../shared/components/forms/individual-entity-form/individual-entity-form.component';
import { ServiceTypeService } from '../../../services/service-type/service-type.service';
import { ServiceService } from '../../../services/service/service.service';

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

  formBuilder = inject(FormBuilder);
  serviceTypeService = inject(ServiceTypeService);
  serviceService = inject(ServiceService);
  processForm!: FormGroup;
  requestLocationForm!: FormGroup;
  generalDataForm!: FormGroup;
  individualEntityForm!: FormGroup;
  serviceNameSelected = '';

  ngOnInit() {
    this.serviceTypeService.getAll();
    this.processForm = this.formBuilder.group({
      serviceType: new FormControl('', [Validators.required,]),
      service: new FormControl('', [Validators.required,]),
    });

    this.processForm.get('serviceType')?.valueChanges.subscribe(serviceTypeId => {
      this.serviceNameSelected = '';
      this.getByServiceType(serviceTypeId);
    });

    this.processForm.get('service')?.valueChanges.subscribe(serviceId => {
      this.serviceNameSelected = this.serviceService.getServiceName(serviceId);
    });
  }

  test(e: any) {
    console.log('DEBUG: e', e);
  }

  getByServiceType(serviceTypeId: string) {
    this.serviceService.getByServiceType(serviceTypeId);
  }

  async onSubmitForm(): Promise<void> {
    console.log('DEBUG: processformvalue', this.processForm.value);
  }

  submit(): void {
    console.log('DEBUG: submit', this.requestLocationForm.markAllAsTouched());
  }

}
