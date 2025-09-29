# Code Analysis: Review and Interview File Processing

## Overview
This analysis examines the existing code for processing theater reviews and interviews from local files and storing them in Firestore. The code consists of two main scripts: `index.js` for reviews and `index_interviews.js` for interviews.

## Data Schemas

### Review Schema
**Main Collections:**
- `performances` - Theater performance records
- `reviews` - Review content linked to performances

**Performance Document Structure:**
```javascript
{
  id: string,                    // Auto-generated document ID
  name: string,                  // Play name
  timePerformed: number,         // Timestamp of performance
  actors: Person[],              // Array of actor objects
  writers: Person[],             // Array of writer objects
  directors: Person[],           // Array of director objects
  groups: Group[],               // Array of theater group objects
  title: string,                 // Performance title
  theater: Theater,              // Theater object
  city: City,                    // City object
  year: string,                  // Year of performance
  reviewId: string               // Reference to linked review
}
```

**Review Document Structure:**
```javascript
{
  performanceId: string,         // Reference to performance document
  review: string,                // Review text content (HTML formatted)
  reviewDate: string,            // Date review was written
  actors: Person[],              // Array of actor objects
  writers: Person[],             // Array of writer objects
  name: string,                  // Play name
  directors: Person[],           // Array of director objects
  groups: Group[],               // Array of theater group objects
  theater: Theater,              // Theater object
  title: string,                 // Review title
  city: City,                    // City object
  year: string,                  // Year of performance
  timePerformed: number,         // Timestamp of performance
  timePublished: number,         // Optional: Publication timestamp
  images: string[],              // Array of Firebase Storage image URLs
  objectID: string               // Search index identifier (Algolia)
}
```

### Interview Schema
**Main Collection:**
- `interviews` - Interview records

**Interview Document Structure:**
```javascript
{
  interview: string,             // Interview content (HTML formatted)
  interviewDate: string,         // Date of interview (MM-YY format)
  persons: Person[],             // Array of interviewed person objects
  title: string,                 // Interview title
  year: string,                  // Year of interview
  timePublished: number,         // Timestamp of publication
  images: string[],              // Array of Firebase Storage image URLs
  objectID: string               // Search index identifier (Algolia)
}
```

### Supporting Entity Schemas

**Person Object:**
```javascript
{
  id: string,                    // Document ID in persons collection
  name: string                   // Person's full name
}
```

**Theater Object:**
```javascript
{
  id: string,                    // Document ID in theaters collection
  name: string                   // Theater name
}
```

**City Object:**
```javascript
{
  id: string,                    // Document ID in cities collection
  name: string                   // City name
}
```

**Group Object:**
```javascript
{
  id: string,                    // Document ID in groups collection
  name: string                   // Group/company name
}
```

## Firestore Collections and Endpoints

### Primary Collections
1. **`performances`** - Theater performance records
2. **`reviews`** - Review content and metadata
3. **`interviews`** - Interview content and metadata
4. **`persons`** - People (actors, directors, writers, interviewees)
5. **`theaters`** - Theater venues
6. **`cities`** - Cities where performances took place
7. **`groups`** - Theater companies/groups
8. **`publishers`** - Contains subcollection for publisher reviews

### Subcollections (Relational Data)
- `cities/{cityId}/performances` - Performances in specific city
- `cities/{cityId}/theaters` - Theaters in specific city
- `theaters/{theaterId}/performances` - Performances at specific theater
- `groups/{groupId}/performances` - Performances by specific group
- `persons/{personId}/actor` - Person's acting roles
- `persons/{personId}/director` - Person's directing roles
- `persons/{personId}/writer` - Person's writing roles
- `publishers/{publisherId}/reviews` - Reviews by publisher

## File Parsing Logic

### Review File Parsing (index.js)

**File Structure Expected:**
```
Meta line with performance details
Review content (multiple lines)
```

**Parsing Steps:**
1. **File Discovery:** Recursively walks `HD/` directory for all files
2. **Text Extraction:** Uses `textract` library to extract text from files
3. **Validation:** Filters out interview files using `isValidReview()`
4. **Meta Parsing:** Splits first line as metadata, rest as review content
5. **Data Extraction:** Parses metadata using pattern matching

