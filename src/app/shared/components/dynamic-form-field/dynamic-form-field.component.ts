import { Component, Input, OnInit } from '@angular/core';
import { DynamicFormField } from '../../../interfaces/dynamic-form-field.interface';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TooltipComponent } from '../tooltip/tooltip.component';
import { PopoverIconComponent } from '../popover-icon/popover-icon.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxMaskDirective } from 'ngx-mask';

@Component({
  selector: 'app-dynamic-form-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PopoverIconComponent,
    NgSelectModule,
    NgxMaskDirective,

  ],
  templateUrl: './dynamic-form-field.component.html',
  styleUrl: './dynamic-form-field.component.css'
})
export class DynamicFormFieldComponent implements OnInit {
  @Input() field!: DynamicFormField;
  @Input() formGroup!: FormGroup;
  @Input() appendToSelector: string = 'body';

  ngOnInit(): void { }

  normalizeOnBlur(field: DynamicFormField): void {
    const ctrl = this.formGroup.get(field.name);
    if (!ctrl) return;

    // Normaliza email: trim + lowercase
    if (field.name === 'email' && typeof ctrl.value === 'string') {
      const v = ctrl.value.trim().toLowerCase();
      if (v !== ctrl.value) {
        ctrl.setValue(v, { emitEvent: false }); // revalida sin disparar valueChanges
      }
    }
  }

  get control() {
    return this.formGroup.get(this.field.name);
  }
}
