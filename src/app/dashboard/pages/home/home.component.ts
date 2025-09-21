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
      label: 'Descargar PDF',
      icon: 'pi pi-file-pdf',
      command: () => this.onDownloadPDF(this.currentFolio)
    },
    {
      label: 'Compartir',
      icon: 'pi pi-share-alt',
      command: () => this.onShare(this.currentFolio)
    },
    {
      label: 'Cancelar trámite',
      icon: 'pi pi-times',
      command: () => this.onCancel(this.currentFolio)
    }
  ];

  currentFolio: string = '';

  showActionMenu(event: Event, folio: string) {
    this.currentFolio = folio;
    this.actionMenu.toggle(event);
  }


  // Métodos para las acciones del menú
  onViewDetails(folio: string) {
    // Navegar a la vista de inquiry con el folio como parámetro
    this.router.navigate(['/dashboard/inquiry'], {
      queryParams: { folio: folio }
    });
  }

  onDownloadPDF(folio: string) {
    console.log('Descargar PDF para:', folio);
    // TODO: Implementar funcionalidad
  }

  onShare(folio: string) {
    console.log('Compartir:', folio);
    // TODO: Implementar funcionalidad
  }

  onCancel(folio: string) {
    console.log('Cancelar trámite:', folio);
    // TODO: Implementar funcionalidad
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
