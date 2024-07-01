import { Component, OnInit, inject, output } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { PopoverIconComponent } from '../../popover-icon/popover-icon.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-general-data-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PopoverIconComponent,
    CommonModule,
  ],
  templateUrl: './general-data-form.component.html',
  styles: ``
})
export class GeneralDataFormComponent implements OnInit {
  generalDataForm!: FormGroup;
  formBuilder = inject(FormBuilder);
  readonly Validators = Validators;
  formEmitter = output<FormGroup>();

  ngOnInit(): void {
    this.generalDataForm = this.formBuilder.group({
      curp: new FormControl('', [Validators.required,]),
      rfc: new FormControl('', [Validators.required,]),
      rupa: new FormControl(''),
    });

    this.formEmitter.emit(this.generalDataForm);

    this.generalDataForm.valueChanges.subscribe(value => {
      this.formEmitter.emit(this.generalDataForm);
    });

  }

  onSubmitForm(): void {

  }
}
