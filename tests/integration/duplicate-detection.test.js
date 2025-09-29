import '../fixtures/test-setup.js';

describe('Duplicate Entity Detection Integration', () => {
  let wizard;
  let entityMatcher;
  let entityCreator;

  beforeEach(async () => {
    document.body.innerHTML = `
      <mp-upload-wizard></mp-upload-wizard>
      <mp-entity-matcher></mp-entity-matcher>
      <mp-entity-creator></mp-entity-creator>
    `;
    wizard = document.querySelector('mp-upload-wizard');
    entityMatcher = document.querySelector('mp-entity-matcher');
    entityCreator = document.querySelector('mp-entity-creator');

    await wizard.updateComplete;

    wizard.entityCache = {
      persons: [
        { id: '1', name: 'Michael J Fox' },
        { id: '2', name: 'Geert Lageveen' },
        { id: '3', name: 'Belle van Heerikhuizen' }
      ],
      theaters: [
        { id: 't1', name: 'Schouwburg De Lawei' },
        { id: 't2', name: 'Royal Theater Amsterdam' }
      ],
      cities: [
        { id: 'c1', name: 'Amsterdam' },
        { id: 'c2', name: 'Rotterdam' }
      ],
      groups: [
        { id: 'g1', name: 'Orkater' },
        { id: 'g2', name: 'Toneelgroep Amsterdam' }
      ]
    };
  });

  it('should detect high similarity matches', async () => {
    const parsedData = {
      actors: ['Michael Fox', 'G. Lageveen']
    };

    const matches = await entityMatcher.findDuplicates(parsedData, 'actors');

    expect(matches).toHaveLength(2);
    expect(matches[0].inputName).toBe('Michael Fox');
    expect(matches[0].candidates[0].entity.name).toBe('Michael J Fox');
    expect(matches[0].candidates[0].similarity).toBeGreaterThan(85);
    expect(matches[0].candidates[0].confidence).toBe('high');
  });

  it('should show duplicate detection UI', async () => {
    const matches = [
      {
        inputName: 'Michael Fox',
        candidates: [
          {
            entity: { id: '1', name: 'Michael J Fox' },
            similarity: 90,
            confidence: 'high',
            reason: 'Strong name similarity'
          }
        ]
      }
    ];

    entityMatcher.showDuplicateDialog('Michael Fox', matches[0].candidates);
    await entityMatcher.updateComplete;

    const dialog = entityMatcher.shadowRoot.querySelector('sl-dialog');
    expect(dialog.open).toBe(true);

    const content = dialog.textContent;
    expect(content).toContain('Michael J Fox');
    expect(content).toContain('90%');
  });

  it('should handle user choosing existing entity', async () => {
    const existingEntity = { id: '1', name: 'Michael J Fox' };

    entityMatcher.showDuplicateDialog('Michael Fox', [{
      entity: existingEntity,
      similarity: 90,
      confidence: 'high',
      reason: 'Strong name similarity'
    }]);

    await entityMatcher.updateComplete;

    const useExistingButton = entityMatcher.shadowRoot.querySelector('[data-action="use-existing"]');
    useExistingButton.click();

    const result = await entityMatcher.getResolvedEntity();
    expect(result).toEqual(existingEntity);
  });

  it('should handle user creating new entity', async () => {
    entityMatcher.showDuplicateDialog('New Person Name', []);
    await entityMatcher.updateComplete;

    const createNewButton = entityMatcher.shadowRoot.querySelector('[data-action="create-new"]');
    createNewButton.click();

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(entityCreator.isOpen).toBe(true);
    expect(entityCreator.entityName).toBe('New Person Name');
  });

  it('should create new entity and update cache', async () => {
    entityCreator.open('person', 'New Person Name');
    await entityCreator.updateComplete;

    const createButton = entityCreator.shadowRoot.querySelector('[data-action="create"]');
    createButton.click();

    const newEntity = await entityCreator.createEntity();
    expect(newEntity.id).toBeDefined();
    expect(newEntity.name).toBe('New Person Name');

    const updatedCache = await wizard.refreshEntityCache();
    expect(updatedCache.persons).toContainEqual(newEntity);
  });

  it('should handle multiple entity types', async () => {
    const parsedData = {
      actors: ['Michael Fox'],
      directors: ['New Director'],
      theater: 'Royal Theatre',
      city: 'A\'dam',
      groups: ['Orkater Company']
    };

    const actorMatches = await entityMatcher.findDuplicates(parsedData, 'actors');
    const theaterMatches = await entityMatcher.findDuplicates(parsedData, 'theater');
    const cityMatches = await entityMatcher.findDuplicates(parsedData, 'city');

    expect(actorMatches[0].candidates.length).toBeGreaterThan(0);
    expect(theaterMatches[0].candidates.length).toBeGreaterThan(0);
    expect(cityMatches[0].candidates[0].entity.name).toBe('Amsterdam');
  });

  it('should process entities sequentially with user confirmation', async () => {
    const parsedData = {
      actors: ['Michael Fox', 'Unknown Actor', 'G. Lageveen']
    };

    const resolutions = [];

    for (const actor of parsedData.actors) {
      const matches = await entityMatcher.findDuplicatesForName(actor, 'person');

      if (matches.length > 0) {
        entityMatcher.showDuplicateDialog(actor, matches);
        await entityMatcher.updateComplete;

        const resolution = await entityMatcher.waitForUserDecision();
        resolutions.push(resolution);
      } else {
        resolutions.push({ name: actor, isNew: true });
      }
    }

    expect(resolutions).toHaveLength(3);
    expect(resolutions[0].entity).toBeDefined();
    expect(resolutions[1].isNew).toBe(true);
    expect(resolutions[2].entity).toBeDefined();
  });

  it('should handle Dutch name variations', async () => {
    const parsedData = {
      directors: ['van Heerikhuizen, Belle', 'Belle v. Heerikhuizen']
    };

    const matches = await entityMatcher.findDuplicates(parsedData, 'directors');

    matches.forEach(match => {
      expect(match.candidates[0].entity.name).toBe('Belle van Heerikhuizen');
      expect(match.candidates[0].similarity).toBeGreaterThan(80);
    });
  });

  it('should cache entity resolution decisions', async () => {
    const resolution = { id: '1', name: 'Michael J Fox' };

    entityMatcher.cacheResolution('Michael Fox', resolution);

    const cachedResult = entityMatcher.getCachedResolution('Michael Fox');
    expect(cachedResult).toEqual(resolution);

    const duplicateCall = await entityMatcher.findDuplicatesForName('Michael Fox', 'person');
    expect(duplicateCall).toEqual([resolution]);
  });

  it('should integrate with form submission', async () => {
    const parsedData = {
      title: 'Test Review',
      actors: ['Michael Fox'],
      city: 'Amsterdam',
      theater: 'Royal Theater',
      performanceDate: '2022-08-13',
      reviewContent: '<p>Content</p>'
    };

    const resolutions = await wizard.resolveAllEntities(parsedData);

    expect(resolutions.actors[0].id).toBe('1');
    expect(resolutions.actors[0].name).toBe('Michael J Fox');

    const finalData = { ...parsedData, ...resolutions };
    expect(finalData.actors[0].id).toBeDefined();
  });
});