# Quickstart: File Upload Wizard

## Test Scenario Validation

This quickstart validates the file upload wizard implementation by executing the primary user scenarios from the specification.

### Prerequisites
1. Authentication token available (OAuth login completed)
2. Test DOCX files prepared (stored in `/tests/fixtures/`):
   - `review-standard.docx` - Standard format: "Orkater / Het Verdriet / Tekst: Geert Lageveen / Regie: Geert Lageveen / Spel: Jasper Stoop, Nick Silva / Amsterdam, Royal Theater / 13-08-2022"
   - `review-complex.docx` - Complex format with multiple groups and variations
   - `review-ambiguous.docx` - Missing labels, requires AI parsing
   - `interview-standard.docx` - Standard interview format
   - `interview-multilingual.docx` - Mixed language content
   - `corrupted.docx` - Intentionally corrupted for error testing
   - `empty.docx` - Empty file for edge case testing
   - `large-5mb.docx` - Performance testing file
3. Existing entities in database for duplicate detection testing

### Scenario 1: Multi-File Review Upload
**Objective**: Validate drag-and-drop upload with sequential processing

**Steps**:
1. Navigate to mp-add component
2. Toggle to "File Upload Wizard" mode
3. Select "Reviews" content type
4. Drag and drop 2 DOCX review files
5. Verify text extraction begins automatically
6. Observe progress indicator shows "Processing file 1 of 2"

**Expected Results**:
- Files appear in upload queue with processing status
- Text extraction completes within 10 seconds per file
- Progress indicator updates correctly
- No UI blocking during background processing

**Validation Code**:
```javascript
// Test file upload handling
const wizard = document.querySelector('mp-upload-wizard');
const testFiles = [
  new File(['test content'], 'review1.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
  new File(['test content'], 'review2.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
];

wizard.contentType = 'reviews';
wizard.handleFilesDropped(testFiles);

// Verify processing state
setTimeout(() => {
  assert(wizard.files.length === 2, 'Files array populated');
  assert(wizard.wizardStep === 'process', 'Moved to process step');
  assert(wizard.processedFiles.every(f => f.extractedText), 'Text extracted from all files');
}, 5000);
```

### Scenario 2: Pre-populated Form Verification
**Objective**: Validate parsed data appears in editable form

**Steps**:
1. Continue from Scenario 1 after text extraction
2. Review first file's pre-populated form
3. Verify theater details are correctly parsed
4. Edit a field (e.g., performance date)
5. Proceed to save

**Expected Results**:
- Form fields populated with parsed data
- All fields remain editable
- User modifications preserved
- Save operation succeeds

**Validation Code**:
```javascript
// Test form pre-population
const reviewForm = document.querySelector('mp-review-form');
const testData = {
  title: 'Test Review',
  name: 'Hamlet',
  actors: ['John Doe', 'Jane Smith'],
  theater: 'Royal Theater',
  city: 'Amsterdam'
};

reviewForm.parsedData = testData;
await reviewForm.updateComplete;

// Verify form fields
assert(reviewForm.shadowRoot.querySelector('[name="title"]').value === 'Test Review');
assert(reviewForm.shadowRoot.querySelector('[name="theater"]').value === 'Royal Theater');

// Test user edit
const titleInput = reviewForm.shadowRoot.querySelector('[name="title"]');
titleInput.value = 'Modified Review Title';
titleInput.dispatchEvent(new Event('input'));

assert(reviewForm.userEdits.title === 'Modified Review Title');
```

### Scenario 3: Duplicate Entity Detection
**Objective**: Validate similarity matching and user resolution

**Steps**:
1. Process file containing "Michael Fox" as actor name
2. Verify system detects existing "Michael J Fox" (85+ % similarity)
3. Review duplicate warning dialog
4. Choose to use existing entity
5. Verify selection applied to form

**Expected Results**:
- High similarity match detected (>85%)
- User presented with clear duplicate warning
- Options to use existing or create new entity
- User choice applied consistently

