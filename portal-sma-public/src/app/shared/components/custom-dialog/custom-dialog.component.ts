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
export class CustomDialogComponent implements OnInit {
  controls = input.required<FormControlConfig[]>();
  dialogConfig = input.required<CustomDialogConfig>();
  onClickCancelButton = output<void>();
  onClickConfirmButton = output<FormGroup<any>>();

  formBuilder = inject(FormBuilder);
  form: FormGroup = this.formBuilder.group({});
  readonly FormControlType = FormControlType;

  ngOnInit(): void {
    this.controls().forEach(control => {
      let initialValue;

      if (control.type === FormControlType.DATE) {
        const formattedDate = this.formatDateToISO(control.initialDate!);
        initialValue = formattedDate;
      } else {
        initialValue = control.initial_value;
      }

      this.form.addControl(control.name, new FormControl(
        initialValue,
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

  private formatDateToISO(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

}
