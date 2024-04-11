import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

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

import { IndexedDBService } from './indexed-db.service';

import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SoftDrinksService {
  constructor(
    private http: HttpClient,
    private indexedDBService: IndexedDBService
  ) {}

  private sortedProductsSubject = new BehaviorSubject<
    { supermarket: string; product: Product }[]
  >([]);
  public sortedProducts$ = this.sortedProductsSubject.asObservable();

  private sortedProducts: { supermarket: string; product: Product }[] = [];
  private selectedSortOption: 'price' | 'discount' = 'price';

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
    this.sortedProductsSubject.next(
      this.sortedProducts.slice(startIndex, endIndex)
    );
  }

  private calculateDiscount(price: number, oldPrice: number): number {
    return Math.round(((oldPrice - price) / oldPrice) * 100);
  }

  public async getTotalProducts(): Promise<number> {
    return this.sortedProducts.length;
  }

  public async extractProducts(
    startIndex: number,
    endIndex: number,
    includedSupermarkets?: string[]
  ): Promise<void> {
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
          includedSupermarkets
        );
        this.sortProducts();
        this.sortedProductsSubject.next(
          this.sortedProducts.slice(startIndex, endIndex)
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
        includedSupermarkets
      );
      this.sortProducts();
      this.sortedProductsSubject.next(
        this.sortedProducts.slice(startIndex, endIndex)
      );
    }
  }

  private filterDrinksProducts(
    supermarkets: Supermarket[],
    includedSupermarkets?: string[]
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
          product.name.includes('Газирана') && product.oldPrice
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
