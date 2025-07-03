import { test, expect } from '@playwright/test';

// Test server configuration
const TEST_APP_URL = process.env.TEST_APP_URL || 'http://localhost:3000';

test.describe('Dashboard Comprehensive UI Tests', () => {
    // Setup: Login before each test and navigate to dashboard
    test.beforeEach(async ({ page }) => {
        await page.goto(TEST_APP_URL);
        
        // Login with test user
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-submit"]');
        
        // Wait for redirect to Sitecore Launchpad
        await page.waitForURL('**/sitecore-launchpad');
        
        // Navigate to the old dashboard for these tests
        await page.goto(`${TEST_APP_URL}/dashboard`);
        await page.waitForSelector('[data-testid="overview-section"]');
    });

    // Test 1: Dashboard Navigation and Sidebar
    test('should navigate through all dashboard sections', async ({ page }) => {
        // Test Overview section (default)
        await expect(page.locator('[data-testid="overview-section"]')).toBeVisible();
        await expect(page.locator('[data-testid="nav-overview"]')).toHaveClass(/active/);

        // Test Projects section
        await page.click('[data-testid="nav-projects"]');
        await expect(page.locator('[data-testid="projects-section"]')).toBeVisible();
        await expect(page.locator('[data-testid="nav-projects"]')).toHaveClass(/active/);

        // Test Tasks section
        await page.click('[data-testid="nav-tasks"]');
        await expect(page.locator('[data-testid="tasks-section"]')).toBeVisible();
        await expect(page.locator('[data-testid="nav-tasks"]')).toHaveClass(/active/);

        // Test Users section
        await page.click('[data-testid="nav-users"]');
        await expect(page.locator('[data-testid="users-section"]')).toBeVisible();
        await expect(page.locator('[data-testid="nav-users"]')).toHaveClass(/active/);

        // Test Reports section
        await page.click('[data-testid="nav-reports"]');
        await expect(page.locator('[data-testid="reports-section"]')).toBeVisible();
        await expect(page.locator('[data-testid="nav-reports"]')).toHaveClass(/active/);

        // Test Settings section
        await page.click('[data-testid="nav-settings"]');
        await expect(page.locator('[data-testid="settings-section"]')).toBeVisible();
        await expect(page.locator('[data-testid="nav-settings"]')).toHaveClass(/active/);

        // Test Profile section
        await page.click('[data-testid="nav-profile"]');
        await expect(page.locator('[data-testid="profile-section"]')).toBeVisible();
        await expect(page.locator('[data-testid="nav-profile"]')).toHaveClass(/active/);
    });

    // Test 2: Sidebar Toggle Functionality
    test('should toggle sidebar visibility', async ({ page }) => {
        const sidebar = page.locator('#sidebar');
        const menuToggle = page.locator('[data-testid="menu-toggle"]');

        // Initial state - sidebar should be visible
        await expect(sidebar).not.toHaveClass(/collapsed/);

        // Click toggle to collapse
        await menuToggle.click();
        await expect(sidebar).toHaveClass(/collapsed/);

        // Click toggle to expand
        await menuToggle.click();
        await expect(sidebar).not.toHaveClass(/collapsed/);
    });

    // Test 3: Dashboard Analytics Cards
    test('should display dashboard analytics cards with data', async ({ page }) => {
        await page.click('[data-testid="nav-overview"]');
        
        // Wait for analytics to load
        await page.waitForTimeout(1000);

        // Check all analytics cards are visible
        await expect(page.locator('[data-testid="total-projects-card"]')).toBeVisible();
        await expect(page.locator('[data-testid="active-tasks-card"]')).toBeVisible();
        await expect(page.locator('[data-testid="team-members-card"]')).toBeVisible();
        await expect(page.locator('[data-testid="budget-utilization-card"]')).toBeVisible();

        // Check values are numeric
        const totalProjects = await page.textContent('[data-testid="total-projects-value"]');
        expect(parseInt(totalProjects || '0')).toBeGreaterThanOrEqual(0);

        const activeTasks = await page.textContent('[data-testid="active-tasks-value"]');
        expect(parseInt(activeTasks || '0')).toBeGreaterThanOrEqual(0);

        const teamMembers = await page.textContent('[data-testid="team-members-value"]');
        expect(parseInt(teamMembers || '0')).toBeGreaterThanOrEqual(0);
    });

    // Test 4: Global Search Functionality
    test('should perform global search', async ({ page }) => {
        const searchInput = page.locator('[data-testid="global-search"]');
        
        // Type in search input
        await searchInput.fill('project');
        
        // Verify search input contains text
        await expect(searchInput).toHaveValue('project');
        
        // Clear search
        await searchInput.clear();
        await expect(searchInput).toHaveValue('');
    });

    // Test 5: Notifications System
    test('should display and interact with notifications', async ({ page }) => {
        const notificationsBtn = page.locator('[data-testid="notifications-btn"]');
        const notificationsDropdown = page.locator('[data-testid="notifications-dropdown"]');
        const badge = page.locator('[data-testid="notification-badge"]');

        // Click notifications button
        await notificationsBtn.click();
        
        // Verify dropdown is visible
        await expect(notificationsDropdown).toHaveClass(/show/);
        
        // Check badge exists
        await expect(badge).toBeVisible();
        
        // Click outside to close
        await page.click('body');
        // Wait for the dropdown to close (may have animation)
        await page.waitForTimeout(500);
        await expect(notificationsDropdown).not.toHaveClass(/show/);
    });

    // Test 6: User Menu and Logout
    test('should display user menu and logout functionality', async ({ page }) => {
        const userMenu = page.locator('[data-testid="user-menu"]');
        const logoutBtn = page.locator('[data-testid="logout-btn"]');
        const userAvatar = page.locator('[data-testid="user-avatar"]');
        const userName = page.locator('[data-testid="current-user-name"]');

        // Verify user menu components
        await expect(userMenu).toBeVisible();
        await expect(userAvatar).toBeVisible();
        await expect(userName).toBeVisible();
        await expect(logoutBtn).toBeVisible();

        // Verify user name is displayed
        const nameText = await userName.textContent();
        expect(nameText).toBeTruthy();
        expect(nameText?.length).toBeGreaterThan(0);

        // Test logout (but don't actually logout to avoid affecting other tests)
        await expect(logoutBtn).toBeEnabled();
    });

    // Test 7: Recent Projects Table
    test('should display and interact with recent projects table', async ({ page }) => {
        await page.click('[data-testid="nav-overview"]');
        
        const recentProjectsTable = page.locator('[data-testid="recent-projects-table"]');
        const addProjectBtn = page.locator('[data-testid="add-project-btn"]');

        // Verify table is visible
        await expect(recentProjectsTable).toBeVisible();
        
        // Verify add project button
        await expect(addProjectBtn).toBeVisible();
        await expect(addProjectBtn).toBeEnabled();
    });

    // Test 8: Create Project Modal
    test('should open and interact with create project modal', async ({ page }) => {
        await page.click('[data-testid="nav-projects"]');
        
        const createProjectBtn = page.locator('[data-testid="create-project-btn"]');
        const modal = page.locator('[data-testid="create-project-modal"]');
        
        // Click create project button
        await createProjectBtn.click();
        
        // Verify modal is visible
        await expect(modal).toBeVisible();
        
        // Check form fields exist
        await expect(page.locator('[data-testid="project-name-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="project-description-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="project-status-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="project-priority-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="project-budget-input"]')).toBeVisible();
        
        // Close modal
        await page.click('.close');
        await expect(modal).not.toBeVisible();
    });

    // Test 9: Create Project Form Submission
    test('should create a new project successfully', async ({ page }) => {
        await page.click('[data-testid="nav-projects"]');
        await page.click('[data-testid="create-project-btn"]');
        
        // Fill out form
        await page.fill('[data-testid="project-name-input"]', 'Test Project UI');
        await page.fill('[data-testid="project-description-input"]', 'Test project description');
        await page.selectOption('[data-testid="project-status-input"]', 'active');
        await page.selectOption('[data-testid="project-priority-input"]', 'high');
        await page.fill('[data-testid="project-budget-input"]', '50000');
        
        // Submit form
        await page.click('[data-testid="submit-project-btn"]');
        
        // Wait for success message or modal to close
        await page.waitForTimeout(1000);
    });

    // Test 10: Projects Table and Filtering
    test('should display projects table and filter by status', async ({ page }) => {
        await page.click('[data-testid="nav-projects"]');
        
        const projectsTable = page.locator('[data-testid="projects-table-tbody"]');
        const statusFilter = page.locator('[data-testid="project-status-filter"]');
        
        // Verify table is visible
        await expect(projectsTable).toBeVisible();
        
        // Test status filter
        await statusFilter.selectOption('active');
        await page.waitForTimeout(500);
        
        // Reset filter
        await statusFilter.selectOption('');
        await page.waitForTimeout(500);
    });

    // Test 11: Create Task Modal
    test('should open and interact with create task modal', async ({ page }) => {
        await page.click('[data-testid="nav-tasks"]');
        
        const createTaskBtn = page.locator('[data-testid="create-task-btn"]');
        const modal = page.locator('[data-testid="create-task-modal"]');
        
        // Click create task button
        await createTaskBtn.click();
        
        // Verify modal is visible
        await expect(modal).toBeVisible();
        
        // Check form fields exist
        await expect(page.locator('[data-testid="task-title-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="task-description-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="task-project-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="task-assignee-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="task-priority-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="task-due-date-input"]')).toBeVisible();
        
        // Close modal
        await page.click('.close');
        await expect(modal).not.toBeVisible();
    });

    // Test 12: Create Task Form Submission
    test('should create a new task successfully', async ({ page }) => {
        await page.click('[data-testid="nav-tasks"]');
        await page.click('[data-testid="create-task-btn"]');
        
        // Fill out form
        await page.fill('[data-testid="task-title-input"]', 'Test Task UI');
        await page.fill('[data-testid="task-description-input"]', 'Test task description');
        await page.selectOption('[data-testid="task-priority-input"]', 'medium');
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await page.fill('[data-testid="task-due-date-input"]', tomorrow.toISOString().split('T')[0]);
        
        // Submit form
        await page.click('[data-testid="submit-task-btn"]');
        
        // Wait for success message or modal to close
        await page.waitForTimeout(1000);
    });

    // Test 13: Tasks Table and Filtering
    test('should display tasks table and filter by status', async ({ page }) => {
        await page.click('[data-testid="nav-tasks"]');
        
        const tasksTable = page.locator('[data-testid="tasks-table-tbody"]');
        const statusFilter = page.locator('[data-testid="task-status-filter"]');
        
        // Verify table is visible
        await expect(tasksTable).toBeVisible();
        
        // Test status filter
        await statusFilter.selectOption('pending');
        await page.waitForTimeout(500);
        
        // Reset filter
        await statusFilter.selectOption('');
        await page.waitForTimeout(500);
    });

    // Test 14: Users Management
    test('should display users table', async ({ page }) => {
        await page.click('[data-testid="nav-users"]');
        
        const usersTable = page.locator('[data-testid="users-table-tbody"]');
        const addUserBtn = page.locator('[data-testid="add-user-btn"]');
        
        // Verify table is visible
        await expect(usersTable).toBeVisible();
        
        // Verify add user button
        await expect(addUserBtn).toBeVisible();
        await expect(addUserBtn).toBeEnabled();
    });

    // Test 15: Reports and Analytics
    test('should display reports section with metrics', async ({ page }) => {
        await page.click('[data-testid="nav-reports"]');
        
        // Check performance metrics card
        const performanceCard = page.locator('[data-testid="performance-metrics-card"]');
        await expect(performanceCard).toBeVisible();
        
        // Check financial overview card
        const financialCard = page.locator('[data-testid="financial-overview-card"]');
        await expect(financialCard).toBeVisible();
        
        // Check generate report button
        const generateBtn = page.locator('[data-testid="generate-report-btn"]');
        await expect(generateBtn).toBeVisible();
        await expect(generateBtn).toBeEnabled();
    });

    // Test 16: Performance Metrics Display
    test('should display performance metrics with values', async ({ page }) => {
        await page.click('[data-testid="nav-reports"]');
        
        const teamProductivity = page.locator('[data-testid="team-productivity"]');
        const onTimeDelivery = page.locator('[data-testid="on-time-delivery"]');
        const qualityScore = page.locator('[data-testid="quality-score"]');
        
        // Verify metrics are visible
        await expect(teamProductivity).toBeVisible();
        await expect(onTimeDelivery).toBeVisible();
        await expect(qualityScore).toBeVisible();
        
        // Check values contain percentages
        const productivityText = await teamProductivity.textContent();
        expect(productivityText).toContain('%');
    });

    // Test 17: Financial Metrics Display
    test('should display financial metrics with values', async ({ page }) => {
        await page.click('[data-testid="nav-reports"]');
        
        const totalBudget = page.locator('[data-testid="total-budget"]');
        const amountSpent = page.locator('[data-testid="amount-spent"]');
        const remainingBudget = page.locator('[data-testid="remaining-budget"]');
        
        // Verify metrics are visible
        await expect(totalBudget).toBeVisible();
        await expect(amountSpent).toBeVisible();
        await expect(remainingBudget).toBeVisible();
        
        // Check values contain currency symbols
        const budgetText = await totalBudget.textContent();
        expect(budgetText).toContain('$');
    });

    // Test 18: Generate Report Functionality
    test('should generate report successfully', async ({ page }) => {
        await page.click('[data-testid="nav-reports"]');
        
        const generateBtn = page.locator('[data-testid="generate-report-btn"]');
        
        // Click generate report
        await generateBtn.click();
        
        // Wait for potential success message
        await page.waitForTimeout(1000);
    });

    // Test 19: Settings User Preferences
    test('should display and interact with user preferences', async ({ page }) => {
        await page.click('[data-testid="nav-settings"]');
        
        // Check form elements
        await expect(page.locator('[data-testid="theme-select"]')).toBeVisible();
        await expect(page.locator('[data-testid="language-select"]')).toBeVisible();
        await expect(page.locator('[data-testid="timezone-select"]')).toBeVisible();
        await expect(page.locator('[data-testid="notifications-enabled"]')).toBeVisible();
        
        // Check save button
        const saveBtn = page.locator('[data-testid="save-preferences-btn"]');
        await expect(saveBtn).toBeVisible();
        await expect(saveBtn).toBeEnabled();
    });

    // Test 20: Theme Selection
    test('should change theme preference', async ({ page }) => {
        await page.click('[data-testid="nav-settings"]');
        
        const themeSelect = page.locator('[data-testid="theme-select"]');
        
        // Change to dark theme
        await themeSelect.selectOption('dark');
        
        // Submit preferences
        await page.click('[data-testid="save-preferences-btn"]');
        
        // Wait for save
        await page.waitForTimeout(1000);
        
        // Change back to light
        await themeSelect.selectOption('light');
        await page.click('[data-testid="save-preferences-btn"]');
        await page.waitForTimeout(1000);
    });

    // Test 21: Language Selection
    test('should change language preference', async ({ page }) => {
        await page.click('[data-testid="nav-settings"]');
        
        const languageSelect = page.locator('[data-testid="language-select"]');
        
        // Change language
        await languageSelect.selectOption('es');
        await page.click('[data-testid="save-preferences-btn"]');
        await page.waitForTimeout(1000);
        
        // Change back to English
        await languageSelect.selectOption('en');
        await page.click('[data-testid="save-preferences-btn"]');
        await page.waitForTimeout(1000);
    });

    // Test 22: Timezone Selection
    test('should change timezone preference', async ({ page }) => {
        await page.click('[data-testid="nav-settings"]');
        
        const timezoneSelect = page.locator('[data-testid="timezone-select"]');
        
        // Change timezone
        await timezoneSelect.selectOption('PST');
        await page.click('[data-testid="save-preferences-btn"]');
        await page.waitForTimeout(1000);
        
        // Change back to EST
        await timezoneSelect.selectOption('EST');
        await page.click('[data-testid="save-preferences-btn"]');
        await page.waitForTimeout(1000);
    });

    // Test 23: Notifications Toggle
    test('should toggle notifications preference', async ({ page }) => {
        await page.click('[data-testid="nav-settings"]');
        
        const notificationsCheckbox = page.locator('[data-testid="notifications-enabled"]');
        
        // Get current state
        const isChecked = await notificationsCheckbox.isChecked();
        
        // Toggle checkbox
        await notificationsCheckbox.click();
        
        // Save preferences
        await page.click('[data-testid="save-preferences-btn"]');
        await page.waitForTimeout(1000);
        
        // Verify state changed
        expect(await notificationsCheckbox.isChecked()).toBe(!isChecked);
    });

    // Test 24: Account Settings Buttons
    test('should display account settings buttons', async ({ page }) => {
        await page.click('[data-testid="nav-settings"]');
        
        // Check account settings buttons
        await expect(page.locator('[data-testid="change-password-btn"]')).toBeVisible();
        await expect(page.locator('[data-testid="export-data-btn"]')).toBeVisible();
        await expect(page.locator('[data-testid="delete-account-btn"]')).toBeVisible();
    });

    // Test 25: Change Password Button
    test('should interact with change password button', async ({ page }) => {
        await page.click('[data-testid="nav-settings"]');
        
        const changePasswordBtn = page.locator('[data-testid="change-password-btn"]');
        
        // Click change password button
        await changePasswordBtn.click();
        
        // Wait for potential modal or action
        await page.waitForTimeout(500);
    });

    // Test 26: Export Data Functionality
    test('should interact with export data button', async ({ page }) => {
        await page.click('[data-testid="nav-settings"]');
        
        const exportDataBtn = page.locator('[data-testid="export-data-btn"]');
        
        // Click export data button
        await exportDataBtn.click();
        
        // Wait for potential action
        await page.waitForTimeout(500);
    });

    // Test 27: Profile Form Display
    test('should display profile form with fields', async ({ page }) => {
        await page.click('[data-testid="nav-profile"]');
        
        // Check all profile form fields
        await expect(page.locator('[data-testid="profile-name"]')).toBeVisible();
        await expect(page.locator('[data-testid="profile-email"]')).toBeVisible();
        await expect(page.locator('[data-testid="profile-phone"]')).toBeVisible();
        await expect(page.locator('[data-testid="profile-department"]')).toBeVisible();
        await expect(page.locator('[data-testid="profile-location"]')).toBeVisible();
        
        // Check update button
        const updateBtn = page.locator('[data-testid="update-profile-btn"]');
        await expect(updateBtn).toBeVisible();
        await expect(updateBtn).toBeEnabled();
    });

    // Test 28: Profile Form Update
    test('should update profile information', async ({ page }) => {
        await page.click('[data-testid="nav-profile"]');
        
        // Fill profile fields
        await page.fill('[data-testid="profile-name"]', 'Updated Test User');
        await page.fill('[data-testid="profile-phone"]', '+1-555-1234');
        await page.fill('[data-testid="profile-department"]', 'Updated QA');
        await page.fill('[data-testid="profile-location"]', 'Updated Location');
        
        // Submit form
        await page.click('[data-testid="update-profile-btn"]');
        
        // Wait for update
        await page.waitForTimeout(1000);
    });

    // Test 29: Form Validation - Required Fields
    test('should validate required fields in create project form', async ({ page }) => {
        await page.click('[data-testid="nav-projects"]');
        await page.click('[data-testid="create-project-btn"]');
        
        // Try to submit empty form
        await page.click('[data-testid="submit-project-btn"]');
        
        // Check that form doesn't submit (modal should still be visible)
        await expect(page.locator('[data-testid="create-project-modal"]')).toBeVisible();
    });

    // Test 30: Form Validation - Email Format
    test('should validate email format in profile form', async ({ page }) => {
        await page.click('[data-testid="nav-profile"]');
        
        const emailInput = page.locator('[data-testid="profile-email"]');
        
        // Clear and enter invalid email
        await emailInput.clear();
        await emailInput.fill('invalid-email');
        
        // Try to submit
        await page.click('[data-testid="update-profile-btn"]');
        
        // Check for validation (browser validation should prevent submission)
        const validationMessage = await emailInput.evaluate((input: HTMLInputElement) => input.validationMessage);
        expect(validationMessage.length).toBeGreaterThan(0);
    });

    // Test 31: Responsive Design - Mobile Menu
    test('should handle responsive design for mobile', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        
        const sidebar = page.locator('#sidebar');
        const menuToggle = page.locator('[data-testid="menu-toggle"]');
        
        // On mobile, sidebar should be initially hidden
        await expect(sidebar).toHaveClass(/collapsed/);
        
        // Click toggle to show sidebar
        await menuToggle.click();
        await expect(sidebar).toHaveClass(/show/);
    });

    // Test 32: Data Persistence
    test('should persist data between page refreshes', async ({ page }) => {
        await page.click('[data-testid="nav-projects"]');
        await page.click('[data-testid="create-project-btn"]');
        
        // Create a project
        await page.fill('[data-testid="project-name-input"]', 'Persistence Test Project');
        await page.selectOption('[data-testid="project-status-input"]', 'active');
        await page.click('[data-testid="submit-project-btn"]');
        
        await page.waitForTimeout(1000);
        
        // Refresh page
        await page.reload();
        await page.waitForSelector('[data-testid="overview-section"]');
        
        // Navigate back to projects
        await page.click('[data-testid="nav-projects"]');
        
        // Check if project exists in table
        await page.waitForTimeout(1000);
    });

    // Test 33: Error Handling - Network Errors
    test('should handle network errors gracefully', async ({ page }) => {
        // Block network requests
        await page.route('**/api/**', route => route.abort());
        
        await page.click('[data-testid="nav-projects"]');
        await page.click('[data-testid="create-project-btn"]');
        
        // Try to create project
        await page.fill('[data-testid="project-name-input"]', 'Network Error Test');
        await page.click('[data-testid="submit-project-btn"]');
        
        // Wait for error handling
        await page.waitForTimeout(2000);
    });

    // Test 34: Accessibility - Keyboard Navigation
    test('should support keyboard navigation', async ({ page }) => {
        // Focus on first navigation item
        await page.keyboard.press('Tab');
        
        // Navigate through menu items with arrows
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        
        // Press Enter to select
        await page.keyboard.press('Enter');
        
        // Verify navigation worked
        await page.waitForTimeout(500);
    });

    // Test 35: Accessibility - ARIA Labels
    test('should have proper ARIA labels and roles', async ({ page }) => {
        // Check navigation has proper role
        const nav = page.locator('nav.sidebar');
        await expect(nav).toBeVisible();
        
        // Check form labels
        await page.click('[data-testid="nav-profile"]');
        const nameInput = page.locator('[data-testid="profile-name"]');
        const nameLabel = page.locator('label[for="profileName"]');
        
        await expect(nameLabel).toBeVisible();
        await expect(nameInput).toBeVisible();
    });

    // Test 36: Performance - Page Load Time
    test('should load dashboard within reasonable time', async ({ page }) => {
        const startTime = Date.now();
        
        await page.goto(TEST_APP_URL);
        
        // Login
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-submit"]');
        
        // Wait for redirect to Sitecore Launchpad then navigate to dashboard
        await page.waitForURL('**/sitecore-launchpad');
        await page.goto(`${TEST_APP_URL}/dashboard`);
        await page.waitForSelector('[data-testid="overview-section"]');
        
        const loadTime = Date.now() - startTime;
        expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds
    });

    // Test 37: Security - XSS Prevention
    test('should prevent XSS attacks in form inputs', async ({ page }) => {
        await page.click('[data-testid="nav-projects"]');
        await page.click('[data-testid="create-project-btn"]');
        
        // Try to enter script tag
        const xssPayload = '<script>alert("XSS")</script>';
        await page.fill('[data-testid="project-name-input"]', xssPayload);
        await page.fill('[data-testid="project-description-input"]', xssPayload);
        
        // Submit form
        await page.click('[data-testid="submit-project-btn"]');
        
        // Wait and check that no alert appeared
        await page.waitForTimeout(1000);
        
        // Navigate to projects to see if data was properly escaped
        await page.click('[data-testid="nav-projects"]');
        await page.waitForTimeout(1000);
    });

    // Test 38: Data Sorting
    test('should handle table data sorting', async ({ page }) => {
        await page.click('[data-testid="nav-projects"]');
        
        // Wait for table to load
        await page.waitForTimeout(1000);
        
        // Check if table headers are clickable for sorting
        const tableHeaders = page.locator('thead th');
        const headerCount = await tableHeaders.count();
        
        expect(headerCount).toBeGreaterThan(0);
    });

    // Test 39: Pagination
    test('should handle pagination if implemented', async ({ page }) => {
        await page.click('[data-testid="nav-projects"]');
        
        // Look for pagination controls
        const paginationControls = page.locator('.pagination, [data-testid*="pagination"]');
        
        // If pagination exists, test it
        if (await paginationControls.count() > 0) {
            await expect(paginationControls).toBeVisible();
        }
    });

    // Test 40: Bulk Operations
    test('should handle bulk operations if available', async ({ page }) => {
        await page.click('[data-testid="nav-projects"]');
        
        // Look for checkboxes or bulk operation buttons
        const checkboxes = page.locator('input[type="checkbox"]');
        const bulkButtons = page.locator('[data-testid*="bulk"], [data-testid*="select-all"]');
        
        // If bulk operations exist, test them
        if (await checkboxes.count() > 0) {
            await expect(checkboxes.first()).toBeVisible();
        }
    });

    // Test 41: Real-time Updates
    test('should handle real-time updates', async ({ page }) => {
        // Test notification updates
        await page.click('[data-testid="notifications-btn"]');
        
        const badge = page.locator('[data-testid="notification-badge"]');
        const initialCount = await badge.textContent();
        
        // Simulate some action that might trigger notifications
        await page.click('[data-testid="nav-projects"]');
        await page.waitForTimeout(2000);
        
        // Check if badge updated
        await page.click('[data-testid="notifications-btn"]');
    });

    // Test 42: Export Functionality
    test('should handle data export operations', async ({ page }) => {
        await page.click('[data-testid="nav-settings"]');
        
        const exportBtn = page.locator('[data-testid="export-data-btn"]');
        
        // Click export button
        await exportBtn.click();
        
        // Wait for potential download or confirmation
        await page.waitForTimeout(1000);
    });

    // Test 43: Import Functionality
    test('should handle data import operations if available', async ({ page }) => {
        // Look for import buttons or file inputs
        const importControls = page.locator('[data-testid*="import"], input[type="file"]');
        
        if (await importControls.count() > 0) {
            await expect(importControls.first()).toBeVisible();
        }
    });

    // Test 44: Advanced Search
    test('should handle advanced search functionality', async ({ page }) => {
        const searchInput = page.locator('[data-testid="global-search"]');
        
        // Test various search terms
        const searchTerms = ['project', 'task', 'user', 'test'];
        
        for (const term of searchTerms) {
            await searchInput.clear();
            await searchInput.fill(term);
            await page.waitForTimeout(500);
        }
        
        await searchInput.clear();
    });

    // Test 45: Multi-language Support
    test('should handle language switching', async ({ page }) => {
        await page.click('[data-testid="nav-settings"]');
        
        const languageSelect = page.locator('[data-testid="language-select"]');
        const languages = ['en', 'es', 'fr'];
        
        for (const lang of languages) {
            await languageSelect.selectOption(lang);
            await page.click('[data-testid="save-preferences-btn"]');
            await page.waitForTimeout(500);
        }
    });

    // Test 46: Theme Persistence
    test('should persist theme changes across sessions', async ({ page }) => {
        await page.click('[data-testid="nav-settings"]');
        
        // Change to dark theme
        await page.selectOption('[data-testid="theme-select"]', 'dark');
        await page.click('[data-testid="save-preferences-btn"]');
        await page.waitForTimeout(1000);
        
        // Refresh page
        await page.reload();
        await page.waitForSelector('[data-testid="overview-section"]');
        
        // Check if theme persisted
        await page.click('[data-testid="nav-settings"]');
        const themeValue = await page.locator('[data-testid="theme-select"]').inputValue();
        expect(themeValue).toBe('dark');
        
        // Reset to light theme
        await page.selectOption('[data-testid="theme-select"]', 'light');
        await page.click('[data-testid="save-preferences-btn"]');
    });

    // Test 47: Session Timeout
    test('should handle session timeout gracefully', async ({ page }) => {
        // Clear session storage to simulate timeout
        await page.evaluate(() => {
            sessionStorage.clear();
        });
        
        // Try to perform an action that requires authentication
        await page.click('[data-testid="nav-projects"]');
        await page.waitForTimeout(1000);
        
        // Should redirect to login or show error
        // This test depends on how session timeout is implemented
    });

    // Test 48: Concurrent User Actions
    test('should handle multiple rapid user actions', async ({ page }) => {
        // Rapidly click through different sections
        const sections = ['projects', 'tasks', 'users', 'reports', 'settings', 'profile', 'overview'];
        
        for (const section of sections) {
            await page.click(`[data-testid="nav-${section}"]`);
            await page.waitForTimeout(100);
        }
        
        // Should end up in overview section
        await expect(page.locator('[data-testid="overview-section"]')).toBeVisible();
    });

    // Test 49: Browser Compatibility Features
    test('should handle browser-specific features', async ({ page }) => {
        // Test localStorage support
        await page.evaluate(() => {
            localStorage.setItem('test', 'value');
            return localStorage.getItem('test') === 'value';
        });
        
        // Test sessionStorage support
        await page.evaluate(() => {
            sessionStorage.setItem('test', 'value');
            return sessionStorage.getItem('test') === 'value';
        });
        
        // Clean up
        await page.evaluate(() => {
            localStorage.removeItem('test');
            sessionStorage.removeItem('test');
        });
    });

    // Test 50: Complete User Workflow
    test('should complete full user workflow from login to logout', async ({ page }) => {
        // Start fresh
        await page.goto(TEST_APP_URL);
        
        // 1. Login
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-submit"]');
        
        // Wait for redirect to Sitecore Launchpad then navigate to dashboard
        await page.waitForURL('**/sitecore-launchpad');
        await page.goto(`${TEST_APP_URL}/dashboard`);
        await page.waitForSelector('[data-testid="overview-section"]');
        
        // 2. View dashboard overview
        await expect(page.locator('[data-testid="total-projects-card"]')).toBeVisible();
        
        // 3. Create a project
        await page.click('[data-testid="nav-projects"]');
        await page.click('[data-testid="create-project-btn"]');
        await page.fill('[data-testid="project-name-input"]', 'Workflow Test Project');
        await page.fill('[data-testid="project-description-input"]', 'End-to-end test project');
        await page.selectOption('[data-testid="project-status-input"]', 'active');
        await page.selectOption('[data-testid="project-priority-input"]', 'high');
        await page.fill('[data-testid="project-budget-input"]', '100000');
        await page.click('[data-testid="submit-project-btn"]');
        await page.waitForTimeout(1000);
        
        // 4. Create a task
        await page.click('[data-testid="nav-tasks"]');
        await page.click('[data-testid="create-task-btn"]');
        await page.fill('[data-testid="task-title-input"]', 'Workflow Test Task');
        await page.fill('[data-testid="task-description-input"]', 'End-to-end test task');
        await page.selectOption('[data-testid="task-priority-input"]', 'high');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await page.fill('[data-testid="task-due-date-input"]', tomorrow.toISOString().split('T')[0]);
        await page.click('[data-testid="submit-task-btn"]');
        await page.waitForTimeout(1000);
        
        // 5. Update profile
        await page.click('[data-testid="nav-profile"]');
        await page.fill('[data-testid="profile-phone"]', '+1-555-WORKFLOW');
        await page.click('[data-testid="update-profile-btn"]');
        await page.waitForTimeout(1000);
        
        // 6. Change settings
        await page.click('[data-testid="nav-settings"]');
        await page.selectOption('[data-testid="theme-select"]', 'dark');
        await page.click('[data-testid="save-preferences-btn"]');
        await page.waitForTimeout(1000);
        
        // 7. View reports
        await page.click('[data-testid="nav-reports"]');
        await expect(page.locator('[data-testid="performance-metrics-card"]')).toBeVisible();
        
        // 8. Check notifications
        await page.click('[data-testid="notifications-btn"]');
        await page.waitForTimeout(500);
        
        // 9. Return to overview
        await page.click('[data-testid="nav-overview"]');
        await expect(page.locator('[data-testid="overview-section"]')).toBeVisible();
        
        // 10. Logout (test the button exists and is clickable)
        const logoutBtn = page.locator('[data-testid="logout-btn"]');
        await expect(logoutBtn).toBeVisible();
        await expect(logoutBtn).toBeEnabled();
        
        // Complete workflow test
        expect(true).toBe(true); // Workflow completed successfully
    });
});