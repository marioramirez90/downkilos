# GOOGLE PLAY GESUNDHEITS-APP-RICHTLINIEN & DEKLARATION

Offizielle Dokumentation: [Google Play Health Apps Policy](https://support.google.com/googleplay/android-developer/answer/14738291)

---

## 1. Einordnung der App
In der Google Play Console muss im Bereich **App-Inhalte** → **Gesundheits-Apps** folgende Kategorie deklariert werden:

- **Hauptkategorie:** `Gesundheit und Fitness`
- **Spezifischer Bereich:** `Ernährungs- und Gewichtskontrolle` (Nutrition & Weight Management)

---

## 2. Bestätigung der Google-Vorgaben für Down Kilos

| Anforderung | Status | Technische Umsetzung in Down Kilos |
| :--- | :--- | :--- |
| **Kein Medizinprodukt** | **Bestätigt** | Die App erhebt keinen Anspruch auf Diagnose, Überwachung oder Heilung von Erkrankungen. In Store-Beschreibung, In-App-Über-Dialog und Impressum ist der medizinische Hinweis prominent integriert. |
| **Schutz vor extremen Crash-Diäten** | **Bestätigt** | Im `CalorieCalculatorService` sind feste Sicherheitsuntergrenzen implementiert (mindestens 1.200 kcal für Frauen, 1.500 kcal für Männer). Das Standarddefizit ist mit moderaten 300 kcal konservativ angesetzt. |
| **Schutz von Minderjährigen** | **Bestätigt** | Bei Nutzern unter 18 Jahren wird die automatische Defizitberechnung deaktiviert (`deficit = 0`), um Jugendliche im Wachstum vor ungesundem Kaloriendefizit zu schützen. |
| **Keine irreführenden Heilungsversprechen** | **Bestätigt** | Es gibt keine Formulierungen wie „Verliere garantiert 10 kg in 2 Wochen“ oder „Lebensmittel X verbrennt automatisch Fett“. Berechnungen werden ausdrücklich als mathematische Richtwerte und Schätzungen ausgewiesen. |
| **Health Connect Berechtigungen** | **Nicht verwendet** | Die App fordert keine Health Connect APIs oder Android Sensor-Berechtigungen an. |

---

## 3. Verbindlicher medizinischer Hinweistext

Folgender Text ist in der App und in der Store-Beschreibung hinterlegt:

> **Medizinischer Hinweis:**  
> „Down Kilos ist kein Medizinprodukt und dient nicht der Diagnose, Behandlung, Heilung oder Vorbeugung von Krankheiten. Die angezeigten Kalorienbedarfswerte sind Schätzungen. Für medizinische Fragen wende dich an qualifiziertes medizinisches Fachpersonal.“
