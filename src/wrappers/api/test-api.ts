import { APIRequestContext } from '@playwright/test';
import { BaseApiWrapper, ApiConfig } from './base-api';

export interface TestUser {
  id: number;
  name: string;
  email: string;
  username: string;
}

export interface CreateTestUserRequest {
  name: string;
  email: string;
  username: string;
  password?: string;
}

export interface TestApiResponse<T> {
  success: boolean;
  message?: string;
  user?: T;
  users?: T[];
}

export class TestApiWrapper extends BaseApiWrapper {
  constructor(request: APIRequestContext, config?: Partial<ApiConfig>) {
    const defaultConfig: ApiConfig = {
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      retries: 3,
    };
    
    super(request, { ...defaultConfig, ...config });
  }

  async getUsers(): Promise<TestUser[]> {
    const response = await this.get('/api/users');
    await this.expectStatus(response, 200);
    const data: TestApiResponse<TestUser> = await this.expectJson(response);
    
    if (!data.success || !data.users) {
      throw new Error('Failed to get users: ' + (data.message || 'Unknown error'));
    }
    
    return data.users;
  }

  async getUserById(id: number): Promise<TestUser> {
    const response = await this.get(`/api/users/${id}`);
    await this.expectStatus(response, 200);
    const data: TestApiResponse<TestUser> = await this.expectJson(response);
    
    if (!data.success || !data.user) {
      throw new Error('Failed to get user: ' + (data.message || 'Unknown error'));
    }
    
    return data.user;
  }

  async createUser(userData: CreateTestUserRequest): Promise<TestUser> {
    const response = await this.post('/api/users', { data: userData });
    await this.expectStatus(response, 201);
    const data: TestApiResponse<TestUser> = await this.expectJson(response);
    
    if (!data.success || !data.user) {
      throw new Error('Failed to create user: ' + (data.message || 'Unknown error'));
    }
    
    return data.user;
  }

  async updateUser(id: number, userData: Partial<CreateTestUserRequest>): Promise<TestUser> {
    const response = await this.put(`/api/users/${id}`, { data: userData });
    await this.expectStatus(response, 200);
    const data: TestApiResponse<TestUser> = await this.expectJson(response);
    
    if (!data.success || !data.user) {
      throw new Error('Failed to update user: ' + (data.message || 'Unknown error'));
    }
    
    return data.user;
  }

  async deleteUser(id: number): Promise<void> {
    const response = await this.delete(`/api/users/${id}`);
    await this.expectStatus(response, 200);
    const data: TestApiResponse<TestUser> = await this.expectJson(response);
    
    if (!data.success) {
      throw new Error('Failed to delete user: ' + (data.message || 'Unknown error'));
    }
  }

  async searchUsers(name: string): Promise<TestUser[]> {
    const users = await this.getUsers();
    return users.filter(user => user.name.toLowerCase().includes(name.toLowerCase()));
  }

  async loginUser(email: string, password: string): Promise<TestUser> {
    const response = await this.post('/api/login', { data: { email, password } });
    await this.expectStatus(response, 200);
    const data: TestApiResponse<TestUser> = await this.expectJson(response);
    
    if (!data.success || !data.user) {
      throw new Error('Failed to login: ' + (data.message || 'Unknown error'));
    }
    
    return data.user;
  }

  async healthCheck(): Promise<{ status: string; timestamp: string; service: string }> {
    const response = await this.get('/health');
    await this.expectStatus(response, 200);
    return await this.expectJson(response);
  }

  async resetData(): Promise<void> {
    const response = await this.post('/api/reset');
    await this.expectStatus(response, 200);
    const data: TestApiResponse<any> = await this.expectJson(response);
    
    if (!data.success) {
      throw new Error('Failed to reset data: ' + (data.message || 'Unknown error'));
    }
  }
}