# Implementation Plan: To-Do List Dashboard

## Overview

This implementation plan builds a standalone single-page web application using vanilla HTML, CSS, and JavaScript (ES6+). The application follows a localStorage-first architecture where all data is persisted client-side, requiring no backend server. The entire JavaScript codebase resides in a single `script.js` file with clear component organization, while styling is consolidated in a single `style.css` file.

The implementation follows an incremental approach: establish project structure, build data persistence layer, implement core components (header, timer, tasks), add theme support, and finally wire everything together with the app controller.

**Critical Architecture Pattern**: localStorage-first data flow
- On page load: Read entire state from localStorage → Render DOM
- On user action: Update DOM instantly + Update localStorage simultaneously

## Tasks

- [x] 1. Set up project structure and foundational files
  - Create root `index.html` with semantic HTML5 structure including header (greeting + clock), main content area (focus timer + task list), and footer (quick links) sections
  - Create `css/style.css` with CSS custom properties for theming (light and dark mode color variables)
  - Create `js/script.js` file with organized section comments: Data Models, Storage Manager, Theme Manager, Components, App Controller, Initialization
  - Include basic responsive layout, typography foundation, and initial theme toggle button in UI
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 11.5, 14.1, 14.3_

- [x] 2. Implement data models and storage layer
  - [x] 2.1 Create Task, ThemeState, and TimerState classes in script.js
    - Implement Task class with id (UUID), description, completed, and createdAt properties
    - Add UUID generation function for task IDs
    - Implement toJSON and static fromJSON methods for serialization
    - Add validation for task description (non-empty, trimmed, 1-500 characters)
    - Implement ThemeState with valid themes array ['light', 'dark'] and validation
    - Implement TimerState with duration constraints (60-7200 seconds)
    - _Requirements: 5.1, 5.4, 8.1, 9.1_

  - [ ]* 2.2 Write property test for Task persistence round-trip
    - **Property 12: Task Persistence Round-Trip**
    - **Validates: Requirements 8.1, 8.4, 8.7**
    - Use fast-check to generate random task objects with varied descriptions, completion states, and timestamps
    - Test serialization via toJSON, storage in localStorage, retrieval, and deserialization via fromJSON
    - Verify all properties (id, description, completed, createdAt) match exactly after round-trip

  - [x] 2.3 Implement StorageManager object with localStorage operations
    - Create StorageManager with KEYS constants (TASKS: 'todo_tasks', THEME: 'todo_theme', TIMER_DURATION: 'focus_timer_duration')
    - Implement getTasks, saveTasks, addTask, updateTask, deleteTask methods
    - Implement getTheme, saveTheme, getTimerDuration, saveTimerDuration methods
    - Add error handling for QuotaExceededError and storage unavailable scenarios
    - Implement in-memory fallback storage (memoryStorage object) when localStorage is unavailable
    - Add init method to test localStorage availability and set isAvailable flag
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 14.2_

  - [ ]* 2.4 Write unit tests for StorageManager error handling
    - Test QuotaExceededError handling (verify graceful degradation)
    - Test fallback to in-memory storage when localStorage.setItem throws error
    - Test corrupted JSON data recovery (parse error handling)
    - Test init method correctly detects localStorage availability
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 3. Checkpoint - Verify data layer functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement Header Component with greeting and clock
  - [ ] 4.1 Create HeaderComponent class in script.js
    - Implement time-based greeting logic: "Good morning" (5-11), "Good afternoon" (12-17), "Good evening" (18-4)
    - Implement clock display using setInterval updating every 1000ms
    - Format time in readable HH:MM format (support both 12-hour with AM/PM and 24-hour format)
    - Add init method to start clock updates and display initial greeting
    - Store intervalId for clock updates to enable cleanup if needed
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3_

  - [ ]* 4.2 Write property test for time-based greeting accuracy
    - **Property 1: Time-Based Greeting Accuracy**
    - **Validates: Requirements 2.2**
    - Use fast-check to generate random hour values (0-23)
    - Verify greeting returns "Good morning" for hours 5-11, "Good afternoon" for 12-17, "Good evening" for 18-4

  - [ ]* 4.3 Write property test for time formatting consistency
    - **Property 2: Time Formatting Consistency**
    - **Validates: Requirements 3.3**
    - Use fast-check to generate random valid timestamps
    - Verify formatting produces parseable HH:MM strings that can reconstruct original hour and minute values

