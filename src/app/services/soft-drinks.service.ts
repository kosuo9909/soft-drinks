import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { IndexedDBService } from './indexed-db.service';
import { firstValueFrom } from 'rxjs';
import { DataSharingService, Supermarkets } from '../dataSharing.service';

export interface Product {
  name: string;
  quantity: string;
  price: number;
  oldPrice: number;
  picUrl: string | null;
  validFrom: string;
  validUntil: string;
}

export interface Supermarket {
  supermarket: string;
  updatedAt: string;
  products: Product[];
}

@Injectable({
  providedIn: 'root',
})
export class SoftDrinksService {
  private _ngUnsubscribe: Subject<void> = new Subject<void>();

  public sortedProducts$ = new BehaviorSubject<
    { supermarket: string; product: Product }[]
  >([]);

  private sortedProducts: { supermarket: string; product: Product }[] = [];
  private selectedSortOption: 'price' | 'discount' = 'price';
  private shopsToInclude: Supermarkets[] = [];
  private searchTerm: string = '';
  private startEndPaginationIndices = [0, 10];

  constructor(
    private http: HttpClient,
    private indexedDBService: IndexedDBService,
    private dataSharingService: DataSharingService
  ) {
    this.listenToDataSharingService();
  }

  private listenToDataSharingService(): void {
    this.dataSharingService
      .getSelectedSortOption()
      .pipe(takeUntil(this._ngUnsubscribe))
      .subscribe((selectedOption) => {
        this.selectedSortOption = selectedOption;
        this.extractProducts();
        console.log('Selected Sort Option:', selectedOption);
      });

    this.dataSharingService
      .getShopsToInclude()
      .pipe(takeUntil(this._ngUnsubscribe))
      .subscribe((shops) => {
        this.shopsToInclude = shops;
        this.extractProducts();
        console.log('Shops to Include:', shops);
      });

    this.dataSharingService
      .getSearchTerm()
      .pipe(takeUntil(this._ngUnsubscribe))
      .subscribe((term) => {
        this.searchTerm = term;
        console.log('Search Term:', term);
        this.extractProducts();
      });

    this.dataSharingService
      .getStartEndPaginationIndices()
      .pipe(takeUntil(this._ngUnsubscribe))
      .subscribe((indices) => {
        this.startEndPaginationIndices = indices;
        this.extractProducts();
        console.log('Pagination Indices:', indices);
      });
  }

  public cleanup(): void {
    this._ngUnsubscribe.next();
    this._ngUnsubscribe.complete();
  }

  public setSortOption(
    option: 'price' | 'discount',
    startIndex: number,
    endIndex: number
  ): void {
    this.selectedSortOption = option;
    this.sortProducts(startIndex, endIndex);
  }

  private sortProducts(startIndex?: number, endIndex?: number): void {
    if (this.selectedSortOption === 'price') {
      this.sortedProducts.sort((a, b) => a.product.price - b.product.price);
    } else if (this.selectedSortOption === 'discount') {
      this.sortedProducts.sort(
        (a, b) =>
          this.calculateDiscount(b.product.price, b.product.oldPrice) -
          this.calculateDiscount(a.product.price, a.product.oldPrice)
      );
    }
    this.sortedProducts$.next(this.sortedProducts.slice(startIndex, endIndex));
  }

  private calculateDiscount(price: number, oldPrice: number): number {
    return Math.round(((oldPrice - price) / oldPrice) * 100);
  }

  public getTotalProducts(): number {
    return this.sortedProducts.length;
  }

  public async extractProducts(): Promise<void> {
    const CACHE_VALIDITY_MINUTES = 60;
    const isCacheValid = await this.indexedDBService.isCacheValid(
      'softDrinks',
      CACHE_VALIDITY_MINUTES
    );

    if (isCacheValid) {
      console.log('Retrieved from cache');
      const cachedProducts = await this.indexedDBService.getProducts(
        'softDrinks'
      );
      if (cachedProducts) {
        this.sortedProducts = this.filterDrinksProducts(
          cachedProducts,
          this.shopsToInclude,
          this.searchTerm
        );
        this.sortProducts();
        this.sortedProducts$.next(
          this.sortedProducts.slice(...this.startEndPaginationIndices)
        );
      }
    } else {
      console.log('Making API call');
      const products = await firstValueFrom(
        this.http.get<Supermarket[]>('https://api.naoferta.net/products')
      );

      await this.indexedDBService.setProducts('softDrinks', products);

      const timestamp = new Date();
      await this.indexedDBService.setLastUpdated('softDrinks', timestamp);

      this.sortedProducts = this.filterDrinksProducts(
        products,
        this.shopsToInclude,
        this.searchTerm
      );
      this.sortProducts();
      this.sortedProducts$.next(
        this.sortedProducts.slice(...this.startEndPaginationIndices)
      );
    }
  }

  private filterDrinksProducts(
    supermarkets: Supermarket[],
    includedSupermarkets?: string[],
    searchKeyword: string = 'Газирана'
  ): { supermarket: string; product: Product }[] {
    const drinksProducts: { supermarket: string; product: Product }[] = [];
    let supermarketsToShow;
    if (includedSupermarkets?.length) {
      supermarketsToShow = supermarkets.filter((supermarket) =>
        includedSupermarkets?.includes(supermarket.supermarket)
      );
    } else {
      supermarketsToShow = supermarkets;
    }
    supermarketsToShow.forEach((supermarket: Supermarket) => {
      const filteredProducts = supermarket.products.filter(
        (product: Product) =>
          product.name.toLowerCase().includes(searchKeyword.toLowerCase()) &&
          product.oldPrice
      );

      filteredProducts.forEach((product: Product) => {
        const productExists = drinksProducts.find(
          (drinkProduct) =>
            drinkProduct.supermarket === supermarket.supermarket &&
            drinkProduct.product.name === product.name
        );

        if (!productExists) {
          drinksProducts.push({
            supermarket: supermarket.supermarket,
            product: product,
          });
        }
      });
    });

    return drinksProducts;
  }
}
