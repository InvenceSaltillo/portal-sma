import { Component, input } from '@angular/core';

type popoverPosition = 'top' | 'bottom' | 'left' | 'right';

@Component({
  selector: 'app-popover-icon',
  standalone: true,
  imports: [],
  templateUrl: './popover-icon.component.html',
  styles: ``
})
export class PopoverIconComponent {
  title = input.required<string>();
  id = input.required<string>();
  text = input.required<string>();
  position = input<popoverPosition>('top');

}
