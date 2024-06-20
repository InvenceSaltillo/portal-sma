import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-title-bar',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './title-bar.component.html',
  styleUrl: './title-bar.component.css'
})
export class TitleBarComponent {
  title = input.required<string>();
  textCenter = input<boolean>();
  textSize = input<string>();

}
