import { Injectable, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from '@angular/fire/auth';
import { Database, ref, set, get } from '@angular/fire/database';
import { sendPasswordResetEmail } from 'firebase/auth';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private db = inject(Database); 

  register(email: string, password: string, userProfile: any): Observable<any> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(userCredential => {
        const uid = userCredential.user?.uid;
        const user = userCredential.user;
        if (!uid) throw new Error('UID not found');
        const userData = {
          uid,
          email,
          emailVerified: user.emailVerified,
          role: 'Pending',
          ...userProfile
        };
        const userRef = ref(this.db, `users/${uid}`);
        return from(set(userRef, userData)).pipe(map(() => user));
      })
    );
  }

  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  getCurrentUserWithRole(): Observable<any> {
    return new Observable(observer => {
      this.auth.onAuthStateChanged(user => {
        if (!user || !user.emailVerified) {
          observer.next(null);
          observer.complete();
        } else {
          const userRef = ref(this.db, `users/${user.uid}`);
          from(get(userRef)).subscribe({
            next: snapshot => {
              observer.next(snapshot.val());
              observer.complete();
            },
            error: err => {
              observer.error(err);
            }
          });          
        }
      });
    });
  }

  getUserData(uid: string): Observable<any> {
    const userRef = ref(this.db, `users/${uid}`);
    return from(get(userRef)).pipe(map(snapshot => snapshot.val()));
  }

  logout(): Promise<void> {
    return signOut(this.auth).then(() => {});
  }

  resetPassword(email: string): Observable<void> {
    return from(sendPasswordResetEmail(this.auth, email));
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No user is currently signed in');
    }

    // Créer les credentials pour la réauthentification
    const credential = EmailAuthProvider.credential(user.email, currentPassword);

    try {
      // Réauthentifier l'utilisateur
      await reauthenticateWithCredential(user, credential);
      
      // Mettre à jour le mot de passe
      await updatePassword(user, newPassword);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        throw new Error('Le mot de passe actuel est incorrect');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Le nouveau mot de passe est trop faible');
      } else {
        throw new Error('Une erreur est survenue lors du changement de mot de passe');
      }
    }
  }
}
