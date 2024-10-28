import { TaskForm } from './components/TaskForm.js';
import { TaskFilters } from './components/TaskFilters.js';
import { TaskList } from './components/TaskList.js';
import { translations } from './translations.js';

class TodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks') || '[]').map(task => ({
            ...task,
            createdAt: task.createdAt || new Date().toISOString()
        }));
        this.categories = this.extractCategories();
        this.editingTaskIndex = null;
        this.currentLanguage = localStorage.getItem('language') || 'en';
        
        this.initializeLanguage();
        this.setupLanguageToggle();
        this.setupKeyboardShortcuts();
        
        this.taskForm = new TaskForm(document.getElementById('taskFormContainer'), {
            onSubmit: this.addTask.bind(this),
            categories: this.categories,
            translations: translations[this.currentLanguage]
        });

        this.taskFilters = new TaskFilters(document.getElementById('taskFiltersContainer'), {
            onFilter: this.filterTasks.bind(this),
            categories: this.categories,
            translations: translations[this.currentLanguage]
        });

        this.taskList = new TaskList(document.getElementById('taskList'), {
            onStatusChange: this.toggleTaskStatus.bind(this),
            onEdit: this.editTask.bind(this),
            onDelete: this.deleteTask.bind(this),
            onCategoryEdit: this.editCategory.bind(this),
            translations: translations[this.currentLanguage]
        });

        this.setupEditDialog();
        this.setupDarkMode();
        this.setupExportImport();
        this.renderTasks();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts if not in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Ctrl/Cmd + / - Show keyboard shortcuts
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                this.showShortcutsDialog();
                return;
            }

            // n - Focus new task input
            if (e.key === 'n') {
                e.preventDefault();
                document.getElementById('taskInput')?.focus();
                return;
            }

            // / - Focus search input
            if (e.key === '/') {
                e.preventDefault();
                document.getElementById('searchInput')?.focus();
                return;
            }

            // d - Toggle dark mode
            if (e.key === 'd') {
                e.preventDefault();
                document.getElementById('darkModeToggle')?.click();
                return;
            }

            // l - Toggle language
            if (e.key === 'l') {
                e.preventDefault();
                document.getElementById('languageToggle')?.click();
                return;
            }

            // e - Export tasks
            if (e.key === 'e') {
                e.preventDefault();
                document.getElementById('exportTasks')?.click();
                return;
            }
        });
    }

    showShortcutsDialog() {
        const t = this.options?.translations || translations[this.currentLanguage];
        const shortcuts = [
            ['Ctrl/Cmd + /', 'Show keyboard shortcuts'],
            ['n', 'New task'],
            ['/', 'Search tasks'],
            ['d', 'Toggle dark mode'],
            ['l', 'Toggle language'],
            ['e', 'Export tasks']
        ];

        const dialog = document.createElement('dialog');
        dialog.className = 'bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md';
        
        dialog.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h2 class="text-xl font-bold text-gray-800 dark:text-white">Keyboard Shortcuts</h2>
                    <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" onclick="this.closest('dialog').close()">✕</button>
                </div>
                <div class="space-y-2">
                    ${shortcuts.map(([key, description]) => `
                        <div class="flex justify-between items-center">
                            <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">${key}</kbd>
                            <span class="text-gray-700 dark:text-gray-300">${description}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
        dialog.showModal();

        dialog.addEventListener('close', () => {
            dialog.remove();
        });

        // Close on click outside
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.close();
            }
        });
    }

    setupExportImport() {
        const exportBtn = document.getElementById('exportTasks');
        const importInput = document.getElementById('importTasks');
        const t = translations[this.currentLanguage];

        exportBtn.addEventListener('click', () => {
            const dataStr = JSON.stringify(this.tasks, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'todo-tasks.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });

        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedTasks = JSON.parse(event.target.result);
                    if (Array.isArray(importedTasks)) {
                        this.tasks = importedTasks.map(task => ({
                            ...task,
                            createdAt: task.createdAt || new Date().toISOString()
                        }));
                        this.updateLocalStorage();
                        this.updateCategories();
                        this.renderTasks();
                        alert(t.importSuccess || 'Tasks imported successfully!');
                    } else {
                        throw new Error('Invalid format');
                    }
                } catch (error) {
                    alert(t.importError || 'Error importing tasks. Please check the file format.');
                }
                importInput.value = '';
            };
            reader.readAsText(file);
        });
    }

    initializeLanguage() {
        document.documentElement.lang = this.currentLanguage;
        this.updateTranslations();
    }

    setupLanguageToggle() {
        const languageToggle = document.getElementById('languageToggle');
        languageToggle.addEventListener('click', () => {
            this.currentLanguage = this.currentLanguage === 'en' ? 'vi' : 'en';
            localStorage.setItem('language', this.currentLanguage);
            document.documentElement.lang = this.currentLanguage;
            this.updateTranslations();
            this.updateComponents();
        });
    }

    updateTranslations() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (translations[this.currentLanguage][key]) {
                element.textContent = translations[this.currentLanguage][key];
            }
        });
    }

    updateComponents() {
        this.taskForm.updateTranslations(translations[this.currentLanguage]);
        this.taskFilters.updateTranslations(translations[this.currentLanguage]);
        this.taskList.updateTranslations(translations[this.currentLanguage]);
        this.renderTasks();
    }

    setupEditDialog() {
        const dialog = document.getElementById('editTaskDialog');
        const form = document.getElementById('editTaskForm');
        const taskInput = document.getElementById('editTaskInput');
        const preview = document.getElementById('editMarkdownPreview');
        
        taskInput.addEventListener('input', () => {
            preview.innerHTML = DOMPurify.sanitize(marked.parse(taskInput.value));
        });
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.editingTaskIndex !== null) {
                const updatedTask = {
                    ...this.tasks[this.editingTaskIndex],
                    text: DOMPurify.sanitize(document.getElementById('editTaskInput').value),
                    markdown: document.getElementById('editTaskInput').value,
                    priority: document.getElementById('editTaskPriority').value,
                    category: DOMPurify.sanitize(document.getElementById('editTaskCategory').value),
                    startDate: document.getElementById('editTaskStartDate').value,
                    endDate: document.getElementById('editTaskEndDate').value
                };
                
                this.tasks[this.editingTaskIndex] = updatedTask;
                this.updateLocalStorage();
                this.updateCategories();
                this.renderTasks();
                dialog.close();
            }
        });

        dialog.addEventListener('close', () => {
            this.editingTaskIndex = null;
            form.reset();
            preview.innerHTML = '';
        });
    }

    setupDarkMode() {
        const darkModeToggle = document.getElementById('darkModeToggle');
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        }

        darkModeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
        });
    }

    addTask(task) {
        this.tasks.push({
            ...task,
            createdAt: new Date().toISOString()
        });
        this.updateLocalStorage();
        this.updateCategories();
        this.renderTasks();
    }

    toggleTaskStatus(task, index) {
        this.tasks[index].completed = !this.tasks[index].completed;
        this.updateLocalStorage();
        this.renderTasks();
    }

    editTask(task, index) {
        const dialog = document.getElementById('editTaskDialog');
        const form = document.getElementById('editTaskForm');
        const preview = document.getElementById('editMarkdownPreview');
        
        document.getElementById('editTaskInput').value = task.markdown || task.text;
        document.getElementById('editTaskPriority').value = task.priority;
        document.getElementById('editTaskCategory').value = task.category || '';
        document.getElementById('editTaskStartDate').value = task.startDate || '';
        document.getElementById('editTaskEndDate').value = task.endDate || '';
        
        preview.innerHTML = DOMPurify.sanitize(marked.parse(task.markdown || task.text));
        
        this.editingTaskIndex = index;
        dialog.showModal();
    }

    editCategory(task, index) {
        const currentCategory = task.category || '';
        const newCategory = prompt(translations[this.currentLanguage].enterCategory, currentCategory);
        
        if (newCategory !== null) {
            this.tasks[index].category = DOMPurify.sanitize(newCategory.trim());
            this.updateLocalStorage();
            this.updateCategories();
            this.renderTasks();
        }
    }

    deleteTask(task, index) {
        if (confirm(translations[this.currentLanguage].deleteConfirmation)) {
            this.tasks.splice(index, 1);
            this.updateLocalStorage();
            this.updateCategories();
            this.renderTasks();
        }
    }

    filterTasks(filters) {
        this.renderTasks(filters);
    }

    renderTasks(filters = {}) {
        this.taskList.render(this.tasks, filters);
    }

    extractCategories() {
        return [...new Set(this.tasks.map(task => task.category).filter(Boolean))];
    }

    updateCategories() {
        this.categories = this.extractCategories();
        this.taskForm.updateCategories(this.categories);
        this.taskFilters.updateCategories(this.categories);
    }

    updateLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});
