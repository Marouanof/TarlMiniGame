import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Database, ref, get } from '@angular/fire/database';

@Component({
  selector: 'app-user-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-stats.component.html',
  styleUrl: './user-stats.component.css'
})
export class UserStatsComponent implements OnInit {
  loading = true;
  users: any[] = [];
  stats: any = {};

  constructor(private db: Database) {}

  async ngOnInit() {
    // Récupération des tests créés
    const testsSnap = await get(ref(this.db, 'tests'));
    let testsCount = 0;
    let draftTestsCount = 0;
    let activeTestsCount = 0;
    let testsById: Record<string, any> = {};
    if (testsSnap.exists()) {
      const tests = testsSnap.val();
      testsCount = Object.keys(tests).length;
      for (const testId of Object.keys(tests)) {
        const t = tests[testId];
        testsById[testId] = t;
        if (t.isDraft) draftTestsCount++;
        if (!t.isDraft && !t.archived) activeTestsCount++;
      }
    }
    // Récupération des utilisateurs (élèves)
    const usersSnap = await get(ref(this.db, 'users'));
    let studentsCount = 0;
    let studentsWithResults = new Set<string>();
    let studentsWithoutResults = new Set<string>();
    if (usersSnap.exists()) {
      const users = usersSnap.val();
      for (const uid of Object.keys(users)) {
        const u = users[uid];
        if (u.role === 'Student') {
          studentsCount++;
          studentsWithoutResults.add(uid);
        }
      }
    }
    // Récupération des résultats de tests (compatibilité testResults/test_results)
    let resultsSnap = await get(ref(this.db, 'testResults'));
    if (!resultsSnap.exists()) {
      resultsSnap = await get(ref(this.db, 'test_results'));
    }
    let resultsCount = 0;
    let totalScore = 0;
    let scoreCount = 0;
    let testSuccess: Record<string, { total: number, count: number }> = {};
    let testsAbove80 = 0;
    let testsBelow50 = 0;
    if (resultsSnap.exists()) {
      const results = resultsSnap.val();
      for (const testId of Object.keys(results)) {
        testSuccess[testId] = { total: 0, count: 0 };
        for (const studentId of Object.keys(results[testId])) {
          studentsWithResults.add(studentId);
          studentsWithoutResults.delete(studentId);
          const games = results[testId][studentId];
          let studentTotalScore = 0;
          let studentScoreCount = 0;
          for (const gameKey of Object.keys(games)) {
            const game = games[gameKey];
            if (typeof game.score === 'number') {
              totalScore += game.score;
              scoreCount++;
              studentTotalScore += game.score;
              studentScoreCount++;
            }
          }
          if (studentScoreCount > 0) {
            testSuccess[testId].total += Math.round(studentTotalScore / studentScoreCount);
            testSuccess[testId].count++;
          }
          resultsCount++;
        }
      }
      // Calcul des tests avec taux de réussite >80% ou <50%
      for (const testId in testSuccess) {
        if (testSuccess[testId].count > 0) {
          const rate = Math.round(testSuccess[testId].total / testSuccess[testId].count);
          if (rate > 80) testsAbove80++;
          if (rate < 50) testsBelow50++;
        }
      }
    }
    // Récupération des enseignants et des liens élèves-enseignant
    let teachers: Record<string, any> = {};
    let teacherStudentCount: Record<string, number> = {};
    let teacherNames: Record<string, string> = {};
    if (usersSnap.exists()) {
      const users = usersSnap.val();
      for (const uid of Object.keys(users)) {
        const u = users[uid];
        if (u.role === 'Teacher') {
          teachers[uid] = u;
          teacherStudentCount[uid] = 0;
          teacherNames[uid] = (u.firstName ? u.firstName + ' ' : '') + (u.lastName || '');
        }
      }
      // Compter les élèves par enseignant
      for (const uid of Object.keys(users)) {
        const u = users[uid];
        if (u.role === 'Student' && u.linkedTeacherId && teachers[u.linkedTeacherId]) {
          teacherStudentCount[u.linkedTeacherId] = (teacherStudentCount[u.linkedTeacherId] || 0) + 1;
        }
      }
    }
    // Moyenne, max, min d'élèves par enseignant
    const studentCounts = Object.values(teacherStudentCount);
    let avgStudentsPerTeacher = 0, maxStudentsPerTeacher = 0, minStudentsPerTeacher = 0;
    if (studentCounts.length > 0) {
      const sum = studentCounts.reduce((a, b) => a + b, 0);
      avgStudentsPerTeacher = Math.round(sum / studentCounts.length);
      maxStudentsPerTeacher = Math.max(...studentCounts);
      minStudentsPerTeacher = Math.min(...studentCounts);
    }
    // Enseignant avec le plus d'élèves
    let topTeacherId = null, topTeacherCount = 0;
    for (const tid in teacherStudentCount) {
      if (teacherStudentCount[tid] > topTeacherCount) {
        topTeacherId = tid;
        topTeacherCount = teacherStudentCount[tid];
      }
    }
    // Enseignants n'ayant publié aucun test
    let teachersWithNoTest = 0;
    const teachersWithTest = new Set<string>();
    for (const testId in testsById) {
      const t = testsById[testId];
      if (t.teacherId) teachersWithTest.add(t.teacherId);
    }
    for (const tid in teachers) {
      if (!teachersWithTest.has(tid)) teachersWithNoTest++;
    }
    // Ajout des stats
    this.stats.tests = testsCount;
    this.stats.draftTests = draftTestsCount;
    this.stats.activeTests = activeTestsCount;
    this.stats.avgScore = scoreCount ? Math.round(totalScore / scoreCount) : 0;
    this.stats.testResults = resultsCount;
    this.stats.studentsWithResults = studentsWithResults.size;
    this.stats.studentsWithoutResults = studentsWithoutResults.size;
    this.stats.testsAbove80 = testsAbove80;
    this.stats.testsBelow50 = testsBelow50;
    this.stats.avgStudentsPerTeacher = avgStudentsPerTeacher;
    this.stats.maxStudentsPerTeacher = maxStudentsPerTeacher;
    this.stats.minStudentsPerTeacher = minStudentsPerTeacher;
    this.stats.teachersWithNoTest = teachersWithNoTest;
    this.stats.topTeacherName = topTeacherId ? teacherNames[topTeacherId] : '-';
    this.stats.topTeacherCount = topTeacherCount;
    this.loading = false;
  }

  computeStats() {
    this.stats = {
      total: this.users.length,
      byRole: this.groupBy('role'),
      byGender: this.groupBy('gender'),
      byGrade: this.groupBy('schoolGrade'),
      withEmail: this.users.filter(u => !!u.email).length,
      withPhone: this.users.filter(u => !!u.phone).length,
      withProfilePic: this.users.filter(u => !!u.profilePic).length,
      active: this.users.filter(u => u.active !== false).length,
      inactive: this.users.filter(u => u.active === false).length,
    };
  }

  groupBy(field: string) {
    return this.users.reduce((acc, user) => {
      const key = user[field] || 'Not specified';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
} 