**Validation Code**:
```javascript
// Test entity matching
const entityMatcher = new EntityMatcher();
entityMatcher.entities = {
  persons: [
    { id: '123', name: 'Michael J Fox' },
    { id: '456', name: 'Robert De Niro' }
  ]
};

const matches = entityMatcher.findDuplicates({ actors: ['Michael Fox'] });
const foxMatch = matches.actors[0].matches[0];

assert(foxMatch.similarity >= 85, 'High similarity detected');
assert(foxMatch.confidence === 'high', 'Confidence level correct');
assert(foxMatch.entity.name === 'Michael J Fox', 'Correct entity matched');

// Test user resolution
const entityDialog = document.querySelector('mp-entity-matcher');
entityDialog.showDuplicateDialog('Michael Fox', [foxMatch]);

// Simulate user choosing existing entity
entityDialog.selectExistingEntity(foxMatch.entity);
assert(entityDialog.resolvedEntity.id === '123');
```

### Scenario 4: Error Handling and Recovery
**Objective**: Validate graceful error handling

**Steps**:
1. Upload corrupted DOCX file
2. Verify error message displayed
3. Choose to skip file and continue
4. Upload additional valid file
5. Complete processing successfully

**Expected Results**:
- Clear error message for corrupted file
- Option to skip or retry file
- Processing continues with remaining files
- Final summary shows error count

**Validation Code**:
```javascript
// Test error handling
const wizard = document.querySelector('mp-upload-wizard');
const corruptedFile = new File(['invalid content'], 'corrupted.docx',
  { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

wizard.handleFilesDropped([corruptedFile]);

// Wait for processing error
setTimeout(() => {
  const errorFile = wizard.processedFiles[0];
  assert(errorFile.status === 'error', 'Error status set');
  assert(errorFile.errorMessage.includes('extraction'), 'Meaningful error message');

  // Test skip functionality
  wizard.handleSkipFile({ detail: { fileIndex: 0 } });
  assert(errorFile.status === 'skipped', 'File marked as skipped');
}, 3000);
```

### Scenario 5: Complete Workflow Integration
**Objective**: Validate end-to-end process with Firebase save

**Steps**:
1. Complete file processing from previous scenarios
2. Verify data saves to Firebase
3. Check automatic Algolia indexing triggered
4. Review success summary screen
5. Verify manual entry mode still accessible

**Expected Results**:
- All valid files saved to Firebase
- Search index updated automatically
- Summary shows correct statistics
- Toggle back to manual mode works

**Validation Code**:
```javascript
// Test complete workflow
const wizard = document.querySelector('mp-upload-wizard');
const firebaseAPI = wizard.firebaseAPI;

// Mock Firebase API to track calls
let saveCalls = [];
firebaseAPI.saveDocument = async (type, data) => {
  saveCalls.push({ type, data });
  return { id: 'mock-id-' + saveCalls.length };
};

// Complete processing
await wizard.handleFileCompleted({
  detail: {
    fileIndex: 0,
    formData: { title: 'Test Review', name: 'Test Play' }
  }
});

// Verify save operations
assert(saveCalls.length > 0, 'Firebase save called');
assert(saveCalls[0].type === 'reviews', 'Correct collection targeted');
assert(wizard.wizardStep === 'summary', 'Moved to summary step');
assert(wizard.completedCount === 1, 'Completion count updated');
```

## Parsing Validation Tests

### Test File Specifications

**review-standard.docx** content:
```
Orkater en Schouwburg De Lawei / Het Verdriet van de Zuiderzee / Tekst: Geert Lageveen / Regie: Geert Lageveen, Belle van Heerikhuizen / Spel: Jasper Stoop, Nick Livramento Silva, Keja Klaasje Kwestro / Oudemirdumerklif, Oudemirdum / 13-08-2022

Even lichtvoetig als indringend locatietheater bij het IJsselmeer

Het is een adembenemend beeld. Eindeloze lappen bouwgaas roepen een verloren zee op...
```

