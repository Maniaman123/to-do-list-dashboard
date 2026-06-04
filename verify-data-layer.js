// Data Layer Verification Script
// This script tests the Task class and StorageManager functionality

console.log('='.repeat(60));
console.log('DATA LAYER FUNCTIONALITY VERIFICATION');
console.log('='.repeat(60));
console.log();

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✓ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.log(`✗ FAIL: ${testName}`);
    testsFailed++;
  }
}

// Mock localStorage for Node.js environment
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  
  getItem(key) {
    return this.store[key] || null;
  }
  
  setItem(key, value) {
    this.store[key] = String(value);
  }
  
  removeItem(key) {
    delete this.store[key];
  }
  
  clear() {
    this.store = {};
  }
}

global.localStorage = new MockLocalStorage();
global.crypto = {
  randomUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
};

// Load the script content
const fs = require('fs');
const path = require('path');
const scriptPath = path.join(__dirname, 'js', 'script.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

// Execute the script
eval(scriptContent);

console.log('SECTION 1: TASK CLASS VERIFICATION');
console.log('-'.repeat(60));

// Test 1: Task class exists
assert(typeof Task === 'function', 'Task class is defined');

// Test 2: Task constructor creates valid task
try {
  const task1 = new Task('Test task description');
  assert(task1.id !== undefined, 'Task has id property');
  assert(task1.description === 'Test task description', 'Task has correct description');
  assert(task1.completed === false, 'Task has completed property set to false');
  assert(typeof task1.createdAt === 'number', 'Task has createdAt timestamp');
} catch (e) {
  assert(false, 'Task constructor creates valid task');
}

// Test 3: Task.generateId() creates unique IDs
try {
  const id1 = Task.generateId();
  const id2 = Task.generateId();
  assert(id1 !== id2, 'Task.generateId() creates unique IDs');
  assert(typeof id1 === 'string' && id1.length > 0, 'Generated ID is non-empty string');
} catch (e) {
  assert(false, 'Task.generateId() works correctly');
}

// Test 4: Task validation - valid descriptions
assert(Task.isValidDescription('Valid task'), 'Validates valid task description');
assert(Task.isValidDescription('A'.repeat(500)), 'Validates 500 character description');
assert(Task.isValidDescription('   trimmed   '), 'Validates description with whitespace');

// Test 5: Task validation - invalid descriptions
assert(!Task.isValidDescription(''), 'Rejects empty string');
assert(!Task.isValidDescription('   '), 'Rejects whitespace-only string');
assert(!Task.isValidDescription('A'.repeat(501)), 'Rejects 501 character description');
assert(!Task.isValidDescription(null), 'Rejects null');
assert(!Task.isValidDescription(undefined), 'Rejects undefined');
assert(!Task.isValidDescription(123), 'Rejects non-string types');

// Test 6: Task constructor throws on invalid input
try {
  new Task('');
  assert(false, 'Task constructor throws on empty description');
} catch (e) {
  assert(e.message.includes('must be non-empty'), 'Task constructor throws on empty description');
}

try {
  new Task('   ');
  assert(false, 'Task constructor throws on whitespace-only description');
} catch (e) {
  assert(e.message.includes('must be non-empty'), 'Task constructor throws on whitespace-only description');
}

// Test 7: Task toJSON serialization
const task2 = new Task('Serialization test');
const json = task2.toJSON();
assert(json.id === task2.id, 'toJSON includes id');
assert(json.description === task2.description, 'toJSON includes description');
assert(json.completed === task2.completed, 'toJSON includes completed');
assert(json.createdAt === task2.createdAt, 'toJSON includes createdAt');

// Test 8: Task fromJSON deserialization
const taskData = {
  id: 'test-id-123',
  description: 'Deserialization test',
  completed: true,
  createdAt: 1234567890
};
const task3 = Task.fromJSON(taskData);
assert(task3.id === taskData.id, 'fromJSON restores id');
assert(task3.description === taskData.description, 'fromJSON restores description');
assert(task3.completed === taskData.completed, 'fromJSON restores completed');
assert(task3.createdAt === taskData.createdAt, 'fromJSON restores createdAt');

// Test 9: Round-trip serialization
const task4 = new Task('Round-trip test');
task4.completed = true;
const serialized = JSON.stringify(task4.toJSON());
const deserialized = Task.fromJSON(JSON.parse(serialized));
assert(deserialized.id === task4.id, 'Round-trip preserves id');
assert(deserialized.description === task4.description, 'Round-trip preserves description');
assert(deserialized.completed === task4.completed, 'Round-trip preserves completed');
assert(deserialized.createdAt === task4.createdAt, 'Round-trip preserves createdAt');

console.log();
console.log('SECTION 2: STORAGE MANAGER VERIFICATION');
console.log('-'.repeat(60));

// Clear localStorage before tests
localStorage.clear();

// Test 10: StorageManager exists
assert(typeof StorageManager === 'object', 'StorageManager object is defined');

// Test 11: StorageManager.init() works
try {
  StorageManager.init();
  assert(StorageManager.isAvailable === true, 'StorageManager.init() sets isAvailable');
} catch (e) {
  assert(false, 'StorageManager.init() executes without error');
}

// Test 12: StorageManager has required KEYS
assert(StorageManager.KEYS.TASKS === 'todo_tasks', 'KEYS.TASKS is defined');
assert(StorageManager.KEYS.THEME === 'todo_theme', 'KEYS.THEME is defined');
assert(StorageManager.KEYS.TIMER_DURATION === 'focus_timer_duration', 'KEYS.TIMER_DURATION is defined');

// Test 13: getTasks returns empty array initially
const emptyTasks = StorageManager.getTasks();
assert(Array.isArray(emptyTasks) && emptyTasks.length === 0, 'getTasks() returns empty array initially');

// Test 14: addTask adds task to storage
const task5 = new Task('Storage test task');
StorageManager.addTask(task5);
const storedTasks = StorageManager.getTasks();
assert(storedTasks.length === 1, 'addTask() increases task count');
assert(storedTasks[0].description === 'Storage test task', 'addTask() stores correct task');

// Test 15: updateTask updates task in storage
StorageManager.updateTask(task5.id, { completed: true });
const updatedTasks = StorageManager.getTasks();
assert(updatedTasks[0].completed === true, 'updateTask() updates task properties');

// Test 16: saveTasks and getTasks work with multiple tasks
const multipleTasks = [
  new Task('Task 1'),
  new Task('Task 2'),
  new Task('Task 3')
];
StorageManager.saveTasks(multipleTasks);
const retrievedTasks = StorageManager.getTasks();
assert(retrievedTasks.length === 3, 'saveTasks() stores multiple tasks');
assert(retrievedTasks[0].description === 'Task 1', 'getTasks() retrieves tasks in order');

// Test 17: deleteTask removes task from storage
const taskToDelete = multipleTasks[1];
StorageManager.deleteTask(taskToDelete.id);
const afterDelete = StorageManager.getTasks();
assert(afterDelete.length === 2, 'deleteTask() removes task');
assert(!afterDelete.find(t => t.id === taskToDelete.id), 'deleteTask() removes correct task');

// Test 18: getTheme and saveTheme work
StorageManager.saveTheme('dark');
const savedTheme = StorageManager.getTheme();
assert(savedTheme === 'dark', 'saveTheme() and getTheme() work correctly');

// Test 19: Invalid theme falls back to default
localStorage.setItem(StorageManager.KEYS.THEME, 'invalid-theme');
const fallbackTheme = StorageManager.getTheme();
assert(fallbackTheme === ThemeState.DEFAULT, 'Invalid theme falls back to default');

// Test 20: getTimerDuration and saveTimerDuration work
StorageManager.saveTimerDuration(3600);
const savedDuration = StorageManager.getTimerDuration();
assert(savedDuration === 3600, 'saveTimerDuration() and getTimerDuration() work correctly');

// Test 21: Corrupted data handling
localStorage.setItem(StorageManager.KEYS.TASKS, 'invalid json');
const corruptedTasks = StorageManager.getTasks();
assert(Array.isArray(corruptedTasks) && corruptedTasks.length === 0, 'Corrupted data returns empty array');

// Test 22: In-memory fallback when localStorage unavailable
localStorage.clear();
const originalAvailable = StorageManager.isAvailable;
StorageManager.isAvailable = false;
StorageManager.memoryStorage = {};

const memTask = new Task('Memory task');
StorageManager.addTask(memTask);
const memTasks = StorageManager.getTasks();
assert(memTasks.length === 1 && memTasks[0].description === 'Memory task', 'In-memory fallback works');

StorageManager.isAvailable = originalAvailable;

// Test 23: Theme state validation
assert(ThemeState.DEFAULT === 'light', 'ThemeState.DEFAULT is light');
assert(ThemeState.VALID_THEMES.includes('light'), 'ThemeState.VALID_THEMES includes light');
assert(ThemeState.VALID_THEMES.includes('dark'), 'ThemeState.VALID_THEMES includes dark');
assert(ThemeState.isValid('light'), 'ThemeState.isValid recognizes light theme');
assert(ThemeState.isValid('dark'), 'ThemeState.isValid recognizes dark theme');
assert(!ThemeState.isValid('invalid'), 'ThemeState.isValid rejects invalid theme');

// Test 24: Timer state model
const timerState = new TimerState();
assert(timerState.duration === TimerState.DEFAULT_DURATION, 'TimerState has default duration');
assert(timerState.remaining === TimerState.DEFAULT_DURATION, 'TimerState has default remaining time');
assert(timerState.isRunning === false, 'TimerState starts not running');
assert(timerState.intervalId === null, 'TimerState has null intervalId initially');

console.log();
console.log('='.repeat(60));
console.log('VERIFICATION COMPLETE');
console.log('='.repeat(60));
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log();

if (testsFailed === 0) {
  console.log('✓ ALL TESTS PASSED - Data layer is fully functional!');
  console.log();
  console.log('VERIFIED FUNCTIONALITY:');
  console.log('  ✓ Task class with UUID generation');
  console.log('  ✓ Task description validation (1-500 characters)');
  console.log('  ✓ Task serialization (toJSON/fromJSON)');
  console.log('  ✓ StorageManager with all CRUD operations');
  console.log('  ✓ localStorage read/write operations');
  console.log('  ✓ Error handling and fallback mechanisms');
  console.log('  ✓ Theme and timer duration persistence');
  console.log('  ✓ Corrupted data recovery');
  console.log('  ✓ In-memory fallback storage');
  process.exit(0);
} else {
  console.log(`✗ ${testsFailed} TEST(S) FAILED - Review implementation`);
  process.exit(1);
}
