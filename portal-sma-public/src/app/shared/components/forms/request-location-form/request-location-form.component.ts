import { Component, OnInit, inject, output, signal } from '@angular/core';
import { PopoverIconComponent } from '../../popover-icon/popover-icon.component';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-request-location-form',
  standalone: true,
  imports: [
    PopoverIconComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './request-location-form.component.html',
  styles: ``
})
export class RequestLocationFormComponent implements OnInit {
  requestLocationForm!: FormGroup;
  formBuilder = inject(FormBuilder);
  formEmitter = output<FormGroup>();

  ngOnInit(): void {
    this.requestLocationForm = this.formBuilder.group({
      state: new FormControl('', [Validators.required,]),
      municipality: new FormControl('', [Validators.required,]),
    });

    this.formEmitter.emit(this.requestLocationForm);

    this.requestLocationForm.valueChanges.subscribe(value => {
      this.formEmitter.emit(this.requestLocationForm);
    });

  }

  onSubmitForm(): void {

  }

}
