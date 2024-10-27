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
        this.renderTasks();
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
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.editingTaskIndex !== null) {
                const updatedTask = {
                    ...this.tasks[this.editingTaskIndex],
                    text: DOMPurify.sanitize(document.getElementById('editTaskInput').value),
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
        
        document.getElementById('editTaskInput').value = task.text;
        document.getElementById('editTaskPriority').value = task.priority;
        document.getElementById('editTaskCategory').value = task.category || '';
        document.getElementById('editTaskStartDate').value = task.startDate || '';
        document.getElementById('editTaskEndDate').value = task.endDate || '';
        
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