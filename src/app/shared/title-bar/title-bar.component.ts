import { CommonModule } from '@angular/common';
import { Component, HostListener, input } from '@angular/core';

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
  subTitle = input<string>();
  textCenter = input<boolean>();
  textSize = input<string>();
  isSticky = false;

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(event: Event) {
    const titlebar = document.getElementById('titlebar');
    if (titlebar) {
      this.isSticky = window.scrollY > titlebar.offsetHeight;
    }
  }
}
