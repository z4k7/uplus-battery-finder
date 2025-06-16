import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Subject, debounceTime } from 'rxjs';
import { BatteryService, BatteryInfo } from '../../services/battery.service';
import { Preferences } from '@capacitor/preferences';
import { addIcons } from 'ionicons';
import {
  batteryCharging,
  batteryChargingOutline,
  closeCircle,
  colorFilterOutline,
  flashOutline,
  hardwareChip,
  informationCircleOutline,
  logoGoogle,
  moon,
  searchOutline,
  shieldCheckmark,
  shieldCheckmarkOutline,
  speedometerOutline,
  sunny,
} from 'ionicons/icons';
import { GeminiService } from 'src/app/services/gemini.service';

addIcons({
  'battery-charging-outline': batteryChargingOutline,
  moon: moon,
  sunny: sunny,
  'flash-outline': flashOutline,
  'search-outline': searchOutline,
  'speedometer-outline': speedometerOutline,
  'shield-checkmark-outline': shieldCheckmarkOutline,
  'color-filter-outline': colorFilterOutline,
  'close-circle': closeCircle,
  'logo-google': logoGoogle,
  'hardware-chip': hardwareChip,
  'battery-charging': batteryCharging,
  'shield-checkmark': shieldCheckmark,
  'information-circle-outline': informationCircleOutline,
});

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class SearchPage implements OnInit {
  searchTerm: string = '';
  searchResults: BatteryInfo[] = [];
  allBrands: string[] = [];
  selectedBrand: string = '';
  isLoading = false;
  aiSearchResults: any = null;

  batteryService = inject(BatteryService);
  geminiService = inject(GeminiService);

  searchTermChanged = new Subject<string>();

  async ngOnInit() {
    this.loadBrands();
    this.searchTermChanged
      .pipe(debounceTime(1000))
      .subscribe(() => this.search());
    await this.initializeDarkMode();
  }

  async initializeDarkMode() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const { value } = await Preferences.get({ key: 'dark-mode' });

    const darkMode = value !== null ? value === 'true' : prefersDark.matches;
    this.setDarkMode(darkMode);

    prefersDark.addEventListener('change', async (mediaQuery) => {
      const { value } = await Preferences.get({ key: 'dark-mode' });
      if (value === null) {
        this.setDarkMode(mediaQuery.matches);
      }
    });
  }

  async toggleDarkTheme() {
    const darkMode = !this.isDarkMode;
    this.setDarkMode(darkMode);
    await Preferences.set({ key: 'dark-mode', value: String(darkMode) });
  }

  private setDarkMode(shouldEnable: boolean) {
    document.body.classList.toggle('dark', shouldEnable);
    document.body.classList.toggle('ion-palette-dark', shouldEnable);
  }

  get isDarkMode(): boolean {
    return document.body.classList.contains('dark');
  }

  loadBrands() {
    this.batteryService.getAllBrands().subscribe({
      next: (brands) => (this.allBrands = brands),
      error: (err) => console.error('Error loading brands:', err),
    });
  }

  async search() {
    if (!this.searchTerm.trim()) {
      this.searchResults = [];
      this.aiSearchResults = null;
      return;
    }

    this.isLoading = true;
    this.aiSearchResults = null; // Reset AI results

    this.batteryService.searchByVehicleName(this.searchTerm).subscribe({
      next: async (results) => {
        const filtered = this.selectedBrand
          ? results.filter((item) => item.vehicle_brand === this.selectedBrand)
          : results;

        this.searchResults = filtered;

        if (filtered.length === 0) {
          // Call Gemini AI if no local results
          const aiResults = await this.geminiService.generateBatterySuggestions(
            this.searchTerm,
            this.selectedBrand
          );
          // Convert to BatteryInfo format
          this.aiSearchResults = aiResults.map((result) => ({
            vehicle_brand: this.selectedBrand || 'AI Suggested',
            vehicle_name: this.searchTerm,
            battery_model: result.battery_model,
            battery_capacity: result.battery_capacity,
            warranty_months: result.warranty_months,
            fuel_type: 'N/A',
            notes: result.notes,
          }));
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Search error:', err);
        this.isLoading = false;
      },
    });
  }

  filterByBrand() {
    if (this.searchTerm.trim()) {
      this.search();
    }
  }

  resetSearch() {
    this.searchTerm = '';
    this.selectedBrand = '';
    this.searchResults = [];
  }
}
