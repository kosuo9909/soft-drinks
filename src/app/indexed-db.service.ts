import { Injectable } from '@angular/core';
import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { Supermarket } from './soft-drinks.service';

interface MyDB extends DBSchema {
  lastUpdated: {
    key: string;
    value: Date;
  };
  products: {
    key: string;
    value: {
      key: string;
      value: Supermarket[];
    };
  };
  images: {
    key: string;
    value: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class IndexedDBService {
  private dbPromise: Promise<IDBPDatabase<MyDB>>;

  constructor() {
    this.dbPromise = openDB<MyDB>('MyDatabase', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products');
        }

        if (!db.objectStoreNames.contains('lastUpdated')) {
          db.createObjectStore('lastUpdated');
        }

        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images');
        }
      },
    });
  }

  public async setLastUpdated(key: string, timestamp: Date): Promise<void> {
    const db = await this.dbPromise;
    await db.put('lastUpdated', timestamp, key);
  }

  public async isCacheValid(
    key: string,
    maxAgeInMinutes: number
  ): Promise<boolean> {
    const db = await this.dbPromise;
    const lastUpdated = await db.get('lastUpdated', key);
    if (!lastUpdated) {
      return false;
    }
    const lastUpdatedDate = new Date(lastUpdated);
    const currentDate = new Date();
    const differenceInMinutes =
      (currentDate.getTime() - lastUpdatedDate.getTime()) / (1000 * 60);
    return differenceInMinutes < maxAgeInMinutes;
  }

  public async setImageUrl(key: string, url: string): Promise<void> {
    const db = await this.dbPromise;
    await db.put('images', url, key);
  }

  public async getImageUrl(key: string): Promise<string | undefined> {
    const db = await this.dbPromise;
    return await db.get('images', key);
  }

  public async getProducts(key: string): Promise<Supermarket[] | undefined> {
    const db = await this.dbPromise;
    const entry = await db.get('products', key);
    return entry?.value;
  }

  public async setProducts(
    key: string,
    products: Supermarket[]
  ): Promise<void> {
    const db = await this.dbPromise;
    await db.put('products', { key, value: products }, key);
  }
}
