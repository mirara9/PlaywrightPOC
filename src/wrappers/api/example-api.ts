import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiWrapper, ApiConfig } from './base-api';

export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  username: string;
}

export class ExampleApiWrapper extends BaseApiWrapper {
  constructor(request: APIRequestContext, config?: Partial<ApiConfig>) {
    const defaultConfig: ApiConfig = {
      baseURL: 'https://jsonplaceholder.typicode.com',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      retries: 3,
    };
    
    super(request, { ...defaultConfig, ...config });
  }

  async getUsers(): Promise<User[]> {
    const response = await this.get('/users');
    await this.expectStatus(response, 200);
    return await this.expectJson(response);
  }

  async getUserById(id: number): Promise<User> {
    const response = await this.get(`/users/${id}`);
    await this.expectStatus(response, 200);
    return await this.expectJson(response);
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await this.post('/users', { data: userData });
    await this.expectStatus(response, 201);
    return await this.expectJson(response);
  }

  async updateUser(id: number, userData: Partial<CreateUserRequest>): Promise<User> {
    const response = await this.put(`/users/${id}`, { data: userData });
    await this.expectStatus(response, 200);
    return await this.expectJson(response);
  }

  async deleteUser(id: number): Promise<void> {
    const response = await this.delete(`/users/${id}`);
    await this.expectStatus(response, 200);
  }

  async searchUsers(name: string): Promise<User[]> {
    const users = await this.getUsers();
    return users.filter(user => user.name.toLowerCase().includes(name.toLowerCase()));
  }
}