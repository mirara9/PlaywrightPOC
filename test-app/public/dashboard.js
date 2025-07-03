// Dashboard JavaScript functionality
class DashboardApp {
    constructor() {
        this.currentUser = null;
        this.authToken = null;
        this.currentSection = 'overview';
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.setupEventListeners();
        this.loadInitialData();
    }

    // Authentication and setup
    checkAuthentication() {
        // Check for stored authentication
        const storedToken = sessionStorage.getItem('authToken');
        const storedUser = sessionStorage.getItem('currentUser');

        if (storedToken && storedUser) {
            this.authToken = storedToken;
            this.currentUser = JSON.parse(storedUser);
            this.setupUserInterface();
        } else {
            // Redirect to login if not authenticated
            window.location.href = '/';
        }
    }

    setupUserInterface() {
        if (this.currentUser) {
            document.getElementById('currentUserName').textContent = this.currentUser.name;
            document.getElementById('userAvatar').textContent = this.currentUser.name.charAt(0).toUpperCase();
            
            // Load user preferences
            this.loadUserPreferences();
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Menu toggle
        document.getElementById('menuToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Global search
        document.getElementById('globalSearch').addEventListener('input', (e) => {
            this.handleGlobalSearch(e.target.value);
        });

        // Notifications
        document.getElementById('notificationsBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleNotifications();
        });

        // Click outside to close notifications dropdown
        document.addEventListener('click', (e) => {
            const notificationsDropdown = document.getElementById('notificationsDropdown');
            const notificationsBtn = document.getElementById('notificationsBtn');
            
            if (notificationsDropdown && notificationsDropdown.classList.contains('show')) {
                if (!notificationsBtn.contains(e.target) && !notificationsDropdown.contains(e.target)) {
                    notificationsDropdown.classList.remove('show');
                }
            }
        });

        // Modal close buttons
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modalId = e.target.getAttribute('data-modal');
                this.closeModal(modalId);
            });
        });

        // Form submissions
        this.setupFormHandlers();

        // Filters
        this.setupFilters();
    }

    setupFormHandlers() {
        // Create Project Form
        document.getElementById('createProjectForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createProject();
        });

        // Create Task Form
        document.getElementById('createTaskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createTask();
        });

        // Profile Form
        document.getElementById('profileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProfile();
        });

        // Preferences Form
        document.getElementById('preferencesForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePreferences();
        });

        // Button click handlers
        document.getElementById('createProjectBtn').addEventListener('click', () => {
            this.openModal('createProjectModal');
            this.loadProjectFormData();
        });

        document.getElementById('createTaskBtn').addEventListener('click', () => {
            this.openModal('createTaskModal');
            this.loadTaskFormData();
        });

        document.getElementById('addProjectBtn').addEventListener('click', () => {
            this.openModal('createProjectModal');
        });

        document.getElementById('addUserBtn').addEventListener('click', () => {
            this.showCreateUserForm();
        });

        document.getElementById('generateReportBtn').addEventListener('click', () => {
            this.generateReport();
        });

        document.getElementById('changePasswordBtn').addEventListener('click', () => {
            this.showChangePasswordModal();
        });

        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('deleteAccountBtn').addEventListener('click', () => {
            this.showDeleteAccountConfirmation();
        });
    }

    setupFilters() {
        // Project status filter
        document.getElementById('projectStatusFilter').addEventListener('change', (e) => {
            this.filterProjects(e.target.value);
        });

        // Task status filter
        document.getElementById('taskStatusFilter').addEventListener('change', (e) => {
            this.filterTasks(e.target.value);
        });
    }

    // Navigation and UI
    showSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');

        this.currentSection = sectionName;

        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    }

    toggleNotifications() {
        const dropdown = document.getElementById('notificationsDropdown');
        dropdown.classList.toggle('show');
        
        if (dropdown.classList.contains('show')) {
            this.loadNotifications();
        }
    }

    // Data loading methods
    async loadInitialData() {
        try {
            await Promise.all([
                this.loadDashboardAnalytics(),
                this.loadRecentProjects(),
                this.loadNotifications()
            ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    async loadSectionData(section) {
        switch (section) {
            case 'overview':
                await this.loadDashboardAnalytics();
                await this.loadRecentProjects();
                break;
            case 'projects':
                await this.loadProjects();
                break;
            case 'tasks':
                await this.loadTasks();
                break;
            case 'users':
                await this.loadUsers();
                break;
            case 'reports':
                await this.loadReports();
                break;
            case 'profile':
                await this.loadProfile();
                break;
            case 'settings':
                await this.loadSettings();
                break;
        }
    }

    async makeAuthenticatedRequest(url, options = {}) {
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`
        };

        const requestOptions = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        const response = await fetch(url, requestOptions);
        
        if (response.status === 401) {
            this.logout();
            return;
        }

        return response;
    }

    // Dashboard Analytics
    async loadDashboardAnalytics() {
        try {
            const response = await this.makeAuthenticatedRequest('/api/analytics/dashboard');
            const data = await response.json();

            if (data.success) {
                const analytics = data.analytics;
                
                document.getElementById('totalProjects').textContent = analytics.totalProjects;
                document.getElementById('activeTasks').textContent = analytics.pendingTasks;
                document.getElementById('teamMembers').textContent = analytics.totalUsers;
                document.getElementById('budgetUtilization').textContent = `${Math.round(analytics.budgetUtilization)}%`;
                
                // Update notification badge
                document.getElementById('notificationBadge').textContent = analytics.unreadNotifications;
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }

    // Projects management
    async loadProjects() {
        try {
            const response = await this.makeAuthenticatedRequest('/api/projects');
            const data = await response.json();

            if (data.success) {
                this.renderProjectsTable(data.projects);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    }

    async loadRecentProjects() {
        try {
            const response = await this.makeAuthenticatedRequest('/api/projects');
            const data = await response.json();

            if (data.success) {
                const recentProjects = data.projects.slice(0, 5);
                this.renderRecentProjectsTable(recentProjects);
            }
        } catch (error) {
            console.error('Error loading recent projects:', error);
        }
    }

    renderProjectsTable(projects) {
        const tbody = document.getElementById('projectsTable');
        tbody.innerHTML = '';

        projects.forEach(project => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-testid="project-name-${project.id}">${project.name}</td>
                <td data-testid="project-description-${project.id}">${project.description}</td>
                <td><span class="status-badge status-${project.status}" data-testid="project-status-${project.id}">${project.status}</span></td>
                <td data-testid="project-priority-${project.id}">${project.priority}</td>
                <td data-testid="project-progress-${project.id}">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${project.progress}%"></div>
                    </div>
                    ${project.progress}%
                </td>
                <td data-testid="project-budget-${project.id}">$${project.budget.toLocaleString()}</td>
                <td>
                    <button class="btn btn-small btn-primary" onclick="dashboard.editProject(${project.id})" data-testid="edit-project-${project.id}">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="dashboard.deleteProject(${project.id})" data-testid="delete-project-${project.id}">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderRecentProjectsTable(projects) {
        const tbody = document.getElementById('recentProjectsTable');
        tbody.innerHTML = '';

        projects.forEach(project => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-testid="recent-project-name-${project.id}">${project.name}</td>
                <td><span class="status-badge status-${project.status}" data-testid="recent-project-status-${project.id}">${project.status}</span></td>
                <td data-testid="recent-project-progress-${project.id}">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${project.progress}%"></div>
                    </div>
                    ${project.progress}%
                </td>
                <td data-testid="recent-project-budget-${project.id}">$${project.budget.toLocaleString()}</td>
                <td>
                    <button class="btn btn-small btn-primary" onclick="dashboard.viewProject(${project.id})" data-testid="view-project-${project.id}">View</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async createProject() {
        const formData = {
            name: document.getElementById('projectName').value,
            description: document.getElementById('projectDescription').value,
            status: document.getElementById('projectStatus').value,
            priority: document.getElementById('projectPriority').value,
            budget: parseInt(document.getElementById('projectBudget').value) || 0,
            progress: 0,
            startDate: new Date().toISOString().split('T')[0],
            teamMembers: [],
            tags: []
        };

        try {
            const response = await this.makeAuthenticatedRequest('/api/projects', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Project created successfully');
                this.closeModal('createProjectModal');
                this.clearForm('createProjectForm');
                
                if (this.currentSection === 'projects' || this.currentSection === 'overview') {
                    await this.loadSectionData(this.currentSection);
                }
            } else {
                this.showError(data.message);
            }
        } catch (error) {
            console.error('Error creating project:', error);
            this.showError('Failed to create project');
        }
    }

    async editProject(id) {
        // Load project data and show edit modal
        try {
            const response = await this.makeAuthenticatedRequest(`/api/projects/${id}`);
            const data = await response.json();

            if (data.success) {
                const project = data.project;
                
                // Populate form with existing data
                document.getElementById('projectName').value = project.name;
                document.getElementById('projectDescription').value = project.description;
                document.getElementById('projectStatus').value = project.status;
                document.getElementById('projectPriority').value = project.priority;
                document.getElementById('projectBudget').value = project.budget;

                // Store project ID for update
                document.getElementById('createProjectForm').setAttribute('data-project-id', id);
                
                this.openModal('createProjectModal');
            }
        } catch (error) {
            console.error('Error loading project:', error);
        }
    }

    async deleteProject(id) {
        if (confirm('Are you sure you want to delete this project?')) {
            try {
                const response = await this.makeAuthenticatedRequest(`/api/projects/${id}`, {
                    method: 'DELETE'
                });

                const data = await response.json();

                if (data.success) {
                    this.showSuccess('Project deleted successfully');
                    await this.loadSectionData(this.currentSection);
                } else {
                    this.showError(data.message);
                }
            } catch (error) {
                console.error('Error deleting project:', error);
                this.showError('Failed to delete project');
            }
        }
    }

    async filterProjects(status) {
        try {
            const url = status ? `/api/projects?status=${status}` : '/api/projects';
            const response = await this.makeAuthenticatedRequest(url);
            const data = await response.json();

            if (data.success) {
                this.renderProjectsTable(data.projects);
            }
        } catch (error) {
            console.error('Error filtering projects:', error);
        }
    }

    // Tasks management
    async loadTasks() {
        try {
            const response = await this.makeAuthenticatedRequest('/api/tasks');
            const data = await response.json();

            if (data.success) {
                this.renderTasksTable(data.tasks);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    renderTasksTable(tasks) {
        const tbody = document.getElementById('tasksTable');
        tbody.innerHTML = '';

        tasks.forEach(task => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-testid="task-title-${task.id}">${task.title}</td>
                <td data-testid="task-project-${task.id}">Project #${task.projectId}</td>
                <td data-testid="task-assignee-${task.id}">User #${task.assignedTo}</td>
                <td><span class="status-badge status-${task.status}" data-testid="task-status-${task.id}">${task.status}</span></td>
                <td data-testid="task-priority-${task.id}">${task.priority}</td>
                <td data-testid="task-due-date-${task.id}">${task.dueDate}</td>
                <td>
                    <button class="btn btn-small btn-primary" onclick="dashboard.editTask(${task.id})" data-testid="edit-task-${task.id}">Edit</button>
                    <button class="btn btn-small btn-success" onclick="dashboard.completeTask(${task.id})" data-testid="complete-task-${task.id}">Complete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async createTask() {
        const formData = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            projectId: parseInt(document.getElementById('taskProject').value),
            assignedTo: parseInt(document.getElementById('taskAssignee').value),
            priority: document.getElementById('taskPriority').value,
            dueDate: document.getElementById('taskDueDate').value,
            status: 'pending',
            estimatedHours: 0,
            actualHours: 0,
            tags: []
        };

        try {
            const response = await this.makeAuthenticatedRequest('/api/tasks', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Task created successfully');
                this.closeModal('createTaskModal');
                this.clearForm('createTaskForm');
                
                if (this.currentSection === 'tasks') {
                    await this.loadTasks();
                }
            } else {
                this.showError(data.message);
            }
        } catch (error) {
            console.error('Error creating task:', error);
            this.showError('Failed to create task');
        }
    }

    async completeTask(id) {
        try {
            const response = await this.makeAuthenticatedRequest(`/api/tasks/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    status: 'completed',
                    completedDate: new Date().toISOString().split('T')[0]
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Task completed successfully');
                await this.loadTasks();
            } else {
                this.showError(data.message);
            }
        } catch (error) {
            console.error('Error completing task:', error);
            this.showError('Failed to complete task');
        }
    }

    async filterTasks(status) {
        try {
            const url = status ? `/api/tasks?status=${status}` : '/api/tasks';
            const response = await this.makeAuthenticatedRequest(url);
            const data = await response.json();

            if (data.success) {
                this.renderTasksTable(data.tasks);
            }
        } catch (error) {
            console.error('Error filtering tasks:', error);
        }
    }

    // Users management
    async loadUsers() {
        try {
            const response = await this.makeAuthenticatedRequest('/api/users');
            const data = await response.json();

            if (data.success) {
                this.renderUsersTable(data.users);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    renderUsersTable(users) {
        const tbody = document.getElementById('usersTable');
        tbody.innerHTML = '';

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-testid="user-name-${user.id}">${user.name}</td>
                <td data-testid="user-email-${user.id}">${user.email}</td>
                <td data-testid="user-role-${user.id}">${user.role}</td>
                <td data-testid="user-department-${user.id}">${user.department}</td>
                <td data-testid="user-last-login-${user.id}">${new Date(user.lastLogin).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-small btn-primary" onclick="dashboard.editUser(${user.id})" data-testid="edit-user-${user.id}">Edit</button>
                    <button class="btn btn-small btn-secondary" onclick="dashboard.viewUser(${user.id})" data-testid="view-user-${user.id}">View</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Reports and Analytics
    async loadReports() {
        try {
            const response = await this.makeAuthenticatedRequest('/api/reports');
            const data = await response.json();

            if (data.success) {
                this.renderReportsTable(data.reports);
                this.updateReportsMetrics(data.reports);
            }
        } catch (error) {
            console.error('Error loading reports:', error);
        }
    }

    renderReportsTable(reports) {
        const tbody = document.getElementById('reportsTable');
        tbody.innerHTML = '';

        reports.forEach(report => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-testid="report-name-${report.id}">${report.name}</td>
                <td data-testid="report-type-${report.id}">${report.type}</td>
                <td data-testid="report-generated-${report.id}">${new Date(report.generatedAt).toLocaleDateString()}</td>
                <td data-testid="report-generated-by-${report.id}">User #${report.generatedBy}</td>
                <td>
                    <button class="btn btn-small btn-primary" onclick="dashboard.viewReport(${report.id})" data-testid="view-report-${report.id}">View</button>
                    <button class="btn btn-small btn-secondary" onclick="dashboard.downloadReport(${report.id})" data-testid="download-report-${report.id}">Download</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateReportsMetrics(reports) {
        // Update performance metrics (mock data for demonstration)
        document.getElementById('teamProductivity').textContent = '85%';
        document.getElementById('onTimeDelivery').textContent = '78%';
        document.getElementById('qualityScore').textContent = '92%';
        
        // Update financial metrics (mock data)
        document.getElementById('totalBudget').textContent = '$430,000';
        document.getElementById('amountSpent').textContent = '$217,500';
        document.getElementById('remainingBudget').textContent = '$212,500';
    }

    async generateReport() {
        this.showSuccess('Report generation started. You will be notified when it\'s ready.');
        // In a real app, this would trigger report generation
    }

    // Profile management
    async loadProfile() {
        if (this.currentUser) {
            document.getElementById('profileName').value = this.currentUser.name || '';
            document.getElementById('profileEmail').value = this.currentUser.email || '';
            document.getElementById('profilePhone').value = this.currentUser.phone || '';
            document.getElementById('profileDepartment').value = this.currentUser.department || '';
            document.getElementById('profileLocation').value = this.currentUser.location || '';
        }
    }

    async updateProfile() {
        const formData = {
            name: document.getElementById('profileName').value,
            email: document.getElementById('profileEmail').value,
            phone: document.getElementById('profilePhone').value,
            department: document.getElementById('profileDepartment').value,
            location: document.getElementById('profileLocation').value
        };

        try {
            const response = await this.makeAuthenticatedRequest(`/api/users/${this.currentUser.id}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Profile updated successfully');
                
                // Update current user data
                this.currentUser = { ...this.currentUser, ...data.user };
                sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                this.setupUserInterface();
            } else {
                this.showError(data.message);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showError('Failed to update profile');
        }
    }

    // Settings management
    async loadSettings() {
        try {
            const response = await this.makeAuthenticatedRequest('/api/settings');
            const data = await response.json();

            if (data.success) {
                const preferences = data.settings.userPreferences;
                
                document.getElementById('themeSelect').value = preferences.theme || 'light';
                document.getElementById('languageSelect').value = preferences.language || 'en';
                document.getElementById('timezoneSelect').value = preferences.timezone || 'EST';
                document.getElementById('notificationsEnabled').checked = preferences.notifications !== false;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async savePreferences() {
        const preferences = {
            theme: document.getElementById('themeSelect').value,
            language: document.getElementById('languageSelect').value,
            timezone: document.getElementById('timezoneSelect').value,
            notifications: document.getElementById('notificationsEnabled').checked
        };

        try {
            const response = await this.makeAuthenticatedRequest('/api/settings/preferences', {
                method: 'PUT',
                body: JSON.stringify(preferences)
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Preferences saved successfully');
                this.applyTheme(preferences.theme);
            } else {
                this.showError(data.message);
            }
        } catch (error) {
            console.error('Error saving preferences:', error);
            this.showError('Failed to save preferences');
        }
    }

    async loadUserPreferences() {
        await this.loadSettings();
    }

    applyTheme(theme) {
        document.body.className = theme === 'dark' ? 'dark-theme' : '';
    }

    // Notifications
    async loadNotifications() {
        try {
            const response = await this.makeAuthenticatedRequest('/api/notifications');
            const data = await response.json();

            if (data.success) {
                this.renderNotifications(data.notifications);
                
                // Update badge count
                const unreadCount = data.notifications.filter(n => !n.read).length;
                document.getElementById('notificationBadge').textContent = unreadCount;
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    renderNotifications(notifications) {
        const dropdown = document.getElementById('notificationsDropdown');
        dropdown.innerHTML = '';

        if (notifications.length === 0) {
            dropdown.innerHTML = '<div class="notification-item">No notifications</div>';
            return;
        }

        notifications.forEach(notification => {
            const item = document.createElement('div');
            item.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
            item.setAttribute('data-testid', `notification-${notification.id}`);
            item.innerHTML = `
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${this.formatTime(notification.createdAt)}</div>
            `;
            
            item.addEventListener('click', () => {
                this.markNotificationAsRead(notification.id);
            });
            
            dropdown.appendChild(item);
        });
    }

    async markNotificationAsRead(id) {
        try {
            await this.makeAuthenticatedRequest(`/api/notifications/${id}/read`, {
                method: 'PUT'
            });
            
            // Reload notifications
            await this.loadNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    // Search functionality
    async handleGlobalSearch(query) {
        if (query.length < 2) return;

        try {
            const response = await this.makeAuthenticatedRequest(`/api/search?query=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (data.success) {
                this.displaySearchResults(data.results);
            }
        } catch (error) {
            console.error('Error searching:', error);
        }
    }

    displaySearchResults(results) {
        // This would show search results in a dropdown or modal
        console.log('Search results:', results);
    }

    // Modal management
    openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    // Form helpers
    clearForm(formId) {
        const form = document.getElementById(formId);
        form.reset();
        form.removeAttribute('data-project-id');
    }

    async loadProjectFormData() {
        // This would load data needed for the project form (like users for assignment)
    }

    async loadTaskFormData() {
        // Load projects and users for task form
        try {
            const [projectsResponse, usersResponse] = await Promise.all([
                this.makeAuthenticatedRequest('/api/projects'),
                this.makeAuthenticatedRequest('/api/users')
            ]);

            const projectsData = await projectsResponse.json();
            const usersData = await usersResponse.json();

            if (projectsData.success) {
                const projectSelect = document.getElementById('taskProject');
                projectSelect.innerHTML = '<option value="">Select Project</option>';
                
                projectsData.projects.forEach(project => {
                    const option = document.createElement('option');
                    option.value = project.id;
                    option.textContent = project.name;
                    projectSelect.appendChild(option);
                });
            }

            if (usersData.success) {
                const userSelect = document.getElementById('taskAssignee');
                userSelect.innerHTML = '<option value="">Select User</option>';
                
                usersData.users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = user.name;
                    userSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading form data:', error);
        }
    }

    // Utility methods
    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    showSuccess(message) {
        // Create and show success toast
        this.showToast(message, 'success');
    }

    showError(message) {
        // Create and show error toast
        this.showToast(message, 'error');
    }

    showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            z-index: 10000;
            background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    logout() {
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('currentUser');
        window.location.href = '/';
    }

    // Placeholder methods for additional functionality
    viewProject(id) { this.showSuccess(`Viewing project ${id}`); }
    editTask(id) { this.showSuccess(`Editing task ${id}`); }
    editUser(id) { this.showSuccess(`Editing user ${id}`); }
    viewUser(id) { this.showSuccess(`Viewing user ${id}`); }
    viewReport(id) { this.showSuccess(`Viewing report ${id}`); }
    downloadReport(id) { this.showSuccess(`Downloading report ${id}`); }
    showCreateUserForm() { this.showSuccess('Create user form would open here'); }
    showChangePasswordModal() { this.showSuccess('Change password modal would open here'); }
    exportData() { this.showSuccess('Data export started'); }
    showDeleteAccountConfirmation() { 
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            this.showSuccess('Account deletion would be processed here');
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DashboardApp();
});

// Handle authentication from login page
window.addEventListener('storage', (e) => {
    if (e.key === 'authToken' && e.newValue) {
        window.location.reload();
    }
});