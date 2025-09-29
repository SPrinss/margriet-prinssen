# Tasks: File Upload Wizard

**Input**: Design documents from `/specs/001-please-look-at/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- Components follow existing pattern in `src/`
- Tests in `tests/unit/`, `tests/integration/`, `tests/contract/`

## Phase 3.1: Setup
- [X] T001 Create service layer directory structure at src/services/
- [X] T002 Install mammoth.js package via npm
- [X] T003 [P] Configure test environment for Web Component testing
- [X] T004 [P] Create test fixtures directory at tests/fixtures/ with sample DOCX files

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [X] T005 [P] Contract test for text extraction POST /extract in tests/contract/text-extraction.test.js
- [X] T006 [P] Contract test for entity matching POST /match in tests/contract/entity-matching.test.js
- [X] T007 [P] Contract test for Firebase reviews POST /reviews in tests/contract/firebase-reviews.test.js
- [X] T008 [P] Contract test for Firebase interviews POST /interviews in tests/contract/firebase-interviews.test.js
- [X] T009 [P] Contract test for Firebase entities GET /entities/{type} in tests/contract/firebase-entities-get.test.js
- [X] T010 [P] Contract test for Firebase entities POST /entities/{type} in tests/contract/firebase-entities-post.test.js
- [X] T011 [P] Contract test for AI parsing POST /parse-segment in tests/contract/ai-parsing.test.js
- [X] T012 [P] Integration test for multi-file upload scenario in tests/integration/multi-file-upload.test.js
- [X] T013 [P] Integration test for form pre-population in tests/integration/form-population.test.js
- [X] T014 [P] Integration test for duplicate entity detection in tests/integration/duplicate-detection.test.js
- [X] T015 [P] Integration test for error handling and recovery in tests/integration/error-recovery.test.js
- [X] T016 [P] Integration test for complete workflow with Firebase save in tests/integration/complete-workflow.test.js

## Phase 3.3: Core Implementation (ONLY after tests are failing)
### Service Layer
- [X] T017 [P] Implement text-extractor.js service with mammoth.js integration in src/services/text-extractor.js
- [X] T018 [P] Implement entity-matcher.js with Levenshtein distance algorithm in src/services/entity-matcher.js
- [X] T019 [P] Implement data-parser.js with hybrid parsing logic in src/services/data-parser.js
- [X] T020 [P] Implement firebase-api.js with REST API operations in src/services/firebase-api.js

### Data Models
- [X] T021 [P] Create WizardFile model class in src/models/wizard-file.js
- [X] T022 [P] Create ProcessingSession model class in src/models/processing-session.js
- [X] T023 [P] Create EntityCache model class in src/models/entity-cache.js
- [X] T024 [P] Create ParsingStage model class in src/models/parsing-stage.js
- [X] T025 [P] Create EntityMatch model class in src/models/entity-match.js

### Web Components - File Upload
- [X] T026 Implement mp-upload-wizard main orchestrator component in src/mp-upload-wizard/mp-upload-wizard.js
- [X] T027 [P] Implement mp-file-drop component for drag-and-drop in src/mp-file-drop/mp-file-drop.js
- [X] T028 [P] Implement mp-file-processor for file processing logic in src/mp-file-processor/mp-file-processor.js
- [X] T029 [P] Implement mp-wizard-progress progress indicator in src/mp-wizard-progress/mp-wizard-progress.js
- [X] T030 [P] Implement mp-wizard-summary success screen in src/mp-wizard-summary/mp-wizard-summary.js

### Web Components - Form Components
- [X] T031 [P] Implement mp-review-form component in src/mp-review-form/mp-review-form.js
- [X] T032 [P] Implement mp-interview-form component in src/mp-interview-form/mp-interview-form.js

### Web Components - Entity Management
- [X] T033 [P] Implement mp-entity-matcher duplicate detection UI in src/mp-entity-matcher/mp-entity-matcher.js
- [X] T034 [P] Implement mp-entity-creator modal component in src/mp-entity-creator/mp-entity-creator.js

### Service Integration with Components
- [ ] T035 Connect text-extractor service to mp-file-processor component
- [ ] T036 Connect data-parser service to mp-file-processor component
- [ ] T037 Connect entity-matcher service to mp-entity-matcher component
- [ ] T038 Connect firebase-api service to mp-upload-wizard for saving

## Phase 3.4: Integration
- [ ] T039 Integrate mp-upload-wizard into existing mp-add.js with mode toggle
- [ ] T040 Connect OAuth authentication to firebase-api service
- [ ] T041 Implement entity cache refresh on entity creation
- [ ] T042 Add Claude Haiku API integration to data-parser service for ambiguous segments
- [ ] T043 Implement file size validation and progress feedback
- [ ] T044 Add error boundaries and retry logic to file processing
- [ ] T045 Connect Shoelace UI components (sl-select, sl-input, sl-dialog) to forms

## Phase 3.5: Polish
- [ ] T046 [P] Unit test text extraction with various DOCX formats in tests/unit/text-extractor.test.js
- [ ] T047 [P] Unit test parsing logic with Dutch content variations in tests/unit/data-parser.test.js
- [ ] T048 [P] Unit test entity matching algorithm accuracy in tests/unit/entity-matcher.test.js
- [ ] T049 [P] Unit test form validation logic in tests/unit/form-validation.test.js
- [ ] T050 Performance test: Ensure text extraction under 10 seconds for 5MB files
- [ ] T051 Performance test: Verify UI remains responsive during processing
- [ ] T052 [P] Add Dutch language labels and translations
- [ ] T053 [P] Implement accessibility features (ARIA labels, keyboard navigation)
- [ ] T054 Verify automatic Algolia indexing triggers correctly
- [ ] T055 Run complete quickstart.md validation scenarios

## Dependencies
- Setup tasks (T001-T004) must complete first
- All tests (T005-T016) MUST complete and fail before implementation (T017-T038)
- Service layer (T017-T020) before service integration (T035-T038)
- Data models (T021-T025) can run parallel with services
- Main wizard component (T026) before integration with mp-add (T039)
- Component implementation before service connections (T035-T038)
- Core implementation before integration phase (T039-T045)
- Everything before polish phase (T046-T055)

## Parallel Execution Examples

### Test Creation (Phase 3.2)
```
# Launch all contract tests together (T005-T011):
Task: "Contract test for text extraction POST /extract in tests/contract/text-extraction.test.js"
Task: "Contract test for entity matching POST /match in tests/contract/entity-matching.test.js"
Task: "Contract test for Firebase reviews POST /reviews in tests/contract/firebase-reviews.test.js"
Task: "Contract test for Firebase interviews POST /interviews in tests/contract/firebase-interviews.test.js"
Task: "Contract test for Firebase entities GET in tests/contract/firebase-entities-get.test.js"
Task: "Contract test for Firebase entities POST in tests/contract/firebase-entities-post.test.js"
Task: "Contract test for AI parsing POST /parse-segment in tests/contract/ai-parsing.test.js"
```

### Service Implementation (Phase 3.3)
```
# Launch all services together (T017-T020):
Task: "Implement text-extractor.js service in src/services/text-extractor.js"
Task: "Implement entity-matcher.js service in src/services/entity-matcher.js"
Task: "Implement data-parser.js service in src/services/data-parser.js"
Task: "Implement firebase-api.js service in src/services/firebase-api.js"
```

### Model Creation (Phase 3.3)
```
# Launch all models together (T021-T025):
Task: "Create WizardFile model in src/models/wizard-file.js"
Task: "Create ProcessingSession model in src/models/processing-session.js"
Task: "Create EntityCache model in src/models/entity-cache.js"
Task: "Create ParsingStage model in src/models/parsing-stage.js"
Task: "Create EntityMatch model in src/models/entity-match.js"
```

### Component Implementation (Phase 3.3)
```
# Launch independent components (T027-T034, excluding T026):
Task: "Implement mp-file-drop component in src/mp-file-drop/mp-file-drop.js"
Task: "Implement mp-file-processor in src/mp-file-processor/mp-file-processor.js"
Task: "Implement mp-wizard-progress in src/mp-wizard-progress/mp-wizard-progress.js"
Task: "Implement mp-wizard-summary in src/mp-wizard-summary/mp-wizard-summary.js"
Task: "Implement mp-review-form in src/mp-review-form/mp-review-form.js"
Task: "Implement mp-interview-form in src/mp-interview-form/mp-interview-form.js"
Task: "Implement mp-entity-matcher in src/mp-entity-matcher/mp-entity-matcher.js"
Task: "Implement mp-entity-creator in src/mp-entity-creator/mp-entity-creator.js"
```

### Unit Tests (Phase 3.5)
```
# Launch all unit tests together (T046-T049):
Task: "Unit test text extraction in tests/unit/text-extractor.test.js"
Task: "Unit test parsing logic in tests/unit/data-parser.test.js"
Task: "Unit test entity matching in tests/unit/entity-matcher.test.js"
Task: "Unit test form validation in tests/unit/form-validation.test.js"
```

## Notes
- [P] tasks operate on different files with no shared dependencies
- TDD approach: All tests must fail before implementation begins
- Service layer abstracts external dependencies (mammoth.js, Firebase, AI)
- Components extend MPElement base class for consistency
- Entity matching uses client-side processing for performance
- Claude Haiku integration uses single static prompt template
- Sequential file processing prevents UI overwhelm
- Maintain compatibility with existing mp-add manual entry mode

## Validation Checklist
*GATE: Checked before execution*

- [x] All contracts (4 files) have corresponding test tasks (T005-T011)
- [x] All entities (6 total) have model tasks (T021-T025 covers main entities)
- [x] All tests (T005-T016) come before implementation (T017+)
- [x] Parallel tasks marked [P] are truly independent (different files)
- [x] Each task specifies exact file path
- [x] No [P] task modifies same file as another [P] task
- [x] Integration scenarios from quickstart.md covered (T012-T016)
- [x] Performance requirements addressed (T050-T051)