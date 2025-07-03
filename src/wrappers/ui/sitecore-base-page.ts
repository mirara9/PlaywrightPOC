import { Page, Locator, expect } from '@playwright/test';
import { BasePage, PageConfig } from './base-page';

/**
 * Base class for all Sitecore page objects
 * Provides common Sitecore-specific functionality and utilities
 */
export abstract class SitecoreBasePage extends BasePage {
  // Common Sitecore UI elements
  protected readonly sitecoreHeader: Locator;
  protected readonly startMenuButton: Locator;
  protected readonly searchBox: Locator;
  protected readonly userMenu: Locator;
  protected readonly logoutButton: Locator;
  protected readonly loadingIndicator: Locator;
  
  // Content tree elements
  protected readonly contentTree: Locator;
  protected readonly contentTreeItem: Locator;
  protected readonly expandTreeNode: Locator;
  
  // Ribbon elements
  protected readonly ribbon: Locator;
  protected readonly ribbonStrip: Locator;
  protected readonly ribbonButton: Locator;

  constructor(page: Page, path: string, config?: PageConfig) {
    super(page, path, {
      timeout: 30000,
      ...config
    });

    // Initialize common Sitecore elements
    this.sitecoreHeader = page.locator('#scHeader, .sc-header');
    this.startMenuButton = page.locator('#scStartMenuButton, [data-sc-id="StartMenuButton"]');
    this.searchBox = page.locator('#scSearchBox, [data-sc-id="SearchBox"]');
    this.userMenu = page.locator('#scUserOptions, .sc-user-menu');
    this.logoutButton = page.locator('a[href*="logout"], [data-sc-id="Logout"]');
    this.loadingIndicator = page.locator('#scLoadingIndicator, .sc-loading, .ajax-loader');
    
    // Content tree
    this.contentTree = page.locator('#scContentTree, .sc-content-tree');
    this.contentTreeItem = page.locator('.scContentTreeNode, .sc-tree-node');
    this.expandTreeNode = page.locator('.scContentTreeNodeGlyph, .sc-tree-glyph');
    
    // Ribbon
    this.ribbon = page.locator('#scRibbon, .sc-ribbon');
    this.ribbonStrip = page.locator('.scRibbonStrip, .sc-ribbon-strip');
    this.ribbonButton = page.locator('.scRibbonButton, .sc-ribbon-button');
  }

  /**
   * Wait for Sitecore page to be fully loaded
   */
  async waitForSitecoreLoad(): Promise<void> {
    console.log('⏳ Waiting for Sitecore page to load...');
    
    // Wait for basic page load
    await this.page.waitForLoadState('networkidle');
    
    // Wait for Sitecore header to be visible
    await this.sitecoreHeader.waitFor({ state: 'visible', timeout: 30000 });
    
    // Wait for any loading indicators to disappear
    try {
      await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
    } catch (error) {
      // Loading indicator might not be present, which is fine
    }
    
    // Additional wait for Sitecore JavaScript to initialize
    await this.page.waitForFunction(() => {
      return window.scForm || window.Sitecore || document.readyState === 'complete';
    }, { timeout: 30000 });
    
    console.log('✅ Sitecore page loaded');
  }

  /**
   * Navigate to Sitecore page and wait for it to load
   */
  async navigate(): Promise<void> {
    await super.navigate();
    await this.waitForSitecoreLoad();
  }

  /**
   * Check if user is logged into Sitecore
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      // Check for presence of Sitecore header and user menu
      const headerVisible = await this.sitecoreHeader.isVisible({ timeout: 5000 });
      const userMenuVisible = await this.userMenu.isVisible({ timeout: 5000 });
      
      return headerVisible && userMenuVisible;
    } catch (error) {
      return false;
    }
  }

  /**
   * Search for content in Sitecore
   */
  async searchContent(searchTerm: string): Promise<void> {
    console.log(`🔍 Searching for: ${searchTerm}`);
    
    await this.searchBox.waitFor({ state: 'visible' });
    await this.searchBox.fill(searchTerm);
    await this.searchBox.press('Enter');
    
    // Wait for search results to load
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to content tree item
   */
  async navigateToTreeItem(itemPath: string): Promise<void> {
    console.log(`🌳 Navigating to tree item: ${itemPath}`);
    
    const pathParts = itemPath.split('/').filter(part => part.length > 0);
    
    // Ensure content tree is visible
    await this.contentTree.waitFor({ state: 'visible' });
    
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      
      // Find and click the tree item
      const treeItem = this.page.locator(`[title*="${part}"], [data-sc-path*="${part}"]`).first();
      
      // Expand parent nodes if needed
      if (i < pathParts.length - 1) {
        const expandButton = treeItem.locator('..').locator('.scContentTreeNodeGlyph, .sc-tree-glyph').first();
        if (await expandButton.isVisible()) {
          await expandButton.click();
          await this.page.waitForTimeout(1000); // Wait for expansion
        }
      }
      
      // Click the item
      await treeItem.click();
      await this.page.waitForTimeout(500);
    }
    
    console.log(`✅ Navigated to: ${itemPath}`);
  }

