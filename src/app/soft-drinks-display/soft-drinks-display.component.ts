import { Component, OnDestroy, OnInit } from '@angular/core';
import { Product, SoftDrinksService } from '../services/soft-drinks.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Subject } from 'rxjs';
import { IndexedDBService } from '../services/indexed-db.service';
import { TranslationService } from '../services/translation-service.service';

interface ProductImageMappings {
  [key: string]: string;
}

@Component({
  selector: 'app-soft-drinks-display',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './soft-drinks-display.component.html',
  styleUrls: ['./soft-drinks-display.component.scss'],
})
export class SoftDrinksDisplayComponent implements OnInit, OnDestroy {
  public softDrinks: { supermarket: string; product: Product }[] = [];
  private _ngUnsubscribe = new Subject<void>();
  public selectedSortOption: 'price' | 'discount' = 'price';
  private productMappings: ProductImageMappings = {
    'Газирана вода Billa Произход – България':
      'https://mysupermarket.bg/api/public/images/products/2axo2a_1637589490741.png',
    'Газирана напитка Лимонада Aspasia':
      'https://mysupermarket.bg/api/public/images/tmarket/f83ff83fe7c30000be40fc01bc01dfe9ffffbff180018001fe41be418400ff1f.webp',
    'Fanta Газирана напитка 1,5 l/опаковка':
      'https://mysupermarket.bg/api/public/images/lidl/f81ff83fc1c7a001e007e0f9ffdda001e007f00ff01ff80ff807f007e007ee37.webp',
    'Газирана напитка Coca Cola или Fanta':
      'https://myplov.com/image/cache/catalog/Fanta-550x688w.png',
    'Газирана напитка Pepsi':
      'https://mysupermarket.bg/api/public/images/tmarket/fc1ff80ff007e003e007f007f807fc4ffc8ff00ff007e007e007e007f00ffc9f.webp',
    'Газирана напитка PEPSI; MIRINDA; различни видове':
      'https://mysupermarket.bg/api/public/images/tmarket/fc1ff80ff007e003e007f007f807fc4ffc8ff00ff007e007e007e007f00ffc9f.webp',
    'Газирана напитка CRODO различни видове':
      'https://www.supermag.bg/images/2022_3/gazirana-napitka-crodo-oran-soda-330ml.jpg?w=426&h=352',
  };

  constructor(
    private softDrinksService: SoftDrinksService,
    private indexedDBService: IndexedDBService,
    private translationService: TranslationService
  ) {}

  public async switchLanguage(language: string) {
    await this.translationService.changeLocale(language);
  }

  public calculateDiscount(price: number, oldPrice: number): number {
    return Math.round(((oldPrice - price) / oldPrice) * 100);
  }

  public sortBy(option: 'price' | 'discount'): void {
    this.selectedSortOption = option;
    this.sortSoftDrinks();
  }

  private sortSoftDrinks(): void {
    if (this.selectedSortOption === 'price') {
      this.softDrinks.sort((a, b) => a.product.price - b.product.price);
    } else if (this.selectedSortOption === 'discount') {
      this.softDrinks.sort(
        (a, b) =>
          this.calculateDiscount(b.product.price, b.product.oldPrice) -
          this.calculateDiscount(a.product.price, a.product.oldPrice)
      );
    }
  }

  public async fetchImageUrl(productName: string): Promise<string> {
    const cachedUrl = await this.indexedDBService.getImageUrl(productName);
    if (cachedUrl) {
      return cachedUrl;
    } else {
      const url = this.productMappings[productName];
      if (url) {
        await this.indexedDBService.setImageUrl(productName, url);
        return url;
      } else {
        throw new Error(`Image URL not found for product: ${productName}`);
      }
    }
  }

  public async ngOnInit() {
    this.softDrinks = await this.softDrinksService.extractProducts();
    this.softDrinks.forEach((item) => {
      if (!item.product.picUrl) {
        this.fetchImageUrl(item.product.name)
          .then((url) => {
            item.product.picUrl = url;
          })
          .catch((error) => {
            console.error('Error fetching the image:', error);
          });
      }
    });
  }

  public ngOnDestroy(): void {
    this._ngUnsubscribe.next();
    this._ngUnsubscribe.complete();
  }
}
