import { Component } from '@angular/core';
import { TitleBarComponent } from '../../../shared/title-bar/title-bar.component';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [
    TitleBarComponent,
  ],
  templateUrl: './report.component.html',
  styleUrl: './report.component.css'
})
export default class ReportComponent {

}
