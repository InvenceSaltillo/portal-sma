import { Component, OnInit, effect, inject } from '@angular/core';
import { TitleBarComponent } from '../../../shared/title-bar/title-bar.component';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PopoverIconComponent } from '../../../shared/components/popover-icon/popover-icon.component';
import { RequestLocationFormComponent } from '../../../shared/components/forms/request-location-form/request-location-form.component';
import { GeneralDataFormComponent } from '../../../shared/components/forms/general-data-form/general-data-form.component';
import { IndividualEntityFormComponent } from '../../../shared/components/forms/individual-entity-form/individual-entity-form.component';
import { ServiceTypeService } from '../../../services/service-type/service-type.service';
import { ServiceService } from '../../../services/service/service.service';
import { Service } from '../../../interfaces/service.interface';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { Popover } from 'flowbite';
import { CommonModule } from '@angular/common';
import { NgxTippyModule, NgxTippyProps } from 'ngx-tippy-wrapper';

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
    CommonModule,
    NgxTippyModule
  ],
  templateUrl: './request.component.html',
  styleUrl: './request.component.css'
})
export default class RequestComponent implements OnInit {

  formBuilder = inject(FormBuilder);
  serviceTypeService = inject(ServiceTypeService);
  serviceService = inject(ServiceService);
  toastr = inject(ToastrService);
  router = inject(Router);

  processForm!: FormGroup;
  requestLocationForm!: FormGroup;
  generalDataForm!: FormGroup;
  individualEntityForm!: FormGroup;
  serviceSelected?: Service;
  test = false;

  public tippyPropsContent: NgxTippyProps = {
    placement: 'right',
    theme: 'my-theme'
  };

  constructor() {
    effect(() => {
      const serviceTypeError = this.serviceTypeService.error();
      const serviceError = this.serviceService.error();
      if (serviceTypeError || serviceError) {
        this.toastr.error(
          serviceTypeError || serviceError,
          '¡Ups!',
        );
      }
      if (serviceTypeError) {
        this.router.navigateByUrl('dashboard/home');
      }
    });
  }

  ngOnInit() {
    this.serviceTypeService.getAll();

    this.processForm = this.formBuilder.group({
      serviceType: new FormControl('', [Validators.required,]),
      service: new FormControl('', [Validators.required,]),
    });

    this.processForm.get('serviceType')?.valueChanges.subscribe(serviceTypeId => {
      this.serviceSelected = undefined;
      this.getByServiceType(serviceTypeId);
    });

    this.processForm.get('service')?.valueChanges.subscribe(serviceId => {
      this.getServiceById(serviceId);
    });
  }

  getByServiceType(serviceTypeId: string) {
    this.serviceService.getByServiceType(serviceTypeId);
  }

  getServiceById(serviceId: string) {
    this.serviceService.getById(serviceId)!.subscribe(result => {
      this.serviceSelected = result;
      this.initializePopovers();
      console.log('DEBUG: this.serviceService', this.serviceSelected);
    });
  }

  private initializePopovers() {
    // Espera a que Angular haya renderizado los elementos en el DOM
    setTimeout(() => {
      this.serviceSelected!.form_sections.forEach((_, index) => {
        const popoverButton = document.getElementById(`popoverButton${index}`);
        const popoverContent = document.getElementById(`popover${index}`);
        if (popoverButton && popoverContent) {
          new Popover(popoverButton, popoverContent);
        }
      });
    });
  }

  async onSubmitForm(): Promise<void> {
    console.log('DEBUG: processformvalue', this.processForm.value);
  }

  submit(): void {
    console.log('DEBUG: submit', this.requestLocationForm.markAllAsTouched());
  }

}
