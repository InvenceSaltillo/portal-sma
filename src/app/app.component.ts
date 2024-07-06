import { NgxSpinnerModule } from 'ngx-spinner';
import { Component, Inject, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { initFlowbite } from 'flowbite';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgxSpinnerModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'portal-sema-public';
  router = inject(Router);

  constructor() { }

  ngOnInit(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        setTimeout(() => { initFlowbite(); })
      }
    });
  }
}
