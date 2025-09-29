
# Implementation Plan: File Upload Wizard

**Branch**: `001-please-look-at` | **Date**: 2025-09-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/workspace/specs/001-please-look-at/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Transform the existing manual data entry system into a file upload wizard that processes multiple DOCX files, extracts review/interview content, pre-fills forms with parsed data, handles entity duplicate detection, and saves to Firebase with automatic Algolia indexing. Measurable outcome: User can drag & drop 4 DOCX files, process them sequentially with human verification, resolve entity duplicates through UI prompts, and successfully save all content.

## Technical Context
**Language/Version**: JavaScript ES6+ with Lit-HTML for component rendering
**Primary Dependencies**: mammoth.js (DOCX text extraction), Shoelace UI components, existing MPElement base class
**Storage**: Firebase Firestore for data, Firebase Storage for file uploads, existing Algolia search integration
**Testing**: Web Component testing framework, unit tests for parsing logic, integration tests for Firebase operations
**Target Platform**: Modern web browsers supporting ES6+ modules and Web Components
**Project Type**: web - frontend web application extending existing system
**Performance Goals**: File processing under 10 seconds per file, search results under 200ms, page loads under 2 seconds
**Constraints**: Must integrate with existing mp-add manual entry system, preserve Firebase Functions for Algolia indexing
**Scale/Scope**: Handle batch uploads of 1-10 DOCX files per session, support existing entity management workflows

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. Data Integrity First**: Does this feature preserve data accuracy? Are manual validation gates included?
**II. Test-Driven Development**: Are tests written before implementation? TDD cycle enforced?
**III. Web-First Architecture**: Does feature support both UI and API access? RESTful JSON APIs?
**IV. Search Integration**: Are all content changes automatically indexed? Search operations triggered?
**V. Firebase Ecosystem**: Using Firebase services consistently? Minimizing external dependencies?

*Mark any violations below in Complexity Tracking section with justification.*

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->
```
src/
├── services/
│   ├── firebase-api.js              # Clean API abstraction
│   ├── text-extractor.js            # DOCX processing with mammoth.js
│   ├── entity-matcher.js            # Similarity detection algorithms
│   └── data-parser.js               # Content parsing logic
├── mp-upload-wizard/                 # Main wizard orchestrator
├── mp-file-drop/                     # Standalone file upload component
├── mp-file-processor/                # Standalone file processing component
├── mp-review-form/                   # Standalone review form component
├── mp-interview-form/                # Standalone interview form component
├── mp-entity-matcher/                # Standalone duplicate detection component
├── mp-entity-creator/                # Standalone entity creation modal
├── mp-wizard-progress/               # Progress indicator component
└── mp-wizard-summary/                # Success screen component

tests/
├── unit/
│   ├── text-extractor.test.js
│   ├── entity-matcher.test.js
│   └── data-parser.test.js
├── integration/
│   ├── upload-wizard.test.js
│   └── firebase-integration.test.js
└── contract/
    ├── firebase-api.test.js
    └── component-contracts.test.js
```

**Structure Decision**: Web application structure extending existing src/ directory with new service layer and modular Web Components. Components follow existing MPElement patterns with separate concerns for file processing, UI rendering, and data management.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from contracts: text-extraction.json, entity-matching.json, firebase-integration.json
- Generate tasks from data model entities: WizardFile, EntityMatch, ReviewData, InterviewData, ProcessingSession
- Generate tasks from quickstart scenarios: multi-file upload, form validation, duplicate detection, error handling
- Service layer tasks: firebase-api.js, text-extractor.js, entity-matcher.js, data-parser.js
- Component tasks: mp-upload-wizard, mp-file-drop, mp-file-processor, mp-review-form, mp-interview-form, mp-entity-matcher, mp-entity-creator, mp-wizard-progress, mp-wizard-summary
- Integration tasks: mp-add.js modifications, existing Firebase Functions compatibility

**Ordering Strategy**:
- TDD order: Contract tests → Service tests → Component tests → Implementation
- Dependency order: Services → Core components → UI components → Integration
- Mark [P] for parallel execution: Different component files, independent service modules
- Sequential: Service implementations, component integration, mp-add modifications

**Estimated Output**: 35-40 numbered, ordered tasks covering:
- 8 contract test tasks [P]
- 4 service implementation tasks [P]
- 9 component implementation tasks [P]
- 12 integration test tasks
- 6 UI integration tasks
- 4 error handling tasks
- 3 performance optimization tasks

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v1.0.0 - See `/memory/constitution.md`*
