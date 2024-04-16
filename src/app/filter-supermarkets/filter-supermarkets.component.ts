import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DataSharingService, Supermarkets } from '../dataSharing.service';

interface LogoStructure {
  name: string;
  src: string;
  active: boolean;
}

@Component({
  selector: 'app-filter-supermarkets',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-supermarkets.component.html',
  styleUrl: './filter-supermarkets.component.scss',
})
export class FilterSupermarketsComponent {
  logos: { [key: string]: LogoStructure } = {
    Billa: {
      name: 'Billa',
      src: '../../assets/filter-supermarket-logos/Billa-Filter-Logo.jpg',
      active: false,
    },
    Kaufland: {
      name: 'Kaufland',
      src: '../../assets/filter-supermarket-logos/kaufland-filter-logo.png',
      active: false,
    },
    Lidl: {
      name: 'Lidl',
      src: '../../assets/filter-supermarket-logos/lidl-filter-logo.jpg',
      active: false,
    },
    Fantastico: {
      name: 'Fantastico',
      src: '../../assets/filter-supermarket-logos/FAntastico-Filter-Logo.png',
      active: false,
    },
    'T-Market': {
      name: 'T-Market',
      src: '../../assets/filter-supermarket-logos/t-market-filter-logo.png',
      active: false,
    },
  };

  constructor(private dataSharingService: DataSharingService) {}

  public activateLogo(logo: string): void {
    this.logos[logo].active = !this.logos[logo].active;
    this.applyFilters();
  }

  private applyFilters(): void {
    const activeSupermarkets = Object.values(this.logos)
      .filter((logo) => logo.active)
      .map((logo) => logo.name as Supermarkets);

    this.dataSharingService.setShopsToInclude(activeSupermarkets);
    this.dataSharingService.setStartEndPaginationIndices([0, 10]);
  }
}
