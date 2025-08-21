import { chromium, FullConfig, request } from '@playwright/test';
import { LuminaApiClient } from './utils/api-client';

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:4174';
  
  console.log('🚀 Starting global E2E test setup...');
  
  // 1. Wait for services to be ready
  console.log('⏳ Waiting for backend services...');
  const requestContext = await request.newContext();
  const apiClient = new LuminaApiClient(requestContext);
  
  const servicesReady = await apiClient.waitForServices(120000); // 2 minutes
  if (!servicesReady) {
    throw new Error('Backend services failed to start within timeout period');
  }
  console.log('✅ Backend services are ready');
  
  // 2. Verify frontend is accessible
  console.log('⏳ Checking frontend accessibility...');
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Setup console log collection
    page.on('console', (msg) => {
      const logs = (global as any).__consoleLogs__ || [];
      logs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString(),
      });
      (global as any).__consoleLogs__ = logs;
    });
    
    // Setup network monitoring
    page.on('response', (response) => {
      const networkActivity = (global as any).__networkActivity__ || [];
      networkActivity.push({
        url: response.url(),
        status: response.status(),
        method: response.request().method(),
        timestamp: new Date().toISOString(),
      });
      (global as any).__networkActivity__ = networkActivity;
    });
    
    await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Verify critical elements are present
    const hasMainContent = await page.$('main, [role="main"], body > div') !== null;
    if (!hasMainContent) {
      throw new Error('Frontend appears to be broken - no main content found');
    }
    console.log('✅ Frontend is accessible');
    
    // 3. Clean up any existing test data
    console.log('🧹 Cleaning up existing test data...');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await context.clearCookies();
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
    await requestContext.dispose();
  }
  
  // 4. Set up test environment variables
  process.env.E2E_SETUP_COMPLETE = 'true';
  process.env.E2E_START_TIME = new Date().toISOString();
  
  console.log('✅ Global E2E test setup completed successfully');
}

export default globalSetup;
