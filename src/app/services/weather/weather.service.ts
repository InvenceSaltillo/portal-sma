import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { WeatherResponse } from '../../interfaces/weather.interface';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  apiUrl = `${environment.weatherApiUrl}${environment.weatherApiKey}`
  private http = inject(HttpClient);

  constructor() { }

  getWeather(latitude: number, longitude: number): Promise<WeatherResponse> {
    const response: Promise<WeatherResponse> = lastValueFrom(
      this.http.get<WeatherResponse>(`${this.apiUrl}&q=${latitude},${longitude}&aqi=no`)
    );
    return response;
  }
}