- [ ] 5. Implement Focus Timer Component
  - [ ] 5.1 Create FocusTimer class in script.js
    - Implement timer state: duration, remaining, isRunning, intervalId
    - Load default duration (1500 seconds = 25 minutes) or saved duration from localStorage on init using StorageManager.getTimerDuration()
    - Implement start method: begin countdown with setInterval decrementing remaining time every 1000ms
    - Implement pause method: clear interval and preserve remaining time
    - Implement reset method: restore remaining time to original duration
    - Implement setDuration method: accept minutes, convert to seconds, save to localStorage via StorageManager.saveTimerDuration()
    - Add formatTime method to convert seconds to MM:SS display format
    - Implement onComplete method with alert/notification when timer reaches zero
    - Add updateDisplay method to update DOM elements with current formatted time
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 5.2 Write property test for timer pause preservation
    - **Property 3: Timer Pause Preservation**
    - **Validates: Requirements 4.3**
    - Use fast-check to generate random remaining time values (1-7200 seconds)
    - Start timer, let it run briefly, pause, verify remaining time unchanged after pause

  - [ ]* 5.3 Write property test for timer reset idempotence
    - **Property 4: Timer Reset Idempotence**
    - **Validates: Requirements 4.4**
    - Use fast-check to generate random durations (60-7200 seconds)
    - Perform start-pause-reset sequence, verify timer returns to exact initial duration

  - [ ]* 5.4 Write property test for custom timer duration acceptance
    - **Property 5: Custom Timer Duration Acceptance**
    - **Validates: Requirements 4.6**
    - Use fast-check to generate valid durations (60-7200 seconds)
    - Set custom duration, verify timer displays correctly and persists to localStorage

- [ ] 6. Checkpoint - Verify header and timer components
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement Task List and Task Item Components
  - [ ] 7.1 Create TaskList class in script.js
    - Implement init method to setup component and load tasks from localStorage
    - Implement loadTasks method using StorageManager.getTasks() to populate internal tasks array
    - Implement renderTasks method to display all tasks in DOM
    - Implement addTask method with input validation (non-empty, trimmed, 1-500 characters)
    - Block task creation for empty or whitespace-only descriptions with visual feedback
    - On successful task creation: update DOM instantly + save to localStorage simultaneously via StorageManager.saveTasks()
    - Clear input field after successful task creation
    - Add setupEventListeners method for form submit and input events
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.1, 8.4_

  - [ ]* 7.2 Write property test for task creation adds to list
    - **Property 6: Task Creation Adds to List**
    - **Validates: Requirements 5.2, 5.3**
    - Use fast-check to generate valid task descriptions (non-empty, 1-500 chars)
    - Create tasks, verify list length increases by one and new task appears in rendered list

  - [ ]* 7.3 Write property test for whitespace validation blocks creation
    - **Property 7: Whitespace Validation Blocks Creation**
    - **Validates: Requirements 5.4**
    - Use fast-check to generate whitespace-only strings (spaces, tabs, newlines)
    - Attempt task creation, verify task list unchanged and list length remains same

  - [ ]* 7.4 Write property test for input field cleared after creation
    - **Property 8: Input Field Cleared After Creation**
    - **Validates: Requirements 5.5**
    - Use fast-check to generate valid descriptions
    - Create task, verify input field value is empty string immediately after

  - [ ] 7.5 Create TaskItem class in script.js
    - Implement render method to create task DOM element with checkbox and delete button
    - Implement toggleComplete method with visual styling (add/remove 'completed' CSS class, strikethrough effect)
    - Implement delete method to remove from DOM and trigger parent TaskList update callback
    - Add updateDisplay method to refresh task styling based on completion status
    - Add event listeners for checkbox toggle and delete button click
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1_

  - [ ]* 7.6 Write property test for task completion toggle
    - **Property 9: Task Completion Toggle**
    - **Validates: Requirements 6.2, 6.3, 6.4**
    - Use fast-check to generate random tasks
    - Toggle completion twice, verify returns to original state
    - Verify correct CSS class application for completed/incomplete states

  - [ ] 7.7 Implement handleTaskUpdate and handleTaskDelete in TaskList
    - Add handleTaskUpdate method: update task completion in internal array + update localStorage simultaneously via StorageManager.saveTasks()
    - Add handleTaskDelete method: remove task from internal array + update localStorage simultaneously via StorageManager.saveTasks()
    - Ensure instant DOM updates with simultaneous localStorage persistence (localStorage-first flow)
    - Update TaskItem callbacks to use these handlers
    - _Requirements: 6.2, 7.2, 7.3, 8.2, 8.3_

  - [ ]* 7.8 Write property test for task deletion removes from list and storage
    - **Property 10: Task Deletion Removes from List and Storage**
    - **Validates: Requirements 7.2, 7.3, 8.3**
    - Use fast-check to generate random tasks
    - Delete task, verify removed from both DOM and localStorage (check StorageManager.getTasks())

  - [ ]* 7.9 Write property test for task modification updates storage
    - **Property 11: Task Modification Updates Storage**
    - **Validates: Requirements 8.2**
    - Use fast-check to generate tasks and completion states
    - Modify completion status, verify localStorage immediately updated (check StorageManager.getTasks())

