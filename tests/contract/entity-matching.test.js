import { EntityMatcher } from '../../src/services/entity-matcher.js';

describe('Entity Matching Service Contract', () => {
  let matcher;

  beforeEach(() => {
    matcher = new EntityMatcher();
    matcher.entities = {
      persons: [
        { id: '1', name: 'Michael J Fox' },
        { id: '2', name: 'Geert Lageveen' },
        { id: '3', name: 'Belle van Heerikhuizen' }
      ],
      theaters: [
        { id: 't1', name: 'Schouwburg De Lawei' },
        { id: 't2', name: 'Royal Theater' }
      ],
      cities: [
        { id: 'c1', name: 'Amsterdam' },
        { id: 'c2', name: 'Oudemirdum' }
      ],
      groups: [
        { id: 'g1', name: 'Orkater' },
        { id: 'g2', name: 'Club Kenau' }
      ]
    };
  });

  describe('POST /match', () => {
    it('should find high similarity matches for person names', async () => {
      const result = await matcher.match({
        names: ['Michael Fox', 'G. Lageveen'],
        entityType: 'person',
        threshold: 70
      });

      expect(result.matches).toHaveLength(2);

      const michaelMatch = result.matches[0];
      expect(michaelMatch.inputName).toBe('Michael Fox');
      expect(michaelMatch.candidates).toHaveLength(1);
      expect(michaelMatch.candidates[0].entity.name).toBe('Michael J Fox');
      expect(michaelMatch.candidates[0].similarity).toBeGreaterThan(85);
      expect(michaelMatch.candidates[0].confidence).toBe('high');
      expect(michaelMatch.candidates[0].reason).toContain('name similarity');
    });

    it('should respect similarity threshold', async () => {
      const result = await matcher.match({
        names: ['John Smith'],
        entityType: 'person',
        threshold: 90
      });

      expect(result.matches[0].candidates).toHaveLength(0);
    });

    it('should handle theater entity matching', async () => {
      const result = await matcher.match({
        names: ['De Lawei', 'Royal Theatre'],
        entityType: 'theater',
        threshold: 70
      });

      expect(result.matches).toHaveLength(2);

      const laweimatch = result.matches[0];
      expect(laweimatch.candidates[0].entity.name).toBe('Schouwburg De Lawei');
      expect(laweimatch.candidates[0].similarity).toBeGreaterThan(70);
    });

    it('should handle city entity matching', async () => {
      const result = await matcher.match({
        names: ['A\'dam', 'Amsterdam'],
        entityType: 'city',
        threshold: 70
      });

      expect(result.matches).toHaveLength(2);
      result.matches.forEach(match => {
        if (match.inputName === 'Amsterdam') {
          expect(match.candidates[0].similarity).toBe(100);
          expect(match.candidates[0].confidence).toBe('high');
        }
      });
    });

    it('should handle group entity matching', async () => {
      const result = await matcher.match({
        names: ['Orkater Theater Company'],
        entityType: 'group',
        threshold: 60
      });

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].candidates[0].entity.name).toBe('Orkater');
      expect(result.matches[0].candidates[0].similarity).toBeGreaterThan(60);
    });

    it('should return empty candidates for no matches', async () => {
      const result = await matcher.match({
        names: ['Unknown Entity'],
        entityType: 'person',
        threshold: 70
      });

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].inputName).toBe('Unknown Entity');
      expect(result.matches[0].candidates).toHaveLength(0);
    });

    it('should validate entity type', async () => {
      try {
        await matcher.match({
          names: ['Test'],
          entityType: 'invalid_type',
          threshold: 70
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.error).toBe('INVALID_ENTITY_TYPE');
        expect(error.message).toContain('person, theater, city, group');
      }
    });

    it('should handle Dutch name variations', async () => {
      const result = await matcher.match({
        names: ['van Heerikhuizen, Belle'],
        entityType: 'person',
        threshold: 70
      });

      expect(result.matches[0].candidates[0].entity.name).toBe('Belle van Heerikhuizen');
      expect(result.matches[0].candidates[0].similarity).toBeGreaterThan(80);
    });
  });
});