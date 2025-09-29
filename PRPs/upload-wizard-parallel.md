# File Upload Wizard - PRP (Prompt Requirements Planning)

## Goal
Transform the existing manual data entry system (`mp-add`) into a file upload wizard that processes multiple DOCX files, extracts review/interview content, pre-fills forms with parsed data, handles entity duplicate detection, and saves to Firebase with automatic Algolia indexing.

**Measurable Outcome**: User can drag & drop 4 DOCX files, process them one-by-one with human verification, resolve entity duplicates through UI prompts, and successfully save all content to database with search indexing.

## Why

### Business Value
- **Efficiency Improvement**: Reduce manual data entry time from ~10 minutes per review to ~2 minutes verification per file
- **Error Reduction**: Automated text parsing reduces transcription errors 
- **Batch Processing**: Handle multiple files in single session instead of individual entries
- **Data Quality**: Duplicate entity detection prevents database inconsistencies

### Integration with Existing Features
- **Seamless Coexistence**: Works alongside existing manual entry forms in `mp-add`
- **Zero Backend Changes**: Leverages existing Firebase Functions for Algolia integration
- **Entity Management**: Integrates with current person/theater/city/group management
- **Authentication Flow**: Uses existing OAuth token-based access control

### Problems Solved
- **For Content Creator**: Eliminate tedious manual typing of review/interview content
- **For Data Integrity**: Prevent duplicate entities (e.g., "Michael Fox" vs "Michael J Fox")
- **For Workflow**: Enable batch processing instead of one-by-one manual entry
- **For User Experience**: Clear progress indication and error handling

## What

### User-Visible Behavior
1. **Upload Interface**: Toggle between "Manual Entry" and "File Upload Wizard" modes in mp-add
2. **Content Type Selection**: Choose "Reviews" or "Interviews" for entire batch
3. **Drag & Drop**: Multi-file DOCX upload with immediate text extraction
4. **Sequential Processing**: Step-by-step form verification (e.g., "Step 2 of 5")
5. **Smart Forms**: Pre-populated fields with parsed data from DOCX content
6. **Duplicate Detection**: Warning dialogs when similar entities detected (>85% similarity)
7. **Entity Creation**: Quick popup forms to create new persons/theaters/cities/groups
8. **Original Text View**: Expandable section to view raw extracted text
9. **Progress Tracking**: Visual progress bar and current step indicator
10. **Success Summary**: Final screen showing processed count with options to upload more

### Technical Requirements
- **File Processing**: DOCX text extraction using mammoth.js library
- **Text Parsing**: Port existing Node.js parsing logic to browser-compatible code
- **Entity Matching**: Levenshtein distance algorithm for similarity detection
- **State Management**: Parent-child communication using existing MPElement property system
- **UI Components**: Shoelace library integration (sl-select, sl-input, sl-dialog, etc.)
- **Firebase Integration**: Reuse existing API patterns and authentication
- **Error Handling**: Graceful fallbacks for extraction failures with manual entry options

## All Needed Context

### Documentation & References
- file: `/workspace/analysis.md` - Complete analysis of existing upload scripts, data schemas, and Firebase Functions
- file: `/workspace/src/mp-add/mp-add.js` - Current manual entry implementation
- file: `/workspace/functions/index.js` - Existing Algolia integration (automatic indexing)
- file: `/workspace/src/mp-element/mp-element.js` - Base component class and property system
- file: `/workspace/src/mp-search/mp-search.js` - Existing Algolia search integration patterns

### Current Codebase Context
```
src/
├── mp-add/
│   ├── mp-add.js                    # Current manual entry system
│   └── mp-add.css.js                # Existing styles
├── mp-element/
│   └── mp-element.js                # Base component class
├── mp-search/
│   └── mp-search.js                 # Algolia integration patterns
├── services/ (NEW)
│   ├── firebase-api.js              # Clean API abstraction
│   ├── text-extractor.js            # DOCX processing
│   ├── entity-matcher.js            # Similarity detection
│   └── data-parser.js               # Content parsing logic
├── mp-file-drop/                    # Standalone file upload component
├── mp-file-processor/               # Standalone file processing component  
├── mp-review-form/                  # Standalone review form component
├── mp-interview-form/               # Standalone interview form component
├── mp-entity-matcher/               # Standalone duplicate detection component
├── mp-entity-creator/               # Standalone entity creation modal
├── mp-upload-wizard/                # Main wizard orchestrator
├── mp-wizard-progress/              # Progress indicator component
└── mp-wizard-summary/               # Success screen component
```

