# Research: File Upload Wizard

## Technology Decisions

### Text Extraction Library
**Decision**: mammoth.js for DOCX text extraction
**Rationale**: Browser-compatible library specifically designed for DOCX files, supports converting to HTML while preserving structure, lightweight and actively maintained
**Alternatives considered**:
- docx.js - Less mature, limited HTML output options
- TextExtractor API - Not universally supported across browsers
- Server-side processing - Violates Web-First Architecture principle

### Component Architecture
**Decision**: Extend existing MPElement base class with Web Components pattern
**Rationale**: Maintains consistency with existing codebase (mp-add.js), provides reactive property system, follows established patterns
**Alternatives considered**:
- React components - Would require major architectural change
- Vanilla Web Components - More boilerplate, lacks property system
- Lit-Element - Close but existing MPElement already provides needed functionality

### Content Parsing Strategy
**Decision**: Hybrid approach with mammoth.js + Claude Haiku + user prompts
**Implementation**:
1. **mammoth.js** extracts text preserving paragraph structure
2. **Split metadata line by "/" delimiters** for initial parsing
3. **Pattern matching** for explicit labels (Tekst:, Regie:, Spel:, etc.)
4. **Claude Haiku API** for ambiguous segments using predefined static prompt template
5. **Frontend user prompts** when AI confidence is low or conflicting
**Rationale**: Handles format variations gracefully while maintaining accuracy through human oversight
**Alternatives considered**:
- Pure regex parsing - Too brittle for format variations
- Full AI parsing - Expensive and potentially less accurate than hybrid approach
- Manual parsing only - Defeats automation purpose

### Entity Similarity Algorithm
**Decision**: Levenshtein distance with normalization for name matching
**Rationale**: Simple, effective for name variations, computationally efficient for client-side processing
**Alternatives considered**:
- Soundex algorithm - Less accurate for visual name variations
- Fuzzy string matching libraries - Overkill for simple name comparison
- Server-side ML matching - Violates performance constraints

### State Management Pattern
**Decision**: Property-based reactive updates with CustomEvent communication
**Rationale**: Follows existing MPElement patterns, enables parent-child component communication, maintains loose coupling
**Alternatives considered**:
- Redux/Flux pattern - Too complex for feature scope
- Event bus - Could create tight coupling issues
- Direct method calls - Violates component encapsulation

### File Processing Strategy
**Decision**: Sequential processing with background text extraction
**Rationale**: Prevents UI blocking, allows user verification per file, maintains data integrity through manual gates
**Alternatives considered**:
- Parallel processing all files - Could overwhelm user interface
- Synchronous processing - Would block UI during extraction
- Server-side batch processing - Violates Web-First Architecture

## Integration Patterns

### Firebase API Integration
**Decision**: Reuse existing REST API patterns from mp-add.js with OAuth token authentication
**Rationale**: Maintains consistency with existing authentication flow, leverages proven Firebase integration patterns
**Best practices**:
- Direct Firestore REST API calls with Bearer token authentication
- Maintain existing document structure for automatic Algolia indexing
- Handle token expiry gracefully with re-authentication prompts

### Shoelace Component Integration
**Decision**: Use existing Shoelace UI components (sl-select, sl-input, sl-dialog) for form elements
**Rationale**: Maintains visual consistency with existing mp-add interface, provides accessibility features
**Best practices**:
- Follow existing form validation patterns
- Use sl-dialog for entity creation modals
- Maintain existing Dutch language labels and text

### Error Handling Strategy
**Decision**: Graceful degradation with fallback to manual entry
**Rationale**: Preserves user workflow even when text extraction fails, maintains data integrity principle
**Best practices**:
- Clear error messages with actionable next steps
- Preserve extracted text for manual review
- Allow skipping problematic files without losing progress

## Performance Considerations

### File Size Limitations
**Decision**: Recommend maximum 5MB DOCX files with user feedback for larger files
**Rationale**: Balance between processing speed (10 second target) and typical document sizes
**Implementation**: Progress indicators during text extraction, size warnings before processing

### Memory Management
**Decision**: Process files sequentially, dispose of File objects after text extraction
**Rationale**: Prevents memory bloat with multiple large files, maintains browser responsiveness
**Implementation**: Clear file references after successful processing, use weak references where possible

### AI Parsing Implementation
**Decision**: Single static prompt template with structured output format
**Prompt Template**:
```
"You are parsing Dutch theater review metadata. Given this text segment: '{segment}' and surrounding context: '{context}', identify the most likely field type and extract structured data. Return JSON with: field type, extracted value, and confidence (0-100). Possible field types: theater, title, writers, directors, actors, groups, city, location, date."
```
**Rationale**: Consistent results, no prompt engineering needed per request, cost-effective
**Implementation**: Single API call per ambiguous segment, cache prompt template as constant

### Caching Strategy
**Decision**: Cache entity lists (persons, theaters, cities, groups) for similarity matching
**Rationale**: Reduces Firebase API calls, improves duplicate detection performance
**Implementation**: Load entities once per session, refresh on entity creation

## Development Workflow Integration

### Testing Strategy
**Decision**: Unit tests for parsing logic, integration tests for component communication, contract tests for Firebase operations
**Rationale**: Follows TDD constitutional principle, ensures reliable file processing
**Implementation**: Jest for unit tests, Web Component testing utilities for integration tests

### Build Pipeline Integration
**Decision**: Integrate with existing Rollup build process, maintain ES module compatibility
**Rationale**: No breaking changes to existing development workflow, maintains code splitting benefits
**Implementation**: Add mammoth.js as external dependency, ensure proper tree shaking

### Code Quality Standards
**Decision**: Follow existing ESLint configuration and Prettier formatting rules
**Rationale**: Maintains code consistency across project, satisfies Quality Standards requirements
**Implementation**: Extend existing linting rules for new service layer and components