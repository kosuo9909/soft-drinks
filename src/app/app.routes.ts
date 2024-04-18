import { Routes } from '@angular/router';
import { SoftDrinksDisplayComponent } from './soft-drinks-display/soft-drinks-display.component';
import { TableComponent } from './table/table.component';

export const routes: Routes = [
  { path: '', component: SoftDrinksDisplayComponent },
  { path: 'table', component: TableComponent },
];
