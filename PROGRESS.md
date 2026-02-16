# ByggNytt - Utvecklingsframsteg

## Projektöversikt
Nyhetsbrevs-app för bygghandel. Blockeditor med MJML-rendering, PDF-export och publik webbsida.

**Tech stack:** React 18 + Vite + Tailwind | Express + SQLite + MJML + Puppeteer + Sharp | npm workspaces monorepo

**Startkommando:** `cd byggnytt && npm run dev` (startar backend :3001 + frontend :5173)

---

## Avklarade agenter

### Agent 1: Projektsetup & Infrastruktur - KLAR
- Monorepo med npm workspaces (`packages/shared`, `packages/backend`, `packages/frontend`)
- TypeScript med strikt läge, Prettier, tsconfig.base.json
- Vite med proxy `/api` → backend, Tailwind CSS v4
- SQLite-databas med schema (newsletters, images, templates)
- Shared types-paket med Block, Newsletter, Settings m.m.
- `.env`-hantering, `.gitignore`
- `npm run dev` startar båda servrarna via concurrently

### Agent 2: Backend API & Databaslagring - KLAR
- **CRUD newsletters:** GET/POST/PUT/DELETE + duplicate, med filtrering (channel, status)
- **Bilduppladdning:** Multer → Sharp (resize max 800px, WebP-konvertering) → SQLite
- **Template-hantering:** GET/POST/DELETE + seed av default-mallar vid start
- **Validering:** `validateBody()` (required, type, enum, length) och `validateUuidParam()` på alla routes
- **Felhantering:** Multer-fel, Sharp-fel, SQLite-constraint, JSON parse-fel
- **Nyhetsbrev från mall:** `POST /api/newsletters` med `from_template_id`
- Alla API-tester passerar (CRUD, validering, duplicering, uppdatering, borttagning)

### Agent 3: MJML-rendering & Export - KLAR
- **mjml-builder.ts:** Block[] → MJML → mailkompatibel HTML med Outlook-stöd
  - Mappning för alla 8 blocktyper (hero, text, image-text, campaign, divider, footer, product, product-grid)
  - Preheader, font-family, färgschema, responsiv layout
- **web-renderer.ts:** Block[] → modern HTML/CSS för webb och PDF
  - Flexbox/Grid layout, media queries (mobil <480px)
  - Standalone-läge med komplett HTML-dokument
- **pdf-generator.ts:** HTML → PDF via Puppeteer (A4, 10mm marginaler)
- **Routes:**
  - `POST /api/render` → webb-HTML för förhandsgranskning
  - `POST /api/render/mjml` → mailkompatibel HTML (+ varningar)
  - `POST /api/export/pdf/:id` → PDF-nedladdning
  - `GET /api/export/public/:id` → publik webbsida
- Verifierat: 6800+ tecken webb-HTML, 18700+ tecken MJML-HTML med Outlook conditionals

### Agent 4: Frontend - Blockeditor - KLAR
- **BlockPalette:** 6 blocktyper med ikoner, klicka för att lägga till
- **Canvas:** dnd-kit med DndContext, SortableContext, verticalListSortingStrategy, PointerSensor (8px distance), KeyboardSensor
- **BlockWrapper:** useSortable hook, drag-handle (≡), duplicera (⊕), ta bort (✕), visuell markering av valt block
- **PropertyPanel:** Formulär per blocktyp (hero, text, image-text, campaign, divider, footer) + block-stil (bakgrundsfärg, padding) + nyhetsbrevsinställningar (titel, ämnesrad, färger)
- **BlockRenderer:** Visuell förhandsgranskning av alla blocktyper i canvas
- **Autosave:** Debounced spara var 5:e sekund + manuell spara-knapp + "(osparad)"-indikator
- **Zustand store:** Fullt implementerad med alla actions (add, remove, duplicate, move, updateContent, updateStyle, updateSettings)

### Agent 5: Frontend - Blockkomponenter - KLAR
- **ImageUploader:** Ny komponent med drag-and-drop, upload-progress, byt/ta bort-overlay
  - Anropar `api.images.upload()` direkt
  - Anvanns i PropertyPanel for hero, image-text, campaign, product, product-grid
