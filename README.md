# Backend-Server für Twanimal

Diese Dokumentation ist nicht vollständig und soll vorerst als Hilfestellung für die Einrichtung und Installation dienen.

## Installation

### 1. Repository klonen

#### 1.1 Ordner auswählen und cmd öffnen

HTTPS-Variante: 

```
git clone https://github.com/fh-erfurt/webaufbau-twanimal-backend
```

SSH-Variante: 

```
git clone git@github.com:fh-erfurt/webaufbau-twanimal-backend.git
```

### Alternative: 1. Git initialisieren und Remote-Branch hinzufügen

#### 1.1 Projektordner erstellen und cmd öffnen

```
git init
git remote add origin https://github.com/fh-erfurt/webaufbau-twanimal-backend
git pull origin main
```

### 2. Pakete installieren

NPM-Variante: ```npm install```
YARN-Variante: ```yarn install```

### 3. Datenbank erstellen

Erstellen Sie eine Datenbank auf Ihrem MySQL-Server. Bspw. ``twanimal``

### 4. Environment-Datei erstellen

Erstellen Sie im Stammverzeichnis des Projektes eine ``.env`` Datei, diese enthält die Konfiguration für den Server

Fügen Sie folgende Einstellungen ein:

```
DATABASE_URL="mysql://root@127.0.0.1:3306/twanimal"

PORT=8080

SSL_ENABLED=false
SSL_CERTIFICATE=
SSL_KEY=

PASSWORD_SALT_ROUNDS=10
```

Passen Sie entsprechend Ihrer Einstellungen die ```DATABASE_URL``` an, Einstellungen, wie den Port, SSL-Zertifikat und Passwort-Salt-Rounds können unverändert bleiben.

### 5. Datenbank-Schema importieren

Um das aktuelle Datenbankschema zu importieren geben Sie folgenden Begriff ein:

```
npx prisma migrate dev
```

Sie werden aufgefordert der Migration einen Namen zu geben, klicken Sie einfach Enter, um einen generieren zu lassen.

Im Anschluss sollten die Tabellen in der Datenbank existieren.

### 6. Starten des Servers

Um den Server zu starten geben Sie bitte folgenden Befelh ein

NPM-Variante: ```npm start```

YARN-Variante: ```yarn start```

NODE-Variante: ```node index.js```

## Verfügbare Endpoints

Folgende Endpoints können im Browser abgerufen werden:

Variante | Pfad | Erforderliche Parameter | Rückgabe | Informationen
--- | --- | --- | --- | ---
ALLE | / | - | Testrückgabe  als JSON
POST | /user/registration | email, username, password, displayName | Registrierten Nutzer | Fehlerrückgabe bei verwendeter E-Mail oder Username
POST | /user/login | username, password | Registrierten Nutzer | Fehlerrückgabe bei nicht vorhandenem Nutzer oder falschem Passwort, Username kann Benutzername oder E-Mail sein

## Ordnerhierarchie

- /prisma (Beinhaltet das Datenbank-Schema)
- /public (Beinhaltet alle statischen Dateien)
- /routes (Beinhaltet alle Routes für die REST-API)
- /services (Beinhaltet alle Kernmodule)
    - databaseService.js (Verwaltet die Datenbank mittels Prisma)
    - userService.js (Verwaltet die Nutzer, inklusive Registrierung und Login)
    - utilityService.js (Beinhaltet Validatoren für Texte und E-Mail Adressen)
- config.js (Beinhaltet Konfiguration (Spiegel von .env))
- index.js (Ausgangsdatei, Startet Server, vereint Routinen und Kernmodule)
- package.json (Beinhaltet Skripte und Bibliotheken)