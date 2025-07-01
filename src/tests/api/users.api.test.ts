import { test, expect } from '@playwright/test';
import { ExampleApiWrapper, CreateUserRequest } from '../../wrappers/api';
import { TestDataManager } from '../../utils';

test.describe('Users API Tests', () => {
  let apiWrapper: ExampleApiWrapper;
  let testData: TestDataManager;

  test.beforeEach(async ({ request }) => {
    apiWrapper = new ExampleApiWrapper(request);
    testData = TestDataManager.getInstance();
  });

  test('should get all users', async () => {
    const users = await apiWrapper.getUsers();
    
    expect(users).toBeDefined();
    expect(Array.isArray(users)).toBeTruthy();
    expect(users.length).toBeGreaterThan(0);
    
    const firstUser = users[0];
    expect(firstUser).toHaveProperty('id');
    expect(firstUser).toHaveProperty('name');
    expect(firstUser).toHaveProperty('email');
    expect(firstUser).toHaveProperty('username');
  });

  test('should get user by id', async () => {
    const userId = 1;
    const user = await apiWrapper.getUserById(userId);
    
    expect(user).toBeDefined();
    expect(user.id).toBe(userId);
    expect(user.name).toBeDefined();
    expect(user.email).toBeDefined();
    expect(user.username).toBeDefined();
  });

  test('should create a new user', async () => {
    const newUser = testData.generateRandomUser();
    const createUserData: CreateUserRequest = {
      name: newUser.name,
      email: newUser.email,
      username: newUser.username
    };

    const createdUser = await apiWrapper.createUser(createUserData);
    
    expect(createdUser).toBeDefined();
    expect(createdUser.name).toBe(createUserData.name);
    expect(createdUser.email).toBe(createUserData.email);
    expect(createdUser.username).toBe(createUserData.username);
  });

  test('should update an existing user', async () => {
    const userId = 1;
    const updateData = {
      name: 'Updated Name',
      email: 'updated@example.com'
    };

    const updatedUser = await apiWrapper.updateUser(userId, updateData);
    
    expect(updatedUser).toBeDefined();
    expect(updatedUser.id).toBe(userId);
    expect(updatedUser.name).toBe(updateData.name);
    expect(updatedUser.email).toBe(updateData.email);
  });

  test('should delete a user', async () => {
    const userId = 1;
    
    await expect(apiWrapper.deleteUser(userId)).resolves.not.toThrow();
  });

  test('should search users by name', async () => {
    const searchTerm = 'Leanne';
    const users = await apiWrapper.searchUsers(searchTerm);
    
    expect(users).toBeDefined();
    expect(Array.isArray(users)).toBeTruthy();
    
    if (users.length > 0) {
      users.forEach(user => {
        expect(user.name.toLowerCase()).toContain(searchTerm.toLowerCase());
      });
    }
  });

  test('should handle non-existent user', async () => {
    const nonExistentId = 99999;
    
    await expect(apiWrapper.getUserById(nonExistentId)).rejects.toThrow();
  });
});