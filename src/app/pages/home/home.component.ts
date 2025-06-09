import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavBarComponent } from '../../shared/nav-bar/nav-bar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, NavBarComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  features = [
    {
      title: 'Mini-Jeux Mathématiques',
      description: 'Apprenez les mathématiques de façon ludique avec nos jeux interactifs',
      icon: '📝'
    },
    {
      title: 'Suivi de Progression',
      description: 'Visualisez vos progrès et identifiez les points à améliorer',
      icon: '📊'
    },
    {
      title: 'Tableau de Bord Enseignant',
      description: 'Suivez les progrès de vos élèves et personnalisez leur apprentissage',
      icon: '🧑‍🏫'
    }
  ];
}