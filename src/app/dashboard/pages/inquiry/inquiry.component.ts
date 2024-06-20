import { Component } from '@angular/core';
import { TitleBarComponent } from '../../../shared/title-bar/title-bar.component';

@Component({
  selector: 'app-inquiry',
  standalone: true,
  imports: [
    TitleBarComponent,
  ],
  templateUrl: './inquiry.component.html',
  styleUrl: './inquiry.component.css'
})
export default class InquiryComponent {

}