**Expected parsing results**:
```javascript
{
  theater: "Schouwburg De Lawei",
  groups: ["Orkater"],
  title: "Het Verdriet van de Zuiderzee",
  writers: ["Geert Lageveen"],
  directors: ["Geert Lageveen", "Belle van Heerikhuizen"],
  actors: ["Jasper Stoop", "Nick Livramento Silva", "Keja Klaasje Kwestro"],
  city: "Oudemirdum",
  location: "Oudemirdumerklif",
  performanceDate: "2022-08-13",
  reviewTitle: "Even lichtvoetig als indringend locatietheater bij het IJsselmeer"
}
```

**review-ambiguous.docx** content:
```
Club Kenau / Moby Dick, de kerstmusical / Leopold Witte / Erik van Muiswinkel, Club Kenau, Milan Sekeris / Stadsschouwburg / December 2023

Nieuwe bewerking van Moby Dick

Het gonst en knispert van de verwachtingen...
```

**Parsing stages expected**:
1. **Regex stage**: Identifies structure but unclear roles
2. **AI stage**: Should identify "Leopold Witte" as director, classify actors
3. **User stage**: May need clarification on "Club Kenau" (group vs actor list)

### Unit Test Coverage

**Text Extraction Tests**:
```javascript
describe('TextExtractor', () => {
  it('should extract text from standard review', async () => {
    const file = await loadFixture('review-standard.docx');
    const result = await textExtractor.extractFromDOCX(file);

    expect(result.text).toContain('Orkater en Schouwburg De Lawei');
    expect(result.text).toContain('13-08-2022');
    expect(result.html).toContain('<p>');
  });

  it('should handle corrupted files gracefully', async () => {
    const file = await loadFixture('corrupted.docx');
    const result = await textExtractor.extractFromDOCX(file);

    expect(result.error).toBeDefined();
    expect(result.error).toContain('extraction failed');
  });
});
```

**Parsing Tests**:
```javascript
describe('DataParser', () => {
  it('should parse standard format with high confidence', () => {
    const input = 'Orkater / Het Verdriet / Tekst: Geert Lageveen / Regie: Geert Lageveen';
    const result = dataParser.parseReviewMetadata(input);

    expect(result.parsedData.writers).toEqual(['Geert Lageveen']);
    expect(result.parsedData.directors).toEqual(['Geert Lageveen']);
    expect(result.confidence).toBeGreaterThan(90);
    expect(result.parsingStages[0].stage).toBe('regex');
  });

  it('should trigger AI parsing for ambiguous segments', async () => {
    const input = 'Club Kenau / Moby Dick / Leopold Witte / Erik van Muiswinkel';
    const result = await dataParser.parseReviewMetadata(input);

    expect(result.parsingStages.some(s => s.stage === 'ai')).toBe(true);
    expect(result.userValidationRequired).toContain('directors');
  });

  it('should handle Dutch name variations', () => {
    const input = 'Spel: Jasper Stoop, Nick Livramento Silva, Keja Klaasje Kwestro';
    const result = dataParser.parseActorString(input);

    expect(result).toEqual([
      'Jasper Stoop',
      'Nick Livramento Silva',
      'Keja Klaasje Kwestro'
    ]);
  });
});
```

**Entity Matching Tests**:
```javascript
describe('EntityMatcher', () => {
  beforeEach(() => {
    entityMatcher.entities = {
      persons: [
        { id: '1', name: 'Michael J Fox' },
        { id: '2', name: 'Geert Lageveen' }
      ]
    };
  });

  it('should detect high similarity matches', () => {
    const matches = entityMatcher.findSimilarEntities(['Michael Fox'], 'person');

    expect(matches[0].candidates[0].similarity).toBeGreaterThan(85);
    expect(matches[0].candidates[0].confidence).toBe('high');
  });

  it('should handle Dutch name normalization', () => {
    const matches = entityMatcher.findSimilarEntities(['G. Lageveen'], 'person');

    expect(matches[0].candidates[0].entity.name).toBe('Geert Lageveen');
    expect(matches[0].candidates[0].similarity).toBeGreaterThan(70);
  });
});
```

