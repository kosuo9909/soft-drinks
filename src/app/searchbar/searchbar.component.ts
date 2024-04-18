import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DataSharingService } from '../services/dataSharing.service';

@Component({
  selector: 'app-searchbar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './searchbar.component.html',
  styleUrl: './searchbar.component.scss',
})
export class SearchbarComponent {
  public searchTerm: string = '';
  public searchPlaceHolder = $localize`:@@searchPlaceHolder: Search...`;

  constructor(private searchBarService: DataSharingService) {}

  public onSearch() {
    console.log('Searching for:', this.searchTerm);
    this.searchBarService.setSearchTerm(this.searchTerm);
  }
}
