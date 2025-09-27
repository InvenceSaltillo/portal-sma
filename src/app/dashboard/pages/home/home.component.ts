import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit, inject, input, signal, ViewChild } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AppUtils } from '../../../app.utils';
import { AuthService } from '../../../services/auth/auth.service';
import { LocalStorageService } from '../../../services/local-storage/local-storage.service';
import { CommonModule } from '@angular/common';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { GeolocationService } from '../../../services/geolocation/geolocation.service';
import { WeatherService } from '../../../services/weather/weather.service';
import { WeatherResponse } from '../../../interfaces/weather.interface';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { TooltipModule } from 'primeng/tooltip';
import { RequestService } from '../../../services/request/request.service';
import { RequestRowWithService } from '../../../interfaces/request.interface';
import { FormsModule } from '@angular/forms';
import { Menu } from 'primeng/menu';
import { PdfService } from '../../../services/pdf/pdf.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../environments/environment';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    MenuModule,
    OverlayPanelModule,
    TooltipModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export default class HomeComponent implements OnInit {
  @ViewChild('actionMenu') actionMenu!: Menu;
  @ViewChild('dt') dt!: any;

  userFullName = '';
  authService = inject(AuthService);
  geolocationService = inject(GeolocationService);
  weatherService = inject(WeatherService);
  requestService = inject(RequestService);
  pdfService = inject(PdfService);
  toastr = inject(ToastrService);
  public localStorageService = inject(LocalStorageService);
  router = inject(Router);
  formattedDate = Date();
  latitude = 0.0;
  longitude = 0.0;
  // error = '';
  weather!: WeatherResponse;
  loading = signal(true);
  error = signal<string | null>(null);
  myRequests = signal<RequestRowWithService[]>([]);
  globalFilter = '';
  totalRecords = 0;
  skeletonRows = Array(5).fill(0); // 5 filas de skeleton
  generatingPDF = signal<string | null>(null); // Track which folio is generating PDF


  constructor() {
    this.userFullName = AppUtils.getUserFullName(this.localStorageService.getUser()!);
    const fechaActual = new Date();
    this.formattedDate = format(fechaActual, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

    console.log('DEBUG: user', this.userFullName);
  }

  async ngOnInit(): Promise<void> {

    if (!this.localStorageService.getItem('location')) {
      await this.getLocation();
      await this.getWeather();
    } else {
      const storedLocation = JSON.parse(this.localStorageService.getItem('location')!);
      await this.getLocation();
      if (this.latitude !== storedLocation['latitude']) {
        await this.getWeather();
      } else {
        const weather = this.localStorageService.getItem('weather');
        this.weather = JSON.parse(weather!);
      }
    }

    await this.loadRequests();
  }

  async loadRequests() {
    try {
      this.loading.set(true);
      this.error.set(null);
      const rows = await this.requestService.listMyRequests(50, 0);
      this.myRequests.set(rows);
      this.totalRecords = rows.length; // Por ahora usamos el length, después se puede obtener del backend
    } catch (e: any) {
      this.error.set(e?.message ?? 'No se pudieron cargar tus trámites');
    } finally {
      this.loading.set(false);
    }
  }


  // Menú de acciones estático
  actionMenuItems = [
    {
      label: 'Ver detalles',
      icon: 'pi pi-eye',
      command: () => this.onViewDetails(this.currentFolio)
    },
    {
      label: 'Solicitud del trámite',
      icon: 'pi pi-file-pdf',
      command: () => this.onDownloadPDF(this.currentFolio)
    },
    {
      label: 'Constancia',
      icon: 'pi pi-file-export',
      command: () => this.onGenerateConstancia(this.currentFolio)
    }
  ];

  currentFolio: string = '';

  showActionMenu(event: Event, folio: string) {
    this.currentFolio = folio;
    this.updateActionMenu();
    this.actionMenu.toggle(event);
  }

  updateActionMenu() {
    const isGeneratingPDF = this.generatingPDF() === this.currentFolio;

    this.actionMenuItems = [
      {
        label: 'Ver detalles',
        icon: 'pi pi-eye',
        command: isGeneratingPDF ? () => {} : () => this.onViewDetails(this.currentFolio)
      },
      {
        label: isGeneratingPDF ? 'Generando PDF...' : 'Solicitud del trámite',
        icon: isGeneratingPDF ? 'pi pi-spin pi-spinner' : 'pi pi-file-pdf',
        command: isGeneratingPDF ? () => {} : () => this.onDownloadPDF(this.currentFolio)
      },
      {
        label: isGeneratingPDF ? 'Generando constancia...' : 'Constancia',
        icon: isGeneratingPDF ? 'pi pi-spin pi-spinner' : 'pi pi-file-export',
        command: isGeneratingPDF ? () => {} : () => this.onGenerateConstancia(this.currentFolio)
      }
    ];
  }


  // Métodos para las acciones del menú
  onViewDetails(folio: string) {
    // Navegar a la vista de inquiry con el folio como parámetro
    this.router.navigate(['/dashboard/inquiry'], {
      queryParams: { folio: folio }
    });
  }

  async onDownloadPDF(folio: string) {
    console.log('🔍 onDownloadPDF llamado para folio:', folio);
    console.log('📊 Estado generatingPDF actual:', this.generatingPDF());
    console.log('📋 Total requests disponibles:', this.myRequests().length);

    // Prevenir múltiples llamadas simultáneas
    if (this.generatingPDF()) {
      console.log('⚠️ Ya hay un PDF generándose, ignorando llamada');
      return;
    }

    try {
      // Establecer estado de carga
      this.generatingPDF.set(folio);
      console.log('✅ Estado de carga establecido para:', folio);

      // Buscar el request por folio para obtener el request_id
      const request = this.myRequests().find(r => r.folio === folio);
      console.log('🔍 Request encontrado:', request);

      if (!request) {
        console.log('❌ No se encontró request para folio:', folio);
        this.toastr.error('No se encontró el trámite solicitado', 'Error');
        return;
      }

      // Mostrar toast de inicio
      this.toastr.info('Generando PDF, por favor espera...', 'Procesando');
      console.log('📞 Llamando a pdfService.generateLicensePDF con ID:', request.id);

      // Llamar a la Edge Function para generar el PDF
      const result = await this.pdfService.generateLicensePDF(request.id);
      console.log('📄 Resultado de generateLicensePDF:', result);

      if (result.success && result.pdf_url) {
        // Abrir el PDF en una nueva pestaña
        console.log('🌐 Abriendo PDF en nueva pestaña:', result.pdf_url);
        window.open(result.pdf_url, '_blank');
        this.toastr.success('PDF generado exitosamente', 'Éxito');
      } else {
        console.log('❌ Error en la generación del PDF:', result.error);
        this.toastr.error(result.error || 'No se pudo generar el PDF', 'Error');
      }
    } catch (error: any) {
      console.error('💥 Error generando PDF:', error);
      this.toastr.error(error.message || 'Error al generar el PDF', 'Error');
    } finally {
      // Limpiar estado de carga
      this.generatingPDF.set(null);
      console.log('🧹 Estado de carga limpiado');
    }
  }

  onShare(folio: string) {
    console.log('Compartir:', folio);
    // TODO: Implementar funcionalidad
  }

  onCancel(folio: string) {
    console.log('Cancelar trámite:', folio);
    // TODO: Implementar funcionalidad
  }

  async onGenerateConstancia(folio: string) {
    console.log('🔍 onGenerateConstancia llamado para folio:', folio);
    console.log('📊 Estado generatingPDF actual:', this.generatingPDF());
    console.log('📋 Total requests disponibles:', this.myRequests().length);

    // Prevenir múltiples llamadas simultáneas
    if (this.generatingPDF()) {
      console.log('⚠️ Ya hay un PDF generándose, ignorando llamada');
      return;
    }

    try {
      // Establecer estado de carga
      this.generatingPDF.set(folio);
      console.log('✅ Estado de carga establecido para:', folio);

      // Buscar el request por folio para obtener el request_id
      const request = this.myRequests().find(r => r.folio === folio);
      console.log('🔍 Request encontrado:', request);

      if (!request) {
        console.log('❌ No se encontró request para folio:', folio);
        this.toastr.error('No se encontró el trámite solicitado', 'Error');
        return;
      }

      // Mostrar toast de inicio
      this.toastr.info('Generando constancia, por favor espera...', 'Procesando');
      console.log('📞 Llamando a generateReceiptCertificate con ID:', request.id);

      // Llamar a la Edge Function para generar la constancia
      const response = await fetch(`${environment.supabaseUrl}/functions/v1/generate-receipt-certificate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${environment.supabaseKey}`,
        },
        body: JSON.stringify({ request_id: request.id })
      });

      const result = await response.json();
      console.log('📄 Resultado de generateReceiptCertificate:', result);

      if (result.success && result.pdf_url) {
        // Abrir el PDF en una nueva pestaña
        console.log('🌐 Abriendo constancia en nueva pestaña:', result.pdf_url);
        window.open(result.pdf_url, '_blank');
        this.toastr.success('Constancia generada exitosamente', 'Éxito');
      } else {
        console.log('❌ Error en la generación de la constancia:', result.error);
        this.toastr.error(result.error || 'No se pudo generar la constancia', 'Error');
      }
    } catch (error: any) {
      console.error('💥 Error generando constancia:', error);
      this.toastr.error(error.message || 'Error al generar la constancia', 'Error');
    } finally {
      // Limpiar estado de carga
      this.generatingPDF.set(null);
      console.log('🧹 Estado de carga limpiado');
    }
  }


  async getLocation(): Promise<void> {
    const location = await this.geolocationService.getCurrentPosition();
    this.latitude = location.coords.latitude;
    this.longitude = location.coords.longitude;
    this.localStorageService.setItem('location', JSON.stringify({
      latitude: this.latitude,
      longitude: this.longitude,
    }));
    console.log('DEBUG: location', location);
  }

  async getWeather(): Promise<void> {
    // if (!weather) {
      this.weather = await this.weatherService.getWeather(this.latitude, this.longitude);
      this.localStorageService.setItem('weather', JSON.stringify(this.weather));
    // } else {

    // }
  }

}
