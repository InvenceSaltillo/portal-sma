
import { Component } from '@angular/core';
import { LabelComponent } from '../../label/label.component';
import { InputFieldComponent } from '../../input/input-field.component';
import { ComponentCardComponent } from '../../../common/component-card/component-card.component';
import { PhoneInputComponent } from '../../group-input/phone-input/phone-input.component';

@Component({
  selector: 'app-input-group',
  standalone: true,
  imports: [
    LabelComponent,
    InputFieldComponent,
    PhoneInputComponent,
    ComponentCardComponent
],
  templateUrl: './input-group.component.html',
  styles: ``
})
export class InputGroupComponent {

  countries = [
    { code: 'US', label: '+1' },
    { code: 'GB', label: '+44' },
    { code: 'CA', label: '+1' },
    { code: 'AU', label: '+61' },
  ];

  handlePhoneNumberChange(phoneNumber: string) {
    console.log('Updated phone number:', phoneNumber);
  }
}