### Integration Test Suite

**Full Processing Pipeline**:
```javascript
describe('Upload Wizard Integration', () => {
  it('should process standard review end-to-end', async () => {
    const wizard = new MPUploadWizard();
    const testFile = await loadFixture('review-standard.docx');

    // Step 1: File upload
    await wizard.handleFilesDropped([testFile]);
    expect(wizard.files.length).toBe(1);
    expect(wizard.wizardStep).toBe('process');

    // Step 2: Text extraction
    await waitFor(() => wizard.processedFiles[0].status === 'parsing');
    expect(wizard.processedFiles[0].extractedText).toContain('Orkater');

    // Step 3: Parsing completion
    await waitFor(() => wizard.processedFiles[0].status === 'completed');
    expect(wizard.processedFiles[0].parsedData.title).toBe('Het Verdriet van de Zuiderzee');

    // Step 4: Save validation
    expect(mockFirebaseAPI.saveDocument).toHaveBeenCalledWith('reviews',
      expect.objectContaining({
        title: 'Het Verdriet van de Zuiderzee',
        writers: ['Geert Lageveen']
      })
    );
  });

  it('should handle AI parsing with user validation', async () => {
    const wizard = new MPUploadWizard();
    const testFile = await loadFixture('review-ambiguous.docx');

    await wizard.handleFilesDropped([testFile]);
    await waitFor(() => wizard.processedFiles[0].status === 'validating');

    // Verify AI was called
    expect(wizard.processedFiles[0].aiParsingUsed).toBe(true);
    expect(wizard.processedFiles[0].userValidationRequired.length).toBeGreaterThan(0);

    // Simulate user validation
    const validationDialog = document.querySelector('mp-entity-matcher');
    expect(validationDialog.isVisible).toBe(true);

    // User selects option
    validationDialog.resolveField('directors', 'Leopold Witte');
    await wizard.updateComplete;

    expect(wizard.processedFiles[0].userEdits.directors).toEqual(['Leopold Witte']);
  });
});
```

## Performance Validation

### File Processing Performance
- **Target**: Text extraction under 10 seconds per file
- **Test**: Process 5MB DOCX file, measure extraction time
- **Validation**: `extractionTime < 10000` milliseconds

### Search Integration Performance
- **Target**: Search results under 200ms
- **Test**: Save document and query Algolia index
- **Validation**: Query response time < 200ms

### UI Responsiveness
- **Target**: No UI blocking during processing
- **Test**: Interact with UI elements during background extraction
- **Validation**: All interactions remain responsive

## Integration Points Validation

### Existing Component Compatibility
- **Test**: Toggle between upload wizard and manual entry modes
- **Expected**: No conflicts, shared authentication state

### Firebase Functions Integration
- **Test**: Document creation triggers Algolia indexing
- **Expected**: Functions execute automatically, no manual intervention required

### Entity Management Integration
- **Test**: Create new entities via wizard, verify availability in manual mode
- **Expected**: New entities appear in all selection lists

## Success Criteria

All scenarios must pass with:
- ✅ No JavaScript console errors
- ✅ All assertions passing
- ✅ Performance targets met
- ✅ User workflow completion under 2 minutes per file
- ✅ Data integrity maintained (no lost or corrupted content)
- ✅ Automatic search indexing functioning
- ✅ Graceful error handling for all edge cases

## Rollback Criteria

If any critical issue found:
- Data loss or corruption detected
- Performance below constitutional requirements
- Breaking changes to existing functionality
- Security vulnerabilities introduced

Execute rollback plan:
1. Disable upload wizard feature flag
2. Restore previous mp-add functionality
3. Investigate and fix issues
4. Re-test complete workflow
5. Gradual re-enablement with monitoring