# Data Model: File Upload Wizard

## Core Entities

### WizardFile
Represents an uploaded file with processing state and extracted content.

**Fields**:
- `originalFile`: File object from browser upload
- `fileName`: string - Original file name
- `extractedText`: string - Raw text content from DOCX
- `parsedData`: ReviewData | InterviewData - Structured content
- `userEdits`: Partial<ReviewData | InterviewData> - User modifications
- `parsingStages`: ParsingStage[] - Sequential parsing attempts and results
- `status`: 'pending' | 'extracting' | 'parsing' | 'validating' | 'completed' | 'skipped' | 'error'
- `matchingEntities`: Record<string, EntityMatch[]> - Duplicate detection results
- `errorMessage`: string? - Processing error details
- `processingTimestamp`: number - When processing started
- `aiParsingUsed`: boolean - Whether Claude Haiku was called
- `userValidationRequired`: string[]? - Fields requiring user confirmation

**Validation Rules**:
- originalFile must be DOCX format (application/vnd.openxmlformats-officedocument.wordprocessingml.document)
- status transitions: pending → processing → (completed | error | skipped)
- extractedText required if status is not 'error'
- errorMessage required if status is 'error'

**State Transitions**:
- Initial: pending
- On text extraction start: extracting
- On parsing start: parsing
- On AI/user validation needed: validating
- On successful completion: completed
- On user skip: skipped
- On any failure: error

### ParsingStage
Represents a parsing attempt and its results.

**Fields**:
- `stage`: 'regex' | 'ai' | 'user' - Parsing method used
- `input`: string - Raw text segment being parsed
- `output`: Record<string, any> - Parsed field values
- `confidence`: number - Confidence score (0-100)
- `timestamp`: number - When this stage was executed
- `aiPrompt`: string? - Prompt sent to Claude Haiku (if applicable)
- `aiResponse`: string? - Raw AI response (if applicable)
- `userPrompt`: string? - Question shown to frontend user (if stage='user')

**Validation Rules**:
- stage 'regex' should have confidence 100 when successful
- stage 'ai' confidence based on Claude Haiku response certainty
- stage 'user' confidence is always 100 (human verification)
- input must not be empty
- output should contain at least one parsed field

### EntityMatch
Represents a potential duplicate entity detected during processing.

**Fields**:
- `entity`: Person | Theater | City | Group - Existing database entity
- `similarity`: number - Similarity percentage (0-100)
- `reason`: string - Human-readable explanation of match
- `confidence`: 'high' | 'medium' | 'low' - Match confidence level

**Validation Rules**:
- similarity must be between 0-100
- confidence 'high' when similarity >= 85%
- confidence 'medium' when similarity 70-84%
- confidence 'low' when similarity 50-69%
- reason must explain basis for match (name similarity, context clues)

### ReviewData
Structured data extracted from theater review content.

**Fields**:
- `title`: string - Review headline/title
- `name`: string - Play/performance name
- `actors`: string[] - Actor names
- `directors`: string[] - Director names
- `writers`: string[] - Writer/playwright names
- `groups`: string[] - Theater company names
- `city`: string - Performance city
- `theater`: string - Venue name
- `performanceDate`: string - ISO date string
- `reviewContent`: string - HTML-formatted review text
- `reviewDate`: string - ISO date string when review written
- `images`: string[]? - Firebase Storage URLs

**Validation Rules**:
- title and name are required
- at least one of actors, directors, or writers must be present
- city and theater are required
- performanceDate must be valid ISO date
- reviewContent must not be empty
- reviewDate defaults to performanceDate if not specified

**Relationships**:
- Links to Person entities via actors, directors, writers arrays
- Links to Theater entity via theater name
- Links to City entity via city name
- Links to Group entities via groups array

### InterviewData
Structured data extracted from interview content.

**Fields**:
- `title`: string - Interview headline
- `persons`: string[] - Interviewee names
- `interviewDate`: string - ISO date string
- `content`: string - HTML-formatted interview text
- `images`: string[]? - Firebase Storage URLs

