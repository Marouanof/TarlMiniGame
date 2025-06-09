import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Database, ref, get, remove, update } from '@angular/fire/database';
import { onValue } from 'firebase/database';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-test-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './test-list.component.html',
  styleUrl: './test-list.component.css'
})
export class TestListComponent {
  private db = inject(Database);
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  
  tests: any[] = [];
  filteredTests: any[] = [];
  selectedState = '';
  loading = true;
  teacherUID = '';
  testToDelete: any = null;
  editingTest: any = null;
  successMessage = '';
  errorMessage = '';

  testForm = this.fb.group({
    testName: ['', Validators.required],
    etatDeTest: ['', Validators.required],
    grade: ['', Validators.required]
  });

  ngOnInit(): void {
    this.auth.getCurrentUserWithRole().subscribe(async (user) => {
      if (!user || user.role !== 'Teacher') return;

      this.teacherUID = user.uid;
      const snapshot = await get(ref(this.db, 'tests'));

      if (snapshot.exists()) {
        const allTests = snapshot.val();
        this.tests = Object.entries(allTests)
          .map(([testId, test]: [string, any]) => ({
            testId,
            ...test,
            isActive: test.isActive !== false
          }))
          .filter((test: any) => test.teacherId === this.teacherUID);
        
        this.applyFilter();
      }

      this.loading = false;
    });
  }

  applyFilter() {
    this.filteredTests = this.selectedState
      ? this.tests.filter(t => t.isActive === (this.selectedState === 'active'))
      : this.tests;
  }

  editTest(test: any) {
    this.editingTest = test;
    this.testForm.patchValue({
      testName: test.testName,
      etatDeTest: test.isActive ? 'Actif' : 'Inactif',
      grade: test.grade
    });
  }

  cancelEdit() {
    this.editingTest = null;
    this.testForm.reset();
    this.successMessage = '';
    this.errorMessage = '';
  }

  async onSubmit() {
    if (this.testForm.invalid || !this.editingTest) return;

    const testData = this.testForm.value;

    try {
      const dataToUpdate = {
        ...this.editingTest,
        testName: testData.testName,
        grade: testData.grade,
        isActive: testData.etatDeTest === 'Actif',
        updatedAt: Date.now()
      };

      await update(ref(this.db, `tests/${this.editingTest.testId}`), dataToUpdate);

      // Mettre à jour la liste des tests
      const index = this.tests.findIndex(t => t.testId === this.editingTest.testId);
      if (index !== -1) {
        this.tests[index] = {
          ...this.tests[index],
          ...dataToUpdate
        };
        this.applyFilter();
      }

      this.successMessage = 'Test modifié avec succès !';
      this.errorMessage = '';
      this.editingTest = null;
      this.testForm.reset();

      // Effacer le message de succès après 2 secondes
      setTimeout(() => {
        this.successMessage = '';
      }, 2000);

    } catch (err) {
      console.error(err);
      this.errorMessage = 'Erreur lors de la modification du test.';
      this.successMessage = '';
    }
  }

  confirmDelete(test: any) {
    this.testToDelete = test;
  }

  cancelDelete() {
    this.testToDelete = null;
  }

  async deleteTest() {
    if (!this.testToDelete) return;

    try {
      await remove(ref(this.db, `tests/${this.testToDelete.testId}`));
      
      const resultsSnapshot = await get(ref(this.db, 'test_results'));
      if (resultsSnapshot.exists()) {
        const results = resultsSnapshot.val();
        const deletePromises = Object.entries(results)
          .filter(([_, result]: [string, any]) => result.testId === this.testToDelete.testId)
          .map(([resultId, _]) => remove(ref(this.db, `test_results/${resultId}`)));
        
        await Promise.all(deletePromises);
      }

      this.tests = this.tests.filter(t => t.testId !== this.testToDelete.testId);
      this.applyFilter();
      this.testToDelete = null;

      alert('Test supprimé avec succès !');
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('Erreur lors de la suppression du test');
    }
  }
}