# GOOGLE PLAY DATA SAFETY (DATENSICHERHEIT) – DOWN KILOS

Offizielle Dokumentation: [Google Play Data Safety Guidelines](https://support.google.com/googleplay/android-developer/answer/10787469)

---

## 1. Allgemeine Übersicht

| Frage in der Google Play Console | Antwort | Begründung / Technischer Nachweis |
| :--- | :--- | :--- |
| **Erhebt oder teilt die App Nutzerdaten?** | **Nein / Nur lokal** | Alle persönlichen Profildaten (Körpergewicht, Kalorien, Name) werden ausschließlich lokal in IndexedDB / LocalStorage verarbeitet. Es gibt keinen eigenen Server und keine zentrale Datenbank, an die diese Daten übertragen werden. |
| **Werden alle von der App erhobenen Nutzerdaten bei der Übertragung verschlüsselt?** | **Ja (HTTPS)** | Externe Produkt- und OSM-Abfragen erfolgen ausnahmslos über TLS/HTTPS. |
| **Bietet die App eine Möglichkeit zur Kontolöschung?** | **Nicht zutreffend** | Die App besitzt kein Benutzerkontensystem. Es gibt keine Registrierung. |
| **Bietet die App eine Möglichkeit, Daten zu löschen?** | **Ja** | Vollständiger Reset unter *Einstellungen → Alle Daten zurücksetzen* entfernt alle lokalen Daten unwiderruflich. |

---

## 2. Detaillierte Datendeklaration nach Kategorien

| Datentyp (Google Play Kategorie) | Erhoben (Collected)? | Geteilt mit Dritten (Shared)? | Verarbeitungsort | Zweck der Verarbeitung | Erforderlich oder Optional? | Löschbar? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Persönliche Daten:** Name (Vorname) | **Nein** (überträgt nicht) | **Nein** | Ausschließlich lokal auf dem Gerät | Personalisierte Begrüßung im Dashboard | Optional | Ja (In-App Reset) |
| **Gesundheits- & Fitnessdaten:** Körpergewicht, Größe, Geburtsdatum, Kalorienziel | **Nein** (überträgt nicht) | **Nein** | Ausschließlich lokal auf dem Gerät | Berechnung des Kalorienbedarfs & Dokumentation des Gewichtsverlaufs | Erforderlich für die Rechnerfunktion | Ja (In-App Reset) |
| **Standortdaten:** Ungefährer / Genauer Standort | **Nur flüchtig bei Abfrage** | **Nein** | Temporär an OpenStreetMap Overpass API (zur Marktsuche im Umkreis) | Filialsuche für Supermärkte | Optional (nur bei manueller Marktsuche) | Keine Speicherung |
| **Finanzdaten:** Kreditkarte, Bankdaten | **Nein** | **Nein** | Nicht vorhanden | App ist 100 % kostenlos | – | – |
| **Fotos & Videos:** Kamera, Galerie | **Nein** | **Nein** | Nicht verwendet | Keine Kamera-/Foto-Berechtigung | – | – |
| **Nachrichten / Kontakte / SMS:** | **Nein** | **Nein** | Nicht verwendet | Keine Berechtigungen angefordert | – | – |
| **App-Aktivität:** Interaktionen, Seitenaufrufe | **Nein** | **Nein** | Keine Analyse-SDKs | Kein Tracking | – | – |
| **Gerätekennungen (Advertising ID, IMEI):** | **Nein** | **Nein** | Keine Tracking-SDKs | Kein Werbenetzwerk | – | – |

---

## 3. Play Console Schritt-für-Schritt Anleitung

1. Öffne die **Google Play Console** → Wähle die App **Down Kilos**.
2. Navigiere im linken Menü zu **App-Inhalte** → **Datensicherheit**.
3. **Datenübertragung:** Wähle aus, dass deine App **keine Daten über das Internet an eigene Server überträgt** und **keine Daten an Dritte weitergibt**.
4. **Sicherheitspraktiken:**
   - Bestätige, dass die Datenübertragung externer Produktabfragen über **HTTPS verschlüsselt** ist.
   - Bestätige, dass der Nutzer seine Daten über die App löschen kann.
5. **Kategorien:** Da die Daten ausschließlich lokal auf dem Gerät verbleiben und das Gerät nicht verlassen, fallen sie unter Googles Definition von *"On-Device Processing Only"*, welche nach den offiziellen Play Console Richtlinien nicht als *"Collected"* deklariert werden muss, solange keine Daten das Gerät verlassen.
