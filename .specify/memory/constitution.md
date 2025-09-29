<!--
Sync Impact Report:
Version change: N/A → 1.0.0 (Initial constitution)
Modified principles: N/A (Initial version)
Added sections: All sections (initial creation)
Removed sections: N/A
Templates requiring updates:
✅ plan-template.md - Updated Constitution Check section and version reference
✅ spec-template.md - Requirements alignment confirmed
✅ tasks-template.md - Task categorization supports principles
✅ No command templates exist - none required for current setup
Follow-up TODOs: None
-->

# Margriet Prinssen Constitution

## Core Principles

### I. Data Integrity First
Every data transformation must preserve accuracy and completeness of theater review and interview content. Manual validation gates are mandatory for content processing. Original source files must be preserved alongside processed versions. Data loss or corruption is non-negotiable failure.

**Rationale**: Theater reviews and interviews are historical cultural records that cannot be recreated if lost or corrupted.

### II. Test-Driven Development (NON-NEGOTIABLE)
All file processing, data parsing, and storage operations must be covered by automated tests written before implementation. Red-Green-Refactor cycle strictly enforced. No code ships without passing tests that validate expected behavior and edge cases.

**Rationale**: File processing involves complex parsing logic with many edge cases that can only be caught through comprehensive testing.

### III. Web-First Architecture
Every feature must support both manual input via web interface and automated batch processing. APIs must be RESTful and return structured JSON. All operations must be accessible via both UI and programmatic interfaces.

**Rationale**: The system serves both content creators (manual entry) and data processing workflows (batch operations).

### IV. Search Integration
All content must be automatically indexed for search functionality. Document creation, updates, and deletions must trigger corresponding search index operations. Search functionality is a primary user interface requirement.

**Rationale**: Theater reviews and interviews are research materials that require powerful search capabilities for discovery and analysis.

### V. Firebase Ecosystem
Leverage Firebase services (Firestore, Storage, Functions) for consistency and reliability. Authentication, data storage, file storage, and serverless functions must use Firebase. Minimize external dependencies that duplicate Firebase capabilities.

**Rationale**: The existing system is built on Firebase, and consistency within this ecosystem ensures reliability and reduces integration complexity.

## Quality Standards

All code must pass ESLint configuration, Prettier formatting, and maintain compatibility with the existing build pipeline (Rollup, Stylus, ES modules). Performance targets: file processing under 10 seconds per file, search results under 200ms, page loads under 2 seconds. Browser compatibility must support modern ES6+ features.

## Development Workflow

Pull requests require: passing automated tests, linting validation, manual testing of affected functionality, and data integrity verification. No direct commits to master branch. Feature branches must follow naming convention: `add-{feature-description}`. Pre-commit hooks must run formatting and basic validation.

## Governance

This constitution supersedes all other practices and guidelines. Amendments require documentation of rationale, impact assessment, and migration plan for affected components. All development decisions must be validated against these principles. Complexity additions must be explicitly justified with business value rationale.

**Version**: 1.0.0 | **Ratified**: 2025-09-26 | **Last Amended**: 2025-09-26