**Validation Rules**:
- title and persons are required
- at least one person must be specified
- interviewDate must be valid ISO date
- content must not be empty

**Relationships**:
- Links to Person entities via persons array

### ProcessingSession
Tracks the overall upload wizard session state.

**Fields**:
- `sessionId`: string - UUID for session tracking
- `contentType`: 'reviews' | 'interviews' - User-selected content type
- `files`: WizardFile[] - All uploaded files
- `currentFileIndex`: number - Currently processing file
- `entities`: EntityCache - Cached database entities for matching
- `wizardStep`: 'upload' | 'process' | 'summary' - Current UI step
- `startTimestamp`: number - Session start time
- `completedCount`: number - Successfully processed files
- `skippedCount`: number - User-skipped files
- `errorCount`: number - Failed processing files

**Validation Rules**:
- contentType must be set before file processing begins
- currentFileIndex must be valid array index or -1
- completed + skipped + error counts should not exceed files length
- wizardStep transitions: upload → process → summary

**State Transitions**:
- Initial: upload step with empty files array
- On file drop: process step with populated files
- On completion: summary step with final counts

## Supporting Data Structures

### EntityCache
Cached database entities for duplicate detection performance.

**Fields**:
- `persons`: Person[] - All persons from database
- `theaters`: Theater[] - All theaters from database
- `cities`: City[] - All cities from database
- `groups`: Group[] - All groups from database
- `lastUpdated`: number - Cache timestamp
- `isStale`: boolean - Whether cache needs refresh

**Validation Rules**:
- Cache expires after 15 minutes (900,000ms)
- isStale = true when lastUpdated + 900,000 < Date.now()
- All arrays default to empty if API calls fail

### Person
Existing entity structure (reference only).

**Fields**:
- `id`: string - Firestore document ID
- `name`: string - Full name

### Theater
Existing entity structure (reference only).

**Fields**:
- `id`: string - Firestore document ID
- `name`: string - Theater name

### City
Existing entity structure (reference only).

**Fields**:
- `id`: string - Firestore document ID
- `name`: string - City name

### Group
Existing entity structure (reference only).

**Fields**:
- `id`: string - Firestore document ID
- `name`: string - Group/company name

## Data Flow Patterns

### File Processing Flow
1. User drops files → Create WizardFile entities with 'pending' status
2. Background text extraction → Update status to 'extracting', set extractedText
3. Hybrid parsing → Update status to 'parsing':
   a. Split metadata line by "/" delimiters
   b. Apply regex patterns for labeled fields (Tekst:, Regie:, etc.)
   c. For unlabeled segments → Claude Haiku API call
   d. Record each attempt in parsingStages array
   e. Flag uncertain fields in userValidationRequired
4. User validation → Update status to 'validating', show prompts for flagged fields
5. Entity matching → Populate matchingEntities with similarity results
6. User verification → Apply userEdits to override parsedData
7. Save to Firebase → Update status to 'completed'

### Entity Resolution Flow
1. Extract names from parsedData (actors, directors, etc.)
2. Compare against cached entities using similarity algorithm
3. Present matches above threshold to user
4. User chooses existing entity or creates new one
5. Update userEdits with selected entity IDs

### Session State Flow
1. Initialize ProcessingSession with 'upload' step
2. Populate files array → Transition to 'process' step
3. Process each file sequentially → Update currentFileIndex
4. Complete all files → Transition to 'summary' step with counts

## Database Integration

### Save Operations
- ReviewData → Firestore /reviews collection + /performances collection
- InterviewData → Firestore /interviews collection
- New entities → Respective collections (/persons, /theaters, etc.)
- Automatic Algolia indexing via existing Firebase Functions

### Entity Management
- Reuse existing entity creation patterns from mp-add.js
- Maintain subcollection relationships (/persons/{id}/actor, etc.)
- Preserve existing UUID generation for new entity IDs

### Data Consistency
- Atomic operations for review + performance creation
- Rollback on partial failures to maintain data integrity
- Preserve original files and extracted text for audit trail