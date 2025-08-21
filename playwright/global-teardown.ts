import { chromium, FullConfig, request } from '@playwright/test';
import { LuminaApiClient } from './utils/api-client';
import { promises as fs } from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:4174';
  
  console.log('🧹 Starting global E2E test teardown...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Clear application state
    console.log('🧹 Clearing application state...');
    await page.goto(baseURL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await context.clearCookies();
    
    // 2. Clean up test data via API
    console.log('🧹 Cleaning up test data...');
    const requestContext = await request.newContext();
    const apiClient = new LuminaApiClient(requestContext);
    
    // Get test data manager from global state if available
    const testDataManager = (global as any).__testDataManager__;
    if (testDataManager) {
      const createdUsers = testDataManager.getCreatedUsers();
      const createdData = testDataManager.getCreatedData();
      
      // Clean up created users
      for (const user of createdUsers) {
        if (user.id && user.token) {
          try {
            await apiClient.cleanupUser(user.id, user.token);
          } catch (error) {
            console.warn(`Failed to cleanup user ${user.id}:`, error);
          }
        }
      }
      
      console.log(`🧹 Cleaned up ${createdUsers.length} test users and ${createdData.length} data items`);
    }
    
    await requestContext.dispose();
    
    // 3. Generate test run summary
    const startTime = process.env.E2E_START_TIME;
    if (startTime) {
      const endTime = new Date();
      const duration = endTime.getTime() - new Date(startTime).getTime();
      
      const summary = {
        startTime: startTime,
        endTime: endTime.toISOString(),
        duration: `${Math.round(duration / 1000)}s`,
        consoleLogs: (global as any).__consoleLogs__ || [],
        networkActivity: (global as any).__networkActivity__ || [],
      };
      
      // Save test run summary
      const summaryPath = path.join(process.cwd(), 'test-results', 'test-run-summary.json');
      await fs.mkdir(path.dirname(summaryPath), { recursive: true });
      await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
      
      console.log(`📊 Test run summary saved to: ${summaryPath}`);
      console.log(`⏱️ Total test run duration: ${summary.duration}`);
    }
    
  } catch (error) {
    console.warn('❌ Global teardown failed:', error);
  } finally {
    await browser.close();
    
    // Clear global state
    delete (global as any).__consoleLogs__;
    delete (global as any).__networkActivity__;
    delete (global as any).__testDataManager__;
    
    console.log('✅ Global E2E test teardown completed');
  }
}

export default globalTeardown;