### Implementation Patterns
- **Component Architecture**: Follow MPElement base class with properties/changedHandlers pattern
- **Event Communication**: Use CustomEvents for parent-child communication (`dispatchEvent`)
- **Firebase API**: Direct REST API calls with OAuth tokens (pattern from mp-add.js:137-178)
- **State Management**: Properties-based reactive updates with `observe: true` pattern
- **Error Handling**: Try-catch with user-friendly fallbacks and alert messages
- **File Processing**: Use FileReader API + mammoth.js for DOCX text extraction
- **Styling**: CSS-in-JS pattern with separate .css.js files per component

### Known Gotchas
- **Mammoth.js Integration**: Requires ArrayBuffer processing, not direct File objects
- **Firebase Storage URLs**: Need proper token handling for image uploads (mp-add.js:391-394)
- **Entity ID Generation**: Use existing UUID utility (utils/uuid.js) for new entities
- **Similarity Threshold**: 85% for strong matches, 70% for possible matches (needs tuning)
- **Content Formatting**: Preserve HTML formatting from parsed text (avoid double-encoding)
- **Authentication State**: Wizard must handle authToken changes/expiry gracefully

## Implementation Blueprint

### Data Models and Structure

#### Core Interfaces
```typescript
interface WizardFile {
  originalFile: File
  extractedText: string
  parsedData: ReviewData | InterviewData
  userEdits: Partial<ReviewData | InterviewData>
  status: 'pending' | 'processing' | 'completed' | 'skipped' | 'error'
  matchingEntities: Record<string, EntityMatch[]>
  errorMessage?: string
}

interface EntityMatch {
  entity: Person | Theater | City | Group
  similarity: number
  reason: string
}

interface ReviewData {
  title: string
  name: string
  actors: string[]
  directors: string[]
  writers: string[]
  groups: string[]
  city: string
  theater: string
  performanceDate: string
  reviewContent: string
  images?: string[]
}

interface InterviewData {
  title: string
  persons: string[]
  interviewDate: string
  content: string
  images?: string[]
}
```

#### Component Properties
```javascript
// mp-upload-wizard properties
{
  authToken: { observe: true, changedHandler: 'authTokenChanged' },
  contentType: { observe: true, defaultValue: '' },
  files: { observe: true, defaultValue: [] },
  currentFileIndex: { observe: true, defaultValue: 0 },
  processedFiles: { observe: true, defaultValue: [] },
  entities: { observe: true, defaultValue: {} },
  wizardStep: { observe: true, defaultValue: 'upload' }
}
```

### Task List

1. **Create Service Layer Foundation**
   - Implement firebase-api.js with clean abstraction methods
   - Build text-extractor.js with mammoth.js integration
   - Create entity-matcher.js with Levenshtein similarity
   - Port data-parser.js from existing Node.js parsing logic

2. **Build Standalone Components**
   - mp-file-drop: Multi-file DOCX upload with drag & drop
   - mp-file-processor: Individual file processing coordinator
   - mp-review-form: Pre-populated review editing form
   - mp-interview-form: Pre-populated interview editing form
   - mp-entity-matcher: Duplicate detection and resolution UI
   - mp-entity-creator: Modal popup for quick entity creation

3. **Create Wizard Orchestration**
   - mp-upload-wizard: Main container and state management
   - mp-wizard-progress: Step indicator and progress visualization
   - mp-wizard-summary: Success screen with upload statistics

4. **Integrate with Existing System**
   - Modify mp-add.js to include wizard mode toggle
   - Ensure Firebase Functions continue handling Algolia indexing
   - Maintain existing authentication and entity management flows

5. **Error Handling & Polish**
   - Implement graceful fallbacks for text extraction failures
   - Add comprehensive user feedback for processing states
   - Handle edge cases in similarity matching and entity creation

### Pseudocode

