import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { Database, ref, get, set, push  } from '@angular/fire/database';
import { from } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [NgIf, NgFor, CommonModule, FormsModule],
  templateUrl: './role-management.component.html',
  styleUrl: './role-management.component.css'
})
export class RoleManagementComponent {
  users: any[] = [];
  teachers: any[] = [];
  filteredUsers: any[] = [];
  loading = true;
  userRole: string | null = null;
  currentUserUID = '';
  filter = 'all';

  constructor(private db: Database, private auth: AuthService) {}

  ngOnInit(): void {
    this.auth.getCurrentUserWithRole().subscribe(user => {
      if (!user) return;
      this.userRole = user.role;
      this.currentUserUID = user.uid;

      from(get(ref(this.db, 'users'))).subscribe({
        next: snapshot => {
          const allUsers = snapshot.val();
          if (allUsers) {
            this.users = Object.entries(allUsers)
              .map(([uid, data]: [string, any]) => ({ uid, ...data }))
              .filter(u => u.uid !== this.currentUserUID && (this.userRole === 'Principal' || u.role !== 'Principal'));
            this.applyFilter();
          }
          this.loading = false;
          this.teachers = this.users.filter(u => u.role === 'Teacher');
        },
        error: err => {
          console.error('Error fetching users', err);
          this.loading = false;
        }
      });
    });
  }

  applyFilter() {
    this.filteredUsers = this.filter === 'pending'
      ? this.users.filter(u => u.role === 'Pending')
      : this.users;
  }

  assignRole(uid: string, newRole: string) {
    set(ref(this.db, `users/${uid}/role`), newRole);
    const updatedUser = this.users.find(u => u.uid === uid);
    if (updatedUser) updatedUser.role = newRole;
    this.applyFilter();
  }

  linkStudentToTeacher(studentUid: string, teacherUid: string) {
    set(ref(this.db, `users/${studentUid}/linkedTeacherId`), teacherUid)
      .then(() => {
        const student = this.users.find(u => u.uid === studentUid);
        if (student) {
          student.linkedTeacherId = teacherUid;
          delete student.tempTeacherId;
          this.applyFilter();
        }
      })
      .catch(err => console.error('Link error:', err));
  }  

  unlinkStudent(studentUid: string) {
    set(ref(this.db, `users/${studentUid}/linkedTeacherId`), '')
      .then(() => {
        const student = this.users.find(u => u.uid === studentUid);
        if (student) {
          student.linkedTeacherId = '';
          this.applyFilter();
        }
      })
      .catch(err => console.error('Error unlinking student:', err));
  }  

  getLinkedTeacherName(user: any): string {
    const teacher = this.teachers.find(t => t.uid === user.linkedTeacherId);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unknown';
  }

    // Method to Reset Parent Password
  resetParentPassword(uid: string) {
    const parent = this.users.find(u => u.uid === uid);
    if (!parent) return;

    const newPassword = this.generateSecurePassword();
    parent.generatedPassword = newPassword;
    set(ref(this.db, `users/${uid}/password`), newPassword);
    alert(`Password Reset\nNew Password: ${newPassword}`);
  }

  // Secure Password Generator
  generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  createParentAccount() {
    const parentUsername = `parent_${this.users.filter(u => u.role === 'Parent').length + 1}`;
    const password = this.generateSecurePassword();
    
    const newParentRef = push(ref(this.db, 'users'));
    const newParentUid = newParentRef.key;

    set(newParentRef, {
      uid: newParentUid,
      username: parentUsername,
      role: 'Parent',
      password: password,
      linkedStudentIds: []
    });

    this.users.push({
      uid: newParentUid,
      username: parentUsername,
      role: 'Parent',
      password: password,
      linkedStudentIds: []
    });

    this.applyFilter();
    alert(`Parent Account Created\nUsername: ${parentUsername}\nPassword: ${password}`);
  }
  
  // Export CSV des utilisateurs
  exportUsersCSV() {
    const headers = ['Nom', 'Prénom', 'Email/Username', 'Rôle'];
    const rows = this.users.map(u => [u.firstName, u.lastName, u.email || u.username, u.role]);
    let csvContent = headers.join(',') + '\n' + rows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'utilisateurs.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Statistiques globales des utilisateurs
  getUserStats() {
    return {
      total: this.users.length,
      teachers: this.users.filter(u => u.role === 'Teacher').length,
      students: this.users.filter(u => u.role === 'Student').length,
      parents: this.users.filter(u => u.role === 'Parent').length,
      administrators: this.users.filter(u => u.role === 'Administrator').length,
      principals: this.users.filter(u => u.role === 'Principal').length,
      pending: this.users.filter(u => u.role === 'Pending').length
    };
  }
}