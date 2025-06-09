import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Database, ref, update } from '@angular/fire/database';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-teacher-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './teacher-profile.component.html',
  styleUrl: './teacher-profile.component.css'
})
export class TeacherProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private db = inject(Database);
  private auth = inject(AuthService);

  profileForm: FormGroup;
  passwordForm: FormGroup;
  loading = true;
  successMessage = '';
  errorMessage = '';
  currentUser: any = null;

  constructor() {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.auth.getCurrentUserWithRole().subscribe(user => {
      if (!user || user.role !== 'Teacher') return;
      
      this.currentUser = user;
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      });
      
      this.loading = false;
    });
  }

  async updateProfile() {
    if (this.profileForm.invalid) return;

    try {
      const updates = this.profileForm.value;
      await update(ref(this.db, `users/${this.currentUser.uid}`), updates);
      
      this.successMessage = 'Profil mis à jour avec succès !';
      this.errorMessage = '';
      
      // Mettre à jour l'utilisateur courant
      this.currentUser = { ...this.currentUser, ...updates };
    } catch (err) {
      console.error('Erreur lors de la mise à jour du profil:', err);
      this.errorMessage = 'Erreur lors de la mise à jour du profil.';
      this.successMessage = '';
    }
  }

  async updatePassword() {
    if (this.passwordForm.invalid) return;
    
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;
    
    if (newPassword !== confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    try {
      await this.auth.updatePassword(currentPassword, newPassword);
      this.successMessage = 'Mot de passe mis à jour avec succès !';
      this.errorMessage = '';
      this.passwordForm.reset();
    } catch (err: any) {
      console.error('Erreur lors du changement de mot de passe:', err);
      this.errorMessage = err.message || 'Erreur lors du changement de mot de passe.';
      this.successMessage = '';
    }
  }
}