  /**
   * Click ribbon button by text or data attribute
   */
  async clickRibbonButton(buttonIdentifier: string): Promise<void> {
    console.log(`🎀 Clicking ribbon button: ${buttonIdentifier}`);
    
    // Try multiple selectors for ribbon buttons
    const selectors = [
      `[title="${buttonIdentifier}"]`,
      `[data-sc-id="${buttonIdentifier}"]`,
      `[onclick*="${buttonIdentifier}"]`,
      `.scRibbonButton:has-text("${buttonIdentifier}")`,
      `.sc-ribbon-button:has-text("${buttonIdentifier}")`
    ];
    
    for (const selector of selectors) {
      const button = this.page.locator(selector).first();
      if (await button.isVisible({ timeout: 2000 })) {
        await button.click();
        await this.page.waitForTimeout(1000);
        return;
      }
    }
    
    throw new Error(`Ribbon button not found: ${buttonIdentifier}`);
  }

  /**
   * Wait for modal dialog to appear
   */
  async waitForDialog(timeout: number = 10000): Promise<Locator> {
    const dialogSelectors = [
      '.scModalDialog',
      '.ui-dialog',
      '.sc-dialog',
      '[role="dialog"]'
    ];
    
    for (const selector of dialogSelectors) {
      try {
        const dialog = this.page.locator(selector);
        await dialog.waitFor({ state: 'visible', timeout });
        return dialog;
      } catch (error) {
        // Try next selector
      }
    }
    
    throw new Error('Dialog did not appear within timeout');
  }

  /**
   * Close modal dialog
   */
  async closeDialog(): Promise<void> {
    const closeSelectors = [
      '.scModalDialog .scClose',
      '.ui-dialog-titlebar-close',
      '.sc-dialog-close',
      '[data-sc-id="Cancel"]',
      'button:has-text("Cancel")',
      'button:has-text("Close")'
    ];
    
    for (const selector of closeSelectors) {
      const closeButton = this.page.locator(selector).first();
      if (await closeButton.isVisible({ timeout: 2000 })) {
        await closeButton.click();
        await this.page.waitForTimeout(500);
        return;
      }
    }
    
    // Fallback: press Escape
    await this.page.keyboard.press('Escape');
  }

  /**
   * Switch to specific Sitecore application
   */
  async switchToApplication(appName: 'Content Editor' | 'Experience Editor' | 'Desktop' | 'Launchpad'): Promise<void> {
    console.log(`🔄 Switching to ${appName}`);
    
    const appUrls = {
      'Content Editor': '/sitecore/shell/Applications/Content%20Manager/default.aspx',
      'Experience Editor': '/sitecore/shell/Applications/WebEdit/WebEditRibbon.aspx',
      'Desktop': '/sitecore/shell/default.aspx',
      'Launchpad': '/sitecore/shell/client/Applications/Launchpad'
    };
    
    const url = appUrls[appName];
    if (!url) {
      throw new Error(`Unknown Sitecore application: ${appName}`);
    }
    
    await this.page.goto(this.baseURL + url);
    await this.waitForSitecoreLoad();
  }

  /**
   * Logout from Sitecore
   */
  async logout(): Promise<void> {
    console.log('🚪 Logging out of Sitecore');
    
    try {
      // Try clicking user menu first
      if (await this.userMenu.isVisible({ timeout: 5000 })) {
        await this.userMenu.click();
        await this.page.waitForTimeout(1000);
      }
      
      // Click logout button
      await this.logoutButton.click();
      
      // Wait for redirect to login page
      await this.page.waitForURL('**/login**', { timeout: 10000 });
      
    } catch (error) {
      // Fallback: navigate directly to logout URL
      await this.page.goto(this.baseURL + '/sitecore/login?logout=true');
    }
    
    console.log('✅ Logged out successfully');
  }

  /**
   * Verify Sitecore page elements are present
   */
  async verifySitecoreElements(): Promise<boolean> {
    try {
      await expect(this.sitecoreHeader).toBeVisible();
      
      // Check for either start menu or user menu (depending on interface)
      const hasStartMenu = await this.startMenuButton.isVisible({ timeout: 2000 });
      const hasUserMenu = await this.userMenu.isVisible({ timeout: 2000 });
      
      return hasStartMenu || hasUserMenu;
    } catch (error) {
      return false;
    }
  }

  /**
   * Take screenshot with Sitecore context
   */
  async takeScreenshot(name: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `sitecore-${name}-${timestamp}.png`;
    
    await this.page.screenshot({
      path: `test-results/${filename}`,
      fullPage: true
    });
    
    console.log(`📸 Screenshot saved: ${filename}`);
    return filename;
  }

  /**
   * Execute Sitecore JavaScript command
   */
  async executeSitecoreCommand(command: string): Promise<any> {
    return await this.page.evaluate((cmd) => {
      // Access Sitecore's JavaScript API
      if (window.scForm) {
        return window.scForm.postRequest('', '', '', cmd);
      } else if (window.Sitecore) {
        return eval(cmd);
      } else {
        throw new Error('Sitecore JavaScript API not available');
      }
    }, command);
  }

  /**
   * Wait for Sitecore operation to complete
   */
  async waitForSitecoreOperation(timeout: number = 30000): Promise<void> {
    // Wait for any AJAX operations to complete
    await this.page.waitForFunction(() => {
      return !window.scForm || !window.scForm.isBusy;
    }, { timeout });
    
    // Wait for any loading indicators
    try {
      await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 5000 });
    } catch (error) {
      // Loading indicator might not be present
    }
  }
}

/**
 * Interface for Sitecore-specific page configuration
 */
export interface SitecorePageConfig extends PageConfig {
  application?: 'Content Editor' | 'Experience Editor' | 'Desktop' | 'Launchpad';
  autoLogin?: boolean;
  loginCredentials?: {
    username: string;
    password: string;
    domain?: string;
  };
}