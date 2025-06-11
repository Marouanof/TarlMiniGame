# 🎓 ZA2ID – Plateforme Éducative Connectée à des Jeux Unity

**ZA2ID** est une application web développée en Angular 19 qui permet aux enseignants de gérer des étudiants, de créer des tests et de recevoir les résultats de jeux éducatifs joués sur Android via Unity. Les données des résultats sont synchronisées automatiquement grâce à **Firebase Realtime Database**.

---

## 🧠 Objectif du projet

Permettre une gestion centralisée d’élèves, de tests et de résultats d’activités ludiques réalisées dans un autre projet Android (Unity). Cette plateforme est conçue pour des environnements éducatifs où l’apprentissage est gamifié.

---

## 📸 Fonctionnement général

- 👨‍🏫 Les **enseignants** créent des comptes étudiants et des tests.
- 🎓 Les **étudiants** scannent un **QR code** généré lors de la création de leur compte.
- 📱 Ils participent à des **jeux sur Android** développés avec **Unity**.
- 🔁 Les **résultats sont envoyés automatiquement** à la **Firebase Realtime Database**.
- 🖥️ Les enseignants visualisent ensuite les performances et résultats dans cette interface web.

---

## 👥 Rôles utilisateurs

- **Admin** : Gestion globale de la plateforme.
- **Principal** : Supervision administrative.
- **Teacher (Enseignant)** : Création des étudiants et des tests, visualisation des résultats.
- **Student (Étudiant)** : Accès indirect via QR code et jeux Android.

---

## 🛠️ Technologies utilisées

- 🔷 **Angular 19**
- 🔥 **Firebase Realtime Database**
- 📦 **QR Code generator**
- 🎮 Connexion externe avec **jeux Unity (Android)**

---
## 🧱 Structure détaillée du projet

```text
src/
├── index.html                 # Fichier HTML principal
├── main.ts                    # Point d'entrée Angular
├── server.ts                  # (Non utilisé ici, car SSR désactivé)
├── styles.css                 # Styles globaux
├── custom-theme.scss          # Personnalisation du thème

├── app/
│   ├── app-routing.module.ts          # Configuration du routing
│   ├── app.component.*                # Composant principal de l'application
│   ├── app.config*.ts                 # Fichiers de config client/serveur
│   ├── app.routes.server.ts           # Routes côté serveur (inutilisé ici)
│
│   ├── guards/                        # Garde d'authentification
│   │   └── auth.guard.ts
│
│   ├── services/
│   │   └── auth.service.ts            # Authentification avec Firebase
│
│   ├── shared/
│   │   ├── nav-bar/                   # Barre de navigation supérieure
│   │   └── sidebar/                   # Menu latéral
│
│   ├── pages/
│   │   ├── login/                     # Page de connexion
│   │   ├── register/                  # Page d'inscription
│   │   ├── dashboard/                 # Vue principale après connexion
│   │   ├── create-parent/             # Création de comptes parents
│   │   ├── student-list/              # Liste des étudiants
│   │   ├── student-registration/      # Formulaire d'inscription étudiant
│   │   ├── test-creation/             # Création de tests
│   │   ├── test-edition/              # Édition de tests
│   │   ├── test-list/                 # Liste des tests
│   │   ├── test-results/              # Résultats des jeux Unity
│   │   ├── role-management/           # Gestion des rôles
│   │   ├── teacher-profile/           # Profil enseignant
│   │   ├── home/                      # Page d'accueil
│   │   └── user-stats/                # Statistiques par utilisateur
│
│   ├── types/
│   │   └── mini-game-types.ts         # Types utilisés dans les mini-jeux
│
│   └── utils/
│       └── password-utils.ts          # Gestion de hachage/validation mot de passe

└── assets/
    └── images/                        # Image de fond, logos…
```



---

## ☁️ Structure des données Firebase (Realtime Database)

```json
{
  "users": {
    "uid": {
      "firstName": "...",
      "lastName": "...",
      "role": "Student | Teacher | Admin | Principal | Parent",
      "linkedTeacherId": "...",
      "linkedChildrenIds": ["..."],
      "password": "...",
      ...
    }
  },
  "tests": {
    "test_uid": {
      "testName": "...",
      "grade": "...",
      "isActive": true,
      "teacherId": "...",
      ...
    }
  },
  "testResults": {
    "test_uid": {
      "student_uid": {
        "game1": {
          "score": ...,
          "correctAnswers": ...,
          "wrongAnswers": ...,
          ...
        }
      }
    }
  }
}
```

---

## 🚀 Lancement du projet

### Prérequis

- Node.js & npm
- Angular CLI (`npm install -g @angular/cli`)

### Étapes

```bash
npm install
ng serve
Puis accéder à http://localhost:4200.

🔐 Sécurité et accès
L’authentification et les autorisations sont gérées par rôle (Admin Principal).

Firebase est utilisé pour stocker les utilisateurs et leurs résultats en temps réel.





