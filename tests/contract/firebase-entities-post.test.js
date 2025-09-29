import { FirebaseAPI } from '../../src/services/firebase-api.js';

describe('Firebase Entities POST Contract', () => {
  let api;
  let mockToken;

  beforeEach(() => {
    api = new FirebaseAPI();
    mockToken = 'mock-firebase-auth-token';
    api.setAuthToken(mockToken);
  });

  describe('POST /entities/{type}', () => {
    it('should create a new person entity', async () => {
      const result = await api.createEntity('persons', {
        name: 'John Doe'
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('John Doe');
      expect(typeof result.id).toBe('string');
    });

    it('should create a new theater entity', async () => {
      const result = await api.createEntity('theaters', {
        name: 'New Theater'
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('New Theater');
    });

    it('should create a new city entity', async () => {
      const result = await api.createEntity('cities', {
        name: 'Utrecht'
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Utrecht');
    });

    it('should create a new group entity', async () => {
      const result = await api.createEntity('groups', {
        name: 'Theater Group X'
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Theater Group X');
    });

    it('should validate entity type', async () => {
      try {
        await api.createEntity('invalid_type', { name: 'Test' });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.error).toBe('INVALID_ENTITY_TYPE');
        expect(error.message).toContain('persons, theaters, cities, groups');
      }
    });

    it('should require name field', async () => {
      try {
        await api.createEntity('persons', {});
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.error).toBe('VALIDATION_ERROR');
        expect(error.message).toContain('name');
        expect(error.message).toContain('required');
      }
    });

    it('should not allow empty name', async () => {
      try {
        await api.createEntity('persons', { name: '' });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.error).toBe('VALIDATION_ERROR');
        expect(error.message).toContain('name');
        expect(error.message).toContain('empty');
      }
    });

    it('should handle authentication errors', async () => {
      api.setAuthToken(null);

      try {
        await api.createEntity('persons', { name: 'Test Person' });
        fail('Should have thrown authentication error');
      } catch (error) {
        expect(error.error).toBe('UNAUTHORIZED');
        expect(error.message).toContain('authentication');
      }
    });

    it('should generate unique IDs for entities', async () => {
      const entity1 = await api.createEntity('persons', { name: 'Person 1' });
      const entity2 = await api.createEntity('persons', { name: 'Person 2' });

      expect(entity1.id).not.toBe(entity2.id);
    });

    it('should trim whitespace from names', async () => {
      const result = await api.createEntity('persons', {
        name: '  John Doe  '
      });

      expect(result.name).toBe('John Doe');
    });

    it('should handle duplicate names in same entity type', async () => {
      await api.createEntity('persons', { name: 'John Doe' });
      const duplicate = await api.createEntity('persons', { name: 'John Doe' });

      expect(duplicate.id).toBeDefined();
      expect(duplicate.name).toBe('John Doe');
    });

    it('should create subcollections for person entities', async () => {
      const person = await api.createEntity('persons', { name: 'Test Actor' });

      const subcollections = await api.getPersonSubcollections(person.id);
      expect(subcollections).toContain('actor');
      expect(subcollections).toContain('director');
      expect(subcollections).toContain('writer');
    });

    it('should invalidate entity cache after creation', async () => {
      const beforeCount = (await api.getEntities('persons')).length;

      await api.createEntity('persons', { name: 'New Person' });

      const afterCount = (await api.getEntities('persons')).length;
      expect(afterCount).toBe(beforeCount + 1);
    });
  });
});