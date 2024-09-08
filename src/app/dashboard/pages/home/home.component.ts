import { animate, state, style, transition, trigger } from '@angular/animations';
import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit, inject, input } from '@angular/core';
import { TitleBarComponent } from '../../../shared/title-bar/title-bar.component';
import { RouterModule } from '@angular/router';
import { AppUtils } from '../../../app.utils';
import { AuthService } from '../../../services/auth/auth.service';
import { LocalStorageService } from '../../../services/local-storage/local-storage.service';
import { CommonModule } from '@angular/common';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { GeolocationService } from '../../../services/geolocation/geolocation.service';
import { WeatherService } from '../../../services/weather/weather.service';
import { WeatherResponse } from '../../../interfaces/weather.interface';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    TitleBarComponent,
    RouterModule,
    CommonModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export default class HomeComponent implements OnInit {
  userFullName = '';
  authService = inject(AuthService);
  geolocationService = inject(GeolocationService);
  weatherService = inject(WeatherService);
  public localStorageService = inject(LocalStorageService);
  formattedDate = Date();
  latitude = 0.0;
  longitude = 0.0;
  error = '';
  weather!: WeatherResponse;

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
        console.log('DEBUG: diferenteeeee',);
        await this.getWeather();
      } else {
        const weather = this.localStorageService.getItem('weather');
        this.weather = JSON.parse(weather!);
      }
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
