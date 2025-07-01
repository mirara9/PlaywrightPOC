import { Page, Locator } from '@playwright/test';
import { BasePage, PageConfig } from './base-page';

export class GooglePage extends BasePage {
  private readonly searchInput: Locator;
  private readonly searchButton: Locator;
  private readonly searchResults: Locator;
  private readonly firstSearchResult: Locator;
  private readonly acceptCookiesButton: Locator;

  constructor(page: Page, config?: PageConfig) {
    super(page, 'https://www.google.com', config);
    
    // Google search elements
    this.searchInput = page.locator('input[name="q"], textarea[name="q"]');
    this.searchButton = page.locator('input[name="btnK"], button[type="submit"]').first();
    this.searchResults = page.locator('#search');
    this.firstSearchResult = page.locator('#search .g').first();
    this.acceptCookiesButton = page.locator('button:has-text("Accept all"), button:has-text("I agree"), #L2AGLb');
  }

  async navigateToGoogle(): Promise<void> {
    await this.navigate();
    await this.waitForPageLoad();
    
    // Handle cookie consent if it appears
    try {
      await this.acceptCookiesButton.waitFor({ timeout: 3000 });
      await this.acceptCookiesButton.click();
    } catch (error) {
      // Cookie dialog might not appear, continue
    }
  }

  async search(query: string): Promise<void> {
    await this.waitForElement(this.searchInput);
    await this.fillInput(this.searchInput, query);
    
    // Press Enter or click search button
    await this.searchInput.press('Enter');
    
    // Wait for search results to load
    await this.waitForElement(this.searchResults);
  }

  async getFirstSearchResult(): Promise<{
    title: string;
    url: string;
    snippet: string;
  }> {
    await this.waitForElement(this.firstSearchResult);
    
    const titleElement = this.firstSearchResult.locator('h3').first();
    const linkElement = this.firstSearchResult.locator('a').first();
    const snippetElement = this.firstSearchResult.locator('[data-sncf="1"], .VwiC3b, .s3v9rd').first();
    
    const title = await titleElement.textContent() || '';
    const url = await linkElement.getAttribute('href') || '';
    const snippet = await snippetElement.textContent() || '';
    
    return {
      title: title.trim(),
      url: url.trim(),
      snippet: snippet.trim()
    };
  }

  async getSearchResultsCount(): Promise<number> {
    await this.waitForElement(this.searchResults);
    return await this.searchResults.locator('.g').count();
  }

  async getAllSearchResults(): Promise<Array<{
    title: string;
    url: string;
    snippet: string;
  }>> {
    await this.waitForElement(this.searchResults);
    
    const results = [];
    const resultElements = this.searchResults.locator('.g');
    const count = await resultElements.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const result = resultElements.nth(i);
      const titleElement = result.locator('h3').first();
      const linkElement = result.locator('a').first();
      const snippetElement = result.locator('[data-sncf="1"], .VwiC3b, .s3v9rd').first();
      
      try {
        const title = await titleElement.textContent() || '';
        const url = await linkElement.getAttribute('href') || '';
        const snippet = await snippetElement.textContent() || '';
        
        if (title && url) {
          results.push({
            title: title.trim(),
            url: url.trim(),
            snippet: snippet.trim()
          });
        }
      } catch (error) {
        // Skip this result if we can't extract data
        continue;
      }
    }
    
    return results;
  }

  async clickFirstSearchResult(): Promise<void> {
    const firstResult = this.firstSearchResult.locator('a').first();
    await this.clickElement(firstResult);
  }

  async expectSearchResultsVisible(): Promise<void> {
    await this.expectVisible(this.searchResults, 'Search results should be visible');
  }

  async expectFirstSearchResultContains(text: string): Promise<void> {
    const firstResult = await this.getFirstSearchResult();
    const containsText = firstResult.title.toLowerCase().includes(text.toLowerCase()) ||
                        firstResult.snippet.toLowerCase().includes(text.toLowerCase());
    
    if (!containsText) {
      throw new Error(`First search result does not contain "${text}". Found: Title="${firstResult.title}", Snippet="${firstResult.snippet}"`);
    }
  }

  async waitForSearchResults(): Promise<void> {
    await this.waitForElement(this.searchResults);
    // Wait for results to stabilize
    await this.page.waitForTimeout(1000);
  }

  async isGoogleHomePage(): Promise<boolean> {
    try {
      await this.searchInput.waitFor({ timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  async getSearchQuery(): Promise<string> {
    return await this.searchInput.inputValue();
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
  }
}