**Key Parsing Functions:**
- `_splitMetaAndReview()` - Separates metadata from review content
- `_analyzeReview()` - Extracts structured data from metadata string
- `_parseDateFromTextAndPath()` - Derives performance date from text and folder structure
- `getMetaDataByString()` - Pattern-based metadata extraction

**Metadata Pattern Recognition:**
```
Theater/ Recensie Margriet Prinssen/Group Name/Play Name/
Tekst: Writer Names/Regie: Director Names/Spel: Actor Names/
Gezien: City, Theater, Date/Info: website
```

### Interview File Parsing (index_interviews.js)

**File Structure Expected:**
```
Meta line
Interview title
Interview content (multiple paragraphs)
```

**Parsing Steps:**
1. **File Discovery:** Same recursive walk through `HD/` directory
2. **Text Extraction:** Uses `textract` for text extraction
3. **Filename Parsing:** Extracts persons and date from filename pattern
4. **Content Structuring:** Converts plain text to HTML with semantic markup

**Key Parsing Functions:**
- `_splitMetaAndReview()` - Separates meta, title, and interview content
- **Filename Pattern:** `Interview PersonName MonthName Year.ext`
- **HTML Conversion:** Short paragraphs become `<h4>` headers, longer ones become `<p>` tags

**Date Extraction:**
- Extracts month and year from filename
- Converts Dutch month names to numbers
- Creates standardized date format (MM-01-YYYY)

## Data Relationships

### Review-Performance Linking
- One performance can have one review (1:1)
- Both documents cross-reference each other via IDs
- Performance data is duplicated in review document for query efficiency

### Person Relationships
- Persons collection serves as master entity list
- Subcollections track person's roles across performances:
  - `/persons/{id}/actor` - Acting performances
  - `/persons/{id}/director` - Directing work
  - `/persons/{id}/writer` - Writing credits

### Geographic Relationships
- Cities contain theaters as subcollection
- Both cities and theaters track their performances
- Enables location-based queries

## Integration Considerations for Upload Wizard

### Form Fields Needed

**Review Upload Form:**
```javascript
{
  playName: string,              // Editable
  title: string,                 // Editable
  actors: string[],              // Multi-input, editable
  directors: string[],           // Multi-input, editable
  writers: string[],             // Multi-input, editable
  groups: string[],              // Multi-input, editable
  city: string,                  // Editable
  theater: string,               // Editable
  performanceDate: date,         // Date picker
  reviewContent: text,           // Large text area with HTML preview
  images: File[],                // Multi-file upload for associated images
  publicationDate: date          // Optional: When review was published
}
```

**Interview Upload Form:**
```javascript
{
  title: string,                 // Editable
  persons: string[],             // Multi-input, editable
  interviewDate: date,           // Date picker (month/year)
  content: text,                 // Large text area with HTML preview
  images: File[]                 // Multi-file upload for associated images
}
```

### Processing Pipeline
1. **File Upload** → **Text Extraction** → **Auto-parsing** → **Form Display** → **User Editing** → **Validation** → **Save**

### Technical Requirements
- Text extraction library (textract equivalent for web)
- Date parsing utilities
- HTML content editor for interviews
- Multi-input components for person/group arrays
- Entity deduplication logic for persons/theaters/cities/groups
- Image upload and Firebase Storage integration
- Search indexing service (Algolia) integration

## Additional System Components

### Image Management
- **Storage:** Firebase Storage for hosting images
- **URLs:** Direct HTTPS URLs stored in document arrays
- **Upload Process:** Images must be uploaded to Firebase Storage and URLs stored in document
- **Multiple Images:** Both reviews and interviews support multiple associated images

### Search Integration
- **Search Service:** Algolia search indexing (based on objectID field)
- **Indexing:** Each document gets an objectID for search functionality
- **Implementation:** Upload wizard needs to trigger search index updates after document creation

### Content Formatting
- **Reviews:** Content stored as HTML with structured formatting (`<h4>`, `<p>` tags)
- **Interviews:** Rich HTML formatting with intro paragraphs, headers, blockquotes
- **Auto-formatting:** Current system auto-converts plain text to HTML during parsing

## Current Infrastructure

### Existing Manual Upload Component (MPAdd)
The current web app includes a manual data entry component with the following capabilities:

