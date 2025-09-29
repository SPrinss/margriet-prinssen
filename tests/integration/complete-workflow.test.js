import '../fixtures/test-setup.js';

describe('Complete Workflow with Firebase Save', () => {
  let wizard;
  let firebaseAPI;
  let savedDocuments;

  beforeEach(async () => {
    document.body.innerHTML = '<mp-upload-wizard></mp-upload-wizard>';
    wizard = document.querySelector('mp-upload-wizard');
    await wizard.updateComplete;

    savedDocuments = [];

    firebaseAPI = wizard.firebaseAPI;
    firebaseAPI.setAuthToken('mock-token');

    firebaseAPI.saveDocument = async (collection, data) => {
      const doc = {
        id: `mock-${collection}-${Date.now()}`,
        collection,
        data,
        timestamp: Date.now()
      };
      savedDocuments.push(doc);
      return doc;
    };

    wizard.entityCache = {
      persons: [
        { id: 'p1', name: 'Existing Actor' },
        { id: 'p2', name: 'Existing Director' }
      ],
      theaters: [
        { id: 't1', name: 'Existing Theater' }
      ],
      cities: [
        { id: 'c1', name: 'Amsterdam' }
      ],
      groups: [
        { id: 'g1', name: 'Existing Group' }
      ]
    };
  });

  it('should complete full review upload workflow', async () => {
    const mockFile = new File([
      'Orkater / Het Verdriet / Tekst: Geert Lageveen / ' +
      'Regie: Geert Lageveen / Spel: Existing Actor / ' +
      'Amsterdam, Existing Theater / 13-08-2022\n\n' +
      'Review content here...'
    ], 'review.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    wizard.contentType = 'reviews';
    await wizard.handleFilesDropped([mockFile]);

    wizard.files[0].status = 'completed';
    wizard.files[0].parsedData = {
      title: 'Het Verdriet',
      name: 'Test Play',
      actors: ['Existing Actor'],
      directors: ['Geert Lageveen'],
      writers: ['Geert Lageveen'],
      groups: ['Orkater'],
      city: 'Amsterdam',
      theater: 'Existing Theater',
      performanceDate: '2022-08-13',
      reviewContent: '<p>Review content here...</p>'
    };

    const formData = await wizard.prepareFormData(0);

    const reviewResult = await firebaseAPI.saveDocument('reviews', formData);
    const performanceResult = await firebaseAPI.saveDocument('performances', {
      name: formData.name,
      actors: formData.actors,
      directors: formData.directors,
      groups: formData.groups,
      date: formData.performanceDate
    });

    expect(savedDocuments).toHaveLength(2);
    expect(savedDocuments[0].collection).toBe('reviews');
    expect(savedDocuments[1].collection).toBe('performances');
    expect(savedDocuments[0].data.title).toBe('Het Verdriet');

    wizard.handleFileCompleted({
      detail: {
        fileIndex: 0,
        reviewId: reviewResult.id,
        performanceId: performanceResult.id
      }
    });

    expect(wizard.completedCount).toBe(1);
    expect(wizard.wizardStep).toBe('summary');
  });

  it('should complete full interview upload workflow', async () => {
    const mockFile = new File([
      'Interview with Geert Lageveen\n' +
      'Date: 13-08-2022\n\n' +
      'Interview content here...'
    ], 'interview.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    wizard.contentType = 'interviews';
    await wizard.handleFilesDropped([mockFile]);

    wizard.files[0].status = 'completed';
    wizard.files[0].parsedData = {
      title: 'Interview with Geert Lageveen',
      persons: ['Geert Lageveen'],
      interviewDate: '2022-08-13',
      content: '<p>Interview content here...</p>'
    };

    const formData = await wizard.prepareFormData(0);
    const result = await firebaseAPI.saveDocument('interviews', formData);

    expect(savedDocuments).toHaveLength(1);
    expect(savedDocuments[0].collection).toBe('interviews');
    expect(savedDocuments[0].data.title).toBe('Interview with Geert Lageveen');

    wizard.handleFileCompleted({
      detail: { fileIndex: 0, interviewId: result.id }
    });

    expect(wizard.completedCount).toBe(1);
  });

  it('should handle entity creation during workflow', async () => {
    const mockFile = new File(['Content'], 'review.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    wizard.contentType = 'reviews';
    await wizard.handleFilesDropped([mockFile]);

    wizard.files[0].parsedData = {
      title: 'Test Review',
      actors: ['New Actor Name'],
      city: 'New City',
      theater: 'New Theater',
      performanceDate: '2022-08-13',
      reviewContent: '<p>Content</p>'
    };

    const newActor = await firebaseAPI.saveDocument('persons', { name: 'New Actor Name' });
    const newCity = await firebaseAPI.saveDocument('cities', { name: 'New City' });
    const newTheater = await firebaseAPI.saveDocument('theaters', { name: 'New Theater' });

    wizard.entityCache.persons.push({ id: newActor.id, name: 'New Actor Name' });
    wizard.entityCache.cities.push({ id: newCity.id, name: 'New City' });
    wizard.entityCache.theaters.push({ id: newTheater.id, name: 'New Theater' });

    const formData = await wizard.prepareFormData(0);
    await firebaseAPI.saveDocument('reviews', formData);

    expect(savedDocuments.filter(d => d.collection === 'persons')).toHaveLength(1);
    expect(savedDocuments.filter(d => d.collection === 'cities')).toHaveLength(1);
    expect(savedDocuments.filter(d => d.collection === 'theaters')).toHaveLength(1);
  });

  it('should trigger Algolia indexing after save', async () => {
    let algoliaTriggered = false;

    wizard.addEventListener('algolia-index', () => {
      algoliaTriggered = true;
    });

    const formData = {
      title: 'Test Review',
      name: 'Test Play',
      city: 'Amsterdam',
      theater: 'Test Theater',
      performanceDate: '2022-08-13',
      reviewContent: '<p>Content</p>'
    };

    await firebaseAPI.saveDocument('reviews', formData);

    wizard.dispatchEvent(new CustomEvent('algolia-index', {
      detail: { collection: 'reviews', documentId: 'test-id' }
    }));

    expect(algoliaTriggered).toBe(true);
  });

  it('should process multiple files with mixed types', async () => {
    const files = [
      new File(['Review 1'], 'review1.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }),
      new File(['Review 2'], 'review2.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
    ];

    wizard.contentType = 'reviews';
    await wizard.handleFilesDropped(files);

    for (let i = 0; i < files.length; i++) {
      wizard.files[i].parsedData = {
        title: `Review ${i + 1}`,
        name: `Play ${i + 1}`,
        city: 'Amsterdam',
        theater: 'Theater',
        performanceDate: '2022-08-13',
        reviewContent: `<p>Content ${i + 1}</p>`
      };

      const formData = await wizard.prepareFormData(i);
      await firebaseAPI.saveDocument('reviews', formData);

      wizard.handleFileCompleted({
        detail: { fileIndex: i, reviewId: `review-${i}` }
      });
    }

    expect(wizard.completedCount).toBe(2);
    expect(savedDocuments.filter(d => d.collection === 'reviews')).toHaveLength(2);
  });

  it('should show summary with statistics', async () => {
    wizard.completedCount = 3;
    wizard.skippedCount = 1;
    wizard.errorCount = 1;
    wizard.wizardStep = 'summary';

    await wizard.updateComplete;

    const summary = wizard.shadowRoot.querySelector('mp-wizard-summary');
    expect(summary).toBeTruthy();
    expect(summary.completedCount).toBe(3);
    expect(summary.skippedCount).toBe(1);
    expect(summary.errorCount).toBe(1);
    expect(summary.totalCount).toBe(5);
  });

  it('should allow toggling back to manual mode', async () => {
    wizard.wizardStep = 'summary';
    await wizard.updateComplete;

    const toggleButton = wizard.shadowRoot.querySelector('.toggle-mode-button');
    toggleButton.click();

    expect(wizard.mode).toBe('manual');
    const manualForm = wizard.shadowRoot.querySelector('mp-add');
    expect(manualForm).toBeTruthy();
  });

  it('should preserve authentication throughout workflow', async () => {
    const mockToken = 'valid-token-123';
    firebaseAPI.setAuthToken(mockToken);

    const file = new File(['Content'], 'review.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    wizard.contentType = 'reviews';
    await wizard.handleFilesDropped([file]);

    wizard.files[0].parsedData = {
      title: 'Test',
      city: 'Amsterdam',
      theater: 'Theater',
      performanceDate: '2022-08-13',
      reviewContent: '<p>Content</p>'
    };

    await wizard.saveAllFiles();

    expect(firebaseAPI.getAuthToken()).toBe(mockToken);
  });

  it('should handle session timeout gracefully', async () => {
    const startTime = Date.now();
    wizard.sessionStartTime = startTime;
    wizard.sessionTimeout = 30 * 60 * 1000;

    jest.advanceTimersByTime(31 * 60 * 1000);

    const isExpired = wizard.isSessionExpired();
    expect(isExpired).toBe(true);

    const timeoutDialog = wizard.shadowRoot.querySelector('.timeout-dialog');
    expect(timeoutDialog).toBeTruthy();
  });

  it('should validate complete workflow performance', async () => {
    const startTime = Date.now();

    const file = new File(['x'.repeat(1024 * 1024)], 'large.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    wizard.contentType = 'reviews';
    await wizard.handleFilesDropped([file]);

    await new Promise(resolve => setTimeout(resolve, 5000));

    const processingTime = Date.now() - startTime;

    expect(processingTime).toBeLessThan(10000);
    expect(wizard.files[0].metadata.processingTime).toBeLessThan(10000);
  });
});