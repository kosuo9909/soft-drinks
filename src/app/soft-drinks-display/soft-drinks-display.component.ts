import { Component, OnDestroy, OnInit } from '@angular/core';
import { Product, SoftDrinksService } from '../services/soft-drinks.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import {
  Subject,
  catchError,
  forkJoin,
  from,
  map,
  mergeMap,
  of,
  takeUntil,
} from 'rxjs';
import { IndexedDBService } from '../services/indexed-db.service';
import { getLocale, setLocale } from '../../locale/i18n';
import { productMappings } from '../../assets/productMappingsMock';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FilterSupermarketsComponent } from '../filter-supermarkets/filter-supermarkets.component';
import { SearchbarComponent } from '../searchbar/searchbar.component';
import { DataSharingService } from '../dataSharing.service';
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
    FilterSupermarketsComponent,
    SearchbarComponent,
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
    private indexedDBService: IndexedDBService,
    private dataSharingService: DataSharingService
  ) {}

  public switchLanguage() {
    const newLanguage = this.currentLanguage === 'en-GB' ? 'bg-BG' : 'en-GB';
    setLocale(newLanguage, localStorage);
    this.currentLanguage = newLanguage;
    location.reload();
  }

  public calculateDiscount(price: number, oldPrice: number): number {
    return Math.round(((oldPrice - price) / oldPrice) * 100);
  }

  public sortBy(option: 'price' | 'discount'): void {
    this.selectedSortOption = option;
    this.dataSharingService.setSelectedSortOption(this.selectedSortOption);
  }

  private async fetchImageUrl(productName: string): Promise<string> {
    const cachedUrl = await this.indexedDBService.getImageUrl(productName);
    const fallbackUrl =
      'https://mysupermarket.bg/_next/static/media/default-product-thumbnail.76adf62e.png';
    if (cachedUrl) {
      return cachedUrl;
    } else {
      const url = productMappings[productName];
      if (url) {
        await this.indexedDBService.setImageUrl(productName, url);
        return url;
      } else {
        await this.indexedDBService.setImageUrl(productName, fallbackUrl);
        return fallbackUrl;
      }
    }
  }

  public async onPageChange(event: PageEvent): Promise<void> {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.dataSharingService.setStartEndPaginationIndices([
      startIndex,
      endIndex,
    ]);
  }

  private async getTotalProductsCountPerRequest(): Promise<void> {
    this.totalItems = await this.softDrinksService.getTotalProducts();
  }

  public async ngOnInit() {
    this.softDrinksService.sortedProducts$
      .pipe(
        takeUntil(this._ngUnsubscribe),
        mergeMap((products) => {
          const imageRequests = products.map((item) => {
            if (!item.product.picUrl) {
              return from(this.fetchImageUrl(item.product.name)).pipe(
                map((picUrl) => {
                  item.product.picUrl = picUrl;
                  return item;
                }),
                catchError((error) => {
                  console.error(error);
                  return of(item);
                })
              );
            } else {
              return of(item);
            }
          });
          return forkJoin(imageRequests);
        })
      )
      .subscribe((products) => {
        this.softDrinks = products;
        this.getTotalProductsCountPerRequest();
      });
    this.currentLanguage = getLocale();
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
