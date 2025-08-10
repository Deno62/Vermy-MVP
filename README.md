# Vermy - Immobilien CRM System

Ein vollständiges Immobilienverwaltungssystem mit deutscher Benutzeroberfläche für die professionelle Verwaltung von Immobilien, Mietern und Finanzen.

![Vermy Screenshot](https://via.placeholder.com/800x400/213560/ffffff?text=Vermy+CRM+Dashboard)

## 🏠 Funktionen

- **Immobilienverwaltung**: Vollständige Verwaltung Ihrer Immobilienobjekte
- **Mieterverwaltung**: Mieterverträge und Kontaktdaten
- **Finanzbuchungen**: Einnahmen, Ausgaben und Nebenkostenabrechnungen
- **Wartung & Mängel**: Wartungsaufgaben und Schadensmeldungen
- **Mahnwesen**: Mahnverfahren und Inkasso
- **Dokumentenverwaltung**: Zentrale Dokumentenablage
- **Dashboard**: Übersichtliche Statistiken und aktuelle Aktivitäten

## 🚀 Technologien

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Routing**: React Router v6
- **Datenspeicherung**: LocalStorage (für Web) / SQLite (für Electron)
- **Bundler**: Vite
- **Design**: Deutsches Business-Software Design

## 📱 Installation & Entwicklung

### Web-Version starten

```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev

# Build für Produktion
npm run build
```

## 🖥️ Desktop-App (Electron)

Um diese Web-App als Desktop-Anwendung zu verpacken, befolgen Sie diese Schritte:

### 1. Electron Dependencies hinzufügen

```bash
npm install --save-dev electron electron-builder
npm install --save electron-updater
```

### 2. package.json erweitern

Fügen Sie folgende Konfiguration zu Ihrer `package.json` hinzu:

```json
{
  "main": "dist-electron/main.js",
  "scripts": {
    "electron": "electron .",
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:8080 && electron .\"",
    "electron:pack": "npm run build && electron-builder",
    "electron:pack:win": "npm run build && electron-builder --win",
    "electron:pack:mac": "npm run build && electron-builder --mac",
    "electron:pack:linux": "npm run build && electron-builder --linux"
  },
  "build": {
    "appId": "com.vermy.immobilien-crm",
    "productName": "Vermy CRM",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "dist-electron/**/*",
      "node_modules/**/*"
    ],
    "mac": {
      "target": "dmg",
      "icon": "assets/icon.icns"
    },
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "linux": {
      "target": "AppImage",
      "icon": "assets/icon.png"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    }
  }
}
```

### 3. Electron Main Process erstellen

Erstellen Sie `src/electron/main.js`:

```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    titleBarStyle: 'default',
    show: false
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers für Datenbankoperationen
ipcMain.handle('database-operation', async (event, operation, data) => {
  // Hier würde die SQLite-Datenbanklogik implementiert werden
  // Für jetzt verwenden wir LocalStorage im Renderer
  return { success: true };
});
```

### 4. Preload Script erstellen

Erstellen Sie `src/electron/preload.js`:

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Sichere API für Datenbank-Operationen
  database: {
    save: (table, data) => ipcRenderer.invoke('database-operation', 'save', { table, data }),
    get: (table, id) => ipcRenderer.invoke('database-operation', 'get', { table, id }),
    getAll: (table) => ipcRenderer.invoke('database-operation', 'getAll', { table }),
    delete: (table, id) => ipcRenderer.invoke('database-operation', 'delete', { table, id })
  },
  
  // System-Informationen
  platform: process.platform,
  isElectron: true
});
```

### 5. SQLite für Desktop-Version

Für die Desktop-Version sollten Sie SQLite verwenden:

```bash
npm install better-sqlite3
```

Dann erweitern Sie `main.js` mit SQLite-Funktionalität:

```javascript
const Database = require('better-sqlite3');
const db = new Database('vermy.db');

// Datenbank-Schema initialisieren
db.exec(`
  CREATE TABLE IF NOT EXISTS immobilien (
    id TEXT PRIMARY KEY,
    bezeichnung TEXT NOT NULL,
    adresse TEXT NOT NULL,
    -- weitere Felder...
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    version INTEGER DEFAULT 1
  );
  
  -- weitere Tabellen...
`);
```

## 📦 Build & Deployment

### Web-Deployment
```bash
npm run build
# Deploy den dist/ Ordner zu Ihrem Webserver
```

### Desktop-App bauen
```bash
# Für alle Plattformen
npm run electron:pack

# Für spezifische Plattform
npm run electron:pack:win    # Windows
npm run electron:pack:mac    # macOS
npm run electron:pack:linux  # Linux
```

Die fertigen Installer finden Sie im `release/` Ordner.

## 🗂️ Datenstruktur

Alle Entitäten enthalten folgende Basis-Felder:
- `id`: UUID
- `created_at`: Erstellungsdatum
- `updated_at`: Änderungsdatum
- `deleted_at`: Löschdatum (Soft Delete)
- `version`: Versionsnummer

### Entitäten:
1. **Immobilie**: Immobilienobjekte
2. **Mieter**: Mieterverträge
3. **Finanzbuchung**: Einnahmen/Ausgaben
4. **Nebenkosten**: Nebenkostenabrechnungen
5. **Wartung & Mängel**: Wartungsaufgaben
6. **Mahnwesen**: Mahnverfahren
7. **Dokumente**: Dokumentenverwaltung

## 🔧 Konfiguration

### Picklists
Alle Dropdown-Listen verwenden vordefinierte Werte für bessere Datenqualität. Diese finden Sie in `src/types/entities.ts`.

### Design System
Das Design-System ist in `src/index.css` und `tailwind.config.ts` definiert und folgt deutschen Business-Software Standards.

## 📄 PDF-Generierung

Für lokale PDF-Generierung (z.B. Mahnungen, Berichte):

```bash
npm install jspdf html2canvas
```

Implementierung in `src/utils/pdfGenerator.ts`.

## 🤝 Contributing

1. Fork das Repository
2. Erstellen Sie einen Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit Ihre Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffnen Sie eine Pull Request

## 📝 Lizenz

Dieses Projekt steht unter der MIT Lizenz. Siehe `LICENSE` Datei für Details.

## 👥 Support

Bei Fragen oder Problemen erstellen Sie bitte ein Issue im GitHub Repository.

---

**Vermy CRM** - Professionelle Immobilienverwaltung für Deutschland 🏠🇩🇪