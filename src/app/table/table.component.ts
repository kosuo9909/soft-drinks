import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Product, SoftDrinksService } from '../services/soft-drinks.service';
import { Subject, takeUntil, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [MatPaginatorModule, MatTableModule, CommonModule, FormsModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
})
export class TableComponent implements AfterViewInit, OnInit, OnDestroy {
  constructor(private softDrinksService: SoftDrinksService) {}

  private _ngUnsubscribe: Subject<void> = new Subject<void>();

  public data: { supermarket: string; product: Product }[] = [];

  public dataSource = new MatTableDataSource<{
    supermarket: string;
    product: Product;
  }>([]);

  public displayedColumns: string[] = ['name', 'oldPrice', 'price'];

  @ViewChild(MatPaginator) paginator: MatPaginator | null | undefined;

  public ngAfterViewInit(): void {
    this.paginator = this.dataSource.paginator;
  }

  public ngOnInit(): void {
    this.softDrinksService.sortedProducts$
      .pipe(takeUntil(this._ngUnsubscribe))
      .pipe(
        tap((info) => {
          console.log('here is the info', info);
        })
      )
      .subscribe((products) => (this.dataSource.data = products));
  }

  public ngOnDestroy(): void {
    this._ngUnsubscribe.next();
    this._ngUnsubscribe.complete();
  }
}