- [ ] 8. Checkpoint - Verify task management functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement Theme Manager and theme toggling
  - [ ] 9.1 Create ThemeManager class in script.js
    - Implement init method to load theme from localStorage using StorageManager.getTheme() and apply to DOM
    - Implement toggleTheme method to switch between 'light' and 'dark' modes
    - Implement applyTheme method to set data-theme attribute on document root and update CSS variables
    - Save theme to localStorage immediately on toggle using StorageManager.saveTheme()
    - Add getCurrentTheme method to read current theme from DOM data-theme attribute or localStorage
    - Use default 'light' theme if no saved theme exists
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 8.5, 8.6_

  - [ ]* 9.2 Write property test for theme persistence round-trip
    - **Property 13: Theme Persistence Round-Trip**
    - **Validates: Requirements 8.5, 8.6, 9.4**
    - Use fast-check to generate theme states ('light', 'dark')
    - Save theme, simulate page reload by reading from localStorage, verify exact theme restored

  - [ ]* 9.3 Write property test for theme toggle idempotence
    - **Property 14: Theme Toggle Idempotence**
    - **Validates: Requirements 9.1**
    - Use fast-check to generate starting theme ('light' or 'dark')
    - Toggle twice, verify returns to original state (light→dark→light or dark→light→dark)

  - [ ]* 9.4 Write property test for theme application completeness
    - **Property 15: Theme Application Completeness**
    - **Validates: Requirements 9.2**
    - Use fast-check to generate theme changes
    - Verify document root has correct data-theme attribute matching applied theme

  - [ ]* 9.5 Write property test for theme CSS variable correctness
    - **Property 16: Theme CSS Variable Correctness**
    - **Validates: Requirements 9.3**
    - Use fast-check to generate theme states
    - Verify computed CSS custom properties (--bg-primary, --bg-secondary, --text-primary, --text-secondary, --accent-color, --border-color) match expected values for theme

  - [ ] 9.6 Wire theme toggle button to ThemeManager
    - Add theme toggle button to HTML (in header or footer section) if not already present
    - Add event listener to call ThemeManager.toggleTheme() on button click
    - Verify theme toggle updates DOM within 100ms (performance requirement)
    - _Requirements: 1.4, 9.1, 12.4_

- [ ] 10. Implement Footer Component with quick links
  - [ ] 10.1 Create FooterComponent class in script.js
    - Define default quick links array with objects containing: text, url, openInNewTab properties
    - Implement init method to render links to footer DOM element
    - Implement render method to create anchor elements with proper href and target attributes
    - Set target="_blank" for links where openInNewTab is true
    - Set target="_self" for links where openInNewTab is false
    - Add rel="noopener noreferrer" for security when opening in new tab
    - _Requirements: 10.1, 10.2, 10.3_

- [ ] 11. Checkpoint - Verify theme and footer functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement App Controller and wire all components together
  - [ ] 12.1 Create AppController class in script.js
    - Initialize component instances: ThemeManager, StorageManager, HeaderComponent, FocusTimer, TaskList, FooterComponent
    - Implement init method with initialization sequence: 
      1. StorageManager.init() to test localStorage availability
      2. ThemeManager.init() to load and apply saved theme
      3. TaskList.loadTasks() to load tasks from localStorage
      4. HeaderComponent.init() to start greeting and clock
      5. FocusTimer.init() to load saved timer duration
      6. FooterComponent.init() to render quick links
      7. setupEventListeners() to wire all interactive elements
    - Wire theme toggle button to ThemeManager.toggleTheme()
    - Wire task input form submit to TaskList.addTask()
    - Wire timer controls (start, pause, reset, set duration) to FocusTimer methods
    - Setup all global event listeners and keyboard shortcuts if needed
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 12.2 Add DOMContentLoaded event listener to initialize AppController
    - Create and initialize AppController instance when DOM is fully loaded
    - Ensure localStorage-first flow: all components load state from localStorage BEFORE rendering
    - Verify page loads within 1 second on standard hardware
    - _Requirements: 8.4, 8.6, 14.1, 12.2_

  - [ ]* 12.3 Write integration tests for full task lifecycle
    - Test complete flow: page load → create task → toggle completion → delete task → simulate page reload → verify persistence
    - Verify localStorage-first data flow throughout entire lifecycle
    - Test multiple tasks (3-5) with various completion states
    - Verify all task properties (id, description, completed, createdAt) persist correctly
    - _Requirements: 5.2, 6.2, 7.2, 8.1, 8.2, 8.3, 8.4, 8.7_

  - [ ]* 12.4 Write integration tests for timer with task workflow
    - Test using focus timer while simultaneously managing tasks (add, complete, delete)
    - Verify timer continues running correctly during task operations without interference
    - Verify timer duration persists to localStorage correctly
    - _Requirements: 4.2, 5.2, 8.5_

