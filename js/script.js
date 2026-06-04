// ============================================
// SECTION 1: Data Models
// ============================================

/**
 * Task Model
 * Represents an individual task item
 */
class Task {
  constructor(description) {
    // Validate description
    if (!Task.isValidDescription(description)) {
      throw new Error('Task description must be non-empty and between 1-500 characters');
    }
    
    this.id = Task.generateId();
    this.description = description.trim();
    this.completed = false;
    this.createdAt = Date.now();
  }

  static generateId() {
    // Try to use crypto.randomUUID() if available (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    // Fallback to custom UUID generation
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Validates task description
   * @param {string} description - The task description to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  static isValidDescription(description) {
    if (typeof description !== 'string') {
      return false;
    }
    
    const trimmed = description.trim();
    return trimmed.length >= 1 && trimmed.length <= 500;
  }

  toJSON() {
    return {
      id: this.id,
      description: this.description,
      completed: this.completed,
      createdAt: this.createdAt
    };
  }

  static fromJSON(json) {
    // Validasi schema sebelum membuat instance
    if (!json || typeof json !== 'object') return null;
    if (typeof json.id !== 'string' || !json.id) return null;
    if (typeof json.description !== 'string' || !Task.isValidDescription(json.description)) return null;
    
    const task = Object.create(Task.prototype);
    task.id = json.id;
    task.description = json.description.trim();
    task.completed = typeof json.completed === 'boolean' ? json.completed : false;
    task.createdAt = typeof json.createdAt === 'number' ? json.createdAt : Date.now();
    return task;
  }
}

/**
 * Theme State Model
 * Manages theme state validation
 */
class ThemeState {
  static DEFAULT = 'light';
  static VALID_THEMES = ['light', 'dark'];

  static isValid(theme) {
    return ThemeState.VALID_THEMES.includes(theme);
  }
}

/**
 * Timer State Model
 * Represents focus timer state
 */
class TimerState {
  static DEFAULT_DURATION = 1500; // 25 minutes in seconds
  static MIN_DURATION = 60; // 1 minute
  static MAX_DURATION = 7200; // 2 hours

  constructor() {
    this.duration = TimerState.DEFAULT_DURATION;
    this.remaining = TimerState.DEFAULT_DURATION;
    this.isRunning = false;
    this.intervalId = null;
  }
}

// ============================================
// SECTION 2: Storage Manager
// ============================================

/**
 * Storage Manager
 * Handles all localStorage interactions with fallback to in-memory storage
 */
const StorageManager = {
  KEYS: {
    TASKS: 'todo_tasks',
    THEME: 'todo_theme',
    TIMER_DURATION: 'focus_timer_duration',
    QUICK_LINKS: 'quick_links'
  },

  isAvailable: true,
  memoryStorage: {},

  init() {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      this.isAvailable = true;
    } catch (e) {
      console.warn('localStorage not available, using in-memory storage');
      this.isAvailable = false;
    }
  },

  // Task operations
  getTasks() {
    if (!this.isAvailable) {
      return this.memoryStorage.tasks || [];
    }
    try {
      const json = localStorage.getItem(this.KEYS.TASKS);
      if (!json) return [];
      const tasksData = JSON.parse(json);
      return tasksData
        .map(taskData => Task.fromJSON(taskData))
        .filter(task => task !== null); // Filter out invalid/corrupt task entries
    } catch (e) {
      console.error('Failed to load tasks:', e);
      return [];
    }
  },

