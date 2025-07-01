const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Mock users database
const users = [
    { id: 1, email: 'john.doe@example.com', password: 'SecurePass123!', name: 'John Doe' },
    { id: 2, email: 'jane.smith@example.com', password: 'SecurePass456!', name: 'Jane Smith' },
    { id: 3, email: 'admin@example.com', password: 'AdminPass789!', name: 'Admin User' },
    { id: 4, email: 'test@example.com', password: 'password123', name: 'Test User' }
];

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
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Name, email, and password are required'
        });
    }
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
        return res.status(409).json({
            success: false,
            message: 'User with this email already exists'
        });
    }
    
    const newUser = {
        id: users.length + 1,
        name,
        email,
        password
    };
    
    users.push(newUser);
    
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: userWithoutPassword
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
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
    console.log(`Test server running at http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API endpoints available at http://localhost:${PORT}/api/`);
});

module.exports = app;