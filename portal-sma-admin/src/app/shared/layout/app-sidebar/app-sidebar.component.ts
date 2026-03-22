import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren, ChangeDetectorRef } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { combineLatest, Subscription } from 'rxjs';
import { SafeHtmlPipe } from '../../pipe/safe-html.pipe';

type NavItem = {
  name: string;
  icon: string;
  path?: string;
  new?: boolean;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SafeHtmlPipe,
  ],
  templateUrl: './app-sidebar.component.html',
})
export class AppSidebarComponent {

  // Main nav items
  navItems: NavItem[] = [
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.5 3.25C4.25736 3.25 3.25 4.25736 3.25 5.5V8.99998C3.25 10.2426 4.25736 11.25 5.5 11.25H9C10.2426 11.25 11.25 10.2426 11.25 8.99998V5.5C11.25 4.25736 10.2426 3.25 9 3.25H5.5ZM4.75 5.5C4.75 5.08579 5.08579 4.75 5.5 4.75H9C9.41421 4.75 9.75 5.08579 9.75 5.5V8.99998C9.75 9.41419 9.41421 9.74998 9 9.74998H5.5C5.08579 9.74998 4.75 9.41419 4.75 8.99998V5.5ZM5.5 12.75C4.25736 12.75 3.25 13.7574 3.25 15V18.5C3.25 19.7426 4.25736 20.75 5.5 20.75H9C10.2426 20.75 11.25 19.7427 11.25 18.5V15C11.25 13.7574 10.2426 12.75 9 12.75H5.5ZM4.75 15C4.75 14.5858 5.08579 14.25 5.5 14.25H9C9.41421 14.25 9.75 14.5858 9.75 15V18.5C9.75 18.9142 9.41421 19.25 9 19.25H5.5C5.08579 19.25 4.75 18.9142 4.75 18.5V15ZM12.75 5.5C12.75 4.25736 13.7574 3.25 15 3.25H18.5C19.7426 3.25 20.75 4.25736 20.75 5.5V8.99998C20.75 10.2426 19.7426 11.25 18.5 11.25H15C13.7574 11.25 12.75 10.2426 12.75 8.99998V5.5ZM15 4.75C14.5858 4.75 14.25 5.08579 14.25 5.5V8.99998C14.25 9.41419 14.5858 9.74998 15 9.74998H18.5C18.9142 9.74998 19.25 9.41419 19.25 8.99998V5.5C19.25 5.08579 18.9142 4.75 18.5 4.75H15ZM15 12.75C13.7574 12.75 12.75 13.7574 12.75 15V18.5C12.75 19.7426 13.7574 20.75 15 20.75H18.5C19.7426 20.75 20.75 19.7427 20.75 18.5V15C20.75 13.7574 19.7426 12.75 18.5 12.75H15ZM14.25 15C14.25 14.5858 14.5858 14.25 15 14.25H18.5C18.9142 14.25 19.25 14.5858 19.25 15V18.5C19.25 18.9142 18.9142 19.25 18.5 19.25H15C14.5858 19.25 14.25 18.9142 14.25 18.5V15Z" fill="currentColor"></path></svg>`,
      name: "Inicio",
      path: "/home",
      // subItems: [
      //   { name: "Ecommerce", path: "/" },
      // ],
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 2C8.41421 2 8.75 2.33579 8.75 2.75V3.75H15.25V2.75C15.25 2.33579 15.5858 2 16 2C16.4142 2 16.75 2.33579 16.75 2.75V3.75H18.5C19.7426 3.75 20.75 4.75736 20.75 6V9V19C20.75 20.2426 19.7426 21.25 18.5 21.25H5.5C4.25736 21.25 3.25 20.2426 3.25 19V9V6C3.25 4.75736 4.25736 3.75 5.5 3.75H7.25V2.75C7.25 2.33579 7.58579 2 8 2ZM8 5.25H5.5C5.08579 5.25 4.75 5.58579 4.75 6V8.25H19.25V6C19.25 5.58579 18.9142 5.25 18.5 5.25H16H8ZM19.25 9.75H4.75V19C4.75 19.4142 5.08579 19.75 5.5 19.75H18.5C18.9142 19.75 19.25 19.4142 19.25 19V9.75Z" fill="currentColor"></path></svg>`,
      name: "Agenda",
      path: "/calendar",
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none"><path d="M3 7.5V6a1 1 0 011-1h4.586a1 1 0 01.707.293L10 7h10a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1v-1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M3 10.5h6v6H3v-6z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
      name: "Catálogos",
      subItems: [
        { name: "Tipo de Trámites", path: "/catalog/procedure-types" },
        { name: "Requisitos", path: "/catalog/requirements" },
        { name: "Trámites", path: "/catalog/procedures" },
        { name: "Temas de Plan de Manejo", path: "/catalog/management-plan-topics" },
        { name: "Subtema de Plan de Manejo", path: "/catalog/management-plan-subtopics" },
        { name: "Régimen de Propiedad", path: "/catalog/property-regimes" },
        { name: "Tipo de Tenencia", path: "/catalog/tenure-types" },
        { name: "Tipo de Documento Legal", path: "/catalog/legal-document-types" },
        { name: "Plantilla de Documentos", path: "/catalog/document-templates" },
        { name: "Especies", path: "/catalog/species" },
        { name: "Campos Adicionales por Trámite", path: "/catalog/procedure-additional-fields" },
        { name: "UMAs", path: "/catalog/wildlife-management-units" },
      ],
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none"><path d="M4 8a2 2 0 012-2h2l1-2h6l1 2h2a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 11v5M9.5 13.5h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      name: "Ventanilla Única",
      subItems: [
        { name: "Administración de Agenda", path: "/single-window/agenda-administration" },
        { name: "Entrega Resolutivo Promovente", path: "/single-window/promoter-resolution-delivery" },
        { name: "Registro y Seguimiento de Trámites", path: "/single-window/procedure-registration-tracking" },
      ],
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none"><path d="M4 7.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.5M4 7.5h16M4 7.5V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 15h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      name: "Registro de Trámite",
      subItems: [
        { name: "Turnar Trámite a Juridico", path: "/procedure-registration/turn-to-legal" },
        { name: "Turnar Trámite a Proceso", path: "/procedure-registration/turn-to-process" },
      ],
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none"><path d="M12 4V20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M7 7H17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M5 10L3.5 13H6.5L5 10Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M19 10L17.5 13H20.5L19 10Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9.5 20H14.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      name: "Área Jurídica",
      subItems: [
        { name: "Dictamen Jurídico", path: "/legal/legal-department" }, ],
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none"><path d="M4 5h16M4 12h8M4 19h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M16 10l3 2-3 2v-4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
      name: "Procesos",
      subItems: [
        { name: "Carátula de Integración de Registros", path: "/processes/registration-integration-cover" },
        { name: "Turnar Trámite a Evaluación", path: "/processes/refer-procedure-evaluation" },
        { name: "Elaborar Resolutivo", path: "/processes/prepare-resolution" },
        { name: "Turnar Resolutivo a Seguimiento", path: "/processes/refer-resolution-followup" },
        { name: "Importar Cintillos Expedidos", path: "/processes/import-issued-tags" },
        { name: "Especies Autorizadas por UMAS", path: "/processes/umas-authorized-species" },
        { name: "Inicio de Revocación de UMAS", path: "/processes/umas-revocation-initiation" },
        { name: "Revocación de UMAS", path: "/processes/umas-revocation" },
      ],
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none"><path d="M9 11l2 2 4-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 3h10l2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
      name: "Evaluación",
      subItems: [
        { name: "Dictamen de Evaluación", path: "/evaluation/dictamen-de-evaluacion" },
      ],
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none"><path d="M4 5h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M7 9h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M4 19h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M7 13h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M18 11l2 2-2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      name: "Seguimiento",
      subItems: [
        { name: "Expediente Digital", path: "/follow-up/digital-expedient" },
        { name: "Turnar Resolutivo a Ventanilla", path: "/follow-up/turn-resolution-to-single-window" },
      ],
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none"><path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 9h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 13h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 17h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      name: "Reportes",
      subItems: [
        { name: "Reporte de Trámite en Curso", path: "/reports/ongoing-procedure" },
        { name: "Reporte de Informe de Actividades", path: "/reports/activity-report" },
        { name: "Reportes de Transparencia", path: "/reports/transparency" },
        { name: "Reportes de Transparencia(LGTA)", path: "/reports/transparency-lgta" },
        { name: "Reportes por Tramites ingresados", path: "/reports/entered-procedures" },
        { name: "Reportes por Tramite anual", path: "/reports/annual-procedure" },
        { name: "Reportes de superficie total de UMAs", path: "/reports/total-umas-surface" },
        { name: "Reportes de aprovechamiento de especies", path: "/reports/species-exploitation" },
        { name: "Reportes de especies controladas", path: "/reports/controlled-species" },
        { name: "Reportes Archivos Digitales", path: "/reports/digital-files" },
      ],
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none"><path d="M12 15.25C13.7949 15.25 15.25 13.7949 15.25 12C15.25 10.2051 13.7949 8.75 12 8.75C10.2051 8.75 8.75 10.2051 8.75 12C8.75 13.7949 10.2051 15.25 12 15.25Z" stroke="currentColor" stroke-width="1.5"/><path d="M19.4 12.98C19.44 12.66 19.46 12.33 19.46 12C19.46 11.67 19.44 11.34 19.4 11.02L21 9.77C21.14 9.66 21.18 9.46 21.09 9.29L19.57 6.71C19.48 6.54 19.28 6.47 19.1 6.53L17.22 7.15C16.7 6.75 16.12 6.41 15.49 6.16L15.1 4.2C15.07 4.01 14.9 3.88 14.7 3.88H11.7C11.5 3.88 11.33 4.01 11.3 4.2L10.91 6.16C10.28 6.41 9.7 6.75 9.18 7.15L7.3 6.53C7.12 6.47 6.92 6.54 6.83 6.71L5.31 9.29C5.22 9.46 5.26 9.66 5.4 9.77L7 11.02C6.96 11.34 6.94 11.67 6.94 12C6.94 12.33 6.96 12.66 7 12.98L5.4 14.23C5.26 14.34 5.22 14.54 5.31 14.71L6.83 17.29C6.92 17.46 7.12 17.53 7.3 17.47L9.18 16.85C9.7 17.25 10.28 17.59 10.91 17.84L11.3 19.8C11.33 19.99 11.5 20.12 11.7 20.12H14.7C14.9 20.12 15.07 19.99 15.1 19.8L15.49 17.84C16.12 17.59 16.7 17.25 17.22 16.85L19.1 17.47C19.28 17.53 19.48 17.46 19.57 17.29L21.09 14.71C21.18 14.54 21.14 14.34 21 14.23L19.4 12.98Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      name: "Configuracion",
      subItems: [
        { name: "Firma Digital", path: "/configuration/digital-signature" },
        { name: "Promovente por UMA", path: "/configuration/promoter-by-uma" },
        { name: "Configuracion de parametros", path: "/configuration/parameter-configuration" },
        { name: "Configuración de formato", path: "/configuration/format-configuration" },
      ],
    },

  ];
  // Others nav items
  othersItems: NavItem[] = [
    // {
    //   icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C11.5858 2 11.25 2.33579 11.25 2.75V12C11.25 12.4142 11.5858 12.75 12 12.75H21.25C21.6642 12.75 22 12.4142 22 12C22 6.47715 17.5228 2 12 2ZM12.75 11.25V3.53263C13.2645 3.57761 13.7659 3.66843 14.25 3.80098V3.80099C15.6929 4.19606 16.9827 4.96184 18.0104 5.98959C19.0382 7.01734 19.8039 8.30707 20.199 9.75C20.3316 10.2341 20.4224 10.7355 20.4674 11.25H12.75ZM2 12C2 7.25083 5.31065 3.27489 9.75 2.25415V3.80099C6.14748 4.78734 3.5 8.0845 3.5 12C3.5 16.6944 7.30558 20.5 12 20.5C15.9155 20.5 19.2127 17.8525 20.199 14.25H21.7459C20.7251 18.6894 16.7492 22 12 22C6.47715 22 2 17.5229 2 12Z" fill="currentColor"></path></svg>`,
    //   name: "Charts",
    //   subItems: [
    //     { name: "Line Chart", path: "/line-chart", pro: false },
    //     { name: "Bar Chart", path: "/bar-chart", pro: false },
    //   ],
    // },
    // {
    //   icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M11.665 3.75618C11.8762 3.65061 12.1247 3.65061 12.3358 3.75618L18.7807 6.97853L12.3358 10.2009C12.1247 10.3064 11.8762 10.3064 11.665 10.2009L5.22014 6.97853L11.665 3.75618ZM4.29297 8.19199V16.0946C4.29297 16.3787 4.45347 16.6384 4.70757 16.7654L11.25 20.0365V11.6512C11.1631 11.6205 11.0777 11.5843 10.9942 11.5425L4.29297 8.19199ZM12.75 20.037L19.2933 16.7654C19.5474 16.6384 19.7079 16.3787 19.7079 16.0946V8.19199L13.0066 11.5425C12.9229 11.5844 12.8372 11.6207 12.75 11.6515V20.037ZM13.0066 2.41453C12.3732 2.09783 11.6277 2.09783 10.9942 2.41453L4.03676 5.89316C3.27449 6.27429 2.79297 7.05339 2.79297 7.90563V16.0946C2.79297 16.9468 3.27448 17.7259 4.03676 18.1071L10.9942 21.5857L11.3296 20.9149L10.9942 21.5857C11.6277 21.9024 12.3732 21.9024 13.0066 21.5857L19.9641 18.1071C20.7264 17.7259 21.2079 16.9468 21.2079 16.0946V7.90563C21.2079 7.05339 20.7264 6.27429 19.9641 5.89316L13.0066 2.41453Z" fill="currentColor"></path></svg>`,
    //   name: "UI Elements",
    //   subItems: [
    //     { name: "Alerts", path: "/alerts", pro: false },
    //     { name: "Avatar", path: "/avatars", pro: false },
    //     { name: "Badge", path: "/badge", pro: false },
    //     { name: "Buttons", path: "/buttons", pro: false },
    //     { name: "Images", path: "/images", pro: false },
    //     { name: "Videos", path: "/videos", pro: false },
    //   ],
    // },
    // {
    //   icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M14 2.75C14 2.33579 14.3358 2 14.75 2C15.1642 2 15.5 2.33579 15.5 2.75V5.73291L17.75 5.73291H19C19.4142 5.73291 19.75 6.0687 19.75 6.48291C19.75 6.89712 19.4142 7.23291 19 7.23291H18.5L18.5 12.2329C18.5 15.5691 15.9866 18.3183 12.75 18.6901V21.25C12.75 21.6642 12.4142 22 12 22C11.5858 22 11.25 21.6642 11.25 21.25V18.6901C8.01342 18.3183 5.5 15.5691 5.5 12.2329L5.5 7.23291H5C4.58579 7.23291 4.25 6.89712 4.25 6.48291C4.25 6.0687 4.58579 5.73291 5 5.73291L6.25 5.73291L8.5 5.73291L8.5 2.75C8.5 2.33579 8.83579 2 9.25 2C9.66421 2 10 2.33579 10 2.75L10 5.73291L14 5.73291V2.75ZM7 7.23291L7 12.2329C7 14.9943 9.23858 17.2329 12 17.2329C14.7614 17.2329 17 14.9943 17 12.2329L17 7.23291L7 7.23291Z" fill="currentColor"></path></svg>`,
    //   name: "Authentication",
    //   subItems: [
    //     { name: "Sign In", path: "/signin", pro: false },
    //     { name: "Sign Up", path: "/signup", pro: false },
    //   ],
    // },
  ];

  openSubmenu: string | null | number = null;
  subMenuHeights: { [key: string]: number } = {};
  @ViewChildren('subMenu') subMenuRefs!: QueryList<ElementRef>;

  readonly isExpanded$;
  readonly isMobileOpen$;
  readonly isHovered$;

  private subscription: Subscription = new Subscription();

  constructor(
    public sidebarService: SidebarService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.isHovered$ = this.sidebarService.isHovered$;
  }

  ngOnInit() {
    // Subscribe to router events
    this.subscription.add(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.setActiveMenuFromRoute(this.router.url);
        }
      })
    );

    // Subscribe to combined observables to close submenus when all are false
    this.subscription.add(
      combineLatest([this.isExpanded$, this.isMobileOpen$, this.isHovered$]).subscribe(
        ([isExpanded, isMobileOpen, isHovered]) => {
          if (!isExpanded && !isMobileOpen && !isHovered) {
            // this.openSubmenu = null;
            // this.savedSubMenuHeights = { ...this.subMenuHeights };
            // this.subMenuHeights = {};
            this.cdr.detectChanges();
          } else {
            // Restore saved heights when reopening
            // this.subMenuHeights = { ...this.savedSubMenuHeights };
            // this.cdr.detectChanges();
          }
        }
      )
    );

    // Initial load
    this.setActiveMenuFromRoute(this.router.url);
  }

  ngOnDestroy() {
    // Clean up subscriptions
    this.subscription.unsubscribe();
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }

  toggleSubmenu(section: string, index: number) {
    const key = `${section}-${index}`;

    if (this.openSubmenu === key) {
      this.openSubmenu = null;
      this.subMenuHeights[key] = 0;
    } else {
      this.openSubmenu = key;

      setTimeout(() => {
        const el = document.getElementById(key);
        if (el) {
          this.subMenuHeights[key] = el.scrollHeight;
          this.cdr.detectChanges(); // Ensure UI updates
        }
      });
    }
  }

  onSidebarMouseEnter() {
    this.isExpanded$.subscribe(expanded => {
      if (!expanded) {
        this.sidebarService.setHovered(true);
      }
    }).unsubscribe();
  }

  private setActiveMenuFromRoute(currentUrl: string) {
    const menuGroups = [
      { items: this.navItems, prefix: 'main' },
      { items: this.othersItems, prefix: 'others' },
    ];

    menuGroups.forEach(group => {
      group.items.forEach((nav, i) => {
        if (nav.subItems) {
          nav.subItems.forEach(subItem => {
            if (currentUrl === subItem.path) {
              const key = `${group.prefix}-${i}`;
              this.openSubmenu = key;

              setTimeout(() => {
                const el = document.getElementById(key);
                if (el) {
                  this.subMenuHeights[key] = el.scrollHeight;
                  this.cdr.detectChanges(); // Ensure UI updates
                }
              });
            }
          });
        }
      });
    });
  }

  onSubmenuClick() {
    console.log('click submenu');
    this.isMobileOpen$.subscribe(isMobile => {
      if (isMobile) {
        this.sidebarService.setMobileOpen(false);
      }
    }).unsubscribe();
  }


}
