import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css'
})
export class NavBarComponent {
  @Input() publicMode = false;
  menuOpen = false;

  constructor(private auth: AuthService) {}

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  logout() {
    this.auth.logout().then(() => window.location.reload());
  }
}