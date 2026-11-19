# Kanban

Kanban-Board im Jira-Stil mit mehreren Projekten (React 19 + Vite + TypeScript + Tailwind 4).

## Funktionen
- Mehrere Projekte mit eigenem Schlüssel (z. B. `WEB` → Vorgänge `WEB-1`, `WEB-2` …) und Farbe
- Board mit frei anpassbaren Spalten (hinzufügen, umbenennen per Doppelklick, verschieben, löschen)
- Vorgänge per Drag & Drop zwischen und innerhalb der Spalten verschieben
- Vorgangstypen (Story, Aufgabe, Bug, Epic), Priorität, Bearbeiter, Labels, Story Points, Beschreibung
- Suche und Filter nach Bearbeiter und Typ
- Speicherung im Browser (localStorage), Export/Import als JSON-Backup
- Direktlink auf Projekte über `#/KEY`, heller und dunkler Modus

## Entwicklung
```bash
npm install
npm run dev
```

## Deploy (GitHub Pages)
Jeder Push auf `main` baut die App per GitHub Actions (`.github/workflows/deploy.yml`) und veröffentlicht sie unter
https://leonhr03.github.io/kanban/. In den Repo-Einstellungen muss unter *Settings → Pages → Source* „GitHub Actions" ausgewählt sein.

Alternativ auf den eigenen Server: `npm run deploy` (rsync über Tailscale nach `/home/leon/server/kanban`).
