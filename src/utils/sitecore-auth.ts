import { Page, BrowserContext } from '@playwright/test';
import { SitecoreLoginPage } from '../wrappers/ui';

/**
 * Sitecore Authentication Utility
 * Handles authentication, session management, and user context for Sitecore testing
 */

export interface SitecoreCredentials {
  username: string;
  password: string;
  domain?: string;
}

export interface SitecoreAuthConfig {
  baseUrl: string;
  credentials: SitecoreCredentials;
  sessionTimeout?: number;
  autoRelogin?: boolean;
}

export class SitecoreAuthManager {
  private page: Page;
  private context: BrowserContext;
  private config: SitecoreAuthConfig;
  private isAuthenticated: boolean = false;
  private sessionStartTime: Date | null = null;
  private loginPage: SitecoreLoginPage;

  constructor(page: Page, config: SitecoreAuthConfig) {
    this.page = page;
    this.context = page.context();
    this.config = {
      sessionTimeout: 30 * 60 * 1000, // 30 minutes default
      autoRelogin: true,
      ...config
    };
    this.loginPage = new SitecoreLoginPage(page, { baseURL: config.baseUrl });
  }

  /**
   * Authenticate user with Sitecore
   */
  async authenticate(): Promise<void> {
    console.log('🔐 Authenticating with Sitecore...');
    
    try {
      await this.loginPage.login(
        this.config.credentials.username,
        this.config.credentials.password,
        this.config.credentials.domain || 'sitecore'
      );
      
      this.isAuthenticated = true;
      this.sessionStartTime = new Date();
      
      console.log(`✅ Authentication successful for: ${this.config.credentials.domain}\\${this.config.credentials.username}`);
      
    } catch (error) {
      this.isAuthenticated = false;
      throw new Error(`Sitecore authentication failed: ${error.message}`);
    }
  }

  /**
   * Check if current session is valid
   */
  async isSessionValid(): Promise<boolean> {
    if (!this.isAuthenticated || !this.sessionStartTime) {
      return false;
    }

    // Check session timeout
    const sessionAge = Date.now() - this.sessionStartTime.getTime();
    if (sessionAge > this.config.sessionTimeout!) {
      console.log('⏰ Session expired due to timeout');
      this.isAuthenticated = false;
      return false;
    }

    // Check if still logged in by looking for Sitecore elements
    try {
      const isLoggedIn = await this.loginPage.isLoggedIn();
      if (!isLoggedIn) {
        console.log('🚪 Session expired - user logged out');
        this.isAuthenticated = false;
        return false;
      }
      
      return true;
    } catch (error) {
      console.log('❌ Session validation failed');
      this.isAuthenticated = false;
      return false;
    }
  }

  /**
   * Ensure user is authenticated (login if needed)
   */
  async ensureAuthenticated(): Promise<void> {
    const sessionValid = await this.isSessionValid();
    
    if (!sessionValid) {
      if (this.config.autoRelogin) {
        console.log('🔄 Session invalid, attempting re-authentication...');
        await this.authenticate();
      } else {
        throw new Error('Session invalid and auto-relogin is disabled');
      }
    }
  }

  /**
   * Logout from Sitecore
   */
  async logout(): Promise<void> {
    if (this.isAuthenticated) {
      console.log('🚪 Logging out of Sitecore...');
      
      try {
        await this.loginPage.logout();
        this.isAuthenticated = false;
        this.sessionStartTime = null;
        console.log('✅ Logged out successfully');
      } catch (error) {
        console.log(`⚠️ Logout failed: ${error.message}`);
        // Force logout state
        this.isAuthenticated = false;
        this.sessionStartTime = null;
      }
    }
  }

  /**
   * Get current authentication status
   */
  getAuthStatus(): {
    isAuthenticated: boolean;
    username: string;
    domain: string;
    sessionAge?: number;
    timeRemaining?: number;
  } {
    const sessionAge = this.sessionStartTime ? Date.now() - this.sessionStartTime.getTime() : 0;
    const timeRemaining = this.sessionStartTime ? this.config.sessionTimeout! - sessionAge : 0;

    return {
      isAuthenticated: this.isAuthenticated,
      username: this.config.credentials.username,
      domain: this.config.credentials.domain || 'sitecore',
      sessionAge: this.sessionStartTime ? sessionAge : undefined,
      timeRemaining: this.sessionStartTime && timeRemaining > 0 ? timeRemaining : undefined
    };
  }

  /**
   * Save authentication state to context storage
   */
  async saveAuthState(): Promise<void> {
    if (this.isAuthenticated) {
      const state = await this.context.storageState();
      // Store state with timestamp for session validation
      const authState = {
        ...state,
        authTimestamp: this.sessionStartTime?.getTime(),
        credentials: this.config.credentials
      };
      
      // Save to storage (could be file, database, etc.)
      console.log('💾 Authentication state saved');
    }
  }

