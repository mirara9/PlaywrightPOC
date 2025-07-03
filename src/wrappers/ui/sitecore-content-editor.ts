import { Page, Locator, expect } from '@playwright/test';
import { SitecoreBasePage, SitecorePageConfig } from './sitecore-base-page';

/**
 * Sitecore Content Editor Page Object
 * Handles interactions with the Sitecore Content Editor interface
 */
export class SitecoreContentEditor extends SitecoreBasePage {
  // Content tree elements
  readonly contentTreePane: Locator;
  readonly contentTreeRoot: Locator;
  readonly selectedTreeItem: Locator;
  readonly treeNodeGlyph: Locator;
  
  // Content area elements
  readonly contentArea: Locator;
  readonly itemEditor: Locator;
  readonly fieldEditor: Locator;
  readonly fieldValue: Locator;
  
  // Ribbon elements (Content Editor specific)
  readonly homeTab: Locator;
  readonly navigateTab: Locator;
  readonly developerTab: Locator;
  readonly viewTab: Locator;
  readonly versionsTab: Locator;
  
  // Ribbon buttons
  readonly saveButton: Locator;
  readonly saveAllButton: Locator;
  readonly newItemButton: Locator;
  readonly deleteItemButton: Locator;
  readonly duplicateItemButton: Locator;
  readonly publishButton: Locator;
  readonly previewButton: Locator;
  
  // Search and filter
  readonly quickSearchBox: Locator;
  readonly searchResults: Locator;
  readonly filterDropdown: Locator;
  
  // Status and messages
  readonly statusBar: Locator;
  readonly itemPath: Locator;
  readonly validationSummary: Locator;
  readonly notificationArea: Locator;

  constructor(page: Page, config?: SitecorePageConfig) {
    super(page, '/sitecore/shell/Applications/Content%20Manager/default.aspx', config);
    
    // Content tree elements
    this.contentTreePane = page.locator('#ContentTreePanel, .sc-contenttree-panel');
    this.contentTreeRoot = page.locator('#ContentTreeInnerPanel, .sc-contenttree-inner');
    this.selectedTreeItem = page.locator('.scContentTreeNodeSelected, .sc-tree-node-selected');
    this.treeNodeGlyph = page.locator('.scContentTreeNodeGlyph, .sc-tree-glyph');
    
    // Content area
    this.contentArea = page.locator('#ContentEditor, .sc-content-editor');
    this.itemEditor = page.locator('#ItemEditor, .sc-item-editor');
    this.fieldEditor = page.locator('.scFieldEditor, .sc-field-editor');
    this.fieldValue = page.locator('.scFieldValue, .sc-field-value');
    
    // Ribbon tabs
    this.homeTab = page.locator('[data-sc-id="HomeTab"], .scRibbonTab:has-text("Home")');
    this.navigateTab = page.locator('[data-sc-id="NavigateTab"], .scRibbonTab:has-text("Navigate")');
    this.developerTab = page.locator('[data-sc-id="DeveloperTab"], .scRibbonTab:has-text("Developer")');
    this.viewTab = page.locator('[data-sc-id="ViewTab"], .scRibbonTab:has-text("View")');
    this.versionsTab = page.locator('[data-sc-id="VersionsTab"], .scRibbonTab:has-text("Versions")');
    
    // Ribbon buttons
    this.saveButton = page.locator('[data-sc-id="Save"], .scRibbonButton:has-text("Save")').first();
    this.saveAllButton = page.locator('[data-sc-id="SaveAll"], .scRibbonButton:has-text("Save All")').first();
    this.newItemButton = page.locator('[data-sc-id="NewItem"], .scRibbonButton:has-text("New Item")').first();
    this.deleteItemButton = page.locator('[data-sc-id="Delete"], .scRibbonButton:has-text("Delete")').first();
    this.duplicateItemButton = page.locator('[data-sc-id="Duplicate"], .scRibbonButton:has-text("Duplicate")').first();
    this.publishButton = page.locator('[data-sc-id="Publish"], .scRibbonButton:has-text("Publish")').first();
    this.previewButton = page.locator('[data-sc-id="Preview"], .scRibbonButton:has-text("Preview")').first();
    
    // Search elements
    this.quickSearchBox = page.locator('#QuickSearch, .sc-quick-search');
    this.searchResults = page.locator('#SearchResults, .sc-search-results');
    this.filterDropdown = page.locator('#FilterDropdown, .sc-filter-dropdown');
    
    // Status elements
    this.statusBar = page.locator('#StatusBar, .sc-status-bar');
    this.itemPath = page.locator('#ItemPath, .sc-item-path');
    this.validationSummary = page.locator('#ValidationSummary, .sc-validation-summary');
    this.notificationArea = page.locator('#NotificationArea, .sc-notification-area');
  }

