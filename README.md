# Lumina E2E Testing Suite

This directory contains the comprehensive end-to-end testing suite for the Lumina learning platform. The testing suite has been enhanced with robust patterns, better error handling, and comprehensive coverage of critical user journeys.

## 🚀 Features

- **Multi-browser Testing**: Chrome, Firefox, Safari, and mobile browsers
- **Robust Test Infrastructure**: Advanced retry strategies, proper wait conditions, and error handling
- **Comprehensive Page Objects**: Reusable components for all major UI elements
- **API Integration**: Direct backend testing and data setup/cleanup
- **Test Fixtures**: Consistent authentication and user management
- **Enhanced Debugging**: Detailed error capture and analysis
- **Environment Configuration**: Support for local, development, staging, and production
- **CI/CD Integration**: Advanced reporting and failure analysis

## 📁 Project Structure

```
playwright/
├── config/
│   └── environments.ts          # Environment configurations
├── fixtures/
│   └── auth-fixtures.ts        # Authentication test fixtures
├── pages/
│   ├── LoginPage.ts            # Login page object model
│   ├── OnboardingPage.ts       # Onboarding page object model
│   ├── LearningJourneyPage.ts  # Journey page object model
│   ├── QuestionPage.ts         # Question interaction page object
│   └── Sidebar.ts              # Sidebar navigation component
├── utils/
│   ├── test-data.ts            # Test data generation and management
│   ├── api-client.ts           # Backend API interaction utilities
│   ├── debug-helpers.ts        # Enhanced debugging and error capture
│   └── ci-reporter.ts          # Custom CI/CD reporting
├── *.spec.ts                   # Test files
├── global-setup.ts             # Global test setup
└── global-teardown.ts          # Global test cleanup
```

## 🎯 Test Categories

### Core User Journeys
- **Authentication Flow**: Registration, login, logout, password reset
- **Onboarding Process**: University selection, degree setup, preferences
- **Learning Journey**: Course navigation, progress tracking, achievements
- **Question Interactions**: Answering questions, providing feedback, navigation
- **Multi-language Support**: Language switching, content localization

### Regression Tests
- **API Integration**: Backend service interactions
- **Data Persistence**: User state across sessions
- **Error Handling**: Network issues, invalid inputs
- **Performance**: Load times, responsiveness

## 🛠️ Getting Started

### Prerequisites
```bash
# Install dependencies
pnpm install

# Install browsers
pnpm test:install
```

### Running Tests

#### Basic Test Execution
```bash
# Run all tests
pnpm test:e2e

# Run with UI (interactive mode)
pnpm test:e2e:ui

# Run with debugging
pnpm test:e2e:debug
```

#### Browser-Specific Tests
```bash
# Chrome only
pnpm test:e2e:chrome

# Firefox only  
pnpm test:e2e:firefox

# Safari only
pnpm test:e2e:webkit

# Mobile browsers
pnpm test:e2e:mobile
```

#### Environment-Specific Tests
```bash
# Local development
pnpm test:e2e:local

# Development server
pnpm test:e2e:dev

# Staging environment
pnpm test:e2e:staging

# Production (smoke tests only)
pnpm test:e2e:prod
```

#### Test Categories
```bash
# Smoke tests (critical functionality)
pnpm test:smoke

# Regression tests (comprehensive coverage)
pnpm test:regression

# Authentication tests
pnpm test:auth

# User journey tests
pnpm test:journey
```

### Advanced Options
```bash
# Run in headed mode (see browser)
pnpm test:e2e:headed

# Update snapshots
pnpm test:update-snapshots

# View test report
pnpm test:report

# Clean test artifacts
pnpm test:clean
```

## 🔧 Configuration

### Environment Variables
```bash
# Test environment (local, development, staging, production)
E2E_ENVIRONMENT=local

# Base URL override
E2E_BASE_URL=http://localhost:4174

# Debug mode
DEBUG_TESTS=true

# CI mode
CI=true
```

### Environment Configuration
Configure different environments in `playwright/config/environments.ts`:

```typescript
{
  name: 'Local Development',
  baseURL: 'http://localhost:4174',
  apiBaseURL: 'http://localhost:3000',
  features: {
    enableQuestionGeneration: true,
    enableRecommendations: true,
    // ... other feature flags
  },
  testConfig: {
    timeout: 30000,
    retries: 1,
    // ... other test settings
  }
}
```

