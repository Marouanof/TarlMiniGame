import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Database, ref, set } from '@angular/fire/database';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

interface GameConfig {
  id: string;
  name: string;
  isEnabled: boolean;
}

@Component({
  selector: 'app-test-creation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './test-creation.component.html',
  styleUrl: './test-creation.component.css'
})
export class TestCreationComponent {
  private fb = inject(FormBuilder);
  private db = inject(Database);
  private router = inject(Router);
  
  successMessage = '';
  errorMessage = '';

  games: GameConfig[] = [
    {
      id: 'game1',
      name: 'Vertical Addition',
      isEnabled: false
    },
    {
      id: 'game2',
      name: 'Composition Addition',
      isEnabled: false
    },
    {
      id: 'game3',
      name: 'Problem Addition',
      isEnabled: false
    }
  ];

  testForm = this.fb.group({
    testName: ['', Validators.required],
    etatDeTest: ['', Validators.required],
    grade: ['', Validators.required]
  });

  constructor(private auth: AuthService) {}

  toggleGame(game: GameConfig) {
    game.isEnabled = !game.isEnabled;
  }

  hasEnabledGames(): boolean {
    return this.games.some(game => game.isEnabled);
  }

  async onSubmit() {
    if (this.testForm.invalid || !this.hasEnabledGames()) {
      this.errorMessage = !this.hasEnabledGames() 
        ? 'Veuillez sélectionner au moins un jeu.' 
        : 'Veuillez remplir tous les champs requis.';
      return;
    }

    const testData = this.testForm.value;
    const uid = `test_${Date.now()}`;

    this.auth.getCurrentUserWithRole().subscribe(async user => {
      if (!user) return;

      try {
        const gamesConfig = this.games.reduce((acc, game) => {
          acc[game.id] = {
            name: game.name,
            enabled: game.isEnabled
          };
          return acc;
        }, {} as { [key: string]: { name: string; enabled: boolean } });

        const dataToSave = {
          ...testData,
          teacherId: user.uid,
          isActive: testData.etatDeTest === 'Actif',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          gamesConfig
        };

        await set(ref(this.db, `tests/${uid}`), dataToSave);
        
        this.successMessage = 'Test créé avec succès !';
        this.errorMessage = '';
        this.resetForm();

        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);

      } catch (err) {
        console.error(err);
        this.errorMessage = 'Erreur lors de la création du test.';
        this.successMessage = '';
      }
    });
  }

  private resetForm() {
    this.testForm.reset();
    this.games.forEach(game => game.isEnabled = false);
  }
}