  /**
   * Navigate to Content Editor and wait for it to load
   */
  async navigate(): Promise<void> {
    await super.navigate();
    await this.waitForContentEditorLoad();
  }

  /**
   * Wait for Content Editor interface to be fully loaded
   */
  async waitForContentEditorLoad(): Promise<void> {
    console.log('⏳ Waiting for Content Editor to load...');
    
    // Wait for main panels to be visible
    await this.contentTreePane.waitFor({ state: 'visible', timeout: 30000 });
    await this.contentArea.waitFor({ state: 'visible', timeout: 30000 });
    
    // Wait for ribbon to be ready
    await this.ribbon.waitFor({ state: 'visible', timeout: 30000 });
    
    // Wait for content tree to load
    await this.page.waitForFunction(() => {
      const tree = document.querySelector('#ContentTreeInnerPanel, .sc-contenttree-inner');
      return tree && tree.children.length > 0;
    }, { timeout: 30000 });
    
    console.log('✅ Content Editor loaded');
  }

  /**
   * Select item in content tree by path
   */
  async selectItemByPath(itemPath: string): Promise<void> {
    console.log(`🌳 Selecting item: ${itemPath}`);
    
    const pathParts = itemPath.split('/').filter(part => part.length > 0);
    let currentPath = '';
    
    for (const part of pathParts) {
      currentPath += `/${part}`;
      
      // Find the tree node
      const nodeSelectors = [
        `[title="${part}"]`,
        `[data-sc-path="${currentPath}"]`,
        `.scContentTreeNode:has-text("${part}")`,
        `.sc-tree-node:has-text("${part}")`
      ];
      
      let nodeFound = false;
      for (const selector of nodeSelectors) {
        const node = this.page.locator(selector).first();
        if (await node.isVisible({ timeout: 2000 })) {
          // Expand if not the final item
          if (currentPath !== itemPath) {
            const expandGlyph = node.locator('..').locator('.scContentTreeNodeGlyph').first();
            if (await expandGlyph.isVisible()) {
              await expandGlyph.click();
              await this.page.waitForTimeout(1000);
            }
          } else {
            // Click to select the final item
            await node.click();
            await this.waitForItemLoad();
          }
          nodeFound = true;
          break;
        }
      }
      
      if (!nodeFound) {
        throw new Error(`Tree node not found: ${part}`);
      }
    }
    
    console.log(`✅ Selected item: ${itemPath}`);
  }