## 📊 Reporting

The test suite generates comprehensive reports:

### HTML Report
- Interactive test results with screenshots and traces
- Access via `pnpm test:report`

### CI Reports
- **JUnit XML**: For CI/CD integration
- **GitHub Actions**: Native GitHub integration
- **JSON Report**: Machine-readable results
- **Markdown Summary**: Human-readable summary with failure analysis

### Debug Information
When tests fail, the suite automatically captures:
- Screenshots at point of failure
- Page HTML source
- Console logs
- Network activity
- Browser storage state
- DOM snapshots
- Detailed error analysis

## 🏗️ Writing Tests

### Using Test Fixtures
```typescript
import { test, expect } from './fixtures/auth-fixtures';

test('User journey with authenticated user', async ({ onboardedPage }) => {
  // User is already authenticated and onboarded
  await expect(onboardedPage).toHaveURL('/my-journey');
});
```

### Page Object Pattern
```typescript
import { LearningJourneyPage } from './pages/LearningJourneyPage';

test('Navigate learning journey', async ({ onboardedPage }) => {
  const journeyPage = new LearningJourneyPage(onboardedPage);
  await journeyPage.goto();
  await journeyPage.clickCourse('Mathematics');
});
```

### Enhanced Debugging
```typescript
import { DebugHelpers } from './utils/debug-helpers';

test('Test with debug helpers', async ({ page, testInfo }) => {
  const debug = new DebugHelpers(page, testInfo);
  
  try {
    await debug.clickWithDebug(page.getByRole('button', { name: 'Submit' }));
  } catch (error) {
    await debug.captureDebugInfo(error, 'Submit button click failed');
    throw error;
  }
});
```

### API Testing
```typescript
import { LuminaApiClient } from './utils/api-client';

test('API integration test', async ({ request }) => {
  const apiClient = new LuminaApiClient(request);
  const healthCheck = await apiClient.healthCheck();
  expect(healthCheck['auth-service']).toBe(true);
});
```

## 🔍 Test Tags

Use tags to organize and filter tests:

```typescript
test('User login @smoke @auth', async ({ page }) => {
  // Critical functionality test
});

test('Complex user journey @regression @journey', async ({ page }) => {
  // Comprehensive test
});
```

## 🚨 Troubleshooting

### Common Issues

#### Tests Failing Intermittently
- Check network conditions and add appropriate waits
- Verify element selectors are stable
- Consider increasing timeouts for slow operations

#### Authentication Issues
- Verify test user credentials are valid
- Check if authentication tokens are properly set
- Ensure cleanup doesn't affect other tests

#### Environment Issues
- Verify all services are running
- Check environment configuration
- Validate required environment variables

### Debug Mode
Run tests in debug mode for step-by-step execution:
```bash
DEBUG_TESTS=true pnpm test:e2e:debug
```

### Viewing Test Reports
After test runs, view detailed reports:
```bash
pnpm test:report
```

## 📈 Best Practices

1. **Use Page Objects**: Encapsulate page interactions in reusable objects
2. **Proper Waits**: Use `waitFor` conditions instead of fixed timeouts
3. **Stable Selectors**: Prefer `data-testid`, roles, and labels over CSS selectors
4. **Test Isolation**: Each test should be independent and clean up after itself
5. **Error Handling**: Use try-catch blocks and debug helpers for complex operations
6. **Environment Awareness**: Configure tests for different deployment scenarios
7. **Performance**: Balance comprehensive coverage with execution time

## 🤝 Contributing

When adding new tests:

1. Follow the existing page object pattern
2. Add appropriate test tags
3. Include both happy path and error scenarios
4. Update documentation for new features
5. Verify tests pass in multiple browsers
6. Consider impact on CI/CD pipeline performance

## 📝 CI/CD Integration

The test suite integrates with CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Run E2E Tests
  run: |
    pnpm --dir apps/e2e test:e2e:ci
  env:
    CI: true
    E2E_ENVIRONMENT: ci

- name: Upload Test Results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: test-results
    path: apps/e2e/test-results/
```

The enhanced test suite provides comprehensive coverage of the Lumina learning platform while maintaining reliability and ease of maintenance.