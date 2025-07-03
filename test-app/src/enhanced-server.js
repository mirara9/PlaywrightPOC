const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Add request logging for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.use(express.static(path.join(__dirname, '../public')));

// Original users data for reset functionality
const originalUsers = [
    { 
        id: 1, 
        email: 'john.doe@example.com', 
        password: 'SecurePass123!', 
        name: 'John Doe', 
        username: 'johndoe',
        role: 'user',
        department: 'Engineering',
        avatar: '/avatars/john.jpg',
        phone: '+1-555-0101',
        location: 'New York, NY',
        joinDate: '2023-01-15',
        lastLogin: new Date().toISOString(),
        preferences: {
            theme: 'light',
            notifications: true,
            language: 'en',
            timezone: 'EST'
        }
    },
    { 
        id: 2, 
        email: 'jane.smith@example.com', 
        password: 'SecurePass456!', 
        name: 'Jane Smith', 
        username: 'janesmith',
        role: 'admin',
        department: 'Management',
        avatar: '/avatars/jane.jpg',
        phone: '+1-555-0102',
        location: 'San Francisco, CA',
        joinDate: '2022-06-10',
        lastLogin: new Date().toISOString(),
        preferences: {
            theme: 'dark',
            notifications: true,
            language: 'en',
            timezone: 'PST'
        }
    },
    { 
        id: 3, 
        email: 'admin@example.com', 
        password: 'AdminPass789!', 
        name: 'Admin User', 
        username: 'admin',
        role: 'admin',
        department: 'IT',
        avatar: '/avatars/admin.jpg',
        phone: '+1-555-0103',
        location: 'Chicago, IL',
        joinDate: '2021-03-01',
        lastLogin: new Date().toISOString(),
        preferences: {
            theme: 'dark',
            notifications: true,
            language: 'en',
            timezone: 'CST'
        }
    },
    { 
        id: 4, 
        email: 'test@example.com', 
        password: 'password123', 
        name: 'Test User', 
        username: 'testuser',
        role: 'user',
        department: 'QA',
        avatar: '/avatars/test.jpg',
        phone: '+1-555-0104',
        location: 'Austin, TX',
        joinDate: '2023-08-20',
        lastLogin: new Date().toISOString(),
        preferences: {
            theme: 'light',
            notifications: false,
            language: 'en',
            timezone: 'CST'
        }
    }
];

// Mock data stores
let users = [...originalUsers.map(user => ({ ...user }))];
let projects = [
    {
        id: 1,
        name: 'E-commerce Platform',
        description: 'Modern e-commerce solution with React and Node.js',
        status: 'active',
        priority: 'high',
        startDate: '2023-01-01',
        endDate: '2024-06-30',
        progress: 75,
        budget: 150000,
        spent: 112500,
        teamMembers: [1, 2],
        tags: ['react', 'nodejs', 'mongodb'],
        createdBy: 1,
        createdAt: '2023-01-01T00:00:00Z'
    },
    {
        id: 2,
        name: 'Mobile App Development',
        description: 'Cross-platform mobile application using React Native',
        status: 'planning',
        priority: 'medium',
        startDate: '2024-02-01',
        endDate: '2024-12-31',
        progress: 15,
        budget: 200000,
        spent: 30000,
        teamMembers: [1, 3, 4],
        tags: ['react-native', 'ios', 'android'],
        createdBy: 2,
        createdAt: '2023-10-15T00:00:00Z'
    },
    {
        id: 3,
        name: 'Data Analytics Dashboard',
        description: 'Business intelligence dashboard with real-time analytics',
        status: 'completed',
        priority: 'low',
        startDate: '2023-03-01',
        endDate: '2023-11-30',
        progress: 100,
        budget: 80000,
        spent: 75000,
        teamMembers: [2, 4],
        tags: ['dashboard', 'analytics', 'charts'],
        createdBy: 3,
        createdAt: '2023-03-01T00:00:00Z'
    }
];

