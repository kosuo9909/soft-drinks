import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Supermarkets =
  | 'Kaufland'
  | 'Fantastico'
  | 'Lidl'
  | 'Billa'
  | 'T-Market';

@Injectable({
  providedIn: 'root',
})
export class DataSharingService {
  private searchTerm = new BehaviorSubject<string>('Газирана');
  private shopsToInclude = new BehaviorSubject<Supermarkets[]>([]);
  private selectedSortOption = new BehaviorSubject<'price' | 'discount'>(
    'price'
  );
  private startEndPaginationIndices = new BehaviorSubject<[number, number]>([
    0, 10,
  ]);
  private isDataLoading = new BehaviorSubject<boolean>(false);

  constructor() {}

  public setIsDataLoading(isLoading: boolean) {
    this.isDataLoading.next(isLoading);
  }

  public getisDataLoading() {
    return this.isDataLoading;
  }

  public setSearchTerm(term: string) {
    this.searchTerm.next(term);
  }

  public getSearchTerm(): Observable<string> {
    return this.searchTerm.asObservable();
  }

  public setShopsToInclude(shops: Supermarkets[]) {
    this.shopsToInclude.next(shops);
  }

  public getShopsToInclude(): Observable<Supermarkets[] | []> {
    return this.shopsToInclude.asObservable();
  }

  public setStartEndPaginationIndices(
    indices: [startIndex: number, endIndex: number]
  ) {
    this.startEndPaginationIndices.next(indices);
  }

  public getStartEndPaginationIndices(): Observable<[number, number] | []> {
    return this.startEndPaginationIndices.asObservable();
  }

  public setSelectedSortOption(option: 'price' | 'discount'): void {
    this.selectedSortOption.next(option);
  }

  public getSelectedSortOption(): Observable<'price' | 'discount'> {
    return this.selectedSortOption.asObservable();
  }
}
