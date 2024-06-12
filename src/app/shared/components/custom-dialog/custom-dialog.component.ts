import { Component, OnInit, inject, input, output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CustomDialogConfig, FormControlConfig, FormControlType } from '../../../interfaces/custom.dialog.interfaces';

@Component({
  selector: 'app-custom-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './custom-dialog.component.html',
  styleUrl: './custom-dialog.component.css'
})
export class CustomDialogComponent implements OnInit{
  controls = input.required<FormControlConfig[]>();
  dialogConfig = input.required<CustomDialogConfig>();
  onClickCancelButton = output<void>();
  onClickConfirmButton = output<FormGroup<any>>();

  formBuilder = inject(FormBuilder);
  form: FormGroup = this.formBuilder.group({});
  readonly FormControlType = FormControlType;

  ngOnInit(): void {
    this.controls().forEach(control => {
      this.form.addControl(control.name, new FormControl(
        control.initialValue,
        control.validators,
      ));
    });
  }

  onCancel(): void {
    this.onClickCancelButton.emit();
  }

  onConfirm(): void {
    this.onClickConfirmButton.emit(this.form);
  }

}
