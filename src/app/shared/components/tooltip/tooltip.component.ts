import { Component, input } from '@angular/core';
import { Tooltip, TooltipInterface } from 'flowbite';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  imports: [],
  templateUrl: './tooltip.component.html',
  styleUrl: './tooltip.component.css'
})
export class TooltipComponent {
  id = input.required<string>();
  label = input.required<string>();
  // tooltip: TooltipInterface = new Tooltip();
}
