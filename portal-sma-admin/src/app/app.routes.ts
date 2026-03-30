import { Routes } from '@angular/router';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { CalendarComponent } from './pages/calendar/calendar.component';
import { HomeComponent } from './pages/home/home.component';
import { ProcedureTypeComponent } from './pages/catalog/procedure-type/procedure-type.component';
import { ProcedureTypeNewComponent } from './pages/catalog/procedure-type-new/procedure-type-new.component';
import { RequirementComponent } from './pages/catalog/requirement/requirement.component';
import { RequirementNewComponent } from './pages/catalog/requirement-new/requirement-new.component';
import { ProcedureComponent } from './pages/catalog/procedure/procedure.component';
import { ProcedureNewComponent } from './pages/catalog/procedure-new/procedure-new.component';
import { ManagementPlanTopicComponent } from './pages/catalog/management-plan-topic/management-plan-topic.component';
import { ManagementPlanTopicNewComponent } from './pages/catalog/management-plan-topic-new/management-plan-topic-new.component';
import { ManagementPlanSubtopicComponent } from './pages/catalog/management-plan-subtopic/management-plan-subtopic.component';
import { ManagementPlanSubtopicNewComponent } from './pages/catalog/management-plan-subtopic-new/management-plan-subtopic-new.component';
import { PropertyRegimeComponent } from './pages/catalog/property-regime/property-regime.component';
import { PropertyRegimeNewComponent } from './pages/catalog/property-regime-new/property-regime-new.component';
import { TenureTypeComponent } from './pages/catalog/tenure-type/tenure-type.component';
import { TenureTypeNewComponent } from './pages/catalog/tenure-type-new/tenure-type-new.component';
import { LegalDocumentTypeComponent } from './pages/catalog/legal-document-type/legal-document-type.component';
import { LegalDocumentTypeNewComponent } from './pages/catalog/legal-document-type-new/legal-document-type-new.component';
import { DocumentTemplateComponent } from './pages/catalog/document-template/document-template.component';
import { DocumentTemplateNewComponent } from './pages/catalog/document-template-new/document-template-new.component';
import { SpeciesComponent } from './pages/catalog/species/species.component';
import { SpeciesNewComponent } from './pages/catalog/species-new/species-new.component';
import { ProcedureAdditionalFieldComponent } from './pages/catalog/procedure-additional-field/procedure-additional-field.component';
import { WildlifeManagementUnitComponent } from './pages/catalog/wildlife-management-unit/wildlife-management-unit.component';
import { AgendaAdministrationComponent } from './pages/single-window/agenda-administration/agenda-administration.component';
import { PromoterResolutionDeliveryComponent } from './pages/single-window/promoter-resolution-delivery/promoter-resolution-delivery.component';
import { ProcedureRegistrationTrackingComponent } from './pages/single-window/procedure-registration-tracking/procedure-registration-tracking.component';
import { LegalDecisionsComponent } from './pages/legal/legal-decisions/legal-decisions.component';
import { RegistrationIntegrationCoverComponent } from './pages/processes/registration-integration-cover/registration-integration-cover.component';
import { ReferProcedureEvaluationComponent } from './pages/processes/refer-procedure-evaluation/refer-procedure-evaluation.component';
import { PrepareResolutionComponent } from './pages/processes/prepare-resolution/prepare-resolution.component';
import { ReferResolutionFollowupComponent } from './pages/processes/refer-resolution-followup/refer-resolution-followup.component';
import { ImportIssuedTagsComponent } from './pages/processes/import-issued-tags/import-issued-tags.component';
import { UmasAuthorizedSpeciesComponent } from './pages/processes/umas-authorized-species/umas-authorized-species.component';
import { UmasRevocationInitiationComponent } from './pages/processes/umas-revocation-initiation/umas-revocation-initiation.component';
import { UmasRevocationComponent } from './pages/processes/umas-revocation/umas-revocation.component';
import { EvaluationDictamenComponent } from './pages/evaluation/evaluation-dictamen/evaluation-dictamen.component';
import { TurnToProcessComponent } from './pages/procedure-registration/turn-to-process/turn-to-process.component';
import { TurnToLegalComponent } from './pages/procedure-registration/turn-to-legal/turn-to-legal.component';
import { DigitalExpedientComponent } from './pages/follow-up/digital-expedient/digital-expedient.component';
import { TurnResolutionToSingleWindowComponent } from './pages/follow-up/turn-resolution-to-single-window/turn-resolution-to-single-window.component';
import { ReportOngoingProcedureComponent } from './pages/reports/report-ongoing-procedure/report-ongoing-procedure.component';
import { ReportActivityComponent } from './pages/reports/report-activity/report-activity.component';
import { ReportTransparencyComponent } from './pages/reports/report-transparency/report-transparency.component';
import { ReportTransparencyLgtaComponent } from './pages/reports/report-transparency-lgta/report-transparency-lgta.component';
import { ReportEnteredProceduresComponent } from './pages/reports/report-entered-procedures/report-entered-procedures.component';
import { ReportAnnualProcedureComponent } from './pages/reports/report-annual-procedure/report-annual-procedure.component';
import { ReportTotalUmasSurfaceComponent } from './pages/reports/report-total-umas-surface/report-total-umas-surface.component';
import { ReportSpeciesExploitationComponent } from './pages/reports/report-species-exploitation/report-species-exploitation.component';
import { ReportControlledSpeciesComponent } from './pages/reports/report-controlled-species/report-controlled-species.component';
import { ReportDigitalFilesComponent } from './pages/reports/report-digital-files/report-digital-files.component';
import { DigitalSignatureComponent } from './pages/configuration/digital-signature/digital-signature.component';
import { PromoterByUmaComponent } from './pages/configuration/promoter-by-uma/promoter-by-uma.component';
import { FormatConfigurationComponent } from './pages/configuration/format-configuration/format-configuration.component';
import { ParameterConfigurationComponent } from './pages/configuration/parameter-configuration/parameter-configuration.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';

