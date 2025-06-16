import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface BatteryInfo {
  vehicle_name: string;
  vehicle_brand: string;
  battery_model: string;
  battery_capacity: number;
  warranty_months: number;
  fuel_type: string;
}

@Injectable({
  providedIn: 'root'
})
export class BatteryService {
     private batteryData$: Observable<BatteryInfo[]>;

  constructor(private http: HttpClient) {
    this.batteryData$ = this.http.get<BatteryInfo[]>('assets/battery-data.json').pipe(
      shareReplay(1) 
    );
  }
  searchByVehicleName(vehicleName: string): Observable<BatteryInfo[]> {
    return this.batteryData$.pipe(
      map(data => {
        if (!vehicleName.trim()) {
          return [];
        }
        return data.filter(battery => 
          battery.vehicle_name.toLowerCase().includes(vehicleName.toLowerCase())
        );
      })
    );
  }

  getAllBrands(): Observable<string[]> {
    return this.batteryData$.pipe(
      map(data => [...new Set(data.map(item => item.vehicle_brand))])
    );
  }
}