#### Main Wizard Flow
```javascript
class MPUploadWizard extends MPElement {
  async handleFilesDropped(files) {
    this.files = files.filter(f => f.name.endsWith('.docx'))
    this.wizardStep = 'process'
    
    // Extract text from all files in background
    for (let file of this.files) {
      const extractedText = await this.textExtractor.extractFromDOCX(file)
      const parsedData = this.contentType === 'reviews' 
        ? await this.dataParser.parseReviewText(extractedText, file.name)
        : await this.dataParser.parseInterviewText(extractedText, file.name)
      
      const matchingEntities = await this.entityMatcher.findDuplicates(parsedData)
      
      this.processedFiles.push({
        originalFile: file,
        extractedText,
        parsedData,
        matchingEntities,
        status: 'pending'
      })
    }
    
    this.processCurrentFile()
  }
  
  async processCurrentFile() {
    const file = this.processedFiles[this.currentFileIndex]
    file.status = 'processing'
    
    // Dispatch event to mp-file-processor
    this.dispatchEvent(new CustomEvent('process-file', {
      detail: { fileData: file, entities: this.entities }
    }))
  }
  
  async handleFileCompleted(event) {
    const { fileIndex, formData } = event.detail
    
    // Save to Firebase
    await this.firebaseAPI.saveDocument(
      this.contentType, 
      { ...this.processedFiles[fileIndex].parsedData, ...formData }
    )
    
    this.processedFiles[fileIndex].status = 'completed'
    
    if (this.currentFileIndex < this.files.length - 1) {
      this.currentFileIndex++
      this.processCurrentFile()
    } else {
      this.wizardStep = 'summary'
    }
  }
}
```

#### Entity Matching Logic
```javascript
class EntityMatcher {
  findDuplicates(parsedData) {
    const results = {}
    
    for (let field of ['actors', 'directors', 'writers']) {
      if (parsedData[field]) {
        results[field] = parsedData[field].map(name => {
          const matches = this.entities.persons.map(person => ({
            entity: person,
            similarity: this.calculateSimilarity(name, person.name)
          })).filter(match => match.similarity > 70)
          
          return { inputName: name, matches }
        })
      }
    }
    
    return results
  }
  
  calculateSimilarity(str1, str2) {
    const normalized1 = this.normalizeName(str1)
    const normalized2 = this.normalizeName(str2)
    
    const distance = this.levenshteinDistance(normalized1, normalized2)
    const maxLength = Math.max(normalized1.length, normalized2.length)
    
    return Math.round((1 - distance / maxLength) * 100)
  }
  
  normalizeName(name) {
    return name.toLowerCase()
      .replace(/\b\w\./g, '') // Remove initials like "J."
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .trim()
  }
}
```

### Integration Points

#### Firebase API Patterns (from mp-add.js)
```javascript
// Document Creation
const resp = await fetch(
  `https://firestore.googleapis.com/v1/projects/margriet-prinssen/databases/(default)/documents/reviews?access_token=${this.authToken}&alt=json`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.authToken}`,
    },
    body: JSON.stringify({ fields: firestoreFormattedData })
  }
)

// Entity Retrieval (cached)
const entities = await this.#getPersons('persons')
this.entities = { persons: entities, ... }
```

#### Component Communication
```javascript
// Parent to child
<mp-file-processor 
  .fileData=${this.processedFiles[this.currentFileIndex]}
  .entities=${this.entities}
  @file-completed=${this.handleFileCompleted}
  @skip-file=${this.handleSkipFile}>
</mp-file-processor>

// Child to parent
this.dispatchEvent(new CustomEvent('file-completed', {
  detail: { fileIndex: this.currentFileIndex, formData: this.formData }
}))
```

#### Shoelace Integration
```javascript
// Forms use existing Shoelace patterns from mp-add
<sl-select label="Acteurs" multiple clearable>
  ${this.persons.map(person => html`
    <sl-option value="${person.name}">${person.name}</sl-option>
  `)}
</sl-select>

// Modals for entity creation
<sl-dialog label="Nieuwe persoon toevoegen" ?open=${this.showCreateModal}>
  <sl-input label="Naam" @input=${e => this.newEntityName = e.target.value}></sl-input>
  <sl-button slot="footer" variant="primary" @click=${this.createEntity}>Toevoegen</sl-button>
</sl-dialog>
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# JavaScript syntax validation
npx jshint src/services/*.js src/mp-upload-wizard/*.js src/mp-file-drop/*.js

# CSS validation  
npx stylelint src/**/*.css.js