  saveTasks(tasks) {
    if (!this.isAvailable) {
      this.memoryStorage.tasks = tasks;
      return;
    }
    try {
      const json = JSON.stringify(tasks.map(task => task.toJSON()));
      localStorage.setItem(this.KEYS.TASKS, json);
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded - switching to in-memory storage');
        this.isAvailable = false;
        this.memoryStorage.tasks = tasks;
      } else {
        console.error('Failed to save tasks:', e);
      }
    }
  },

  addTask(task) {
    const tasks = this.getTasks();
    tasks.push(task);
    this.saveTasks(tasks);
  },

  updateTask(taskId, updates) {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      Object.assign(tasks[taskIndex], updates);
      this.saveTasks(tasks);
    }
  },

  deleteTask(taskId) {
    const tasks = this.getTasks();
    const filteredTasks = tasks.filter(t => t.id !== taskId);
    this.saveTasks(filteredTasks);
  },

  // Settings operations
  getTheme() {
    if (!this.isAvailable) {
      return this.memoryStorage.theme || ThemeState.DEFAULT;
    }
    try {
      const theme = localStorage.getItem(this.KEYS.THEME);
      return ThemeState.isValid(theme) ? theme : ThemeState.DEFAULT;
    } catch (e) {
      console.error('Failed to load theme:', e);
      return ThemeState.DEFAULT;
    }
  },

  saveTheme(theme) {
    if (!this.isAvailable) {
      this.memoryStorage.theme = theme;
      return;
    }
    try {
      localStorage.setItem(this.KEYS.THEME, theme);
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
  },

  getTimerDuration() {
    if (!this.isAvailable) {
      return this.memoryStorage.timerDuration || TimerState.DEFAULT_DURATION;
    }
    try {
      const duration = localStorage.getItem(this.KEYS.TIMER_DURATION);
      // NaN Guard: parseInt('abc', 10) returns NaN — always validate before returning
      const parsed = parseInt(duration, 10);
      return (duration && !isNaN(parsed)) ? parsed : TimerState.DEFAULT_DURATION;
    } catch (e) {
      console.error('Failed to load timer duration:', e);
      return TimerState.DEFAULT_DURATION;
    }
  },

  saveTimerDuration(duration) {
    if (!this.isAvailable) {
      this.memoryStorage.timerDuration = duration;
      return;
    }
    try {
      localStorage.setItem(this.KEYS.TIMER_DURATION, duration.toString());
    } catch (e) {
      console.error('Failed to save timer duration:', e);
    }
  },

  setupStorageSync(onExternalChange) {
    window.addEventListener('storage', (event) => {
      if (event.key === this.KEYS.TASKS && event.newValue !== event.oldValue) {
        console.log('Tasks updated from another tab, syncing...');
        if (typeof onExternalChange === 'function') {
          onExternalChange();
        }
      }
    });
  },

  // Quick Links operations
  getQuickLinks() {
    if (!this.isAvailable) {
      return this.memoryStorage.quickLinks || this._defaultLinks();
    }
    try {
      const json = localStorage.getItem(this.KEYS.QUICK_LINKS);
      if (!json) {
        // First run: seed defaults and save them
        const defaults = this._defaultLinks();
        this.saveQuickLinks(defaults);
        return defaults;
      }
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : this._defaultLinks();
    } catch (e) {
      console.error('Failed to load quick links:', e);
      return this._defaultLinks();
    }
  },

  saveQuickLinks(links) {
    if (!this.isAvailable) {
      this.memoryStorage.quickLinks = links;
      return;
    }
    try {
      localStorage.setItem(this.KEYS.QUICK_LINKS, JSON.stringify(links));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        this.isAvailable = false;
        this.memoryStorage.quickLinks = links;
      } else {
        console.error('Failed to save quick links:', e);
      }
    }
  },

  _defaultLinks() {
    return [
      { id: 'link_1', label: 'GitHub',         url: 'https://github.com' },
      { id: 'link_2', label: 'Stack Overflow', url: 'https://stackoverflow.com' },
      { id: 'link_3', label: 'MDN Web Docs',   url: 'https://developer.mozilla.org' },
      { id: 'link_4', label: 'Google',         url: 'https://www.google.com' }
    ];
  }
};

// ============================================
// SECTION 3: Theme Manager
// ============================================

/**
 * Theme Manager
 * Handles theme switching and CSS variable application
 */
class ThemeManager {
  constructor() {
    this.currentTheme = ThemeState.DEFAULT;
  }

  init() {
    // Load theme from localStorage first
    const savedTheme = StorageManager.getTheme();
    this.applyTheme(savedTheme);
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
    StorageManager.saveTheme(newTheme);
  }

  applyTheme(themeName) {
    if (!ThemeState.isValid(themeName)) {
      themeName = ThemeState.DEFAULT;
    }

    this.currentTheme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    
    // Update theme toggle icon
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
      themeIcon.textContent = themeName === 'light' ? '🌙' : '☀️';
    }
  }

  getCurrentTheme() {
    return this.currentTheme;
  }
}