**Component Features:**
- **Tab-based Interface:** Separate forms for Reviews, Interviews, and entity management
- **Entity Management:** CRUD operations for Persons, Groups, Cities, Theaters
- **File Upload:** Direct Firebase Storage integration
- **Firestore Integration:** Direct REST API calls to Firestore
- **Authentication:** OAuth token-based access control

**Current Form Fields (Reviews):**
```javascript
{
  selectedActors: Person[],        // Multi-select from persons collection
  selectedDirectors: Person[],     // Multi-select from persons collection
  selectedWriters: Person[],       // Multi-select from persons collection
  selectedGroups: Group[],         // Multi-select from groups collection
  city: City,                      // Single select from cities collection
  theater: Theater,                // Single select from theaters collection
  reviewDate: date,                // Date picker (performance date)
  title: string,                   // Text input
  name: string,                    // Text input (play name)
  review: text,                    // Large textarea with HTML formatting
  imageFile: File                  // File upload to Firebase Storage
}
```

**Current Form Fields (Interviews):**
```javascript
{
  interviewees: Person[],          // Multi-select from persons collection
  interviewDate: date,             // Date picker
  titleInterview: string,          // Text input
  interview: text,                 // Large textarea with HTML formatting
  imageFile: File                  // File upload to Firebase Storage
}
```

### Firebase Functions (Algolia Sync)
Automatic Cloud Functions handle search indexing:

**Review Index Functions:**
- `addToReviewIndex` - Triggers on document creation
- `updateReviewIndex` - Triggers on document updates
- `deleteFromReviewIndex` - Triggers on document deletion

**Interview Index Functions:**
- `addToInterviewIndex` - Triggers on document creation
- `updateInterviewIndex` - Triggers on document updates
- `deleteFromInterviewIndex` - Triggers on document deletion

**Search Data Processing:**
```javascript
// Reviews - Searchable fields extracted
{
  groups: string[],              // Group names only
  name: string,                  // Play name
  theater: string,               // Theater name only
  writers: string[],             // Writer names only
  directors: string[],           // Director names only
  title: string,                 // Review title
  reviewDate: string,            // Review date
  actors: string[],              // Actor names only
  city: string,                  // City name only
  year: string,                  // Performance year
  persons: string[],             // Combined actors, directors, writers
  objectID: string               // Firestore document ID
}

// Interviews - Searchable fields extracted
{
  title: string,                 // Interview title
  persons: string[],             // Person names only
  interviewDate: string,         // Interview date
  year: string,                  // Interview year
  images: string[],              // Image URLs
  objectID: string               // Firestore document ID
}
```

### Data Storage Architecture

**Firestore Document Structure:**
- **Direct API Access:** Uses Firestore REST API with OAuth tokens
- **Nested Objects:** Complex objects stored as mapValue fields
- **Arrays:** Multiple entities stored as arrayValue with nested mapValue objects
- **Auto-Generated IDs:** Documents use Firestore auto-generated IDs
- **Manual Entity IDs:** Supporting entities (persons, cities, etc.) use UUID-based IDs

**Firebase Storage Integration:**
- **Path Structure:** `/{collection}/{randomized-filename}`
- **Access Tokens:** Files uploaded with OAuth bearer tokens
- **URL Generation:** Download URLs include media access tokens
- **File Processing:** Files read as ArrayBuffer before upload

### Current Limitations & Considerations

**Missing from Current System:**
- **File Parsing:** No automatic text extraction from uploaded files
- **Batch Processing:** No support for multiple file uploads
- **Data Validation:** Minimal validation beyond required fields
- **Performance Documents:** Reviews don't create linked performance records
- **Cross-References:** No bidirectional linking between documents
- **Subcollections:** No population of person/theater/city subcollections

**Upload Wizard Requirements:**
1. **File Text Extraction:** Integrate textract-equivalent library
2. **Auto-Parsing Logic:** Port parsing functions from original scripts
3. **Batch Upload Interface:** Handle multiple files sequentially
4. **Enhanced Validation:** Implement data validation and preview
5. **Performance Linking:** Create performance documents for reviews
6. **Subcollection Management:** Populate relational subcollections
7. **Progress Tracking:** Show upload/processing progress to user