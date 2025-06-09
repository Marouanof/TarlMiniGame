import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { Database, ref, set } from '@angular/fire/database';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-test-creation',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './test-creation.component.html',
  styleUrl: './test-creation.component.css'
})
export class TestCreationComponent {
  private fb = inject(FormBuilder);
  private db = inject(Database);
  private router = inject(Router);
  successMessage = '';
  errorMessage = '';

  constructor(private auth: AuthService) {}

  testForm = this.fb.group({
    testName: ['', Validators.required],
    etatDeTest: ['', Validators.required],
    grade: ['', Validators.required]
  });

  async onSubmit() {
    if (this.testForm.invalid) return;

    const testData = this.testForm.value;
    const uid = `test_${Date.now()}`;

    this.auth.getCurrentUserWithRole().subscribe(async user => {
      if (!user) return;

      try {
        const dataToSave = {
          ...testData,
          teacherId: user.uid,
          isActive: testData.etatDeTest === 'Actif',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        await set(ref(this.db, `tests/${uid}`), dataToSave);

        this.successMessage = 'Test créé avec succès !';
        this.errorMessage = '';

        // Rediriger vers le dashboard après 2 secondes
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
}