// ============================================
// SECTION 4: Components
// ============================================

/**
 * Header Component
 * Manages greeting and clock display
 */
class HeaderComponent {
  constructor() {
    this.greetingElement = document.getElementById('greeting-display');
    this.clockElement = document.getElementById('clock-display');
    this.dateElement = document.getElementById('date-display');
    this.clockIntervalId = null;
    this.clockTimeoutId = null; // Used by self-correcting clock
  }

  init() {
    this.updateGreeting();
    this.updateDate();

    // Self-correcting clock: syncs to the real system second boundary
    // to prevent accumulated drift when tab is throttled in the background
    this.startClock();

    // Update greeting every minute
    setInterval(() => {
      this.updateGreeting();
    }, 60000);

    // Update date at midnight without requiring a page refresh
    this._scheduleMidnightDateRefresh();
  }

  updateGreeting() {
    const greeting = this.getTimeBasedGreeting();
    if (this.greetingElement) {
      this.greetingElement.textContent = greeting;
    }
  }

  /**
   * Renders the full date in Indonesian locale format.
   * Example: "Rabu, 4 Juni 2026"
   */
  updateDate() {
    if (!this.dateElement) return;
    const now = new Date();
    this.dateElement.textContent = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Schedules updateDate() to fire at the next midnight,
   * then repeats every 24 hours — so the date never gets stale.
   */
  _scheduleMidnightDateRefresh() {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const msUntilMidnight = midnight - now;
    setTimeout(() => {
      this.updateDate();
      setInterval(() => this.updateDate(), 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }

  updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    if (this.clockElement) {
      this.clockElement.textContent = `${hours}:${minutes}:${seconds}`;
    }
  }

  /**
   * Self-correcting clock that re-aligns itself to the system second boundary
   * on every tick, eliminating cumulative setInterval drift.
   */
  startClock() {
    this.updateClock();
    // Calculate exact ms remaining until the next full second
    const msUntilNextSecond = 1000 - (Date.now() % 1000);
    this.clockTimeoutId = setTimeout(() => this.startClock(), msUntilNextSecond);
  }

  getTimeBasedGreeting() {
    const hour = new Date().getHours();
    
    // Time-based greeting logic:
    // 05:00 - 11:59: Selamat pagi
    // 12:00 - 17:59: Selamat siang/sore
    // 18:00 - 04:59: Selamat malam
    if (hour >= 5 && hour < 12) {
      return 'Selamat pagi, Reyhan!';
    } else if (hour >= 12 && hour < 18) {
      return 'Selamat siang, Reyhan!';
    } else {
      return 'Selamat malam, Reyhan!';
    }
  }
}

/**
 * Focus Timer Component
 * Provides countdown timer functionality
 */
class FocusTimer {
  constructor() {
    this.timerState = new TimerState();
    this.minutesDisplay = document.getElementById('timer-minutes');
    this.secondsDisplay = document.getElementById('timer-seconds');
    this.startBtn = document.getElementById('timer-start');
    this.pauseBtn = document.getElementById('timer-pause');
    this.resetBtn = document.getElementById('timer-reset');
    this.durationInput = document.getElementById('timer-duration-input');
    this.setDurationBtn = document.getElementById('timer-set-duration');
  }

  init() {
    // Load saved duration from localStorage
    const savedDuration = StorageManager.getTimerDuration();
    this.timerState.duration = savedDuration;
    this.timerState.remaining = savedDuration;
    
    // Update duration input to match
    if (this.durationInput) {
      this.durationInput.value = Math.floor(savedDuration / 60);
    }
    
    this.updateDisplay();
    this.setupEventListeners();
  }

  setupEventListeners() {
    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => this.start());
    }
    
    if (this.pauseBtn) {
      this.pauseBtn.addEventListener('click', () => this.pause());
    }
    
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => this.reset());
    }
    
