import { FirebaseAPI } from '../../src/services/firebase-api.js';

describe('Firebase Reviews Contract', () => {
  let api;
  let mockToken;

  beforeEach(() => {
    api = new FirebaseAPI();
    mockToken = 'mock-firebase-auth-token';
    api.setAuthToken(mockToken);
  });

  describe('POST /reviews', () => {
    it('should create a new review with required fields', async () => {
      const reviewData = {
        title: 'Het Verdriet van de Zuiderzee',
        name: 'Test Play',
        actors: ['Jasper Stoop', 'Nick Silva'],
        directors: ['Geert Lageveen'],
        writers: ['Geert Lageveen'],
        groups: ['Orkater'],
        city: 'Amsterdam',
        theater: 'Royal Theater',
        performanceDate: '2022-08-13',
        reviewContent: '<p>Amazing performance...</p>',
        reviewDate: '2022-08-14'
      };

      const result = await api.createReview(reviewData);

      expect(result).toBeDefined();
      expect(result.reviewId).toBeDefined();
      expect(result.performanceId).toBeDefined();
      expect(typeof result.reviewId).toBe('string');
      expect(typeof result.performanceId).toBe('string');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        title: 'Test Review',
        name: 'Test Play'
      };

      try {
        await api.createReview(incompleteData);
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.error).toBe('VALIDATION_ERROR');
        expect(error.message).toContain('required');
        expect(error.message).toContain('city');
        expect(error.message).toContain('theater');
      }
    });

    it('should handle authentication errors', async () => {
      api.setAuthToken(null);

      const reviewData = {
        title: 'Test Review',
        name: 'Test Play',
        city: 'Amsterdam',
        theater: 'Test Theater',
        performanceDate: '2022-08-13',
        reviewContent: '<p>Content</p>'
      };

      try {
        await api.createReview(reviewData);
        fail('Should have thrown authentication error');
      } catch (error) {
        expect(error.error).toBe('UNAUTHORIZED');
        expect(error.message).toContain('authentication');
      }
    });

    it('should validate date format', async () => {
      const reviewData = {
        title: 'Test Review',
        name: 'Test Play',
        city: 'Amsterdam',
        theater: 'Test Theater',
        performanceDate: 'invalid-date',
        reviewContent: '<p>Content</p>'
      };

      try {
        await api.createReview(reviewData);
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.error).toBe('VALIDATION_ERROR');
        expect(error.message).toContain('date');
      }
    });

    it('should handle HTML content properly', async () => {
      const reviewData = {
        title: 'Test Review',
        name: 'Test Play',
        city: 'Amsterdam',
        theater: 'Test Theater',
        performanceDate: '2022-08-13',
        reviewContent: '<p>First paragraph</p><p>Second paragraph</p><ul><li>List item</li></ul>'
      };

      const result = await api.createReview(reviewData);
      expect(result.reviewId).toBeDefined();
    });

    it('should create linked performance document', async () => {
      const reviewData = {
        title: 'Test Review',
        name: 'Test Play',
        actors: ['Actor 1'],
        directors: ['Director 1'],
        city: 'Amsterdam',
        theater: 'Test Theater',
        performanceDate: '2022-08-13',
        reviewContent: '<p>Content</p>'
      };

      const result = await api.createReview(reviewData);

      expect(result.performanceId).toBeDefined();

      const performance = await api.getPerformance(result.performanceId);
      expect(performance.name).toBe('Test Play');
      expect(performance.actors).toEqual(['Actor 1']);
      expect(performance.directors).toEqual(['Director 1']);
    });

    it('should handle optional image URLs', async () => {
      const reviewData = {
        title: 'Test Review',
        name: 'Test Play',
        city: 'Amsterdam',
        theater: 'Test Theater',
        performanceDate: '2022-08-13',
        reviewContent: '<p>Content</p>',
        images: ['https://storage.firebase.com/image1.jpg', 'https://storage.firebase.com/image2.jpg']
      };

      const result = await api.createReview(reviewData);
      expect(result.reviewId).toBeDefined();
    });
  });
});