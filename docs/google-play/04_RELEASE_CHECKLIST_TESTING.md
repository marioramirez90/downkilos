# GOOGLE PLAY RELEASE CHECKLISTE & TESTING LEITFADEN

## 1. Verpflichtender geschlossener Test (Closed Testing)

> [!IMPORTANT]
> **Google Play Richtlinie für private Entwicklerkonten (seit 13. November 2023):**  
> Neue persönliche Entwicklerkonten müssen vor der Beantragung des Produktionszugangs einen geschlossenen Test mit **mindestens 12 Testern über mindestens 14 aufeinanderfolgende Tage** durchführen.

### Vorgehensweise:
1. **Testerliste anlegen:**  
   Erstelle in der Google Play Console unter *Testen* → *Geschlossener Test* eine E-Mail-Liste mit mindestens 12 bis 15 vertrauenswürdigen Testpersonen (Freunde, Familie, Bekannte mit Android-Smartphones).
2. **Release im geschlossenen Test-Track veröffentlichen:**  
   Lade das generierte Android App Bundle (`.aab`) in den geschlossenen Test-Track hoch.
3. **Opt-in-Link teilen:**  
   Sende den generierten Play Store Test-Link an alle Tester.
4. **14 Tage aktiv halten:**  
   Alle 12 Tester müssen für die vollen 14 Tage registriert und aktiv angemeldet bleiben.
5. **Produktionszugang beantragen:**  
   Nach Ablauf der 14 Tage schaltet die Play Console den Button *„Produktionszugriff beantragen“* frei, inklusive eines kurzen Fragebogens über das Feedback der Tester.

---

## 2. Schlüsselverwaltung & Google Play App Signing

> [!CAUTION]
> **Sicherheits-Grundsatz:**  
> Keystore-Dateien (`.jks`, `.keystore`) und Passwörter dürfen **niemals im öffentlichen GitHub-Repository** eingecheckt werden. Sie gehören in `.gitignore` bzw. GitHub Actions Secrets!

### Unterschied der Schlüssel:
1. **Google Play App-Signaturschlüssel:**  
   Wird sicher in der Google Play Infrastruktur verwahrt. Google signiert das finale APK, das an die Smartphones der Nutzer ausgeliefert wird.
2. **Upload-Schlüssel (Upload Keystore):**  
   Wird vom Entwickler einmalig lokal erstellt. Dient ausschließlich dazu, dass Google Play verifiziert, dass das hochgeladene AAB tatsächlich von dir stammt.

### Upload-Keystore lokal erstellen (Befehl):
```bash
keytool -genkey -v -keystore downkilos-upload-key.jks -alias downkilos-upload -keyalg RSA -keysize 2048 -validity 10000
```
- Speichere die Datei `downkilos-upload-key.jks` an einem sicheren Ort (z. B. Passwort-Manager oder externes Backup).
- Die Datei `android/app/*.jks` ist in `.gitignore` eingetragen.

---

## 3. Test-Checkliste vor Einreichung

- [x] **App-Start & Onboarding:** Startet direkt in den Willkommens-Screen, Profilerstellung ohne Login.
- [x] **Kalorienberechnung:** Korrekte Berechnung nach Mifflin-St. Jeor, Defizit 300 kcal, keine extremen Werte.
- [x] **Marktauswahl & Produkte:** Sortiment lädt zuverlässig, Nährwertampel und Portionsumrechnung funktionieren.
- [x] **Einkaufsliste:** Hinzufügen, Entfernen, Abhaken und Gesamtsummenberechnung stabil.
- [x] **Gewichtsverlauf:** Hinzufügen neuer Wiegewerte mit automatischer Aktualisierung im Dashboard.
- [x] **Offline-Verhalten:** Bereits gespeicherte Einkaufslisten und Profildaten bleiben ohne Internet verfügbar.
- [x] **Datenreset:** *Einstellungen → Alle Daten zurücksetzen* löscht wirklich alle lokalen Einträge und leitet zum Anfang.
- [x] **Rechtliche Seiten:** Datenschutzerklärung und Impressum sind aus den Einstellungen direkt erreichbar.