export const routes: Routes = [
  {
    path: '',
    component: SignInComponent,
    canActivate: [guestGuard],
    pathMatch: 'full',
    title: 'Portal SMA - Iniciar sesión',
  },
  {
    path: 'signin',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        component: HomeComponent,
        pathMatch: 'full',
        title:
          'Portal SMA - Inicio',
      },
      {
        path: 'calendar',
        component: CalendarComponent,
        pathMatch: 'full',
        data: { calendarMode: 'agenda' },
        title:
          'Portal SMA - Agenda',
      },
      {
        path: 'notifications',
        component: NotificationsComponent,
        pathMatch: 'full',
        title: 'Portal SMA - Notificaciones',
      },
      {
        path: 'catalog/procedure-types/new',
        component: ProcedureTypeNewComponent,
        title: 'Portal SMA - Nuevo tipo de trámite',
      },
      {
        path: 'catalog/procedure-types/:id/edit',
        component: ProcedureTypeNewComponent,
        title: 'Portal SMA - Editar tipo de trámite',
      },
      {
        path: 'catalog/procedure-types',
        component: ProcedureTypeComponent,
        title: 'Portal SMA - Tipo de Trámites',
      },
      {
        path: 'catalog/requirements/new',
        component: RequirementNewComponent,
        title: 'Portal SMA - Nuevo requisito',
      },
      {
        path: 'catalog/requirements/:id/edit',
        component: RequirementNewComponent,
        title: 'Portal SMA - Editar requisito',
      },
      {
        path: 'catalog/requirements',
        component: RequirementComponent,
        title: 'Portal SMA - Requisitos',
      },
      {
        path: 'catalog/procedures/new',
        component: ProcedureNewComponent,
        title: 'Portal SMA - Nuevo trámite',
      },
      {
        path: 'catalog/procedures/:id/edit',
        component: ProcedureNewComponent,
        title: 'Portal SMA - Editar trámite',
      },
      {
        path: 'catalog/procedures',
        component: ProcedureComponent,
        title: 'Portal SMA - Trámites',
      },
      {
        path: 'catalog/management-plan-topics/new',
        component: ManagementPlanTopicNewComponent,
        title: 'Portal SMA - Nuevo tema de plan de manejo',
      },
      {
        path: 'catalog/management-plan-topics/:id/edit',
        component: ManagementPlanTopicNewComponent,
        title: 'Portal SMA - Editar tema de plan de manejo',
      },
      {
        path: 'catalog/management-plan-topics',
        component: ManagementPlanTopicComponent,
        title: 'Portal SMA - Temas de Plan de Manejo',
      },
      {
        path: 'catalog/management-plan-subtopics/new',
        component: ManagementPlanSubtopicNewComponent,
        title: 'Portal SMA - Nuevo subtema de plan de manejo',
      },
      {
        path: 'catalog/management-plan-subtopics/:id/edit',
        component: ManagementPlanSubtopicNewComponent,
        title: 'Portal SMA - Editar subtema de plan de manejo',
      },
      {
        path: 'catalog/management-plan-subtopics',
        component: ManagementPlanSubtopicComponent,
        title: 'Portal SMA - Subtemas de Plan de Manejo',
      },
      {
        path: 'catalog/property-regimes/new',
        component: PropertyRegimeNewComponent,
        title: 'Portal SMA - Nuevo régimen de propiedad',
      },
      {
        path: 'catalog/property-regimes/:id/edit',
        component: PropertyRegimeNewComponent,
        title: 'Portal SMA - Editar régimen de propiedad',
      },
      {
        path: 'catalog/property-regimes',
        component: PropertyRegimeComponent,
        title: 'Portal SMA - Régimen de Propiedad',
      },
      {
        path: 'catalog/tenure-types/new',
        component: TenureTypeNewComponent,
        title: 'Portal SMA - Nuevo tipo de tenencia',
      },
      {
        path: 'catalog/tenure-types/:id/edit',
        component: TenureTypeNewComponent,
        title: 'Portal SMA - Editar tipo de tenencia',
      },
      {
        path: 'catalog/tenure-types',
        component: TenureTypeComponent,
        title: 'Portal SMA - Tipo de Tenencia',
      },
      {
        path: 'catalog/legal-document-types/new',
        component: LegalDocumentTypeNewComponent,
        title: 'Portal SMA - Nuevo tipo de documento legal',
      },
      {
        path: 'catalog/legal-document-types/:id/edit',
        component: LegalDocumentTypeNewComponent,
        title: 'Portal SMA - Editar tipo de documento legal',
      },
      {
        path: 'catalog/legal-document-types',
        component: LegalDocumentTypeComponent,
        title: 'Portal SMA - Tipo de Documento Legal',
      },
      {
        path: 'catalog/document-templates/new',
        component: DocumentTemplateNewComponent,
        title: 'Portal SMA - Nueva plantilla de documento',
      },
      {
        path: 'catalog/document-templates/:id/edit',
        component: DocumentTemplateNewComponent,
        title: 'Portal SMA - Editar plantilla de documento',
      },
      {
        path: 'catalog/document-templates',
        component: DocumentTemplateComponent,
        title: 'Portal SMA - Plantillas de documentos',
      },
      {
        path: 'catalog/species/new',
        component: SpeciesNewComponent,
        title: 'Portal SMA - Nueva especie',
      },
      {
        path: 'catalog/species/:id/edit',
        component: SpeciesNewComponent,
        title: 'Portal SMA - Editar especie',
      },
      {
        path: 'catalog/species',
        component: SpeciesComponent,
        title: 'Portal SMA - Especies',
      },
      {
        path: 'catalog/procedure-additional-fields',
        component: ProcedureAdditionalFieldComponent,
        title: 'Portal SMA - Campos Adicionales por Trámite',
      },
      {
        path: 'catalog/wildlife-management-units',
        component: WildlifeManagementUnitComponent,
        title: 'Portal SMA - UMAs',
      },
      {
        path: 'single-window/agenda-administration',
        component: AgendaAdministrationComponent,
        pathMatch: 'full',
        title: 'Portal SMA - Administración de Agenda',
      },
      {
        path: 'single-window/promoter-resolution-delivery',
        component: PromoterResolutionDeliveryComponent,
        title: 'Portal SMA - Entrega Resolutivo Promovente',
      },
      {
        path: 'single-window/procedure-registration-tracking',
        component: ProcedureRegistrationTrackingComponent,
        title: 'Portal SMA - Registro y Seguimiento de Trámites',
      },
      {
        path: 'procedure-registration/turn-to-process',
        component: TurnToProcessComponent,
        title: 'Portal SMA - Turnar Trámite a Proceso',
      },
      {
        path: 'procedure-registration/turn-to-legal',
        component: TurnToLegalComponent,
        title: 'Portal SMA - Turnar Trámite a Jurídico',
      },
      {
        path: 'follow-up/digital-expedient',
        component: DigitalExpedientComponent,
        title: 'Portal SMA - Expediente Digital',
      },
      {
        path: 'follow-up/turn-resolution-to-single-window',
        component: TurnResolutionToSingleWindowComponent,
        title: 'Portal SMA - Turnar Resolutivo a Ventanilla',
      },
      {
        path: 'processes/registration-integration-cover',
        component: RegistrationIntegrationCoverComponent,
        title: 'Portal SMA - Carátula de Integración de Registros',
      },
      {
        path: 'processes/refer-procedure-evaluation',
        component: ReferProcedureEvaluationComponent,
        title: 'Portal SMA - Turnar Trámite a Evaluación',
      },
      {
        path: 'processes/prepare-resolution',
        component: PrepareResolutionComponent,
        title: 'Portal SMA - Elaborar Resolutivo',
      },
      {
        path: 'processes/refer-resolution-followup',
        component: ReferResolutionFollowupComponent,
        title: 'Portal SMA - Turnar Resolutivo a Seguimiento',
      },
      {
        path: 'processes/import-issued-tags',
        component: ImportIssuedTagsComponent,
        title: 'Portal SMA - Importar Cintillos Expedidos',
      },
      {
        path: 'processes/umas-authorized-species',
        component: UmasAuthorizedSpeciesComponent,
        title: 'Portal SMA - Especies Autorizadas por UMAS',
      },
      {
        path: 'processes/umas-revocation-initiation',
        component: UmasRevocationInitiationComponent,
        title: 'Portal SMA - Inicio de Revocación de UMAS',
      },
      {
        path: 'processes/umas-revocation',
        component: UmasRevocationComponent,
        title: 'Portal SMA - Revocación de UMAS',
      },
      {
        path: 'evaluation/dictamen-de-evaluacion',
        component: EvaluationDictamenComponent,
        title: 'Portal SMA - Dictamen de Evaluación',
      },
      {
        path: 'reports/ongoing-procedure',
        component: ReportOngoingProcedureComponent,
        title: 'Portal SMA - Reporte de Trámite en Curso',
      },
      {
        path: 'reports/activity-report',
        component: ReportActivityComponent,
        title: 'Portal SMA - Reporte de Informe de Actividades',
      },
      {
        path: 'reports/transparency',
        component: ReportTransparencyComponent,
        title: 'Portal SMA - Reportes de Transparencia',
      },
      {
        path: 'reports/transparency-lgta',
        component: ReportTransparencyLgtaComponent,
        title: 'Portal SMA - Reportes de Transparencia(LGTA)',
      },
      {
        path: 'reports/entered-procedures',
        component: ReportEnteredProceduresComponent,
        title: 'Portal SMA - Reportes por Tramites ingresados',
      },
      {
        path: 'reports/annual-procedure',
        component: ReportAnnualProcedureComponent,
        title: 'Portal SMA - Reportes por Tramite anual',
      },
      {
        path: 'reports/total-umas-surface',
        component: ReportTotalUmasSurfaceComponent,
        title: 'Portal SMA - Reportes de superficie total de UMAs',
      },
      {
        path: 'reports/species-exploitation',
        component: ReportSpeciesExploitationComponent,
        title: 'Portal SMA - Reportes de aprovechamiento de especies',
      },
      {
        path: 'reports/controlled-species',
        component: ReportControlledSpeciesComponent,
        title: 'Portal SMA - Reportes de especies controladas',
      },
      {
        path: 'reports/digital-files',
        component: ReportDigitalFilesComponent,
        title: 'Portal SMA - Reportes Archivos Digitales',
      },
      {
        path: 'configuration/digital-signature',
        component: DigitalSignatureComponent,
        title: 'Portal SMA - Firma Digital',
      },
      {
        path: 'configuration/promoter-by-uma',
        component: PromoterByUmaComponent,
        title: 'Portal SMA - Promovente por UMA',
      },
      {
        path: 'configuration/parameter-configuration',
        component: ParameterConfigurationComponent,
        title: 'Portal SMA - Configuracion de parametros',
      },
      {
        path: 'configuration/format-configuration',
        component: FormatConfigurationComponent,
        title: 'Portal SMA - Configuración de formato',
      },
      {
        path: 'legal/legal-department',
        component: LegalDecisionsComponent,
        title: 'Portal SMA - Área Jurídica',
      },
    ],
  },
  /** 404 fuera del layout (sin sidebar ni header). Requiere sesión; si no, authGuard → login. */
  {
    path: '**',
    component: NotFoundComponent,
    canActivate: [authGuard],
    title: 'Portal SMA - Página no encontrada',
  },
];