    if (this.setDurationBtn) {
      this.setDurationBtn.addEventListener('click', () => this.setDuration());
    }
  }

  start() {
    if (this.timerState.isRunning) return;
    
    this.timerState.isRunning = true;
    this.updateButtonStates();
    
    this.timerState.intervalId = setInterval(() => {
      if (this.timerState.remaining > 0) {
        this.timerState.remaining--;
        this.updateDisplay();
      } else {
        this.onComplete();
      }
    }, 1000);
  }

  pause() {
    if (!this.timerState.isRunning) return;
    
    this.timerState.isRunning = false;
    
    if (this.timerState.intervalId) {
      clearInterval(this.timerState.intervalId);
      this.timerState.intervalId = null;
    }
    
    this.updateButtonStates();
  }

  reset() {
    this.pause();
    this.timerState.remaining = this.timerState.duration;
    this.updateDisplay();
  }

  setDuration() {
    if (!this.durationInput) return;
    
    const minutes = parseInt(this.durationInput.value, 10);
    
    // Fallback ke default jika NaN atau invalid
    if (isNaN(minutes) || minutes <= 0) {
      const defaultMinutes = TimerState.DEFAULT_DURATION / 60;
      this.durationInput.value = defaultMinutes;
      this.timerState.duration = TimerState.DEFAULT_DURATION;
      this.timerState.remaining = TimerState.DEFAULT_DURATION;
      StorageManager.saveTimerDuration(TimerState.DEFAULT_DURATION);
      this.updateDisplay();
      return;
    }
    
    // Clamp to valid range
    const clampedMinutes = Math.max(
      TimerState.MIN_DURATION / 60,
      Math.min(TimerState.MAX_DURATION / 60, minutes)
    );
    
    const seconds = clampedMinutes * 60;
    
    this.timerState.duration = seconds;
    this.timerState.remaining = seconds;
    
    // Save to localStorage immediately
    StorageManager.saveTimerDuration(seconds);
    
    this.updateDisplay();
    this.durationInput.value = clampedMinutes;
  }

  onComplete() {
    this.pause();
    this.timerState.remaining = 0;
    this.updateDisplay();
    
    // Alert user dengan pesan Bahasa Indonesia
    alert('Waktu fokus habis! Istirahat sejenak.');
    
    // Reset timer
    this.reset();
  }

  updateDisplay() {
    const minutes = Math.floor(this.timerState.remaining / 60);
    const seconds = this.timerState.remaining % 60;
    
    if (this.minutesDisplay) {
      this.minutesDisplay.textContent = minutes.toString().padStart(2, '0');
    }
    
    if (this.secondsDisplay) {
      this.secondsDisplay.textContent = seconds.toString().padStart(2, '0');
    }
  }

  updateButtonStates() {
    if (this.startBtn) {
      this.startBtn.disabled = this.timerState.isRunning;
    }
    
    if (this.pauseBtn) {
      this.pauseBtn.disabled = !this.timerState.isRunning;
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * Task List Component
 * Manages the collection of tasks
 */
class TaskList {
  constructor() {
    this.tasks = [];
    this.taskForm = document.getElementById('task-form');
    this.taskInput = document.getElementById('task-input');
    this.errorMessage = document.getElementById('error-message');
    this.tasksContainer = document.getElementById('tasks-container');
  }

  init() {
    this.loadTasks();
    this.renderTasks();
    this.setupEventListeners();
  }

  loadTasks() {
    // Load from localStorage first
    this.tasks = StorageManager.getTasks();
  }

  setupEventListeners() {
    if (this.taskForm) {
      this.taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addTask();
      });
    }
  }

addTask() {
    if (!this.taskInput) return;
    
    const description = this.taskInput.value;
    
    // Validate input using Task class validation
    if (!Task.isValidDescription(description)) {
      this.showError('Task description must be non-empty and between 1-500 characters');
      return;
    }
    
    // Clear any previous errors
    this.clearError();
    
    // 🔴 MANUAL FIX: VALIDASI ANTI-DUPLIKAT (Fitur Tantangan)
    const isDuplicate = this.tasks.some(t => t.description.trim().toLowerCase() === description.trim().toLowerCase());
    if (isDuplicate) {
      this.showError("Tugas ini sudah ada di dalam list!");
      return;
    }
    // --------------------------------------------------------

    // Create new task
    try {
      const task = new Task(description);
      
      // Update internal state
      this.tasks.push(task);
      
      // Save to localStorage immediately
      StorageManager.saveTasks(this.tasks);
      
      // Update DOM instantly
      this.renderTasks();
      
      // Clear input
      this.clearInput();
    } catch (error) {
      this.showError(error.message);
    }
  }

  handleTaskUpdate(taskId, completed) {
    // 1. Update internal state
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    task.completed = completed;
    
    // 2. Save ke localStorage
    StorageManager.saveTasks(this.tasks);
    
    // 3. Surgical DOM update — hanya update elemen yang berubah
    const taskEl = this.tasksContainer.querySelector(`[data-task-id="${taskId}"]`);
    if (taskEl) {
      taskEl.classList.toggle('completed', completed);
      const descEl = taskEl.querySelector('.task-description');
      if (descEl) {
        descEl.style.textDecoration = completed ? 'line-through' : '';
        descEl.style.color = completed ? 'var(--text-secondary)' : '';
      }
    }
  }

  handleTaskDelete(taskId) {
    // 1. Update internal state
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    
    // 2. Save to localStorage
    StorageManager.saveTasks(this.tasks);
    
    // 3. Surgical DOM removal — hanya hapus elemen yang dihapus
    const taskEl = this.tasksContainer.querySelector(`[data-task-id="${taskId}"]`);
    if (taskEl) {
      taskEl.remove();
    }
    
    // 4. Jika list kosong setelah delete, tampilkan pesan empty
    if (this.tasks.length === 0) {
      this.renderTasks(); // Full render hanya saat list benar-benar kosong
    }
  }

  renderTasks() {
    if (!this.tasksContainer) return;
    
    // Clear container
    this.tasksContainer.innerHTML = '';
    
    // Render each task
    this.tasks.forEach(task => {
      const taskElement = this.createTaskElement(task);
      this.tasksContainer.appendChild(taskElement);
    });
    
    // Show message if no tasks
    if (this.tasks.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.textContent = 'No tasks yet. Add one to get started!';
      emptyMessage.style.textAlign = 'center';
      emptyMessage.style.color = 'var(--text-secondary)';
      emptyMessage.style.padding = 'var(--spacing-xl)';
      this.tasksContainer.appendChild(emptyMessage);
    }
  }

  createTaskElement(task) {
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    if (task.completed) {
      taskItem.classList.add('completed');
    }
    taskItem.dataset.taskId = task.id;

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => {
      this.handleTaskUpdate(task.id, checkbox.checked);
    });

    // Description
    const description = document.createElement('span');
    description.className = 'task-description';
    description.textContent = task.description;

    // ── Action button group ──────────────────────────────────────
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'task-edit';
    editBtn.textContent = '✏️';
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.addEventListener('click', () => {
      this.enterEditMode(task.id);
    });

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-delete';
    deleteBtn.textContent = '🗑️';
    deleteBtn.setAttribute('aria-label', 'Delete task');
    deleteBtn.addEventListener('click', () => {
      this.handleTaskDelete(task.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    taskItem.appendChild(checkbox);
    taskItem.appendChild(description);
    taskItem.appendChild(actions);

    return taskItem;
  }

  // ── INLINE EDIT MODE ────────────────────────────────────────────

  /**
   * Switches a task row into edit mode:
   * replaces the <span> with an <input> and swaps action buttons.
   */
  enterEditMode(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    const taskEl = this.tasksContainer.querySelector(`[data-task-id="${taskId}"]`);
    if (!taskEl || taskEl.classList.contains('editing')) return; // already editing

    taskEl.classList.add('editing');

    // Disable the checkbox while editing
    const checkbox = taskEl.querySelector('.task-checkbox');
    if (checkbox) checkbox.disabled = true;

    // Replace description span with an input
    const descEl = taskEl.querySelector('.task-description');
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'task-edit-input';
    editInput.value = task.description;
    editInput.maxLength = 500;
    editInput.setAttribute('aria-label', 'Edit task description');
    taskEl.replaceChild(editInput, descEl);
    editInput.focus();
    editInput.select();

    // Replace action buttons with Save + Cancel
    const actionsEl = taskEl.querySelector('.task-actions');
    actionsEl.innerHTML = '';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'task-save';
    saveBtn.textContent = '✅';
    saveBtn.setAttribute('aria-label', 'Save task');
    saveBtn.addEventListener('click', () => this.saveEdit(taskId));

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'task-cancel';
    cancelBtn.textContent = '❌';
    cancelBtn.setAttribute('aria-label', 'Cancel edit');
    cancelBtn.addEventListener('click', () => this.cancelEdit(taskId, task.description));

    actionsEl.appendChild(saveBtn);
    actionsEl.appendChild(cancelBtn);

    // Allow saving with Enter, cancelling with Escape
    editInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this.saveEdit(taskId); }
      if (e.key === 'Escape') { e.preventDefault(); this.cancelEdit(taskId, task.description); }
    });
  }

  /**
   * Validates and persists the edited description, then restores normal view.
   */
  saveEdit(taskId) {
    const taskEl = this.tasksContainer.querySelector(`[data-task-id="${taskId}"]`);
    if (!taskEl) return;

    const editInput = taskEl.querySelector('.task-edit-input');
    if (!editInput) return;

    const newDescription = editInput.value;

    // --- Validation ---
    if (!Task.isValidDescription(newDescription)) {
      editInput.classList.add('input-error');
      editInput.setAttribute('placeholder', 'Deskripsi tidak boleh kosong (maks 500 karakter)');
      editInput.value = '';
      editInput.focus();
      return;
    }

    const trimmed = newDescription.trim();

    // Duplicate check — exclude the task being edited itself
    const isDuplicate = this.tasks.some(
      t => t.id !== taskId && t.description.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      editInput.classList.add('input-error');
      editInput.value = trimmed;
      editInput.select();
      this.showError('Tugas dengan nama ini sudah ada di dalam list!');
      return;
    }

    // --- Commit changes ---
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.description = trimmed;
      StorageManager.saveTasks(this.tasks);
    }

    this.clearError();
    this._exitEditMode(taskId, trimmed);
  }

  /**
   * Discards changes and restores the original description.
   */
  cancelEdit(taskId, originalDescription) {
    this.clearError();
    this._exitEditMode(taskId, originalDescription);
  }

  /**
   * Internal: restores a task row from edit mode back to normal view.
   */
  _exitEditMode(taskId, displayDescription) {
    const task = this.tasks.find(t => t.id === taskId);
    const taskEl = this.tasksContainer.querySelector(`[data-task-id="${taskId}"]`);
    if (!taskEl) return;

    taskEl.classList.remove('editing');

    // Re-enable checkbox
    const checkbox = taskEl.querySelector('.task-checkbox');
    if (checkbox) checkbox.disabled = false;

    // Restore description span
    const editInput = taskEl.querySelector('.task-edit-input');
    const descSpan = document.createElement('span');
    descSpan.className = 'task-description';
    descSpan.textContent = displayDescription;
    if (task && task.completed) {
      descSpan.style.textDecoration = 'line-through';
      descSpan.style.color = 'var(--text-secondary)';
    }
    taskEl.replaceChild(descSpan, editInput);

    // Restore original action buttons
    const actionsEl = taskEl.querySelector('.task-actions');
    actionsEl.innerHTML = '';

    const editBtn = document.createElement('button');
    editBtn.className = 'task-edit';
    editBtn.textContent = '✏️';
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.addEventListener('click', () => this.enterEditMode(taskId));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-delete';
    deleteBtn.textContent = '🗑️';
    deleteBtn.setAttribute('aria-label', 'Delete task');
    deleteBtn.addEventListener('click', () => this.handleTaskDelete(taskId));

    actionsEl.appendChild(editBtn);
    actionsEl.appendChild(deleteBtn);
  }

  clearInput() {
    if (this.taskInput) {
      this.taskInput.value = '';
    }
  }

  showError(message) {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
    }
  }

  clearError() {
    if (this.errorMessage) {
      this.errorMessage.textContent = '';
    }
  }
}