- **RichTextEditor:** contentEditable med toolbar (Bold, Italic, Lank, Rensa formatering)
  - Ctrl+B/I genvargar
  - Synkar externt varde utan att storma cursor
  - Anvanns i PropertyPanel for TextForm och ImageTextForm
- **Inline-redigering i canvas:** `InlineText`-komponent med contentEditable
  - Rubriker, underrubriker, foretagsnamn, kampanjtext redigerbart direkt i canvas
  - Sparar vid blur, Enter stanger redigering
  - Placeholder-text nar faltet ar tomt (CSS `:empty::before`)
- **Bilduppladdning i canvas:** `CanvasImage`-komponent
  - Klicka pa bild-placeholder for att ladda upp direkt i canvas
  - Dra-och-slapp stod
  - Hover-overlay "Byt bild" pa befintliga bilder
- **Produktblock:** `product` och `product-grid` implementerade
  - Block-defaults, palette-knappar, canvas-preview, egenskapspanel
  - ProductGridForm med hopfallbara produktsektioner, lagg till/ta bort produkter
- **ColorField:** Extraherad gemensam komponent for fargvaljare
- **CSS:** `.inline-editable` och `.rich-text-editor` stilar for placeholder och fokus

### Agent 6: Frontend - Forhandsgranskning & Export - KLAR
- **PreviewPanel:** Modal med iframe, toggle webb/mail renderingslage, toggle desktop (600px) / mobil (375px)
  - "Uppdatera"-knapp, "Nytt fonster"-knapp, stang med Escape eller klick utanfor
  - Laddar om automatiskt vid byte av renderingslage
- **ExportDropdown:** Absolut-positionerad dropdown fran "Exportera"-knappen
  - "Ladda ner PDF" - sparar forst, hamtar blob, skapar nedladdningslank
  - "Kopiera mail-HTML" - renderar MJML, kopierar till urklipp
  - "Kopiera publik lank" - kopierar URL till urklipp
  - Statusmeddelanden (info/success/error) med auto-stang efter 1.5s
  - Stanger vid klick utanfor eller Escape
- **EditorLayout:** Uppdaterad med Forhandsgranska- och Exportera-knappar, StatusBadge
- **NewsletterList:** Filtrering per kanal och status, FilterGroup-komponent, NewsletterCard med kanal-/statusbadgar, blockantal, uppdateringsdatum
- **api.ts:** PDF-export fixad med `res.blob()` istallet for `res.json()` for binara filer

### Agent 7: Mallar & Kanalkonfiguration - KLAR
- **"Skapa fran mall"-flode:** Tre-stegs wizard i NewsletterList (1. Valj kanal, 2. Valj mall, 3. Ange titel)
  - Visar kanaler med fargprov och beskrivning
  - Laddar mallar filtrerade per kanal fran API
  - "Tom"-alternativ for att borja fran noll
  - Mallkort med namn, blockantal, fargprov, "Standard"-badge
  - Skickar `from_template_id` vid skapande
- **Spara som mall:** "Spara som mall"-knapp i EditorLayout header
  - Modal dialog med mallnamn, auto-sparar osparade andringar forst
  - Anropar `POST /api/templates` med `from_newsletter_id`
  - Framgangs-/felmeddelanden med auto-stang
- **Fargscheman per kanal:** Utokad SettingsForm i PropertyPanel
  - "Aterstall kanalprofil"-knapp (aterstaller farger, typsnitt, avsandarnamn)
  - Snabbvaljare for kanalprofilers fargscheman (klickbara fargprov)
  - Nytt falt: sekundarfarg (color_secondary)
  - Nytt falt: typsnitt (font_family) med 5 mailsakra val
- **API-klient:** Utokad `api.templates` med `list(channel?)`, `get(id)`, `create(data)`, `delete(id)`
- **Shared types:** `CreateNewsletterRequest` utokad med `from_template_id`

---

## Alla agenter klara

---

## Filstruktur (53 filer totalt)

