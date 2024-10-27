export class TaskList {
  constructor(container, options = {}) {
      this.container = container;
      this.options = {
          itemsPerPage: options.itemsPerPage || 10,
          onStatusChange: options.onStatusChange || (() => {}),
          onEdit: options.onEdit || (() => {}),
          onDelete: options.onDelete || (() => {}),
          onCategoryEdit: options.onCategoryEdit || (() => {})
      };
      this.currentPage = 1;
  }

  sortTasks(tasks, sortBy) {
      const [criteria, direction] = sortBy.split('-');
      const priorityValues = { 'Cao': 3, 'Trung bình': 2, 'Thấp': 1 };

      const sortedTasks = [...tasks].sort((a, b) => {
          let comparison = 0;

          switch (criteria) {
              case 'dateCreated':
                  comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
                  break;
              case 'dueDate':
                  comparison = new Date(a.endDate || '9999-12-31') - new Date(b.endDate || '9999-12-31');
                  break;
              case 'priority':
                  comparison = (priorityValues[b.priority] || 0) - (priorityValues[a.priority] || 0);
                  break;
              case 'status':
                  comparison = (a.completed ? 1 : 0) - (b.completed ? 1 : 0);
                  break;
              default:
                  return 0;
          }

          return direction === 'asc' ? comparison : -comparison;
      });

      return sortedTasks;
  }

  filterTasks(tasks, filters) {
      return tasks.filter(task => {
          const matchesSearch = !filters.search ||
              task.text.toLowerCase().includes(filters.search.toLowerCase());
          const matchesPriority = !filters.priority ||
              filters.priority === 'all' ||
              task.priority === filters.priority;
          const matchesStatus = !filters.status ||
              filters.status === 'all' ||
              (filters.status === 'completed' && task.completed) ||
              (filters.status === 'incomplete' && !task.completed);
          const matchesCategory = !filters.category ||
              filters.category === 'all' ||
              task.category === filters.category;

          return matchesSearch && matchesPriority && matchesStatus && matchesCategory;
      });
  }

  render(tasks, filters = {}) {
      const startIndex = (this.currentPage - 1) * this.options.itemsPerPage;
      const endIndex = startIndex + this.options.itemsPerPage;
      
      let processedTasks = this.filterTasks(tasks, filters);
      if (filters.sortBy) {
          processedTasks = this.sortTasks(processedTasks, filters.sortBy);
      }
      
      const paginatedTasks = processedTasks.slice(startIndex, endIndex);

      this.container.innerHTML = `
      <ul class="space-y-4" role="list" aria-label="Todo list">
        ${paginatedTasks.map((task, index) => this.renderTask(task, startIndex + index)).join('')}
      </ul>
      ${this.renderPagination(processedTasks.length)}
    `;

      this.attachEventListeners(paginatedTasks);
  }

  getDueDateStatus(endDate) {
      if (!endDate) return null;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(endDate);
      const timeDiff = dueDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysDiff < 0) return 'overdue';
      if (daysDiff <= 2) return 'due-soon';
      return 'normal';
  }

  getDueDateIndicator(endDate) {
      const status = this.getDueDateStatus(endDate);
      if (!status) return '';

      const indicators = {
          'overdue': '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Overdue</span>',
          'due-soon': '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Due Soon</span>',
          'normal': ''
      };

      return indicators[status];
  }

  getTaskRowClass(task) {
      const status = this.getDueDateStatus(task.endDate);
      const baseClasses = 'bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0';
      
      if (task.completed) return `${baseClasses} opacity-50`;
      
      const statusClasses = {
          'overdue': 'border-l-4 border-red-500',
          'due-soon': 'border-l-4 border-yellow-500',
          'normal': ''
      };

      return `${baseClasses} ${statusClasses[status] || ''}`;
  }

  renderTask(task, index) {
      const dueDateIndicator = this.getDueDateIndicator(task.endDate);
      
      return `
      <li class="${this.getTaskRowClass(task)}" data-task-index="${index}">
        <div class="flex items-center space-x-2">
          <input 
            type="checkbox" 
            ${task.completed ? 'checked' : ''} 
            class="form-checkbox h-5 w-5 text-blue-600 dark:text-blue-400"
            aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}"
          >
          <span class="text-lg font-semibold ${task.completed ? 'line-through' : ''}">${
          DOMPurify.sanitize(task.text)
      }</span>
        </div>
        <div class="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
          <span class="text-sm ${this.getPriorityColor(task.priority)}">${task.priority}</span>
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">
              ${task.startDate} - ${task.endDate}
            </span>
            ${dueDateIndicator}
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-500 category-text" title="Click to edit category">
              ${task.category || 'No category'}
            </span>
            <button class="edit-category-btn text-blue-500 hover:text-blue-700 text-sm" aria-label="Edit category">
              ✎
            </button>
          </div>
          <button class="edit-btn text-blue-500 hover:text-blue-700" aria-label="Edit task">
            Edit
          </button>
          <button class="delete-btn text-red-500 hover:text-red-700" aria-label="Delete task">
            Delete
          </button>
        </div>
      </li>
    `;
  }

  renderPagination(totalItems) {
      const totalPages = Math.ceil(totalItems / this.options.itemsPerPage);
      if (totalPages <= 1) return '';

      return `
      <div class="flex justify-center space-x-2 mt-4" role="navigation" aria-label="Pagination">
        ${Array.from({ length: totalPages }, (_, i) => i + 1)
          .map(page => `
            <button 
              class="px-3 py-1 rounded ${
              page === this.currentPage
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700'
          }"
              ${page === this.currentPage ? 'aria-current="page"' : ''}
              data-page="${page}"
            >
              ${page}
            </button>
          `).join('')}
      </div>
    `;
  }

  getPriorityColor(priority) {
      const colors = {
          'Cao': 'text-red-500 dark:text-red-400',
          'Trung bình': 'text-yellow-500 dark:text-yellow-400',
          'Thấp': 'text-green-500 dark:text-green-400'
      };
      return colors[priority] || 'text-gray-500 dark:text-gray-400';
  }

  attachEventListeners(tasks) {
      this.container.querySelectorAll('input[type="checkbox"]').forEach((checkbox, index) => {
          checkbox.addEventListener('change', () => {
              this.options.onStatusChange(tasks[index], index);
          });
      });

      this.container.querySelectorAll('.edit-btn').forEach((button, index) => {
          button.addEventListener('click', () => {
              this.options.onEdit(tasks[index], index);
          });
      });

      this.container.querySelectorAll('.delete-btn').forEach((button, index) => {
          button.addEventListener('click', () => {
              this.options.onDelete(tasks[index], index);
          });
      });

      const categoryElements = this.container.querySelectorAll('.category-text, .edit-category-btn');
      categoryElements.forEach((element, index) => {
          element.addEventListener('click', () => {
              this.options.onCategoryEdit(tasks[index], index);
          });
      });

      this.container.querySelectorAll('[data-page]').forEach(button => {
          button.addEventListener('click', () => {
              this.currentPage = parseInt(button.dataset.page);
              this.render(tasks);
          });
      });
  }
}