let tasks = [
    {
        id: 1,
        title: 'Setup project infrastructure',
        description: 'Initialize repository and setup CI/CD pipeline',
        status: 'completed',
        priority: 'high',
        projectId: 1,
        assignedTo: 1,
        dueDate: '2023-01-15',
        completedDate: '2023-01-12',
        estimatedHours: 16,
        actualHours: 14,
        tags: ['setup', 'infrastructure'],
        createdBy: 1,
        createdAt: '2023-01-01T00:00:00Z'
    },
    {
        id: 2,
        title: 'Design user authentication system',
        description: 'Create secure login and registration system',
        status: 'in-progress',
        priority: 'high',
        projectId: 1,
        assignedTo: 2,
        dueDate: '2024-01-30',
        completedDate: null,
        estimatedHours: 24,
        actualHours: 18,
        tags: ['authentication', 'security'],
        createdBy: 1,
        createdAt: '2023-01-05T00:00:00Z'
    },
    {
        id: 3,
        title: 'Implement payment gateway',
        description: 'Integrate Stripe payment processing',
        status: 'pending',
        priority: 'medium',
        projectId: 1,
        assignedTo: 1,
        dueDate: '2024-03-15',
        completedDate: null,
        estimatedHours: 32,
        actualHours: 0,
        tags: ['payment', 'integration'],
        createdBy: 2,
        createdAt: '2023-12-01T00:00:00Z'
    }
];

let notifications = [
    {
        id: 1,
        title: 'Welcome to the platform!',
        message: 'Thank you for joining our team. Get started by exploring the dashboard.',
        type: 'info',
        read: false,
        userId: 1,
        createdAt: new Date().toISOString()
    },
    {
        id: 2,
        title: 'Task assigned',
        message: 'You have been assigned a new task: Design user authentication system',
        type: 'task',
        read: false,
        userId: 2,
        createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
        id: 3,
        title: 'Project deadline approaching',
        message: 'E-commerce Platform deadline is in 30 days',
        type: 'warning',
        read: true,
        userId: 1,
        createdAt: new Date(Date.now() - 86400000).toISOString()
    }
];

let reports = [
    {
        id: 1,
        name: 'Monthly Progress Report',
        type: 'progress',
        data: {
            totalProjects: 3,
            activeProjects: 1,
            completedTasks: 25,
            pendingTasks: 8,
            teamProductivity: 85,
            budgetUtilization: 72
        },
        generatedAt: new Date().toISOString(),
        generatedBy: 1
    },
    {
        id: 2,
        name: 'Team Performance Analysis',
        type: 'performance',
        data: {
            teamMembers: 4,
            averageTaskCompletion: 3.2,
            onTimeDelivery: 78,
            qualityScore: 92,
            customerSatisfaction: 88
        },
        generatedAt: new Date(Date.now() - 86400000).toISOString(),
        generatedBy: 2
    }
];

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    // Simple token validation (in real app, use JWT)
    if (token.startsWith('mock_token_')) {
        const userId = parseInt(token.split('_')[2]);
        const user = users.find(u => u.id === userId);
        if (user) {
            req.user = user;
            next();
        } else {
            return res.status(403).json({ success: false, message: 'Invalid token' });
        }
    } else {
        return res.status(403).json({ success: false, message: 'Invalid token format' });
    }
}

// API Routes

// Authentication
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    setTimeout(() => {
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all fields'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address'
            });
        }

        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // Update last login
            user.lastLogin = new Date().toISOString();
            
            const { password: _, ...userWithoutPassword } = user;
            
            res.json({
                success: true,
                message: 'Login successful',
                user: userWithoutPassword,
                token: `mock_token_${user.id}_${Date.now()}`
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
    }, 500);
});

// User Management
app.get('/api/users', authenticateToken, (req, res) => {
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json({
        success: true,
        users: safeUsers
    });
});

app.get('/api/users/:id', authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const user = users.find(u => u.id === id);
    
    if (user) {
        const { password, ...userWithoutPassword } = user;
        res.json({
            success: true,
            user: userWithoutPassword
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }
});

app.put('/api/users/:id', authenticateToken, (req, res) => {
    const userId = parseInt(req.params.id);
    const updates = req.body;
    
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }
    
    // Update user fields
    users[userIndex] = { ...users[userIndex], ...updates };
    
    const { password, ...userWithoutPassword } = users[userIndex];
    res.json({
        success: true,
        message: 'User updated successfully',
        user: userWithoutPassword
    });
});

