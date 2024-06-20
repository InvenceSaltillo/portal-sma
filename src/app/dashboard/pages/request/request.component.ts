import { Component } from '@angular/core';
import { TitleBarComponent } from '../../../shared/title-bar/title-bar.component';

@Component({
  selector: 'app-request',
  standalone: true,
  imports: [
    TitleBarComponent,
  ],
  templateUrl: './request.component.html',
  styleUrl: './request.component.css'
})
export default class RequestComponent {

}
