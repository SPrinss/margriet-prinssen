import { FirebaseAPI } from '../../src/services/firebase-api.js';

describe('Firebase Interviews Contract', () => {
  let api;
  let mockToken;

  beforeEach(() => {
    api = new FirebaseAPI();
    mockToken = 'mock-firebase-auth-token';
    api.setAuthToken(mockToken);
  });

  describe('POST /interviews', () => {
    it('should create a new interview with required fields', async () => {
      const interviewData = {
        title: 'Interview with Geert Lageveen',
        persons: ['Geert Lageveen', 'Belle van Heerikhuizen'],
        interviewDate: '2022-08-13',
        content: '<p>Interview content...</p>'
      };

      const result = await api.createInterview(interviewData);

      expect(result).toBeDefined();
      expect(result.interviewId).toBeDefined();
      expect(typeof result.interviewId).toBe('string');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        title: 'Test Interview'
      };

      try {
        await api.createInterview(incompleteData);
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.error).toBe('VALIDATION_ERROR');
        expect(error.message).toContain('required');
        expect(error.message).toContain('persons');
        expect(error.message).toContain('interviewDate');
        expect(error.message).toContain('content');
      }
    });

    it('should require at least one person', async () => {
      const interviewData = {
        title: 'Test Interview',
        persons: [],
        interviewDate: '2022-08-13',
        content: '<p>Content</p>'
      };

      try {
        await api.createInterview(interviewData);
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.error).toBe('VALIDATION_ERROR');
        expect(error.message).toContain('at least one person');
      }
    });

    it('should handle authentication errors', async () => {
      api.setAuthToken(null);

      const interviewData = {
        title: 'Test Interview',
        persons: ['Test Person'],
        interviewDate: '2022-08-13',
        content: '<p>Content</p>'
      };

      try {
        await api.createInterview(interviewData);
        fail('Should have thrown authentication error');
      } catch (error) {
        expect(error.error).toBe('UNAUTHORIZED');
        expect(error.message).toContain('authentication');
      }
    });

    it('should validate date format', async () => {
      const interviewData = {
        title: 'Test Interview',
        persons: ['Test Person'],
        interviewDate: 'invalid-date',
        content: '<p>Content</p>'
      };

      try {
        await api.createInterview(interviewData);
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.error).toBe('VALIDATION_ERROR');
        expect(error.message).toContain('date');
      }
    });

    it('should handle HTML content properly', async () => {
      const interviewData = {
        title: 'Test Interview',
        persons: ['Test Person'],
        interviewDate: '2022-08-13',
        content: '<p>Question 1</p><p>Answer 1</p><p>Question 2</p><p>Answer 2</p>'
      };

      const result = await api.createInterview(interviewData);
      expect(result.interviewId).toBeDefined();
    });

    it('should handle multiple interviewees', async () => {
      const interviewData = {
        title: 'Group Interview',
        persons: ['Person 1', 'Person 2', 'Person 3'],
        interviewDate: '2022-08-13',
        content: '<p>Content</p>'
      };

      const result = await api.createInterview(interviewData);
      expect(result.interviewId).toBeDefined();
    });

    it('should handle optional image URLs', async () => {
      const interviewData = {
        title: 'Test Interview',
        persons: ['Test Person'],
        interviewDate: '2022-08-13',
        content: '<p>Content</p>',
        images: ['https://storage.firebase.com/image1.jpg', 'https://storage.firebase.com/image2.jpg']
      };

      const result = await api.createInterview(interviewData);
      expect(result.interviewId).toBeDefined();
    });

    it('should not allow empty content', async () => {
      const interviewData = {
        title: 'Test Interview',
        persons: ['Test Person'],
        interviewDate: '2022-08-13',
        content: ''
      };

      try {
        await api.createInterview(interviewData);
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.error).toBe('VALIDATION_ERROR');
        expect(error.message).toContain('content');
        expect(error.message).toContain('empty');
      }
    });
  });
});