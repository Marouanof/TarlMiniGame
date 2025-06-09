import { Component, inject, OnInit } from '@angular/core';
import { Database, ref, get, update, remove } from '@angular/fire/database';
import { AuthService } from '../../services/auth.service'; 
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './student-list.component.html',
  styleUrl: './student-list.component.css'
})
export class StudentListComponent implements OnInit {
  private db = inject(Database);
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  students: any[] = [];
  filteredStudents: any[] = [];
  loading = true;
  teacherUID = '';
  editingStudent: any = null;
  editForm: FormGroup;
  successMessage = '';
  errorMessage = '';

  // Filtres
  searchTerm: string = '';
  selectedGrade: string = '';
  selectedGender: string = '';

  constructor() {
    this.editForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      birthday: ['', Validators.required],
      schoolGrade: ['', Validators.required],
      gender: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadStudents();
  }

  async loadStudents() {
    this.loading = true;
    try {
      this.auth.getCurrentUserWithRole().subscribe(async (user) => {
        if (!user || user.role !== 'Teacher') return;

        this.teacherUID = user.uid;
        const snapshot = await get(ref(this.db, 'users'));

        if (snapshot.exists()) {
          const allUsers = snapshot.val();
          this.students = Object.entries(allUsers)
            .map(([uid, userData]: [string, any]) => ({
              uid,
              ...userData
            }))
            .filter((user: any) => user.role === 'Student' && user.linkedTeacherId === this.teacherUID);
          this.applyFilters();
        }

        this.loading = false;
      });
    } catch (error) {
      console.error('Error loading students:', error);
      this.errorMessage = 'Erreur lors du chargement des étudiants';
      this.loading = false;
    }
  }

  applyFilters() {
    this.filteredStudents = this.students.filter(student => {
      const matchesName = (student.firstName + ' ' + student.lastName).toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesGrade = this.selectedGrade ? student.schoolGrade === this.selectedGrade : true;
      const matchesGender = this.selectedGender ? student.gender === this.selectedGender : true;
      return matchesName && matchesGrade && matchesGender;
    });
  }

  async deleteStudent(uid: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet étudiant ?')) return;

    try {
      // Supprimer l'étudiant de la base de données
      await remove(ref(this.db, `users/${uid}`));
      
      // Mettre à jour la liste locale
      this.students = this.students.filter(s => s.uid !== uid);
      this.applyFilters();
      
      this.successMessage = 'Étudiant supprimé avec succès';
      setTimeout(() => this.successMessage = '', 3000);
    } catch (error) {
      console.error('Error deleting student:', error);
      this.errorMessage = 'Erreur lors de la suppression de l\'étudiant';
      setTimeout(() => this.errorMessage = '', 3000);
    }
  }

  editStudent(student: any) {
    this.editingStudent = student;
    this.editForm.patchValue({
      firstName: student.firstName,
      lastName: student.lastName,
      birthday: student.birthday,
      schoolGrade: student.schoolGrade,
      gender: student.gender
    });
  }

  cancelEdit() {
    this.editingStudent = null;
    this.editForm.reset();
  }

  async saveEdit() {
    if (this.editForm.invalid || !this.editingStudent) return;

    try {
      const updatedData = {
        ...this.editingStudent,
        ...this.editForm.value,
        updatedAt: Date.now()
      };

      // Mettre à jour dans la base de données
      await update(ref(this.db, `users/${this.editingStudent.uid}`), updatedData);
      
      // Mettre à jour la liste locale
      const index = this.students.findIndex(s => s.uid === this.editingStudent.uid);
      if (index !== -1) {
        this.students[index] = updatedData;
        this.applyFilters();
      }

      this.editingStudent = null;
      this.editForm.reset();
      this.successMessage = 'Étudiant modifié avec succès';
      setTimeout(() => this.successMessage = '', 3000);
    } catch (error) {
      console.error('Error updating student:', error);
      this.errorMessage = 'Erreur lors de la modification de l\'étudiant';
      setTimeout(() => this.errorMessage = '', 3000);
    }
  }

  async generateQRCode(student: any) {
    try {
      const qrData = JSON.stringify({ uid: student.uid, pin: student.password });
      const qrUrl = await QRCode.toDataURL(qrData);

      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Student QR Code Login", 20, 20);

      doc.setFontSize(12);
      doc.text(`First Name: ${student.firstName}`, 20, 30);
      doc.text(`Last Name: ${student.lastName}`, 20, 40);
      doc.text(`Grade: ${student.schoolGrade}`, 20, 50);
      doc.text(`Birth Date: ${student.birthday}`, 20, 60);
      doc.text(`Gender: ${student.gender}`, 20, 70);
      doc.text(`PIN: ${student.password}`, 20, 80);
      doc.text("Scan the QR code below to log in:", 20, 100);

      doc.addImage(qrUrl, "PNG", 20, 110, 100, 100);

      const filename = `student-${student.firstName}-${student.lastName}-G${student.schoolGrade}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }
}