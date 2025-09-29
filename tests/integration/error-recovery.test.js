import '../fixtures/test-setup.js';

describe('Error Handling and Recovery Integration', () => {
  let wizard;

  beforeEach(async () => {
    document.body.innerHTML = '<mp-upload-wizard></mp-upload-wizard>';
    wizard = document.querySelector('mp-upload-wizard');
    await wizard.updateComplete;
  });

  it('should handle corrupted file gracefully', async () => {
    const corruptedFile = new File(['invalid binary data'], 'corrupted.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    wizard.contentType = 'reviews';
    await wizard.handleFilesDropped([corruptedFile]);

    await new Promise(resolve => setTimeout(resolve, 500));

    expect(wizard.files[0].status).toBe('error');
    expect(wizard.files[0].errorMessage).toContain('extraction');

    const errorDisplay = wizard.shadowRoot.querySelector('.error-message');
    expect(errorDisplay).toBeTruthy();
    expect(errorDisplay.textContent).toContain('failed');
  });

  it('should allow skipping corrupted files', async () => {
    const files = [
      new File(['valid'], 'valid1.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }),
      new File(['invalid'], 'corrupted.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }),
      new File(['valid'], 'valid2.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
    ];

    wizard.contentType = 'reviews';
    await wizard.handleFilesDropped(files);

    wizard.files[1].status = 'error';
    wizard.files[1].errorMessage = 'Extraction failed';

    const skipButton = wizard.shadowRoot.querySelector('[data-file-index="1"] .skip-button');
    skipButton.click();

    expect(wizard.files[1].status).toBe('skipped');
    expect(wizard.skippedCount).toBe(1);
    expect(wizard.currentFileIndex).toBe(2);
  });

  it('should handle network errors during Firebase save', async () => {
    wizard.firebaseAPI.mockNetworkError = true;

    const formData = {
      title: 'Test Review',
      name: 'Test Play',
      city: 'Amsterdam',
      theater: 'Test Theater',
      performanceDate: '2022-08-13',
      reviewContent: '<p>Content</p>'
    };

    try {
      await wizard.saveReview(formData);
      fail('Should have thrown network error');
    } catch (error) {
      expect(error.message).toContain('network');
    }

    const errorDialog = wizard.shadowRoot.querySelector('.error-dialog');
    expect(errorDialog).toBeTruthy();
    expect(errorDialog.textContent).toContain('retry');
  });

  it('should retry failed operations', async () => {
    let attemptCount = 0;

    wizard.firebaseAPI.saveDocument = async () => {
      attemptCount++;
      if (attemptCount === 1) {
        throw new Error('Network error');
      }
      return { id: 'success-id' };
    };

    const formData = {
      title: 'Test Review',
      name: 'Test Play',
      city: 'Amsterdam',
      theater: 'Test Theater',
      performanceDate: '2022-08-13',
      reviewContent: '<p>Content</p>'
    };

    const result = await wizard.saveWithRetry(formData);

    expect(attemptCount).toBe(2);
    expect(result.id).toBe('success-id');
  });

  it('should handle authentication token expiry', async () => {
    wizard.firebaseAPI.mockTokenExpired = true;

    const formData = {
      title: 'Test Review',
      name: 'Test Play',
      city: 'Amsterdam',
      theater: 'Test Theater',
      performanceDate: '2022-08-13',
      reviewContent: '<p>Content</p>'
    };

    try {
      await wizard.saveReview(formData);
    } catch (error) {
      expect(error.code).toBe('UNAUTHORIZED');
    }

    const authDialog = wizard.shadowRoot.querySelector('.auth-dialog');
    expect(authDialog).toBeTruthy();
    expect(authDialog.textContent).toContain('sign in');
  });

  it('should preserve data on authentication refresh', async () => {
    const formData = {
      title: 'Test Review',
      name: 'Test Play',
      city: 'Amsterdam',
      theater: 'Test Theater',
      performanceDate: '2022-08-13',
      reviewContent: '<p>Content</p>'
    };

    wizard.pendingData = formData;
    wizard.firebaseAPI.mockTokenExpired = true;

    await wizard.handleAuthRefresh();

    wizard.firebaseAPI.mockTokenExpired = false;
    wizard.firebaseAPI.setAuthToken('new-token');

    const result = await wizard.savePendingData();
    expect(result).toBeDefined();
    expect(wizard.pendingData).toBeNull();
  });

  it('should handle AI parsing service unavailable', async () => {
    wizard.dataParser.mockServiceUnavailable = true;

    const file = new File(['Content'], 'review.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    wizard.contentType = 'reviews';
    await wizard.handleFilesDropped([file]);

    wizard.files[0].extractedText = 'Leopold Witte / Erik van Muiswinkel';

    await wizard.parseFileContent(0);

    expect(wizard.files[0].aiParsingUsed).toBe(false);
    expect(wizard.files[0].userValidationRequired).toBeDefined();
    expect(wizard.files[0].userValidationRequired.length).toBeGreaterThan(0);
  });

  it('should fallback to manual entry on extraction failure', async () => {
    const file = new File(['corrupted'], 'review.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    wizard.contentType = 'reviews';
    await wizard.handleFilesDropped([file]);

    wizard.files[0].status = 'error';

    const manualButton = wizard.shadowRoot.querySelector('.manual-entry-button');
    manualButton.click();

    const manualForm = wizard.shadowRoot.querySelector('mp-review-form');
    expect(manualForm).toBeTruthy();
    expect(manualForm.mode).toBe('manual');
  });

  it('should validate data before save', async () => {
    const incompleteData = {
      title: 'Test Review'
    };

    try {
      await wizard.saveReview(incompleteData);
      fail('Should have thrown validation error');
    } catch (error) {
      expect(error.type).toBe('VALIDATION_ERROR');
      expect(error.fields).toContain('city');
      expect(error.fields).toContain('theater');
    }

    const validationErrors = wizard.shadowRoot.querySelector('.validation-errors');
    expect(validationErrors).toBeTruthy();
  });

  it('should track error statistics in session', async () => {
    const files = [
      new File(['valid'], 'valid1.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }),
      new File(['invalid'], 'corrupted.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
    ];

    wizard.contentType = 'reviews';
    await wizard.handleFilesDropped(files);

    wizard.handleFileCompleted({ detail: { fileIndex: 0, formData: {} } });
    wizard.handleFileError({ detail: { fileIndex: 1, error: 'Extraction failed' } });

    const summary = wizard.getSessionSummary();
    expect(summary.total).toBe(2);
    expect(summary.completed).toBe(1);
    expect(summary.errors).toBe(1);
    expect(summary.errorDetails[0]).toContain('corrupted.docx');
  });

  it('should provide clear error messages', async () => {
    const errorScenarios = [
      { type: 'FILE_TOO_LARGE', message: 'exceeds 5MB limit' },
      { type: 'INVALID_FORMAT', message: 'DOCX files only' },
      { type: 'EXTRACTION_FAILED', message: 'Could not extract text' },
      { type: 'PARSING_FAILED', message: 'Could not parse metadata' },
      { type: 'NETWORK_ERROR', message: 'Check your connection' },
      { type: 'UNAUTHORIZED', message: 'Please sign in' }
    ];

    errorScenarios.forEach(scenario => {
      const error = wizard.formatError(scenario.type);
      expect(error).toContain(scenario.message);
    });
  });
});