- [ ] 13. Add responsive styling and visual polish to style.css
  - [ ] 13.1 Implement visual design requirements in style.css
    - Apply simple color palette with clear contrast for both light and dark themes
    - Define CSS custom properties in :root for light theme and [data-theme="dark"] for dark theme
    - Variables needed: --bg-primary, --bg-secondary, --text-primary, --text-secondary, --accent-color, --border-color
    - Add readable typography with appropriate font sizes (body: 16px, headings: scale appropriately)
    - Implement visual hierarchy with consistent spacing and component grouping (margins, padding)
    - Add minimal decorative elements (subtle borders, rounded corners, shadows)
    - Implement hover states for all interactive elements (buttons, links, checkboxes)
    - Add active/focus states for accessibility and visual feedback
    - Ensure UI updates complete within 100ms for all user actions (optimize transitions)
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 12.1_

  - [ ] 13.2 Add responsive design and performance optimizations
    - Add responsive breakpoints for mobile (< 768px), tablet (768-1024px), desktop (> 1024px)
    - Optimize DOM manipulation to batch updates where possible (DocumentFragment for multiple elements)
    - Ensure theme toggle applies within 100ms using CSS transitions
    - Test page load time with simulated large localStorage data (50-100 tasks)
    - Verify UI remains responsive with many tasks (test with 100+ tasks)
    - Add CSS transitions for smooth state changes (max 100ms duration)
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 14. Final checkpoint - Complete application testing
  - Ensure all tests pass, ask the user if questions arise.
  - Verify standalone operation: open index.html directly in browser without server
  - Test in multiple browsers: Chrome (latest), Firefox (latest), Edge (latest), Safari (latest)
  - Verify localStorage persistence across page reloads (create tasks, reload, verify tasks remain)
  - Test theme switching works correctly and persists across page reloads
  - Test with 100+ tasks for performance validation (ensure list renders smoothly, interactions remain responsive)
  - Verify timer continues countdown correctly and persists custom duration
  - Verify all interactive elements respond within 100ms (buttons, toggles, inputs)
  - Test error scenarios: localStorage unavailable (private browsing), quota exceeded (fill storage)
  - Verify in-memory fallback storage works when localStorage is unavailable
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 12.1, 12.2, 12.3, 12.4, 14.1, 14.3, 14.4_

## Notes

- Tasks marked with `*` are optional property-based and unit tests that can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- The implementation follows **localStorage-first architecture**:
  - **On page load**: Read entire state from localStorage → Render DOM
  - **On user action**: Update DOM instantly + Update localStorage simultaneously
- All JavaScript code resides in a single `js/script.js` file organized by clear section comments:
  1. Data Models (Task, ThemeState, TimerState)
  2. Storage Manager (localStorage operations)
  3. Theme Manager (theme switching)
  4. Components (Header, FocusTimer, TaskList, TaskItem, Footer)
  5. App Controller (orchestration)
  6. Initialization (DOMContentLoaded)
- All CSS styling resides in a single `css/style.css` file
- Property-based tests use **fast-check** library with minimum 100 iterations per property
- Checkpoints ensure incremental validation at key milestones
- The application is standalone and requires no backend server or build tools
- Storage keys used: 'todo_tasks', 'todo_theme', 'focus_timer_duration'

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.3"] },
    { "id": 2, "tasks": ["2.2", "2.4"] },
    { "id": 3, "tasks": ["4.1", "5.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "5.2", "5.3", "5.4"] },
    { "id": 5, "tasks": ["7.1", "7.5"] },
    { "id": 6, "tasks": ["7.2", "7.3", "7.4", "7.6"] },
    { "id": 7, "tasks": ["7.7"] },
    { "id": 8, "tasks": ["7.8", "7.9"] },
    { "id": 9, "tasks": ["9.1", "10.1"] },
    { "id": 10, "tasks": ["9.2", "9.3", "9.4", "9.5"] },
    { "id": 11, "tasks": ["9.6"] },
    { "id": 12, "tasks": ["12.1"] },
    { "id": 13, "tasks": ["12.2"] },
    { "id": 14, "tasks": ["12.3", "12.4", "13.1"] },
    { "id": 15, "tasks": ["13.2"] }
  ]
}
```