# Component registration check
grep -r "window.customElements.define" src/
```

### Level 2: Unit Tests
```javascript
// Test text extraction
describe('TextExtractor', () => {
  it('should extract text from DOCX files', async () => {
    const mockFile = new File([''], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    const result = await textExtractor.extractFromDOCX(mockFile)
    expect(result).toBeDefined()
  })
})

// Test entity matching
describe('EntityMatcher', () => {
  it('should detect high similarity matches', () => {
    const matcher = new EntityMatcher([{name: 'Michael Fox'}])
    const result = matcher.findSimilarEntities('Michael J Fox', 'person')
    expect(result[0].similarity).toBeGreaterThan(85)
  })
})

// Test component event handling
describe('MPUploadWizard', () => {
  it('should advance to next file on completion', () => {
    const wizard = new MPUploadWizard()
    wizard.currentFileIndex = 0
    wizard.handleFileCompleted({ detail: { fileIndex: 0 } })
    expect(wizard.currentFileIndex).toBe(1)
  })
})
```

### Level 3: Integration Tests
```javascript
// End-to-end wizard flow
describe('Upload Wizard Integration', () => {
  it('should process files from upload to Firebase', async () => {
    // 1. Upload files
    const files = [mockDOCXFile()]
    await wizard.handleFilesDropped(files)
    
    // 2. Verify text extraction
    expect(wizard.processedFiles[0].extractedText).toBeDefined()
    
    // 3. Complete processing
    await wizard.handleFileCompleted({ detail: { fileIndex: 0, formData: mockFormData } })
    
    // 4. Verify Firebase save
    expect(mockFirebaseAPI.saveDocument).toHaveBeenCalled()
    
    // 5. Verify Algolia indexing (via Functions)
    expect(wizard.wizardStep).toBe('summary')
  })
})

// Test Firebase Functions integration
describe('Algolia Integration', () => {
  it('should automatically index documents on save', async () => {
    // Save document to Firestore
    await firebaseAPI.saveReview(mockReviewData)
    
    // Verify Functions trigger (mock Firebase Functions)
    expect(mockAlgoliaIndex.saveObject).toHaveBeenCalledWith(
      expect.objectContaining({ objectID: expect.any(String) })
    )
  })
})
```

## Final Validation Checklist

### Functionality Requirements
- [ ] DOCX files can be uploaded via drag & drop
- [ ] Text extraction works with mammoth.js
- [ ] Forms pre-populate with parsed data
- [ ] Entity duplicate detection shows warnings at >85% similarity
- [ ] Users can create new entities via popup modals  
- [ ] Progress indicator shows current step and total
- [ ] Success screen displays processing statistics
- [ ] Firebase save triggers automatic Algolia indexing
- [ ] Error handling provides graceful fallbacks
- [ ] Integration with existing mp-add manual entry works

### Technical Quality Gates
- [ ] All components extend MPElement base class
- [ ] Properties use observe: true for reactive updates
- [ ] Events follow CustomEvent pattern for communication
- [ ] Firebase API calls follow existing OAuth token pattern
- [ ] Shoelace components integrated consistently
- [ ] CSS-in-JS pattern maintained across components
- [ ] Error states handled with user feedback
- [ ] File processing handles edge cases (corrupted files, etc.)
- [ ] Entity matching algorithm tuned for optimal similarity detection
- [ ] Code follows existing project conventions and patterns

### User Experience Validation
- [ ] Upload process feels responsive and provides clear feedback
- [ ] Duplicate warnings are clear and actionable
- [ ] Forms are intuitive with pre-filled but editable data
- [ ] Progress indication helps user understand workflow
- [ ] Error messages are helpful and suggest next steps
- [ ] Success screen provides clear options for next actions
- [ ] Integration between wizard and manual modes is seamless
- [ ] Performance is acceptable for typical file sizes (1-5MB DOCX)

### Data Integrity Checks
- [ ] Parsed data matches original file content accurately
- [ ] Entity relationships maintained correctly
- [ ] Firebase document structure follows existing schema
- [ ] Algolia search indexes update automatically
- [ ] No duplicate entities created inappropriately  
- [ ] Image uploads work with existing Firebase Storage patterns
- [ ] Authentication state handled throughout wizard flow

### Deployment Readiness
- [ ] All new components registered with customElements
- [ ] Dependencies (mammoth.js) properly imported
- [ ] No breaking changes to existing functionality
- [ ] Error logging provides debugging information
- [ ] Performance monitoring hooks in place
- [ ] Rollback plan available if issues discovered
- [ ] Documentation updated for new wizard functionality

---

## Success Metrics

**Context Richness**: 9/10 - Comprehensive analysis of existing code, patterns, and integration points
**Implementation Clarity**: 9/10 - Clear component architecture, data flow, and integration patterns  
**Validation Completeness**: 9/10 - Multi-level testing strategy with specific test cases
**One-Pass Success Probability**: 85% - Well-researched architecture leveraging existing patterns

This PRP provides a complete roadmap for implementing the file upload wizard while maintaining compatibility with existing systems and following established project patterns.