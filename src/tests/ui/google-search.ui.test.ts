import { test, expect } from '@playwright/test';
import { GooglePage } from '../../wrappers/ui';
import { TestHelpers } from '../../utils';

/**
 * Google Search Tests - DISABLED
 * 
 * These tests are disabled using test.describe.skip() to prevent them from running
 * in the test suite. They can be re-enabled by changing test.describe.skip() back
 * to test.describe() if needed.
 * 
 * Reason for disabling: External dependency on Google.com which may cause test 
 * instability and is not part of the core application functionality.
 */
test.describe.skip('Google Search Tests', () => {
  let googlePage: GooglePage;

  test.beforeEach(async ({ page }) => {
    googlePage = new GooglePage(page);
  });

  test('should navigate to Google and search for "apple" and return first result', async () => {
    // Navigate to Google
    await googlePage.navigateToGoogle();
    await googlePage.expectTitle(/Google/i);
    
    // Verify we're on Google homepage
    expect(await googlePage.isGoogleHomePage()).toBeTruthy();
    
    // Search for "apple"
    await googlePage.search('apple');
    
    // Wait for search results to load
    await googlePage.waitForSearchResults();
    await googlePage.expectSearchResultsVisible();
    
    // Get the first search result
    const firstResult = await googlePage.getFirstSearchResult();
    
    // Validate the first result contains relevant information
    expect(firstResult.title).toBeTruthy();
    expect(firstResult.url).toBeTruthy();
    expect(firstResult.title.length).toBeGreaterThan(0);
    expect(firstResult.url).toMatch(/^https?:\/\//);
    
    // Verify the result is related to "apple"
    await googlePage.expectFirstSearchResultContains('apple');
    
    // Log the first search result for verification
    console.log('First search result for "apple":');
    console.log(`Title: ${firstResult.title}`);
    console.log(`URL: ${firstResult.url}`);
    console.log(`Snippet: ${firstResult.snippet}`);
    
    // Take a screenshot of the search results
    await googlePage.screenshot('google-search-apple-results');
  });

  test('should search for "apple" and get multiple search results', async () => {
    await googlePage.navigateToGoogle();
    await googlePage.search('apple');
    await googlePage.waitForSearchResults();
    
    // Get all search results
    const allResults = await googlePage.getAllSearchResults();
    
    // Verify we have multiple results
    expect(allResults.length).toBeGreaterThan(1);
    expect(allResults.length).toBeLessThanOrEqual(10);
    
    // Verify each result has required properties
    allResults.forEach((result, index) => {
      expect(result.title, `Result ${index + 1} should have title`).toBeTruthy();
      expect(result.url, `Result ${index + 1} should have URL`).toBeTruthy();
      expect(result.url, `Result ${index + 1} should have valid URL`).toMatch(/^https?:\/\//);
    });
    
    // Log all results
    console.log(`Found ${allResults.length} search results for "apple":`);
    allResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title} - ${result.url}`);
    });
  });

  test('should search for "apple" and click first result', async () => {
    await googlePage.navigateToGoogle();
    await googlePage.search('apple');
    await googlePage.waitForSearchResults();
    
    // Get first result before clicking
    const firstResult = await googlePage.getFirstSearchResult();
    expect(firstResult.url).toBeTruthy();
    
    // Click the first search result
    await googlePage.clickFirstSearchResult();
    
    // Wait for navigation
    await TestHelpers.waitForNetworkIdle(googlePage.page);
    
    // Verify we navigated to a different page
    const currentUrl = await googlePage.getCurrentUrl();
    expect(currentUrl).not.toContain('google.com/search');
    
    // Take a screenshot of the destination page
    await googlePage.screenshot('apple-first-result-page');
    
    console.log(`Navigated to first result: ${currentUrl}`);
  });

  test('should handle search with no results gracefully', async () => {
    await googlePage.navigateToGoogle();
    
    // Search for something very unlikely to have results
    const uniqueQuery = `xyzunlikelysearchterm${Date.now()}`;
    await googlePage.search(uniqueQuery);
    
    try {
      await googlePage.waitForSearchResults();
      const results = await googlePage.getAllSearchResults();
      
      // Either no results or very few results
      expect(results.length).toBeLessThanOrEqual(2);
      
      console.log(`Search for "${uniqueQuery}" returned ${results.length} results`);
    } catch (error) {
      // It's okay if search results don't appear for this unique query
      console.log(`No search results found for unique query: ${uniqueQuery}`);
    }
  });

  test('should verify search functionality with different queries', async () => {
    const queries = ['apple', 'Microsoft', 'Playwright automation'];
    
    for (const query of queries) {
      await googlePage.navigateToGoogle();
      await googlePage.search(query);
      await googlePage.waitForSearchResults();
      
      const firstResult = await googlePage.getFirstSearchResult();
      expect(firstResult.title).toBeTruthy();
      expect(firstResult.url).toBeTruthy();
      
      console.log(`First result for "${query}": ${firstResult.title}`);
      
      // Small delay between searches
      await TestHelpers.delay(1000);
    }
  });

  test('should clear search and perform new search', async () => {
    await googlePage.navigateToGoogle();
    
    // First search
    await googlePage.search('apple');
    await googlePage.waitForSearchResults();
    
    let searchQuery = await googlePage.getSearchQuery();
    expect(searchQuery).toBe('apple');
    
    // Navigate back to Google homepage
    await googlePage.navigateToGoogle();
    
    // Second search
    await googlePage.search('microsoft');
    await googlePage.waitForSearchResults();
    
    searchQuery = await googlePage.getSearchQuery();
    expect(searchQuery).toBe('microsoft');
    
    const firstResult = await googlePage.getFirstSearchResult();
    expect(firstResult.title.toLowerCase()).toContain('microsoft');
  });

  test('should handle different viewport sizes for Google search', async () => {
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 768, height: 1024 },  // Tablet
      { width: 375, height: 667 }    // Mobile
    ];
    
    for (const viewport of viewports) {
      await TestHelpers.setViewportSize(googlePage.page, viewport.width, viewport.height);
      
      await googlePage.navigateToGoogle();
      expect(await googlePage.isGoogleHomePage()).toBeTruthy();
      
      await googlePage.search('apple');
      await googlePage.waitForSearchResults();
      
      const firstResult = await googlePage.getFirstSearchResult();
      expect(firstResult.title).toBeTruthy();
      
      console.log(`Viewport ${viewport.width}x${viewport.height}: Found result "${firstResult.title}"`);
      
      await googlePage.screenshot(`google-search-${viewport.width}x${viewport.height}`);
    }
  });

  test('should validate first Apple search result properties', async () => {
    await googlePage.navigateToGoogle();
    await googlePage.search('apple');
    await googlePage.waitForSearchResults();
    
    const firstResult = await googlePage.getFirstSearchResult();
    
    // Detailed validation of the first result
    expect(firstResult.title).toBeTruthy();
    expect(firstResult.title.length).toBeGreaterThan(5);
    expect(firstResult.url).toMatch(/^https?:\/\/[^\s]+/);
    
    // The first result for "apple" should likely be Apple Inc.
    const titleLower = firstResult.title.toLowerCase();
    const urlLower = firstResult.url.toLowerCase();
    const snippetLower = firstResult.snippet.toLowerCase();
    
    const containsApple = titleLower.includes('apple') || 
                         urlLower.includes('apple') || 
                         snippetLower.includes('apple');
    
    expect(containsApple).toBeTruthy();
    
    // Log the result for test output
    console.log('Search result:', {
      searchQuery: 'apple',
      firstResult: firstResult,
      timestamp: new Date().toISOString()
    });
  });
});