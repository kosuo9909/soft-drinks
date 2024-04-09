import { Component, OnDestroy, OnInit } from '@angular/core';
import { Product, SoftDrinksService } from '../services/soft-drinks.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Subject } from 'rxjs';
import { IndexedDBService } from '../services/indexed-db.service';
import { getLocale, setLocale } from '../../locale/i18n';
import { productMappings } from '../../assets/productMappingsMock';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
@Component({
  selector: 'app-soft-drinks-display',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    MatSelectModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatPaginatorModule,
  ],
  templateUrl: './soft-drinks-display.component.html',
  styleUrls: ['./soft-drinks-display.component.scss'],
})
export class SoftDrinksDisplayComponent implements OnInit, OnDestroy {
  public softDrinks: { supermarket: string; product: Product }[] = [];
  private _ngUnsubscribe = new Subject<void>();
  public selectedSortOption: 'price' | 'discount' = 'price';
  public currentLanguage: 'en-GB' | 'bg-BG' | string = 'en-GB';
  public totalItems = 0;
  public pageSize = 10;
  public pageSizeOptions = [10, 25, 50];
  public currentPage = 0;

  public languageNames: { [key: string]: string } = {
    'en-GB': 'Български',
    'bg-BG': 'English',
  };

  constructor(
    private softDrinksService: SoftDrinksService,
    private indexedDBService: IndexedDBService
  ) {}

  public async switchLanguage() {
    const newLanguage = this.currentLanguage === 'en-GB' ? 'bg-BG' : 'en-GB';
    setLocale(newLanguage, localStorage);
    console.log('Changing language to:', newLanguage);
    this.currentLanguage = newLanguage;
    location.reload();
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
      const url = productMappings[productName];
      if (url) {
        await this.indexedDBService.setImageUrl(productName, url);
        return url;
      } else {
        throw new Error(`Image URL not found for product: ${productName}`);
      }
    }
  }

  public async onPageChange(event: PageEvent): Promise<void> {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    await this.loadSoftDrinks();
  }

  private async loadSoftDrinks(): Promise<void> {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.softDrinks = await this.softDrinksService.extractProducts(
      startIndex,
      endIndex
    );
    this.totalItems = await this.softDrinksService.getTotalProducts();
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

  public async ngOnInit() {
    this.currentLanguage = getLocale();
    this.loadSoftDrinks();
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
