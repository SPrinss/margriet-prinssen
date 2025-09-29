import { FirebaseAPI } from '../../src/services/firebase-api.js';

describe('Firebase Entities GET Contract', () => {
  let api;
  let mockToken;

  beforeEach(() => {
    api = new FirebaseAPI();
    mockToken = 'mock-firebase-auth-token';
    api.setAuthToken(mockToken);
  });

  describe('GET /entities/{type}', () => {
    it('should retrieve all persons', async () => {
      const persons = await api.getEntities('persons');

      expect(Array.isArray(persons)).toBe(true);
      if (persons.length > 0) {
        expect(persons[0]).toHaveProperty('id');
        expect(persons[0]).toHaveProperty('name');
        expect(typeof persons[0].id).toBe('string');
        expect(typeof persons[0].name).toBe('string');
      }
    });

    it('should retrieve all theaters', async () => {
      const theaters = await api.getEntities('theaters');

      expect(Array.isArray(theaters)).toBe(true);
      if (theaters.length > 0) {
        expect(theaters[0]).toHaveProperty('id');
        expect(theaters[0]).toHaveProperty('name');
      }
    });

    it('should retrieve all cities', async () => {
      const cities = await api.getEntities('cities');

      expect(Array.isArray(cities)).toBe(true);
      if (cities.length > 0) {
        expect(cities[0]).toHaveProperty('id');
        expect(cities[0]).toHaveProperty('name');
      }
    });

    it('should retrieve all groups', async () => {
      const groups = await api.getEntities('groups');

      expect(Array.isArray(groups)).toBe(true);
      if (groups.length > 0) {
        expect(groups[0]).toHaveProperty('id');
        expect(groups[0]).toHaveProperty('name');
      }
    });

    it('should validate entity type', async () => {
      try {
        await api.getEntities('invalid_type');
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.error).toBe('INVALID_ENTITY_TYPE');
        expect(error.message).toContain('persons, theaters, cities, groups');
      }
    });

    it('should handle authentication errors', async () => {
      api.setAuthToken(null);

      try {
        await api.getEntities('persons');
        fail('Should have thrown authentication error');
      } catch (error) {
        expect(error.error).toBe('UNAUTHORIZED');
        expect(error.message).toContain('authentication');
      }
    });

    it('should return empty array when no entities exist', async () => {
      const result = await api.getEntities('persons');

      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle network errors gracefully', async () => {
      api.mockNetworkError = true;

      try {
        await api.getEntities('persons');
        fail('Should have thrown network error');
      } catch (error) {
        expect(error.error).toBe('NETWORK_ERROR');
        expect(error.message).toContain('network');
      }
    });

    it('should cache entity results for performance', async () => {
      const start = Date.now();
      const firstCall = await api.getEntities('persons');
      const firstTime = Date.now() - start;

      const secondStart = Date.now();
      const secondCall = await api.getEntities('persons');
      const secondTime = Date.now() - secondStart;

      expect(secondTime).toBeLessThan(firstTime / 2);
      expect(firstCall).toEqual(secondCall);
    });

    it('should invalidate cache after entity creation', async () => {
      const initialPersons = await api.getEntities('persons');
      const initialCount = initialPersons.length;

      await api.createEntity('persons', { name: 'New Person' });

      const updatedPersons = await api.getEntities('persons');
      expect(updatedPersons.length).toBe(initialCount + 1);
    });
  });
});