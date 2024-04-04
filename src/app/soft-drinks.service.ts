import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  public async extractProducts(): Promise<
    { supermarket: string; product: Product }[]
  > {
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
        return this.filterDrinksProducts(cachedProducts);
      }
      return [];
    } else {
      console.log('Making API call');
      const products = await firstValueFrom(
        this.http.get<Supermarket[]>('https://api.naoferta.net/products')
      );

      await this.indexedDBService.setProducts('softDrinks', products);

      const timestamp = new Date();
      await this.indexedDBService.setLastUpdated('softDrinks', timestamp);

      return this.filterDrinksProducts(products);
    }
  }

  private filterDrinksProducts(
    supermarkets: Supermarket[]
  ): { supermarket: string; product: Product }[] {
    const drinksProducts: { supermarket: string; product: Product }[] = [];

    supermarkets.forEach((supermarket: Supermarket) => {
      const filteredProducts = supermarket.products.filter((product: Product) =>
        product.name.includes('Газирана')
      );

      filteredProducts.forEach((product: Product) => {
        drinksProducts.push({
          supermarket: supermarket.supermarket,
          product: product,
        });
      });
    });

    return drinksProducts;
  }
}
