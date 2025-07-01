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
    { id: 1, email: 'john.doe@example.com', password: 'SecurePass123!', name: 'John Doe', username: 'johndoe' },
    { id: 2, email: 'jane.smith@example.com', password: 'SecurePass456!', name: 'Jane Smith', username: 'janesmith' },
    { id: 3, email: 'admin@example.com', password: 'AdminPass789!', name: 'Admin User', username: 'admin' },
    { id: 4, email: 'test@example.com', password: 'password123', name: 'Test User', username: 'testuser' }
];

// Mock users database - mutable copy
let users = [...originalUsers];

// API Routes
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    // Simulate network delay
    setTimeout(() => {
        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all fields'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address'
            });
        }

        // Find user
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // Remove password from response
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
    }, 500); // 500ms delay to simulate real API
});

app.get('/api/users', (req, res) => {
    // Return users without passwords
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json({
        success: true,
        users: safeUsers
    });
});

app.get('/api/users/:id', (req, res) => {
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

app.post('/api/users', (req, res) => {
    const { name, email, password, username } = req.body;
    
    if (!name || !email) {
        return res.status(400).json({
            success: false,
            message: 'Name and email are required'
        });
    }
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
        return res.status(409).json({
            success: false,
            message: 'User with this email already exists'
        });
    }
    
    // Check if username already exists
    if (username && users.find(u => u.username === username)) {
        return res.status(409).json({
            success: false,
            message: 'User with this username already exists'
        });
    }
    
    const newUser = {
        id: users.length + 1,
        name,
        email,
        password: password || 'defaultPassword123!',
        username: username || name.toLowerCase().replace(/\s+/g, '')
    };
    
    users.push(newUser);
    
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: userWithoutPassword
    });
});

// Update user endpoint
app.put('/api/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const { name, email, password, username } = req.body;
    
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }
    
    // Check if email is being changed and already exists
    if (email && email !== users[userIndex].email) {
        if (users.find(u => u.email === email && u.id !== userId)) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
    }
    
    // Check if username is being changed and already exists
    if (username && username !== users[userIndex].username) {
        if (users.find(u => u.username === username && u.id !== userId)) {
            return res.status(409).json({
                success: false,
                message: 'User with this username already exists'
            });
        }
    }
    
    // Update user fields
    if (name) users[userIndex].name = name;
    if (email) users[userIndex].email = email;
    if (password) users[userIndex].password = password;
    if (username) users[userIndex].username = username;
    
    const { password: _, ...userWithoutPassword } = users[userIndex];
    res.json({
        success: true,
        message: 'User updated successfully',
        user: userWithoutPassword
    });
});

// Delete user endpoint
app.delete('/api/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }
    
    users.splice(userIndex, 1);
    
    res.json({
        success: true,
        message: 'User deleted successfully'
    });
});

// Reset data endpoint for testing
app.post('/api/reset', (req, res) => {
    users.length = 0; // Clear array
    users.push(...originalUsers.map(user => ({ ...user }))); // Deep copy original data
    
    res.json({
        success: true,
        message: 'Data reset successfully',
        userCount: users.length
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'playwright-test-app'
    });
});

// Alternative debug route
app.get('/debug', (req, res) => {
    const fs = require('fs');
    const filePath = path.join(__dirname, '../public/index.html');
    const publicDir = path.join(__dirname, '../public');
    
    res.json({
        server: 'working',
        timestamp: new Date().toISOString(),
        serverFile: __filename,
        publicDir: publicDir,
        indexPath: filePath,
        indexExists: fs.existsSync(filePath),
        publicDirExists: fs.existsSync(publicDir),
        publicContents: fs.existsSync(publicDir) ? fs.readdirSync(publicDir) : 'not found'
    });
});

// Serve the main page - MUST be after API routes
app.get('/', (req, res) => {
    console.log('=== ROOT ROUTE HANDLER CALLED ===');
    console.log('Request headers:', req.headers);
    
    const filePath = path.join(__dirname, '../public/index.html');
    console.log('Attempting to serve file:', filePath);
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
        console.error('❌ index.html not found at:', filePath);
        return res.status(404).json({
            success: false,
            message: 'Login page not found',
            attempted_path: filePath
        });
    }
    
    console.log('✅ File exists, sending...');
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('❌ Error sending file:', err);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Error serving login page',
                    error: err.message
                });
            }
        } else {
            console.log('✅ File sent successfully');
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// 404 handler - MUST be last
app.use((req, res) => {
    console.log('404 handler triggered for:', req.method, req.url);
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Test server running at http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API endpoints available at http://localhost:${PORT}/api/`);
});

module.exports = app;