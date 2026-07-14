# Phase 3 — UI / UX Design

**Status:** Not Started
**Deliverables:** Wireframes, High Fidelity Mockups, UI Specification, UX Guidelines, Design Tokens

## Modules

### Module 1: Design System
- [x] Task 1.1: Establish the design tokens package
  - [x] Subtask 1.1.1: Define color, spacing, radius, typography, shadow tokens
    - [x] Activity: Create `packages/design-tokens/src/index.ts`
    - [x] Activity: Create the Ant Design theme adapter (`antd-theme.ts`)
  - [x] Subtask 1.1.2: Enforce token usage via lint
    - [x] Activity: Add `no-raw-design-values` shared ESLint rule
- [ ] Task 1.2: Expand the design system beyond the scaffold
  - [ ] Subtask 1.2.1: Define component-level design specs (buttons, forms, tables)
    - [ ] Activity: Document variants/states for each core AntD component override

### Module 2: Navigation
- [ ] Task 2.1: Design the primary navigation structure
  - [ ] Subtask 2.1.1: Define top-level nav (Dashboard, Projects, Governance, Audit, Admin)
    - [ ] Activity: Wireframe the primary nav and breadcrumb pattern

### Module 3: Dashboard Design
- [ ] Task 3.1: Design the governance dashboard
  - [ ] Subtask 3.1.1: Wireframe key dashboard widgets (project health, audit status, risk register)
    - [ ] Activity: Produce low-fi wireframes
    - [ ] Activity: Produce high-fidelity mockups

### Module 4: Project Workspace
- [ ] Task 4.1: Design the per-project workspace
  - [ ] Subtask 4.1.1: Wireframe project overview, documents, checklist, audit trail tabs
    - [ ] Activity: Produce workspace wireframes

### Module 5: Workflow Designer
- [ ] Task 5.1: Design the visual workflow/governance rule designer
  - [ ] Subtask 5.1.1: Wireframe the drag-and-drop workflow builder
    - [ ] Activity: Produce workflow designer mockups

### Module 6: Customer Portal
- [ ] Task 6.1: Design the external customer sign-off portal
  - [ ] Subtask 6.1.1: Wireframe customer-facing sign-off and status views
    - [ ] Activity: Produce customer portal mockups

### Module 7: Mobile Responsive Design
- [ ] Task 7.1: Define responsive breakpoints and mobile layouts
  - [ ] Subtask 7.1.1: Validate breakpoint tokens against real content
    - [ ] Activity: Test dashboard/workspace layouts at `sm`/`md`/`lg` breakpoints

### Module 8: Accessibility
- [ ] Task 8.1: Define accessibility standards (WCAG 2.1 AA)
  - [ ] Subtask 8.1.1: Document color contrast, keyboard nav, and ARIA requirements
    - [ ] Activity: Audit design tokens for WCAG AA contrast compliance
    - [ ] Activity: Add accessibility checks to the `ui-audit` skill

## Deliverables Checklist
- [ ] Wireframes
- [ ] High Fidelity Mockups
- [ ] UI Specification
- [ ] UX Guidelines
- [x] Design Tokens (initial version shipped in scaffold)
