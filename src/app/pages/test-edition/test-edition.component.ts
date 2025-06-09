import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { Database, ref, update, get } from '@angular/fire/database';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-test-edition',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './test-edition.component.html',
  styleUrl: './test-edition.component.css'
})
export class TestEditionComponent {
  private fb = inject(FormBuilder);
  private db = inject(Database);
  private router = inject(Router);
  successMessage = '';
  errorMessage = '';
  testId: string | null = null;

  constructor(private auth: AuthService) {}

  testForm = this.fb.group({
    testName: ['', Validators.required],
    etatDeTest: ['', Validators.required],
    grade: ['', Validators.required]
  });

  ngOnInit() {
    const testData = localStorage.getItem('currentTest');
    if (testData) {
      const test = JSON.parse(testData);
      this.testId = test.uid;
      this.testForm.patchValue({
        testName: test.testName,
        etatDeTest: test.isActive ? 'Actif' : 'Inactif',
        grade: test.grade
      });
    }
  }

  async onSubmit() {
    if (this.testForm.invalid || !this.testId) return;

    const testData = this.testForm.value;

    this.auth.getCurrentUserWithRole().subscribe(async user => {
      if (!user) return;

      try {
        // Récupérer les données existantes du test
        const testRef = ref(this.db, `tests/${this.testId}`);
        const snapshot = await get(testRef);
        const existingData = snapshot.val();

        if (!existingData) {
          throw new Error('Test non trouvé');
        }

        // Fusionner les données existantes avec les nouvelles données
        const dataToUpdate = {
          ...existingData,
          testName: testData.testName,
          grade: testData.grade,
          isActive: testData.etatDeTest === 'Actif',
          updatedAt: Date.now()
        };

        await update(testRef, dataToUpdate);

        this.successMessage = 'Test modifié avec succès !';
        this.errorMessage = '';
        localStorage.removeItem('currentTest');

        // Rediriger vers la liste des tests après 2 secondes
        setTimeout(() => {
          this.router.navigate(['/test-list']);
        }, 2000);

      } catch (err) {
        console.error(err);
        this.errorMessage = 'Erreur lors de la modification du test.';
        this.successMessage = '';
      }
    });
  }
} 