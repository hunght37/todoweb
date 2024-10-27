export class TaskFilters {
  constructor(container, options = {}) {
      this.container = container;
      this.options = {
          onFilter: options.onFilter || (() => {}),
          categories: options.categories || [],
          translations: options.translations || {}
      };
      this.render();
  }

  updateTranslations(translations) {
      this.options.translations = translations;
      this.render();
  }

  render() {
      const t = this.options.translations;
      this.container.innerHTML = `
      <div class="mb-4 grid grid-cols-1 md:grid-cols-5 gap-4" role="search">
        <div class="form-group">
          <label for="searchInput" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            ${t.searchTasks || 'Search Tasks'}
          </label>
          <input 
            type="text" 
            id="searchInput" 
            placeholder="${t.search || 'Search...'}" 
            class="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          >
        </div>

        <div class="form-group">
          <label for="filterPriority" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            ${t.priorityFilter || 'Priority Filter'}
          </label>
          <select 
            id="filterPriority" 
            class="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          >
            <option value="all">${t.allPriorities || 'All priorities'}</option>
            <option value="Cao">${t.high || 'High'}</option>
            <option value="Trung bình">${t.medium || 'Medium'}</option>
            <option value="Thấp">${t.low || 'Low'}</option>
          </select>
        </div>

        <div class="form-group">
          <label for="filterStatus" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            ${t.statusFilter || 'Status Filter'}
          </label>
          <select 
            id="filterStatus" 
            class="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          >
            <option value="all">${t.allStatuses || 'All statuses'}</option>
            <option value="completed">${t.completed || 'Completed'}</option>
            <option value="incomplete">${t.incomplete || 'Incomplete'}</option>
          </select>
        </div>

        <div class="form-group">
          <label for="filterCategory" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            ${t.categoryFilter || 'Category Filter'}
          </label>
          <select 
            id="filterCategory" 
            class="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          >
            <option value="all">${t.allCategories || 'All categories'}</option>
            ${this.options.categories.map(category => `
              <option value="${category}">${category}</option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label for="sortBy" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            ${t.sortBy || 'Sort By'}
          </label>
          <select 
            id="sortBy" 
            class="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          >
            <option value="dateCreated-desc">${t.dateCreatedNewest || 'Date Created (Newest)'}</option>
            <option value="dateCreated-asc">${t.dateCreatedOldest || 'Date Created (Oldest)'}</option>
            <option value="dueDate-asc">${t.dueDateEarliest || 'Due Date (Earliest)'}</option>
            <option value="dueDate-desc">${t.dueDateLatest || 'Due Date (Latest)'}</option>
            <option value="priority-desc">${t.priorityHighToLow || 'Priority (High to Low)'}</option>
            <option value="priority-asc">${t.priorityLowToHigh || 'Priority (Low to High)'}</option>
            <option value="status-desc">${t.statusCompletedFirst || 'Status (Completed First)'}</option>
            <option value="status-asc">${t.statusIncompleteFirst || 'Status (Incomplete First)'}</option>
          </select>
        </div>
      </div>
    `;

      this.attachEventListeners();
  }

  attachEventListeners() {
      const inputs = [
          'searchInput',
          'filterPriority',
          'filterStatus',
          'filterCategory',
          'sortBy'
      ];

      inputs.forEach(id => {
          this.container.querySelector(`#${id}`).addEventListener('input', () => {
              this.emitFilters();
          });
      });
  }

  emitFilters() {
      const filters = {
          search: this.container.querySelector('#searchInput').value,
          priority: this.container.querySelector('#filterPriority').value,
          status: this.container.querySelector('#filterStatus').value,
          category: this.container.querySelector('#filterCategory').value,
          sortBy: this.container.querySelector('#sortBy').value
      };

      this.options.onFilter(filters);
  }

  updateCategories(categories) {
      this.options.categories = categories;
      this.render();
  }
}