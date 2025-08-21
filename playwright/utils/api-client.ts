import type { APIRequestContext } from '@playwright/test';
import { TestUser } from './test-data';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

/**
 * API client for interacting with Lumina backend services during E2E tests
 */
export class LuminaApiClient {
  constructor(private readonly request: APIRequestContext) {}

  /**
   * Health check endpoints for all services
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const services = [
      'auth-service',
      'knowledge-base',
      'feedback-service',
      'recommendation-service',
      'learning-resources',
      'question-generator',
      'user-service',
    ];

    const healthChecks = await Promise.allSettled(
      services.map(async (service) => {
        try {
          const response = await this.request.get(`http://localhost:3000/${service}/health`);
          return { service, healthy: response.ok() };
        } catch {
          return { service, healthy: false };
        }
      })
    );

    const result: Record<string, boolean> = {};
    healthChecks.forEach((check, index) => {
      if (check.status === 'fulfilled') {
        result[services[index]] = check.value.healthy;
      } else {
        result[services[index]] = false;
      }
    });

    return result;
  }

  /**
   * Create a test user via API
   */
  async createUser(userData: TestUser): Promise<ApiResponse<{ id: string; token: string }>> {
    try {
      const response = await this.request.post('http://localhost:3000/auth-service/graphql', {
        data: {
          query: `
            mutation CreateUser($input: CreateUserInput!) {
              createUser(input: $input) {
                id
                email
                firstName
                lastName
              }
            }
          `,
          variables: {
            input: {
              email: userData.email,
              password: userData.password,
              firstName: userData.firstName,
              lastName: userData.lastName,
            },
          },
        },
      });

      const responseData = await response.json();
      
      if (response.ok() && responseData.data?.createUser) {
        return {
          success: true,
          data: {
            id: responseData.data.createUser.id,
            token: '', // Would need to implement token generation
          },
          status: response.status(),
        };
      }

      return {
        success: false,
        error: responseData.errors?.[0]?.message || 'Failed to create user',
        status: response.status(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500,
      };
    }
  }

  /**
   * Authenticate user and get token
   */
  async authenticateUser(email: string, password: string): Promise<ApiResponse<{ token: string }>> {
    try {
      const response = await this.request.post('http://localhost:3000/auth-service/graphql', {
        data: {
          query: `
            mutation Login($input: LoginInput!) {
              login(input: $input) {
                token
                user {
                  id
                  email
                }
              }
            }
          `,
          variables: {
            input: {
              email,
              password,
            },
          },
        },
      });

      const responseData = await response.json();
      
      if (response.ok() && responseData.data?.login) {
        return {
          success: true,
          data: { token: responseData.data.login.token },
          status: response.status(),
        };
      }

      return {
        success: false,
        error: responseData.errors?.[0]?.message || 'Authentication failed',
        status: response.status(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500,
      };
    }
  }

  /**
   * Clean up test user data
   */
  async cleanupUser(userId: string, token: string): Promise<ApiResponse> {
    try {
      const response = await this.request.post('http://localhost:3000/auth-service/graphql', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          query: `
            mutation DeleteUser($id: ID!) {
              deleteUser(id: $id) {
                success
              }
            }
          `,
          variables: { id: userId },
        },
      });

      const responseData = await response.json();
      
      return {
        success: response.ok() && responseData.data?.deleteUser?.success,
        status: response.status(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500,
      };
    }
  }

  /**
   * Get user progress data
   */
  async getUserProgress(userId: string, token: string): Promise<ApiResponse> {
    try {
      const response = await this.request.post('http://localhost:3000/user-service/graphql', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          query: `
            query GetUserProgress($userId: ID!) {
              userProgress(userId: $userId) {
                completedCourses
                totalCourses
                currentLevel
                achievements
              }
            }
          `,
          variables: { userId },
        },
      });

      const responseData = await response.json();
      
      return {
        success: response.ok(),
        data: responseData.data?.userProgress,
        status: response.status(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500,
      };
    }
  }

  /**
   * Submit question feedback
   */
  async submitQuestionFeedback(
    questionId: string,
    feedback: 'like' | 'dislike',
    token: string
  ): Promise<ApiResponse> {
    try {
      const response = await this.request.post('http://localhost:3000/feedback-service/graphql', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          query: `
            mutation SubmitFeedback($input: FeedbackInput!) {
              submitFeedback(input: $input) {
                id
                success
              }
            }
          `,
          variables: {
            input: {
              questionId,
              type: feedback,
            },
          },
        },
      });

      const responseData = await response.json();
      
      return {
        success: response.ok() && responseData.data?.submitFeedback?.success,
        data: responseData.data?.submitFeedback,
        status: response.status(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500,
      };
    }
  }

  /**
   * Wait for backend services to be ready
   */
  async waitForServices(timeoutMs = 60000): Promise<boolean> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < timeoutMs) {
      const healthChecks = await this.healthCheck();
      const allHealthy = Object.values(healthChecks).every(Boolean);
      
      if (allHealthy) {
        return true;
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    return false;
  }
}