// Projects Management
app.get('/api/projects', authenticateToken, (req, res) => {
    const { status, priority, search } = req.query;
    
    let filteredProjects = [...projects];
    
    if (status) {
        filteredProjects = filteredProjects.filter(p => p.status === status);
    }
    
    if (priority) {
        filteredProjects = filteredProjects.filter(p => p.priority === priority);
    }
    
    if (search) {
        filteredProjects = filteredProjects.filter(p => 
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    res.json({
        success: true,
        projects: filteredProjects
    });
});

app.get('/api/projects/:id', authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const project = projects.find(p => p.id === id);
    
    if (project) {
        res.json({
            success: true,
            project: project
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'Project not found'
        });
    }
});

app.post('/api/projects', authenticateToken, (req, res) => {
    const newProject = {
        id: projects.length + 1,
        ...req.body,
        createdBy: req.user.id,
        createdAt: new Date().toISOString()
    };
    
    projects.push(newProject);
    
    res.status(201).json({
        success: true,
        message: 'Project created successfully',
        project: newProject
    });
});

app.put('/api/projects/:id', authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const projectIndex = projects.findIndex(p => p.id === id);
    
    if (projectIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Project not found'
        });
    }
    
    projects[projectIndex] = { ...projects[projectIndex], ...req.body };
    
    res.json({
        success: true,
        message: 'Project updated successfully',
        project: projects[projectIndex]
    });
});

app.delete('/api/projects/:id', authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const projectIndex = projects.findIndex(p => p.id === id);
    
    if (projectIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Project not found'
        });
    }
    
    projects.splice(projectIndex, 1);
    
    res.json({
        success: true,
        message: 'Project deleted successfully'
    });
});

// Tasks Management
app.get('/api/tasks', authenticateToken, (req, res) => {
    const { status, priority, projectId, assignedTo } = req.query;
    
    let filteredTasks = [...tasks];
    
    if (status) {
        filteredTasks = filteredTasks.filter(t => t.status === status);
    }
    
    if (priority) {
        filteredTasks = filteredTasks.filter(t => t.priority === priority);
    }
    
    if (projectId) {
        filteredTasks = filteredTasks.filter(t => t.projectId === parseInt(projectId));
    }
    
    if (assignedTo) {
        filteredTasks = filteredTasks.filter(t => t.assignedTo === parseInt(assignedTo));
    }
    
    res.json({
        success: true,
        tasks: filteredTasks
    });
});

app.post('/api/tasks', authenticateToken, (req, res) => {
    const newTask = {
        id: tasks.length + 1,
        ...req.body,
        createdBy: req.user.id,
        createdAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    
    res.status(201).json({
        success: true,
        message: 'Task created successfully',
        task: newTask
    });
});

app.put('/api/tasks/:id', authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(t => t.id === id);
    
    if (taskIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Task not found'
        });
    }
    
    tasks[taskIndex] = { ...tasks[taskIndex], ...req.body };
    
    res.json({
        success: true,
        message: 'Task updated successfully',
        task: tasks[taskIndex]
    });
});

// Notifications
app.get('/api/notifications', authenticateToken, (req, res) => {
    const userNotifications = notifications.filter(n => n.userId === req.user.id);
    
    res.json({
        success: true,
        notifications: userNotifications
    });
});

app.put('/api/notifications/:id/read', authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const notification = notifications.find(n => n.id === id && n.userId === req.user.id);
    
    if (notification) {
        notification.read = true;
        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'Notification not found'
        });
    }
});

// Reports and Analytics
app.get('/api/reports', authenticateToken, (req, res) => {
    res.json({
        success: true,
        reports: reports
    });
});

app.get('/api/analytics/dashboard', authenticateToken, (req, res) => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const userNotifications = notifications.filter(n => n.userId === req.user.id && !n.read).length;
    
    res.json({
        success: true,
        analytics: {
            totalProjects,
            activeProjects,
            completedTasks,
            pendingTasks,
            unreadNotifications: userNotifications,
            totalUsers: users.length,
            projectProgress: projects.reduce((acc, p) => acc + p.progress, 0) / projects.length,
            budgetUtilization: projects.reduce((acc, p) => acc + (p.spent / p.budget * 100), 0) / projects.length
        }
    });
});

