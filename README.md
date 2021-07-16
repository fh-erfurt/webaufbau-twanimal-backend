# Backend-Server für Twanimal

Diese Dokumentation dient als Hilfestellung für die Einrichtung und Installation des Backend-Servers für Twanimal.

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

ASSET_PREFIX="http://localhost:8080/"
```

Passen Sie entsprechend Ihrer Einstellungen die ```DATABASE_URL``` an, Einstellungen, wie den Port, SSL-Zertifikat und Passwort-Salt-Rounds können unverändert bleiben.

### 5. Datenbank-Schema importieren

Um das aktuelle Datenbankschema zu importieren geben Sie folgenden Begriff ein:

```
npx prisma migrate dev
```

Sie werden aufgefordert der Migration einen Namen zu geben, klicken Sie einfach Enter, um einen generieren zu lassen.

Im Anschluss sollten die Tabellen in der Datenbank existieren.

### 5. (Alternative) Datenbank-Schema aus init-Datei importieren

Importieren Sie das Schema aus der ```init.sql``` - Datei

### 6. Starten des Servers

Um den Server zu starten geben Sie bitte folgenden Befelh ein

NPM-Variante: ```npm start```

YARN-Variante: ```yarn start```

NODE-Variante: ```tsc && node dist/index.js```

Der Server wird erreichbar sein über den in der ```.env``` - Datei eingestellten Port.

## Verfügbare Endpoints

Folgende Endpoints können im Browser abgerufen werden:

Variante | Pfad | Erforderliche Parameter | API-Token | Rückgabe | Informationen
--- | --- | --- | --- | --- | ---
ALLE | / | - | - | Testrückgabe  als JSON
POST | /user/registration | email, username, password, displayName | - | User | Fehlerrückgabe bei verwendeter E-Mail oder Username
POST | /user/login | username, password | - | User | Fehlerrückgabe bei nicht vorhandenem Nutzer oder falschem Passwort, Username kann Benutzername oder E-Mail sein
POST | /validate-session | username, password  | Ja | User | Fehlerrückgabe bei nicht vorhandenem Nutzer oder falschem Passwort, Username kann Benutzername oder E-Mail sein
POST | /user/update | (optional), email, username, password, displayName, profilePicture, description | Ja | User | Fehlerrückgabe bei verwendeter E-Mail oder Username
ALLE | /user/{id} | id | Optional | User | Fehlerrückgabe bei nicht vorhandenem Nutzer
POST | /user/{id}/follow | id | Ja | User | Fehlerrückgabe bei nicht vorhandenem Nutzer
POST | /user/{id}/unfollow | id | Ja | User | Fehlerrückgabe bei nicht vorhandenem Nutzer
ALLE | /user/{id}/posts | id | Optional | PaginationResult mit Posts | Fehlerrückgabe bei nicht vorhandenem Nutzer
ALLE | /home-timeline | | Ja | PaginationResult mit Posts | 
ALLE | /suggestions | | Ja | PaginationResult mit Nutzern | 
POST | /post/new | text | Ja | Post | Fehlerrückgabe bei ungültigem Text
POST | /post/{id} | id | Optional | Post | Fehlerrückgabe bei nicht vorhandenem Beitrag
POST | /post/{id}/delete | id | Ja | Textrückgabe | Fehlerrückgabe bei nicht vorhandenem Beitrag oder fehlender Berechtigung
POST | /post/{id}/like | id | Ja | Post | Fehlerrückgabe bei nicht vorhandenem Beitrag
POST | /post/{id}/unlike | id | Ja | Post | Fehlerrückgabe bei nicht vorhandenem Beitrag
ALLE | /post/{id}/replies | id | Optional | PaginationResult mit Posts | 

## Relevante Models

Model | Feld | Typ | Beschreibung
--- | --- | --- | ---
User | id | number | Einzigartige ID
&nbsp; | username | string | Einzigartiger Nutzername
&nbsp; | displayName | string | Anzeigename
&nbsp; | profilePictureUrl | string | Profilbild
&nbsp; | description | string | Beschreibung
&nbsp; | createdAt | number | Unix-Timestamp mit Erstellungsdatum
&nbsp; | followerCount | number | Anzahl Follower
&nbsp; | followingCount | number | Anzahl Folge Ich
&nbsp; | postCount | number | Anzahl Posts
&nbsp; | isFollowing | ?boolean | Anfragender Nutzer folgt Nutzer
&nbsp; | isFollowingBack | ?boolean | Nutzer folgt anfragenden Nutzer
&nbsp; | apiToken | ?string | API-Token für Anfragen
&nbsp; | email | ?string | Einzigartige E-Mail Adresse
Post | id | number | Einzigartige ID
&nbsp; | createdBy | User | Ersteller des Beitrags
&nbsp; | createdAt | number | Unix-Timestamp mit Erstellungsdatum
&nbsp; | text | string | Inhalt des Beitrags
&nbsp; | attachements | JSON | Bild- und Videomaterial
&nbsp; | likeCount | number | Anzahl Gefällt mir Angaben
&nbsp; | hasLiked | ?boolean | Anfragender Nutzer gefällt Beitrag
&nbsp; | replyTo | ?Beitrag | Beitrag auf den Beitrag antwortet
&nbsp; | repostOf | ?Beitrag | Beitrag den Beitrag teilt
PaginationResult | limit | number | Maximale Anzahl an Ergebnissen
&nbsp; | page | number | Seite zum Überspringen von Ergebnissen
&nbsp; | total | ?number | Gesamte Anzahl an Ergebnissen
&nbsp; | moreAvailable | ?boolean | Weitere Ergebnisse verfügbar
&nbsp; | results | ?any | Ergebnisse

## Anfragen mit angemeldetem Nutzer

Für die Auführung von bspw. /post/new, /user/{id}/follow und für das Anzeigen von Relationen unter Nutzern benötigt man einen angemeldeten Nutzer. Nach erfolgreicher Registrierung oder Anmeldung wird zum Nutzer das Attribut apiToken zurückgeliefert, welches für eine Authorization verwendet werden kann.

API-Token werden als Header in der Request als Bearer-Token verwendet.

Bspw: ```Authorization: Bearer [API-Token]```

## Ordnerhierarchie

- /dist (Beinhaltet den in Javascript kompilierten Server)
- /prisma (Beinhaltet das Datenbank-Schema)
- /public (Beinhaltet alle statischen Dateien)
- /src (Beinhaltet alle Typescript-Dateien)
    - /routes (Beinhaltet alle Routes für die REST-API)
    - /services (Beinhaltet alle Kernmodule)
        - databaseService.ts (Verwaltet die Datenbank mittels Prisma)
        - paginationResultService.ts (Verwaltet die PaginationResults und Middleware für routes)
        - postService.ts (Verwaltet die Beiträge, inklusive Home-Timeline)
        - searchService.ts (Gibt Suchbegriffe zurück für Nutzer und Beiträge)
        - userService.ts (Verwaltet die Nutzer, inklusive Authentication, Registrierung und Login)
        - utilityService.ts (Beinhaltet Validatoren für Texte und E-Mail Adressen)
    - config.ts (Beinhaltet Konfiguration (Spiegel von .env))
    - index.ts (Ausgangsdatei, Startet Server, vereint Routinen und Kernmodule)
    - custom.d.ts (Enhält Erweiterungen für Express-Typescript Interfaces)
- .prettierrc (Styling für prettier-Formatter)
- init.sql (Initialisierungs-Schema für die Datenbank alternativ zu Prisma-Migration)
- package.json (Beinhaltet Skripte und Bibliotheken)
- tsconfig.json (Enthält Konfiguration für Typescript Compiler)