/**
 * Footer Component
 * Manages quick links — loaded from and saved to localStorage.
 */
class FooterComponent {
  constructor() {
    this.linksContainer = document.getElementById('quick-links-container');
    this.form = document.getElementById('quick-link-form');
    this.labelInput = document.getElementById('quick-link-label');
    this.urlInput = document.getElementById('quick-link-url');
    this.errorEl = document.getElementById('quick-link-error');
    this.links = [];
  }

  init() {
    this.links = StorageManager.getQuickLinks();
    this.renderLinks();
    this._setupEventListeners();
  }

  _setupEventListeners() {
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this._addLink();
      });
    }
  }

  _generateId() {
    return `link_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  _addLink() {
    const label = this.labelInput ? this.labelInput.value.trim() : '';
    const url   = this.urlInput   ? this.urlInput.value.trim()   : '';

    // Validation
    if (!label) {
      this._showError('Label tidak boleh kosong.');
      return;
    }
    if (!url || !this._isValidUrl(url)) {
      this._showError('Masukkan URL yang valid (mulai dengan http:// atau https://).');
      return;
    }
    const isDuplicate = this.links.some(
      l => l.url.toLowerCase() === url.toLowerCase()
    );
    if (isDuplicate) {
      this._showError('URL ini sudah ada di Quick Links.');
      return;
    }

    this._clearError();

    const newLink = { id: this._generateId(), label, url };
    this.links.push(newLink);
    StorageManager.saveQuickLinks(this.links);
    this._appendLinkElement(newLink);

    // Clear inputs
    if (this.labelInput) this.labelInput.value = '';
    if (this.urlInput)   this.urlInput.value   = '';
  }

  _deleteLink(id) {
    this.links = this.links.filter(l => l.id !== id);
    StorageManager.saveQuickLinks(this.links);
    const el = this.linksContainer.querySelector(`[data-link-id="${id}"]`);
    if (el) el.remove();
    if (this.links.length === 0) this.renderLinks();
  }

  _isValidUrl(str) {
    try {
      const u = new URL(str);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  renderLinks() {
    if (!this.linksContainer) return;
    this.linksContainer.innerHTML = '';

    if (this.links.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'No links yet. Add one above!';
      empty.className = 'quick-links-empty';
      this.linksContainer.appendChild(empty);
      return;
    }

    this.links.forEach(link => this._appendLinkElement(link));
  }

  _appendLinkElement(link) {
    if (!this.linksContainer) return;

    // Remove empty message if present
    const emptyMsg = this.linksContainer.querySelector('.quick-links-empty');
    if (emptyMsg) emptyMsg.remove();

    const wrapper = document.createElement('div');
    wrapper.className = 'quick-link-item';
    wrapper.dataset.linkId = link.id;

    const anchor = document.createElement('a');
    anchor.href = link.url;
    anchor.textContent = link.label;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.className = 'quick-link-anchor';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'quick-link-delete';
    deleteBtn.textContent = '✕';
    deleteBtn.setAttribute('aria-label', `Remove ${link.label}`);
    deleteBtn.addEventListener('click', () => this._deleteLink(link.id));

    wrapper.appendChild(anchor);
    wrapper.appendChild(deleteBtn);
    this.linksContainer.appendChild(wrapper);
  }

  _showError(msg) {
    if (this.errorEl) this.errorEl.textContent = msg;
  }

  _clearError() {
    if (this.errorEl) this.errorEl.textContent = '';
  }
}

// ============================================
// SECTION 5: App Controller
// ============================================

/**
 * App Controller
 * Orchestrates application initialization and component coordination
 */
class AppController {
  constructor() {
    this.themeManager = new ThemeManager();
    this.headerComponent = new HeaderComponent();
    this.focusTimer = new FocusTimer();
    this.taskList = new TaskList();
    this.footerComponent = new FooterComponent();
  }

  init() {
    // Initialize storage manager
    StorageManager.init();
    
    // 1. Load and apply theme from localStorage
    this.themeManager.init();
    
    // 2. Initialize header (greeting and clock)
    this.headerComponent.init();
    
    // 3. Initialize focus timer with saved duration
    this.focusTimer.init();
    
    // 4. Load tasks from localStorage and render
    this.taskList.init();
    
    // 4b. Setup cross-tab storage synchronization
    StorageManager.setupStorageSync(() => {
      this.taskList.loadTasks();
      this.taskList.renderTasks();
    });
    
    // 5. Initialize footer
    this.footerComponent.init();
    
    // 6. Setup global event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Theme toggle button
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        this.themeManager.toggleTheme();
      });
    }
  }
}

// ============================================
// SECTION 6: Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
});
