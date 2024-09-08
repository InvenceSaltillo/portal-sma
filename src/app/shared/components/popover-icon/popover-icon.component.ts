import { Component, input, OnInit } from '@angular/core';
import { PopoverPosition } from '../../../interfaces/popover.interface';
import { NgxTippyModule, NgxTippyProps } from 'ngx-tippy-wrapper';



@Component({
  selector: 'app-popover-icon',
  standalone: true,
  imports: [
    NgxTippyModule,
  ],
  templateUrl: './popover-icon.component.html',
  styles: ``
})
export class PopoverIconComponent implements OnInit {
  title = input.required<string>();
  id = input.required<string>();
  text = input.required<string>();
  position = input<PopoverPosition>('top');
  svgIconPath = input<string>('m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z');
  data = {};

  public tippyPropsContent: NgxTippyProps = {
    placement: 'right',
    theme: 'my-theme',
    arrow: true,
    trigger: 'mouseenter',
  };

  ngOnInit() {
    this.data = {
      title: this.title(),
      text: this.text(),
      svgIconPath: this.svgIconPath(),
      position: this.position(),
    };
  }

}
