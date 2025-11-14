import { faker } from '@faker-js/faker';

export interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  id?: string;
}

export interface TestUniversity {
  name: string;
  id: string;
}

export interface TestDegree {
  name: string;
  universityId: string;
  id?: string;
}

export class TestDataManager {
  private readonly createdUsers: TestUser[] = [];
  private readonly createdData: Array<{ type: string; id: string }> = [];

  /**
   * Generate a unique test user with realistic data
   */
  generateUser(): TestUser {
    const user: TestUser = {
      email: faker.internet.email().toLowerCase(),
      password: this.generateSecurePassword(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
    };

    this.createdUsers.push(user);
    return user;
  }

  /**
   * Generate a secure password that meets platform requirements
   */
  private generateSecurePassword(): string {
    // Generate password with at least 8 characters, including uppercase, lowercase, number, and special char
    const lowercase = faker.string.alpha({ length: 3, casing: 'lower' });
    const uppercase = faker.string.alpha({ length: 2, casing: 'upper' });
    const numbers = faker.string.numeric(2);
    const special = faker.helpers.arrayElement(['!', '@', '#', '$', '%']);

    const password = lowercase + uppercase + numbers + special;
    return faker.helpers.shuffle(password.split('')).join('');
  }

  /**
   * Get predefined test universities for stable testing
   */
  getTestUniversities(): TestUniversity[] {
    return [
      { name: 'The Open University Of Israel', id: 'ou-israel' },
      { name: 'Hebrew University of Jerusalem', id: 'huji' },
      { name: 'Tel Aviv University', id: 'tau' },
      { name: 'Technion - Israel Institute of Technology', id: 'technion' },
    ];
  }

  /**
   * Get predefined test degrees for stable testing
   */
  getTestDegrees(): TestDegree[] {
    return [
      { name: 'Computer Science', universityId: 'ou-israel' },
      { name: 'Economics', universityId: 'ou-israel' },
      { name: 'Mathematics', universityId: 'huji' },
      { name: 'Physics', universityId: 'technion' },
      { name: 'Psychology', universityId: 'tau' },
    ];
  }

  /**
   * Generate test course data
   */
  generateCourse() {
    return {
      name: faker.lorem.words(3),
      description: faker.lorem.paragraph(),
      credits: faker.number.int({ min: 2, max: 6 }),
      difficulty: faker.helpers.arrayElement(['Beginner', 'Intermediate', 'Advanced']),
    };
  }

  /**
   * Track created data for cleanup
   */
  trackCreatedData(type: string, id: string): void {
    this.createdData.push({ type, id });
  }

  /**
   * Get all created users for cleanup
   */
  getCreatedUsers(): TestUser[] {
    return [...this.createdUsers];
  }

  /**
   * Get all created data for cleanup
   */
  getCreatedData(): Array<{ type: string; id: string }> {
    return [...this.createdData];
  }

  /**
   * Clear all tracked data (for cleanup)
   */
  clearTrackedData(): void {
    this.createdUsers.length = 0;
    this.createdData.length = 0;
  }

  /**
   * Generate realistic learning progress data
   */
  generateLearningProgress() {
    return {
      completedModules: faker.number.int({ min: 0, max: 10 }),
      totalModules: faker.number.int({ min: 10, max: 20 }),
      skillLevel: faker.helpers.arrayElement(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
      lastAccessDate: faker.date.recent({ days: 30 }),
      studyTimeHours: faker.number.int({ min: 5, max: 100 }),
    };
  }

  /**
   * Generate test question data
   */
  generateQuestion() {
    return {
      question: faker.lorem.sentence() + '?',
      answers: [
        faker.lorem.words(2),
        faker.lorem.words(3),
        faker.lorem.words(2),
        faker.lorem.words(4),
      ],
      correctAnswer: 0,
      difficulty: faker.helpers.arrayElement(['Easy', 'Medium', 'Hard']),
      tags: faker.helpers.arrayElements(['math', 'science', 'history', 'literature'], 2),
    };
  }
}