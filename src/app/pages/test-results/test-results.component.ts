import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Database, ref, get } from '@angular/fire/database';
import { FormsModule } from '@angular/forms';

interface GameResult {
  correctAnswers: number;
  wrongAnswers: number;
  score: number;
  startedAt: number;
  finishedAt: number;
}

interface StudentResults {
  [gameKey: string]: GameResult;
}

interface TestData {
  [studentId: string]: StudentResults;
}

interface AllTestResults {
  [testId: string]: TestData;
}

@Component({
  selector: 'app-test-results',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './test-results.component.html',
  styles: []
})
export class TestResultsComponent implements OnInit {
  loading = true;
  results: AllTestResults | null = null;
  teacherUID: string | null = null;
  tests: { [key: string]: { testName: string, teacherId: string, grade?: string|number } } = {};
  students: { [key: string]: { firstName: string; lastName: string } } = {};
  searchTerm: string = '';
  selectedGrade: string = '';
  selectedGame: string = '';

  constructor(
    private auth: AuthService,
    private db: Database
  ) {}

  async ngOnInit() {
    this.auth.getCurrentUserWithRole().subscribe(async (user) => {
      if (!user || user.role !== 'Teacher') return;
      this.teacherUID = user.uid;

      // Charger les tests (filtrés par teacherId)
      const testsRef = ref(this.db, 'tests');
      const testsSnapshot = await get(testsRef);
      if (testsSnapshot.exists()) {
        const allTests = testsSnapshot.val();
        this.tests = Object.fromEntries(
          Object.entries(allTests)
            .filter(([_, test]: [string, any]) => test.teacherId === this.teacherUID)
        ) as { [key: string]: { testName: string, teacherId: string, grade?: string|number } };
      }

      // Charger les étudiants
      const usersRef = ref(this.db, 'users');
      const usersSnapshot = await get(usersRef);
      if (usersSnapshot.exists()) {
        const allUsers = usersSnapshot.val();
        this.students = Object.fromEntries(
          Object.entries(allUsers)
            .filter(([_, userData]: [string, any]) => userData.role === 'Student')
            .map(([id, userData]: [string, any]) => [id, { firstName: userData.firstName, lastName: userData.lastName }])
        );
      }

      // Charger les résultats (filtrés par tests du prof)
      const testResultsRef = ref(this.db, 'testResults');
      const resultsSnapshot = await get(testResultsRef);
      if (resultsSnapshot.exists()) {
        const allResults = resultsSnapshot.val();
        this.results = Object.fromEntries(
          Object.entries(allResults)
            .filter(([testId, _]) => testId in this.tests)
        ) as AllTestResults;
      }

      this.loading = false;
    });
  }

  getTestName(testId: string): string {
    return this.tests[testId]?.testName || `Test ${testId}`;
  }

  getStudentName(studentId: string): string {
    const student = this.students[studentId];
    return student ? `${student.firstName} ${student.lastName}` : `Étudiant ${studentId}`;
  }

  getAllGrades(): string[] {
    // Récupère tous les grades uniques des tests du prof
    const grades = Object.values(this.tests).map((t: any) => t.grade?.toString()).filter(Boolean);
    return Array.from(new Set(grades));
  }

  getAllGames(): string[] {
    // Récupère tous les jeux uniques présents dans les résultats
    if (!this.results) return [];
    const games = new Set<string>();
    Object.values(this.results).forEach(testData => {
      Object.values(testData as any).forEach((studentResults: any) => {
        Object.keys(studentResults).forEach(gameKey => games.add(gameKey));
      });
    });
    return Array.from(games);
  }

  getTests(): string[] {
    if (!this.results) return [];
    let testIds = Object.keys(this.results);
    if (this.selectedGrade) {
      testIds = testIds.filter(testId => this.tests[testId]?.grade?.toString() === this.selectedGrade);
    }
    return testIds;
  }

  getStudents(testId: string): string[] {
    if (!this.results || !this.results[testId]) return [];
    const allStudentIds = Object.keys(this.results[testId]);
    if (!this.searchTerm.trim()) return allStudentIds;
    const term = this.searchTerm.trim().toLowerCase();
    return allStudentIds.filter(studentId => {
      const student = this.students[studentId];
      if (!student) return false;
      return (
        student.firstName.toLowerCase().includes(term) ||
        student.lastName.toLowerCase().includes(term)
      );
    });
  }

  getGames(testId: string, studentId: string): string[] {
    if (!this.results || !this.results[testId] || !this.results[testId][studentId]) return [];
    const allGames = Object.keys(this.results[testId][studentId]);
    if (!this.selectedGame) return allGames;
    return allGames.filter(game => game === this.selectedGame);
  }

  formatGameName(gameKey: string): string {
    const gameNumber = gameKey.replace('game', '');
    return `Jeu ${gameNumber}`;
  }

  formatDate(timestamp: number): string {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  calculateDuration(startTime: number, endTime: number): string {
    if (!startTime || !endTime) return '-';
    const durationInMinutes = Math.round((endTime - startTime) / 60000);
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = durationInMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} minutes`;
  }

  calculateAverageScore(testId: string, studentId: string): number {
    const games = this.getGames(testId, studentId);
    if (games.length === 0) return 0;
    const scores = games.map(game => this.results![testId][studentId][game].score);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  // Score moyen global pour un test
  calculateTestAverage(testId: string): number {
    const students = this.getStudents(testId);
    if (students.length === 0) return 0;
    const scores = students.map(studentId => this.calculateAverageScore(testId, studentId));
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  // Meilleur score global pour un test
  calculateTestBestScore(testId: string): number {
    const students = this.getStudents(testId);
    if (students.length === 0) return 0;
    const scores = students.map(studentId => this.calculateAverageScore(testId, studentId));
    return Math.max(...scores);
  }
} 