  /**
   * Wait for item to load in the editor
   */
  async waitForItemLoad(): Promise<void> {
    // Wait for content area to update
    await this.page.waitForLoadState('networkidle');
    
    // Wait for any AJAX operations
    await this.waitForSitecoreOperation();
    
    // Additional small wait for UI to stabilize
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get field value by field name
   */
  async getFieldValue(fieldName: string): Promise<string> {
    const fieldSelectors = [
      `[data-sc-field="${fieldName}"] input`,
      `[data-sc-field="${fieldName}"] textarea`,
      `[id*="${fieldName}"]`,
      `label:has-text("${fieldName}") + * input`,
      `label:has-text("${fieldName}") + * textarea`
    ];
    
    for (const selector of fieldSelectors) {
      const field = this.page.locator(selector).first();
      if (await field.isVisible({ timeout: 2000 })) {
        return await field.inputValue();
      }
    }
    
    throw new Error(`Field not found: ${fieldName}`);
  }

  /**
   * Set field value by field name
   */
  async setFieldValue(fieldName: string, value: string): Promise<void> {
    console.log(`📝 Setting field '${fieldName}' to: ${value}`);
    
    const fieldSelectors = [
      `[data-sc-field="${fieldName}"] input`,
      `[data-sc-field="${fieldName}"] textarea`,
      `[id*="${fieldName}"]`,
      `label:has-text("${fieldName}") + * input`,
      `label:has-text("${fieldName}") + * textarea`
    ];
    
    for (const selector of fieldSelectors) {
      const field = this.page.locator(selector).first();
      if (await field.isVisible({ timeout: 2000 })) {
        await field.clear();
        await field.fill(value);
        
        // Trigger change event
        await field.blur();
        await this.page.waitForTimeout(500);
        
        console.log(`✅ Field '${fieldName}' updated`);
        return;
      }
    }
    
    throw new Error(`Field not found or not editable: ${fieldName}`);
  }

  /**
   * Save current item
   */
  async saveItem(): Promise<void> {
    console.log('💾 Saving item...');
    
    await this.saveButton.click();
    await this.waitForSitecoreOperation();
    
    // Check for any validation errors
    if (await this.validationSummary.isVisible({ timeout: 2000 })) {
      const errors = await this.validationSummary.textContent();
      if (errors && errors.trim()) {
        throw new Error(`Validation errors: ${errors}`);
      }
    }
    
    console.log('✅ Item saved');
  }

  /**
   * Create new item
   */
  async createNewItem(itemName: string, templateName: string): Promise<void> {
    console.log(`🆕 Creating new item: ${itemName} (${templateName})`);
    
    // Click New Item button
    await this.newItemButton.click();
    
    // Wait for new item dialog
    const dialog = await this.waitForDialog();
    
    // Select template
    const templateSelector = dialog.locator(`[title="${templateName}"], [data-sc-template="${templateName}"], td:has-text("${templateName}")`).first();
    await templateSelector.click();
    
    // Enter item name
    const nameField = dialog.locator('#ItemName, [name="ItemName"], input[type="text"]').first();
    await nameField.fill(itemName);
    
    // Click OK button
    const okButton = dialog.locator('[data-sc-id="OK"], button:has-text("OK")').first();
    await okButton.click();
    
    // Wait for dialog to close and item to load
    await this.waitForItemLoad();
    
    console.log(`✅ Created item: ${itemName}`);
  }

  /**
   * Delete current item
   */
  async deleteCurrentItem(): Promise<void> {
    console.log('🗑️ Deleting current item...');
    
    await this.deleteItemButton.click();
    
    // Wait for confirmation dialog
    const dialog = await this.waitForDialog();
    
    // Confirm deletion
    const confirmButton = dialog.locator('[data-sc-id="Yes"], button:has-text("Yes"), button:has-text("Delete")').first();
    await confirmButton.click();
    
    await this.waitForSitecoreOperation();
    
    console.log('✅ Item deleted');
  }

  /**
   * Duplicate current item
   */
  async duplicateCurrentItem(newName: string): Promise<void> {
    console.log(`📋 Duplicating item as: ${newName}`);
    
    await this.duplicateItemButton.click();
    
    // Wait for duplicate dialog
    const dialog = await this.waitForDialog();
    
    // Enter new name
    const nameField = dialog.locator('#ItemName, [name="ItemName"], input[type="text"]').first();
    await nameField.clear();
    await nameField.fill(newName);
    
    // Click OK
    const okButton = dialog.locator('[data-sc-id="OK"], button:has-text("OK")').first();
    await okButton.click();
    
    await this.waitForItemLoad();
    
    console.log(`✅ Item duplicated as: ${newName}`);
  }

  /**
   * Publish current item
   */
  async publishItem(publishMode: 'item' | 'tree' | 'site' = 'item'): Promise<void> {
    console.log(`📢 Publishing item (mode: ${publishMode})...`);
    
    await this.publishButton.click();
    
    // Wait for publish dialog
    const dialog = await this.waitForDialog();
    
    // Select publish mode if options are available
    const modeRadio = dialog.locator(`[value="${publishMode}"], input[type="radio"]:has-text("${publishMode}")`).first();
    if (await modeRadio.isVisible({ timeout: 2000 })) {
      await modeRadio.check();
    }
    
    // Click Publish button
    const publishBtn = dialog.locator('[data-sc-id="Publish"], button:has-text("Publish")').first();
    await publishBtn.click();
    
    // Wait for publish to complete
    await this.waitForSitecoreOperation(60000); // Publishing can take longer
    
    console.log('✅ Item published');
  }

  /**
   * Preview current item
   */
  async previewItem(): Promise<void> {
    console.log('👁️ Opening item preview...');
    
    await this.previewButton.click();
    
    // Preview typically opens in a new window/tab
    const previewPage = await this.page.context().waitForEvent('page');
    await previewPage.waitForLoadState('networkidle');
    
    console.log('✅ Preview opened');
    return previewPage;
  }

  /**
   * Search for content
   */
  async searchContent(searchTerm: string): Promise<void> {
    console.log(`🔍 Searching Content Editor for: ${searchTerm}`);
    
    await this.quickSearchBox.fill(searchTerm);
    await this.quickSearchBox.press('Enter');
    
    // Wait for search results
    await this.searchResults.waitFor({ state: 'visible', timeout: 10000 });
    
    console.log('✅ Search completed');
  }

  /**
   * Get current item information
   */
  async getCurrentItemInfo(): Promise<{
    name: string;
    path: string;
    template: string;
    id: string;
  }> {
    // Get item path from status bar or breadcrumb
    const path = await this.itemPath.textContent() || '';
    
    // Extract item name (last part of path)
    const pathParts = path.split('/');
    const name = pathParts[pathParts.length - 1] || '';
    
    // Get additional info from page or data attributes
    const id = await this.page.getAttribute('[data-sc-item-id]', 'data-sc-item-id') || '';
    const template = await this.page.getAttribute('[data-sc-template]', 'data-sc-template') || '';
    
    return {
      name: name.trim(),
      path: path.trim(),
      template: template.trim(),
      id: id.trim()
    };
  }

  /**
   * Switch to different Content Editor tab
   */
  async switchToTab(tabName: 'Home' | 'Navigate' | 'Developer' | 'View' | 'Versions'): Promise<void> {
    console.log(`🔄 Switching to ${tabName} tab`);
    
    const tabs = {
      'Home': this.homeTab,
      'Navigate': this.navigateTab,
      'Developer': this.developerTab,
      'View': this.viewTab,
      'Versions': this.versionsTab
    };
    
    const tab = tabs[tabName];
    if (tab) {
      await tab.click();
      await this.page.waitForTimeout(1000);
    } else {
      throw new Error(`Unknown tab: ${tabName}`);
    }
    
    console.log(`✅ Switched to ${tabName} tab`);
  }

  /**
   * Verify Content Editor is loaded and functional
   */
  async verifyContentEditor(): Promise<boolean> {
    try {
      await expect(this.contentTreePane).toBeVisible();
      await expect(this.contentArea).toBeVisible();
      await expect(this.ribbon).toBeVisible();
      
      // Check that we have at least one tree node
      await expect(this.contentTreeRoot.locator('.scContentTreeNode, .sc-tree-node').first()).toBeVisible();
      
      return true;
    } catch (error) {
      return false;
    }
  }
}