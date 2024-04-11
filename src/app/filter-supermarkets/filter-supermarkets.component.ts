import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SoftDrinksService } from '../services/soft-drinks.service';

@Component({
  selector: 'app-filter-supermarkets',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-supermarkets.component.html',
  styleUrl: './filter-supermarkets.component.scss',
})
export class FilterSupermarketsComponent {
  @Input() startIndex: number = 0;
  @Input() endIndex: number = 10;
  logos = [
    {
      name: 'Billa',
      src: '../../assets/filter-supermarket-logos/Billa-Filter-Logo.jpg',
      active: false,
      hover: false,
    },
    {
      name: 'Kaufland',
      src: '../../assets/filter-supermarket-logos/kaufland-filter-logo.png',
      active: false,
      hover: false,
    },
    {
      name: 'Lidl',
      src: '../../assets/filter-supermarket-logos/lidl-filter-logo.jpg',
      active: false,
      hover: false,
    },
    {
      name: 'Fantastico',
      src: '../../assets/filter-supermarket-logos/FAntastico-Filter-Logo.png',
      active: false,
      hover: false,
    },
    {
      name: 'T-Market',
      src: '../../assets/filter-supermarket-logos/t-market-filter-logo.png',
      active: false,
      hover: false,
    },
  ];

  constructor(private softdrinksService: SoftDrinksService) {}

  public activateLogo(index: number): void {
    this.logos[index].active = !this.logos[index].active;
    this.applyFilters();
  }

  private applyFilters(): void {
    const activeSupermarkets = this.logos
      .filter((logo) => logo.active)
      .map((logo) => logo.name);

    this.softdrinksService.extractProducts(
      this.startIndex,
      this.endIndex,
      activeSupermarkets
    );
  }

  public hoverLogo(index: number, isHovering: boolean): void {
    if (!this.logos[index].active) {
      this.logos[index].hover = isHovering;
    }
  }
}
