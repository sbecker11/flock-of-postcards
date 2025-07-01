# Future Work - Resume Flock

## 🏷️ Project Renaming

### Current Status
- **Current Name**: `flock-of-postcards`
- **Proposed Name**: `resume-flock`
- **Rationale**: The project has evolved from a postcard concept into a resume visualization system with business cards and skill chips

### Implementation
- Update `package.json` name field
- Rename repository
- Update all documentation references
- Update import paths if necessary

---

## 📄 Resume Upload & LLM Parsing System

### Core Requirements
1. **File Upload Interface** - Support multiple formats (PDF, DOCX, TXT)
2. **LLM Agent** - Parse resume into structured sections
3. **Data Transformation** - Convert parsed data to existing job format
4. **Preview & Edit** - Allow users to review and modify parsed data
5. **Integration** - Seamlessly integrate with existing flock visualization

### Implementation Plan

#### Phase 1: File Upload System
```javascript
// server.mjs - Add file upload endpoints
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// POST /api/upload-resume
app.post('/api/upload-resume', upload.single('resume'), async (req, res) => {
  try {
    const file = req.file;
    const parsedData = await parseResumeWithLLM(file.buffer, file.mimetype);
    res.json({ success: true, data: parsedData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Phase 2: LLM Parsing Agent
```javascript
// LLM parsing function
async function parseResumeWithLLM(fileBuffer, mimeType) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  
  const prompt = `
    Parse this resume and extract the following structured data:
    - Personal Information (name, email, phone, location)
    - Summary/Objective
    - Work History (company, position, dates, responsibilities)
    - Education (degree, institution, dates)
    - Skills (technical and soft skills)
    - Certifications
    - Projects
    
    Return as JSON with this structure:
    {
      "personal": {...},
      "summary": "...",
      "workHistory": [...],
      "education": [...],
      "skills": [...],
      "certifications": [...],
      "projects": [...]
    }
  `;
  
  const result = await model.generateContent([prompt, fileBuffer]);
  return JSON.parse(result.response.text());
}
```

#### Phase 3: Data Transformation
```javascript
// Transform parsed resume to job format
function transformResumeToJobs(parsedResume) {
  return parsedResume.workHistory.map(job => ({
    id: generateId(),
    company: job.company,
    position: job.position,
    startDate: job.startDate,
    endDate: job.endDate,
    description: job.responsibilities.join('\n'),
    skills: extractSkillsFromJob(job.responsibilities, parsedResume.skills),
    location: job.location || parsedResume.personal.location
  }));
}
```

---

## 🏢 CMS Integration Options

### 1. Notion Integration
```javascript
// server.mjs - Notion integration
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// POST /api/notion-sync
app.post('/api/notion-sync', async (req, res) => {
  try {
    const { databaseId, pageId } = req.body;
    
    if (databaseId) {
      // Sync from Notion database
      const response = await notion.databases.query({
        database_id: databaseId,
        sorts: [{ property: 'Date', direction: 'descending' }]
      });
      
      const jobs = response.results.map(page => ({
        id: page.id,
        company: page.properties.Company?.title?.[0]?.plain_text,
        position: page.properties.Position?.rich_text?.[0]?.plain_text,
        startDate: page.properties.StartDate?.date?.start,
        endDate: page.properties.EndDate?.date?.start,
        description: page.properties.Description?.rich_text?.[0]?.plain_text,
        skills: page.properties.Skills?.multi_select?.map(s => s.name) || []
      }));
      
      res.json({ success: true, jobs });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Airtable Integration
```javascript
// Airtable integration
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

// POST /api/airtable-sync
app.post('/api/airtable-sync', async (req, res) => {
  try {
    const records = await base('Jobs').select().all();
    const jobs = records.map(record => ({
      id: record.id,
      company: record.get('Company'),
      position: record.get('Position'),
      startDate: record.get('Start Date'),
      endDate: record.get('End Date'),
      description: record.get('Description'),
      skills: record.get('Skills') || []
    }));
    
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 3. Google Sheets Integration
```javascript
// Google Sheets integration
import { google } from 'googleapis';

const sheets = google.sheets({ version: 'v4' });

// POST /api/sheets-sync
app.post('/api/sheets-sync', async (req, res) => {
  try {
    const { spreadsheetId, range } = req.body;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
      auth: await getGoogleAuth()
    });
    
    const rows = response.data.values;
    const jobs = rows.slice(1).map(row => ({
      id: generateId(),
      company: row[0],
      position: row[1],
      startDate: row[2],
      endDate: row[3],
      description: row[4],
      skills: row[5] ? row[5].split(',').map(s => s.trim()) : []
    }));
    
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 📋 Template-Based Resume Output

### Resume Template System
```javascript
// Template engine for different resume formats
const resumeTemplates = {
  modern: {
    name: 'Modern Professional',
    description: 'Clean, minimalist design with focus on skills',
    sections: ['header', 'summary', 'experience', 'skills', 'education'],
    styling: 'modern.css'
  },
  creative: {
    name: 'Creative Portfolio',
    description: 'Visual-focused with color and graphics',
    sections: ['header', 'portfolio', 'experience', 'skills', 'education'],
    styling: 'creative.css'
  },
  traditional: {
    name: 'Traditional Corporate',
    description: 'Classic format for corporate environments',
    sections: ['header', 'objective', 'experience', 'education', 'skills'],
    styling: 'traditional.css'
  }
};

// POST /api/generate-resume
app.post('/api/generate-resume', async (req, res) => {
  try {
    const { template, data, format } = req.body;
    
    const templateConfig = resumeTemplates[template];
    const resumeHtml = generateResumeHTML(templateConfig, data);
    
    if (format === 'pdf') {
      const pdf = await generatePDF(resumeHtml);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=resume.pdf');
      res.send(pdf);
    } else {
      res.json({ success: true, html: resumeHtml });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Template Features
- **Multiple Formats**: PDF, HTML, DOCX
- **Customizable Styling**: CSS themes for different industries
- **Section Reordering**: Drag-and-drop section arrangement
- **Real-time Preview**: Live preview of changes
- **Export Options**: Print-friendly, web-optimized, mobile-responsive

---

## 🧩 Reusable Vue Components

### High-Value Components for Public Distribution

#### 1. ResizeHandle Component ⭐⭐⭐⭐⭐
**Current**: `modules/components/ResizeHandle.vue`

**Features**:
- Universal resizable panels
- Stepping/snapping functionality
- Collapse controls
- Percentage display
- Touch support
- Smooth animations

**Potential Package**: `@vue-resize-handle`

#### 2. InfiniteScrollingContainer ⭐⭐⭐⭐⭐
**Current**: `modules/resume/infiniteScrollingContainer.mjs`

**Features**:
- Infinite scrolling with item cloning
- Touch & mouse support
- Momentum scrolling with physics
- Smooth animations with easing
- Resize handling
- Performance optimized

**Potential Package**: `@vue-infinite-scroll`

#### 3. CustomDropdown Component ⭐⭐⭐⭐
**Current**: `modules/customDropdown/`

**Features**:
- Fully customizable styling
- Search functionality
- Multi-select support
- Keyboard navigation
- Virtual scrolling for large datasets

**Potential Package**: `@vue-custom-dropdown`

#### 4. Color Palette System ⭐⭐⭐⭐
**Current**: `modules/colors/` + `modules/composables/useColorPalette.mjs`

**Features**:
- Dynamic color palette management
- Theme switching
- CSS custom properties integration
- Palette persistence
- Accessibility considerations

**Potential Package**: `@vue-color-palette`

#### 5. Timeline Component ⭐⭐⭐
**Current**: `modules/components/Timeline.vue`

**Features**:
- Interactive timeline visualization
- Zoom and pan controls
- Event markers
- Custom styling
- Responsive design

**Potential Package**: `@vue-timeline`

---

## 🔧 State Management Improvements

### Current Architecture
- **Global State Manager** (`stateManager.mjs`) - Server-persisted state
- **Vue Composables** - Reactive local state with singleton patterns
- **Event Bus** (`eventBus.mjs`) - Module communication
- **Legacy Controllers** - Class-based state management

### Recommended State Machine Implementation

#### Option 1: XState Integration (Low Effort - 1-2 days)
```javascript
// Install: npm install xstate @xstate/vue
import { createMachine } from 'xstate';
import { useMachine } from '@xstate/vue';

const resumeMachine = createMachine({
  id: 'resume',
  initial: 'idle',
  states: {
    idle: {
      on: { UPLOAD: 'uploading' }
    },
    uploading: {
      on: { SUCCESS: 'parsing', ERROR: 'error' }
    },
    parsing: {
      on: { SUCCESS: 'editing', ERROR: 'error' }
    },
    editing: {
      on: { SAVE: 'saving', EXPORT: 'exporting' }
    },
    saving: {
      on: { SUCCESS: 'editing', ERROR: 'error' }
    },
    exporting: {
      on: { SUCCESS: 'editing', ERROR: 'error' }
    },
    error: {
      on: { RETRY: 'idle' }
    }
  }
});
```

#### Option 2: Pinia Integration (Medium Effort - 3-5 days)
```javascript
// Install: npm install pinia
import { defineStore } from 'pinia';

export const useResumeStore = defineStore('resume', {
  state: () => ({
    jobs: [],
    skills: [],
    education: [],
    currentJob: null,
    isLoading: false,
    error: null
  }),
  
  getters: {
    sortedJobs: (state) => state.jobs.sort((a, b) => new Date(b.startDate) - new Date(a.startDate)),
    allSkills: (state) => [...new Set(state.jobs.flatMap(job => job.skills))]
  },
  
  actions: {
    async uploadResume(file) {
      this.isLoading = true;
      try {
        const response = await fetch('/api/upload-resume', {
          method: 'POST',
          body: new FormData().append('resume', file)
        });
        const data = await response.json();
        this.jobs = data.jobs;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.isLoading = false;
      }
    }
  }
});
```

---

## 📦 Package.json Dependencies to Add

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.2.0",
    "@notionhq/client": "^2.2.0",
    "airtable": "^0.12.0",
    "googleapis": "^128.0.0",
    "multer": "^1.4.5-lts.1",
    "puppeteer": "^21.0.0",
    "xstate": "^4.38.0",
    "@xstate/vue": "^3.0.0",
    "pinia": "^2.1.0"
  },
  "devDependencies": {
    "@types/multer": "^1.4.7"
  }
}
```

---

## 🎯 Implementation Priority

### Phase 1 (Week 1-2): Foundation
1. Project renaming to `resume-flock`
2. Basic file upload system
3. LLM parsing integration
4. Data transformation pipeline

### Phase 2 (Week 3-4): CMS Integration
1. Notion integration
2. Airtable integration
3. Google Sheets integration
4. Data synchronization

### Phase 3 (Week 5-6): Templates & Export
1. Resume template system
2. PDF generation
3. Multiple format export
4. Template customization

### Phase 4 (Week 7-8): Component Extraction
1. ResizeHandle component
2. InfiniteScrollingContainer component
3. CustomDropdown component
4. NPM package preparation

### Phase 5 (Week 9-10): State Management
1. XState or Pinia integration
2. State machine implementation
3. Performance optimization
4. Documentation

---

## 🔍 Technical Considerations

### Security
- File upload validation and sanitization
- API key management for external services
- Rate limiting for LLM API calls
- Input validation for all endpoints

### Performance
- File size limits and compression
- Caching for parsed resume data
- Lazy loading for large datasets
- Optimized rendering for infinite scroll

### Accessibility
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Focus management

### Testing
- Unit tests for parsing logic
- Integration tests for API endpoints
- E2E tests for user workflows
- Performance testing for large datasets 