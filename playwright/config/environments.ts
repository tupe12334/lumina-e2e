


/**
 * Environment configuration for different deployment scenarios
 *
 * NOTE: Hardcoded URLs and localhost references are appropriate in test configuration files.
 * This file defines test environments for E2E testing with Playwright.
 * Multiple exports are necessary to provide different environment configurations.
 */

export interface EnvironmentConfig {
  name: string;
  baseURL: string;
  apiBaseURL: string;
  services: {
    authService: string;
    knowledgeBase: string;
    feedbackService: string;
    recommendationService: string;
    learningResources: string;
    questionGenerator: string;
    userService: string;
  };
  features: {
    enableQuestionGeneration: boolean;
    enableRecommendations: boolean;
    enableFeedback: boolean;
    enableMultiLanguage: boolean;
  };
  testConfig: {
    slowMo: number;
    timeout: number;
    retries: number;
    workers: number;
  };
}

const environments: Record<string, EnvironmentConfig> = {
  local: {
    name: 'Local Development',
    baseURL: 'http://localhost:4174',
    apiBaseURL: 'http://localhost:3000',
    services: {
      authService: 'http://localhost:3000/auth-service',
      knowledgeBase: 'http://localhost:3000/knowledge-base',
      feedbackService: 'http://localhost:3000/feedback-service',
      recommendationService: 'http://localhost:3000/recommendation-service',
      learningResources: 'http://localhost:3000/learning-resources',
      questionGenerator: 'http://localhost:3000/question-generator',
      userService: 'http://localhost:3000/user-service',
    },
    features: {
      enableQuestionGeneration: true,
      enableRecommendations: true,
      enableFeedback: true,
      enableMultiLanguage: true,
    },
    testConfig: {
      slowMo: 0,
      timeout: 30000,
      retries: 1,
      workers: 4,
    },
  },

  development: {
    name: 'Development Server',
    baseURL: 'https://dev.lumina.example.com',
    apiBaseURL: 'https://api-dev.lumina.example.com',
    services: {
      authService: 'https://api-dev.lumina.example.com/auth-service',
      knowledgeBase: 'https://api-dev.lumina.example.com/knowledge-base',
      feedbackService: 'https://api-dev.lumina.example.com/feedback-service',
      recommendationService: 'https://api-dev.lumina.example.com/recommendation-service',
      learningResources: 'https://api-dev.lumina.example.com/learning-resources',
      questionGenerator: 'https://api-dev.lumina.example.com/question-generator',
      userService: 'https://api-dev.lumina.example.com/user-service',
    },
    features: {
      enableQuestionGeneration: true,
      enableRecommendations: true,
      enableFeedback: true,
      enableMultiLanguage: true,
    },
    testConfig: {
      slowMo: 100,
      timeout: 45000,
      retries: 2,
      workers: 2,
    },
  },

  staging: {
    name: 'Staging Environment',
    baseURL: 'https://staging.lumina.example.com',
    apiBaseURL: 'https://api-staging.lumina.example.com',
    services: {
      authService: 'https://api-staging.lumina.example.com/auth-service',
      knowledgeBase: 'https://api-staging.lumina.example.com/knowledge-base',
      feedbackService: 'https://api-staging.lumina.example.com/feedback-service',
      recommendationService: 'https://api-staging.lumina.example.com/recommendation-service',
      learningResources: 'https://api-staging.lumina.example.com/learning-resources',
      questionGenerator: 'https://api-staging.lumina.example.com/question-generator',
      userService: 'https://api-staging.lumina.example.com/user-service',
    },
    features: {
      enableQuestionGeneration: true,
      enableRecommendations: true,
      enableFeedback: true,
      enableMultiLanguage: true,
    },
    testConfig: {
      slowMo: 200,
      timeout: 60000,
      retries: 3,
      workers: 1,
    },
  },

  production: {
    name: 'Production Environment',
    baseURL: 'https://lumina.example.com',
    apiBaseURL: 'https://api.lumina.example.com',
    services: {
      authService: 'https://api.lumina.example.com/auth-service',
      knowledgeBase: 'https://api.lumina.example.com/knowledge-base',
      feedbackService: 'https://api.lumina.example.com/feedback-service',
      recommendationService: 'https://api.lumina.example.com/recommendation-service',
      learningResources: 'https://api.lumina.example.com/learning-resources',
      questionGenerator: 'https://api.lumina.example.com/question-generator',
      userService: 'https://api.lumina.example.com/user-service',
    },
    features: {
      enableQuestionGeneration: true,
      enableRecommendations: true,
      enableFeedback: true,
      enableMultiLanguage: true,
    },
    testConfig: {
      slowMo: 500,
      timeout: 90000,
      retries: 3,
      workers: 1,
    },
  },

  // CI environment for automated testing
  ci: {
    name: 'CI Environment',
    baseURL: 'http://localhost:4174',
    apiBaseURL: 'http://localhost:3000',
    services: {
      authService: 'http://localhost:3000/auth-service',
      knowledgeBase: 'http://localhost:3000/knowledge-base',
      feedbackService: 'http://localhost:3000/feedback-service',
      recommendationService: 'http://localhost:3000/recommendation-service',
      learningResources: 'http://localhost:3000/learning-resources',
      questionGenerator: 'http://localhost:3000/question-generator',
      userService: 'http://localhost:3000/user-service',
    },
    features: {
      enableQuestionGeneration: true,
      enableRecommendations: true,
      enableFeedback: true,
      enableMultiLanguage: true,
    },
    testConfig: {
      slowMo: 0,
      timeout: 60000,
      retries: 3,
      workers: 2,
    },
  },
};

/**
 * Get environment configuration based on environment variable or default
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const envName = process.env.E2E_ENVIRONMENT || 'local';
  const config = environments[envName];

  if (!config) {
    throw new Error(`Unknown environment: ${envName}. Available: ${Object.keys(environments).join(', ')}`);
  }

  return config;
}

/**
 * Get all available environment names
 */
export function getAvailableEnvironments(): string[] {
  return Object.keys(environments);
}

/**
 * Validate that all required environment variables are set for the given environment
 */
export function validateEnvironment(envConfig: EnvironmentConfig): void {
  const requiredEnvVars = [];

  // Add environment-specific validation
  if (envConfig.name.includes('Production')) {
    requiredEnvVars.push('PRODUCTION_API_KEY', 'PRODUCTION_ADMIN_TOKEN');
  }

  if (envConfig.name.includes('Staging')) {
    requiredEnvVars.push('STAGING_API_KEY');
  }

  const missing = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables for ${envConfig.name}: ${missing.join(', ')}`
    );
  }
}

/**
 * Get feature flags for the current environment
 */
export function isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
  const config = getEnvironmentConfig();
  return config.features[feature];
}

/**
 * Get service URL for the current environment
 */
export function getServiceURL(service: keyof EnvironmentConfig['services']): string {
  const config = getEnvironmentConfig();
  return config.services[service];
}