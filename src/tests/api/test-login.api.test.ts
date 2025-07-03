import { test, expect } from '@playwright/test';
import { TestDataManager } from '../../utils';

test.describe('Test Login API - Backend Tests', () => {
  let testData: TestDataManager;
  let baseURL: string;

  test.beforeAll(async () => {
    testData = TestDataManager.getInstance();
    baseURL = 'http://localhost:3000';
  });

  test.describe('POST /api/login', () => {
    test('should login successfully with valid credentials', async ({ request }) => {
      const user = testData.getUser('regular');
      
      const response = await request.post(`${baseURL}/api/login`, {
        data: {
          email: user.email,
          password: user.password
        }
      });

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);
      expect(responseBody.message).toBe('Login successful');
      expect(responseBody.user).toBeDefined();
      expect(responseBody.user.email).toBe(user.email);
      expect(responseBody.user.name).toBe(user.name);
      expect(responseBody.user.password).toBeUndefined(); // Password should not be returned
      expect(responseBody.token).toBeDefined();
    });

    test('should login successfully with admin credentials', async ({ request }) => {
      const adminUser = testData.getUser('admin');
      
      const response = await request.post(`${baseURL}/api/login`, {
        data: {
          email: adminUser.email,
          password: adminUser.password
        }
      });

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);
      expect(responseBody.user.email).toBe(adminUser.email);
      expect(responseBody.user.name).toBe(adminUser.name);
    });

    test('should fail with invalid email', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/login`, {
        data: {
          email: 'nonexistent@example.com',
          password: 'password123'
        }
      });

      expect(response.status()).toBe(401);
      
      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.message).toBe('Invalid credentials');
    });

    test('should fail with invalid password', async ({ request }) => {
      const user = testData.getUser('regular');
      
      const response = await request.post(`${baseURL}/api/login`, {
        data: {
          email: user.email,
          password: 'wrongpassword'
        }
      });

      expect(response.status()).toBe(401);
      
      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.message).toBe('Invalid credentials');
    });

    test('should fail with empty email', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/login`, {
        data: {
          email: '',
          password: 'password123'
        }
      });

      expect(response.status()).toBe(400);
      
      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.message).toBe('Please fill in all fields');
    });

    test('should fail with empty password', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/login`, {
        data: {
          email: 'test@example.com',
          password: ''
        }
      });

      expect(response.status()).toBe(400);
      
      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.message).toBe('Please fill in all fields');
    });

    test('should fail with missing fields', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/login`, {
        data: {}
      });

      expect(response.status()).toBe(400);
      
      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.message).toBe('Please fill in all fields');
    });

    test('should fail with invalid email format', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/login`, {
        data: {
          email: 'invalid-email',
          password: 'password123'
        }
      });

      expect(response.status()).toBe(400);
      
      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.message).toBe('Please enter a valid email address');
    });

    test('should have proper response time', async ({ request }) => {
      const user = testData.getUser('regular');
      const startTime = Date.now();
      
      const response = await request.post(`${baseURL}/api/login`, {
        data: {
          email: user.email,
          password: user.password
        }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });

    test('should handle concurrent login requests', async ({ request }) => {
      const user = testData.getUser('regular');
      
      const loginRequests = Array(5).fill(null).map(() => 
        request.post(`${baseURL}/api/login`, {
          data: {
            email: user.email,
            password: user.password
          }
        })
      );

      const responses = await Promise.all(loginRequests);
      
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });
    });
  });

  test.describe('GET /api/users', () => {
    test('should get all users without passwords', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/users`);

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);
      expect(responseBody.users).toBeDefined();
      expect(Array.isArray(responseBody.users)).toBe(true);
      expect(responseBody.users.length).toBeGreaterThan(0);
      
      // Check that passwords are not included
      responseBody.users.forEach((user: any) => {
        expect(user.password).toBeUndefined();
        expect(user.id).toBeDefined();
        expect(user.name).toBeDefined();
        expect(user.email).toBeDefined();
      });
    });
  });

  test.describe('GET /api/users/:id', () => {
    test('should get user by id', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/users/1`);

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);
      expect(responseBody.user).toBeDefined();
      expect(responseBody.user.id).toBe(1);
      expect(responseBody.user.password).toBeUndefined();
    });

    test('should return 404 for non-existent user', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/users/999`);

      expect(response.status()).toBe(404);
      
      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.message).toBe('User not found');
    });
  });

  test.describe('POST /api/users', () => {
    test('should create new user', async ({ request }) => {
      const newUser = testData.generateRandomUser();
      
      const response = await request.post(`${baseURL}/api/users`, {
        data: {
          name: newUser.name,
          email: newUser.email,
          password: newUser.password
        }
      });

      expect(response.status()).toBe(201);
      
      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);
      expect(responseBody.message).toBe('User created successfully');
      expect(responseBody.user.name).toBe(newUser.name);
      expect(responseBody.user.email).toBe(newUser.email);
      expect(responseBody.user.password).toBeUndefined();
    });

    test('should fail to create user with existing email', async ({ request }) => {
      const existingUser = testData.getUser('regular');
      
      const response = await request.post(`${baseURL}/api/users`, {
        data: {
          name: 'New Name',
          email: existingUser.email,
          password: 'newpassword'
        }
      });

      expect(response.status()).toBe(409);
      
      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.message).toBe('User with this email already exists');
    });

    test('should fail to create user with missing fields', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/users`, {
        data: {
          name: 'Test User'
          // Missing email and password
        }
      });

      expect(response.status()).toBe(400);
      
      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.message).toBe('Name and email are required');
    });
  });

  test.describe('Health Check', () => {
    test('should respond to health check', async ({ request }) => {
      const response = await request.get(`${baseURL}/health`);

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.status).toBe('OK');
      expect(responseBody.timestamp).toBeDefined();
    });
  });

  test.describe('Error Handling', () => {
    test('should return 404 for non-existent routes', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/nonexistent`);

      expect(response.status()).toBe(404);
      
      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.message).toBe('Route not found');
    });

    test('should handle malformed JSON', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/login`, {
        data: 'invalid json string',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Should handle the error gracefully
      expect([400, 500]).toContain(response.status());
    });
  });

  test.describe('Security Tests', () => {
    test('should not return sensitive information in error messages', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/login`, {
        data: {
          email: 'test@example.com',
          password: 'wrongpassword'
        }
      });

      const responseBody = await response.json();
      
      // Should not reveal whether email exists or not
      expect(responseBody.message).toBe('Invalid credentials');
      expect(responseBody.message).not.toContain('email');
      expect(responseBody.message).not.toContain('user');
    });

    test('should validate input to prevent injection attacks', async ({ request }) => {
      const maliciousInputs = [
        'test@example.com; DROP TABLE users; --',
        '<script>alert("xss")</script>',
        '../../etc/passwd',
        'null',
        'undefined'
      ];

      for (const maliciousInput of maliciousInputs) {
        const response = await request.post(`${baseURL}/api/login`, {
          data: {
            email: maliciousInput,
            password: 'password'
          }
        });

        // Should handle malicious input safely
        expect([400, 401]).toContain(response.status());
      }
    });
  });
});