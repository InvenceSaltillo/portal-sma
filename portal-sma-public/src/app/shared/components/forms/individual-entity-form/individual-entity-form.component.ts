import { Component, OnInit, inject, output } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
import { PopoverIconComponent } from '../../popover-icon/popover-icon.component';

@Component({
  selector: 'app-individual-entity-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PopoverIconComponent,
  ],
  templateUrl: './individual-entity-form.component.html',
  styles: ``
})
export class IndividualEntityFormComponent implements OnInit {
  individualEntityForm!: FormGroup;
  formBuilder = inject(FormBuilder);
  readonly Validators = Validators;
  formEmitter = output<FormGroup>();

  ngOnInit(): void {
    this.individualEntityForm = this.formBuilder.group({
      name: new FormControl('', [Validators.required,]),
      lastName1: new FormControl('', [Validators.required,]),
      lastName2: new FormControl('', [Validators.required,]),
      gender: new FormControl('', [Validators.required,]),
    });

    this.formEmitter.emit(this.individualEntityForm);

    this.individualEntityForm.valueChanges.subscribe(value => {
      this.formEmitter.emit(this.individualEntityForm);
    });

  }

  onSubmitForm(): void {

  }
}