// Settings and Preferences
app.get('/api/settings', authenticateToken, (req, res) => {
    res.json({
        success: true,
        settings: {
            systemSettings: {
                maintenanceMode: false,
                allowRegistration: true,
                defaultTheme: 'light',
                sessionTimeout: 30
            },
            userPreferences: req.user.preferences
        }
    });
});

app.put('/api/settings/preferences', authenticateToken, (req, res) => {
    const userIndex = users.findIndex(u => u.id === req.user.id);
    if (userIndex !== -1) {
        users[userIndex].preferences = { ...users[userIndex].preferences, ...req.body };
        res.json({
            success: true,
            message: 'Preferences updated successfully',
            preferences: users[userIndex].preferences
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }
});

// Search functionality
app.get('/api/search', authenticateToken, (req, res) => {
    const { query, type } = req.query;
    
    if (!query) {
        return res.status(400).json({
            success: false,
            message: 'Search query is required'
        });
    }
    
    const results = {
        users: [],
        projects: [],
        tasks: []
    };
    
    const searchTerm = query.toLowerCase();
    
    if (!type || type === 'users') {
        results.users = users
            .filter(u => 
                u.name.toLowerCase().includes(searchTerm) ||
                u.email.toLowerCase().includes(searchTerm) ||
                u.department.toLowerCase().includes(searchTerm)
            )
            .map(({ password, ...user }) => user);
    }
    
    if (!type || type === 'projects') {
        results.projects = projects.filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm) ||
            p.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }
    
    if (!type || type === 'tasks') {
        results.tasks = tasks.filter(t =>
            t.title.toLowerCase().includes(searchTerm) ||
            t.description.toLowerCase().includes(searchTerm) ||
            t.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }
    
    res.json({
        success: true,
        results: results
    });
});

// Reset data endpoint for testing
app.post('/api/reset', (req, res) => {
    users.length = 0;
    users.push(...originalUsers.map(user => ({ ...user })));
    
    // Reset other data stores
    projects.length = 0;
    projects.push(
        {
            id: 1,
            name: 'E-commerce Platform',
            description: 'Modern e-commerce solution with React and Node.js',
            status: 'active',
            priority: 'high',
            startDate: '2023-01-01',
            endDate: '2024-06-30',
            progress: 75,
            budget: 150000,
            spent: 112500,
            teamMembers: [1, 2],
            tags: ['react', 'nodejs', 'mongodb'],
            createdBy: 1,
            createdAt: '2023-01-01T00:00:00Z'
        }
    );
    
    tasks.length = 0;
    tasks.push(
        {
            id: 1,
            title: 'Setup project infrastructure',
            description: 'Initialize repository and setup CI/CD pipeline',
            status: 'completed',
            priority: 'high',
            projectId: 1,
            assignedTo: 1,
            dueDate: '2023-01-15',
            completedDate: '2023-01-12',
            estimatedHours: 16,
            actualHours: 14,
            tags: ['setup', 'infrastructure'],
            createdBy: 1,
            createdAt: '2023-01-01T00:00:00Z'
        }
    );
    
    res.json({
        success: true,
        message: 'Data reset successfully',
        counts: {
            users: users.length,
            projects: projects.length,
            tasks: tasks.length,
            notifications: notifications.length
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'playwright-test-app-enhanced'
    });
});

// Sitecore Launchpad route
app.get('/sitecore-launchpad', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/sitecore-launchpad.html'));
});

// Serve the enhanced dashboard
app.get('/dashboard', (req, res) => {
    const filePath = path.join(__dirname, '../public/dashboard.html');
    res.sendFile(filePath);
});

// Serve the main page - redirect to Sitecore Launchpad
app.get('/', (req, res) => {
    res.redirect('/sitecore-launchpad');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Enhanced test server running at http://localhost:${PORT}`);
    console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API endpoints available at http://localhost:${PORT}/api/`);
});

module.exports = app;