  /**
   * Restore authentication state from context storage
   */
  async restoreAuthState(): Promise<boolean> {
    try {
      // This would load from saved state
      // For now, just validate current session
      return await this.isSessionValid();
    } catch (error) {
      console.log('⚠️ Could not restore authentication state');
      return false;
    }
  }

  /**
   * Switch to different user (logout current, login new)
   */
  async switchUser(newCredentials: SitecoreCredentials): Promise<void> {
    console.log(`🔄 Switching to user: ${newCredentials.domain}\\${newCredentials.username}`);
    
    // Logout current user
    await this.logout();
    
    // Update credentials
    this.config.credentials = newCredentials;
    
    // Login new user
    await this.authenticate();
  }

  /**
   * Execute function with authentication handling
   */
  async withAuth<T>(fn: () => Promise<T>): Promise<T> {
    await this.ensureAuthenticated();
    
    try {
      return await fn();
    } catch (error) {
      // Check if error might be due to authentication issues
      if (error.message.includes('login') || error.message.includes('unauthorized')) {
        console.log('🔄 Possible auth issue, attempting fresh authentication...');
        await this.authenticate();
        return await fn();
      }
      throw error;
    }
  }

  /**
   * Setup authentication for test context
   */
  static async setupForTest(
    page: Page, 
    config: SitecoreAuthConfig
  ): Promise<SitecoreAuthManager> {
    const authManager = new SitecoreAuthManager(page, config);
    await authManager.authenticate();
    return authManager;
  }
}

/**
 * Authentication helper functions for common scenarios
 */
export class SitecoreAuthHelpers {
  /**
   * Get default admin credentials
   */
  static getAdminCredentials(password: string = 'b'): SitecoreCredentials {
    return {
      username: 'admin',
      password: password,
      domain: 'sitecore'
    };
  }

  /**
   * Get developer credentials (if using default developer account)
   */
  static getDeveloperCredentials(password: string = 'developer'): SitecoreCredentials {
    return {
      username: 'developer',
      password: password,
      domain: 'sitecore'
    };
  }

  /**
   * Create authentication config with common defaults
   */
  static createConfig(
    baseUrl: string, 
    credentials: SitecoreCredentials,
    options?: Partial<SitecoreAuthConfig>
  ): SitecoreAuthConfig {
    return {
      baseUrl,
      credentials,
      sessionTimeout: 30 * 60 * 1000,
      autoRelogin: true,
      ...options
    };
  }

  /**
   * Quick setup for admin authentication
   */
  static async setupAdminAuth(
    page: Page, 
    baseUrl: string, 
    adminPassword: string = 'b'
  ): Promise<SitecoreAuthManager> {
    const config = SitecoreAuthHelpers.createConfig(
      baseUrl,
      SitecoreAuthHelpers.getAdminCredentials(adminPassword)
    );
    
    return await SitecoreAuthManager.setupForTest(page, config);
  }

  /**
   * Setup authentication with environment variables
   */
  static async setupFromEnv(page: Page, baseUrl: string): Promise<SitecoreAuthManager> {
    const credentials: SitecoreCredentials = {
      username: process.env.SITECORE_USERNAME || 'admin',
      password: process.env.SITECORE_PASSWORD || 'b',
      domain: process.env.SITECORE_DOMAIN || 'sitecore'
    };

    const config = SitecoreAuthHelpers.createConfig(baseUrl, credentials);
    return await SitecoreAuthManager.setupForTest(page, config);
  }

  /**
   * Validate authentication configuration
   */
  static validateConfig(config: SitecoreAuthConfig): boolean {
    if (!config.baseUrl) {
      throw new Error('Base URL is required for Sitecore authentication');
    }

    if (!config.credentials.username) {
      throw new Error('Username is required for Sitecore authentication');
    }

    if (!config.credentials.password) {
      throw new Error('Password is required for Sitecore authentication');
    }

    return true;
  }
}

/**
 * Playwright test fixture for Sitecore authentication
 */
export const sitecoreAuthFixture = {
  async sitecoreAuth({ page }, use: (auth: SitecoreAuthManager) => Promise<void>) {
    const baseUrl = process.env.SITECORE_CM_URL || 'https://xp0cm.localhost';
    const authManager = await SitecoreAuthHelpers.setupFromEnv(page, baseUrl);
    
    try {
      await use(authManager);
    } finally {
      await authManager.logout();
    }
  }
};

/**
 * Decorator for automatic Sitecore authentication in tests
 */
export function withSitecoreAuth(credentials?: SitecoreCredentials) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const page = args[0]?.page || args[0]; // Handle different test patterns
      const baseUrl = process.env.SITECORE_CM_URL || 'https://xp0cm.localhost';
      
      const authCredentials = credentials || SitecoreAuthHelpers.getAdminCredentials();
      const config = SitecoreAuthHelpers.createConfig(baseUrl, authCredentials);
      
      const authManager = await SitecoreAuthManager.setupForTest(page, config);
      
      try {
        return await originalMethod.apply(this, args);
      } finally {
        await authManager.logout();
      }
    };
    
    return descriptor;
  };
}