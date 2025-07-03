export interface TestUser {
  name: string;
  email: string;
  username: string;
  password: string;
}

export interface TestEnvironment {
  baseUrl: string;
  apiUrl: string;
  name: string;
}

export class TestDataManager {
  private static instance: TestDataManager;
  private users: TestUser[] = [];
  private environments: Record<string, TestEnvironment> = {};

  private constructor() {
    this.initializeTestData();
  }

  static getInstance(): TestDataManager {
    if (!TestDataManager.instance) {
      TestDataManager.instance = new TestDataManager();
    }
    return TestDataManager.instance;
  }

  private initializeTestData(): void {
    this.users = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'SecurePass123!'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        username: 'janesmith',
        password: 'SecurePass456!'
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        username: 'admin',
        password: 'AdminPass789!'
      }
    ];

    this.environments = {
      dev: {
        baseUrl: 'https://dev.example.com',
        apiUrl: 'https://api-dev.example.com',
        name: 'Development'
      },
      staging: {
        baseUrl: 'https://staging.example.com',
        apiUrl: 'https://api-staging.example.com',
        name: 'Staging'
      },
      prod: {
        baseUrl: 'https://example.com',
        apiUrl: 'https://api.example.com',
        name: 'Production'
      }
    };
  }

  getUser(type: 'regular' | 'admin' = 'regular'): TestUser {
    if (type === 'admin') {
      return this.users.find(user => user.username === 'admin')!;
    }
    return this.users[0];
  }

  getAllUsers(): TestUser[] {
    return [...this.users];
  }

  getEnvironment(env: string = 'dev'): TestEnvironment {
    return this.environments[env] || this.environments.dev;
  }

  generateRandomUser(): TestUser {
    const randomId = Math.random().toString(36).substring(2, 8);
    return {
      name: `Test User ${randomId}`,
      email: `testuser${randomId}@example.com`,
      username: `testuser${randomId}`,
      password: `TestPass${randomId}!`
    };
  }

  generateRandomString(length: number = 8): string {
    return Math.random().toString(36).substring(2, length + 2);
  }

  generateRandomEmail(): string {
    const randomString = this.generateRandomString();
    return `test${randomString}@example.com`;
  }
}