```
byggnytt/
├── package.json                          # Monorepo root med workspaces
├── tsconfig.base.json                    # Delad TypeScript-config
├── .env.example / .gitignore / .prettierrc
│
├── packages/shared/src/
│   ├── types.ts                          # Newsletter, Block, BlockContent, API-typer
│   ├── constants.ts                      # CHANNEL_CONFIG, BLOCK_TYPE_LABELS, MAX_IMAGE_WIDTH
│   ├── block-defaults.ts                 # getBlockDefaults() per blocktyp
│   └── index.ts                          # Re-exports
│
├── packages/backend/src/
│   ├── index.ts                          # Express app + CORS + routes + seed
│   ├── db/database.ts                    # SQLite connection + schema init
│   ├── db/schema.sql                     # newsletters, images, templates
│   ├── db/seed.ts                        # Seedar default-mallar
│   ├── middleware/errorHandler.ts         # Multer, Sharp, SQLite, JSON-fel
│   ├── middleware/validate.ts            # validateBody(), validateUuidParam()
│   ├── routes/newsletters.ts             # CRUD + duplicate + from_template_id
│   ├── routes/templates.ts               # CRUD + skydd av default-mallar
│   ├── routes/render.ts                  # POST /render + /render/mjml
│   ├── routes/export.ts                  # POST /export/pdf + GET /export/public
│   ├── routes/upload.ts                  # POST /upload + GET/DELETE /images
│   ├── services/mjml-builder.ts          # Block[] → MJML → mail-HTML
│   ├── services/web-renderer.ts          # Block[] → modern HTML/CSS
│   ├── services/pdf-generator.ts         # HTML → PDF via Puppeteer
│   └── services/image-service.ts         # Sharp: resize, WebP, delete
│
├── packages/frontend/src/
│   ├── main.tsx + App.tsx                # Entry + routing (lista/editor)
│   ├── index.css                         # Tailwind + .input-field
│   ├── stores/editorStore.ts             # Zustand: blocks, selection, dirty-state
│   ├── hooks/useAutosave.ts              # Debounced auto-save
│   ├── utils/api.ts                      # API-klient: newsletters, render, export, images, templates
│   ├── components/Editor/
│   │   ├── EditorLayout.tsx              # Tre-kolumns layout + header + save
│   │   ├── BlockPalette.tsx              # 8 blocktyper att lagga till
│   │   ├── Canvas.tsx                    # dnd-kit sortable canvas
│   │   ├── BlockWrapper.tsx              # Drag-handle, delete, duplicate
│   │   ├── PropertyPanel.tsx             # Formular per blocktyp + ImageUploader + RichText
│   │   ├── ImageUploader.tsx             # Bilduppladdning med drag-and-drop
│   │   ├── RichTextEditor.tsx            # contentEditable med B/I/lank-toolbar
│   │   ├── PreviewPanel.tsx             # Forhandsgranskning: iframe, webb/mail, desktop/mobil
│   │   └── ExportDropdown.tsx           # PDF, mail-HTML, publik lank export
│   ├── components/Blocks/
│   │   └── BlockRenderer.tsx             # Inline-redigering + alla 8 blocktyper
│   └── components/NewsletterList/
│       └── NewsletterList.tsx            # Lista, skapa, duplicera, ta bort
│
└── templates/
    ├── proffs/default.json               # Standardmall proffs
    └── konsument/default.json            # Standardmall konsument
```

---

## API-endpoints (alla implementerade)

| Metod | URL | Status |
|-------|-----|--------|
| GET | `/api/newsletters` | Klar |
| GET | `/api/newsletters/:id` | Klar |
| POST | `/api/newsletters` | Klar (med from_template_id) |
| PUT | `/api/newsletters/:id` | Klar |
| DELETE | `/api/newsletters/:id` | Klar |
| POST | `/api/newsletters/:id/duplicate` | Klar |
| POST | `/api/render` | Klar (webb-HTML) |
| POST | `/api/render/mjml` | Klar (mail-HTML) |
| POST | `/api/export/pdf/:id` | Klar (Puppeteer) |
| GET | `/api/export/public/:id` | Klar |
| POST | `/api/upload` | Klar (Sharp) |
| GET | `/api/images` | Klar |
| DELETE | `/api/images/:id` | Klar |
| GET | `/api/templates` | Klar |
| GET | `/api/templates/:id` | Klar |
| POST | `/api/templates` | Klar |
| DELETE | `/api/templates/:id` | Klar |
| GET | `/api/health` | Klar |
