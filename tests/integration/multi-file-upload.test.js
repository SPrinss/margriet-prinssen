import '../fixtures/test-setup.js';

describe('Multi-File Upload Integration', () => {
  let wizard;
  let mockFiles;

  beforeEach(async () => {
    document.body.innerHTML = '<mp-upload-wizard></mp-upload-wizard>';
    wizard = document.querySelector('mp-upload-wizard');
    await wizard.updateComplete;

    mockFiles = [
      new File(['Content 1'], 'review1.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }),
      new File(['Content 2'], 'review2.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }),
      new File(['Content 3'], 'review3.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
    ];
  });

  it('should handle multiple files dropped simultaneously', async () => {
    wizard.contentType = 'reviews';
    await wizard.handleFilesDropped(mockFiles);

    expect(wizard.files.length).toBe(3);
    expect(wizard.wizardStep).toBe('process');
    expect(wizard.currentFileIndex).toBe(0);
  });

  it('should process files sequentially', async () => {
    wizard.contentType = 'reviews';
    await wizard.handleFilesDropped(mockFiles);

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(wizard.currentFileIndex).toBe(0);

    await wizard.processNextFile();
    expect(wizard.currentFileIndex).toBe(1);

    await wizard.processNextFile();
    expect(wizard.currentFileIndex).toBe(2);
  });

  it('should show progress indicator during processing', async () => {
    wizard.contentType = 'reviews';
    await wizard.handleFilesDropped(mockFiles);

    const progress = wizard.shadowRoot.querySelector('mp-wizard-progress');
    expect(progress).toBeTruthy();
    expect(progress.total).toBe(3);
    expect(progress.current).toBe(1);
  });

  it('should prevent UI blocking during file processing', async () => {
    wizard.contentType = 'reviews';
    await wizard.handleFilesDropped(mockFiles);

    const startTime = Date.now();
    const button = wizard.shadowRoot.querySelector('sl-button');
    button.click();

    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(100);
  });

  it('should transition to summary after all files processed', async () => {
    wizard.contentType = 'reviews';
    await wizard.handleFilesDropped(mockFiles);

    for (let i = 0; i < mockFiles.length; i++) {
      await wizard.processNextFile();
      wizard.handleFileCompleted({
        detail: { fileIndex: i, formData: { title: `Review ${i}` } }
      });
    }

    expect(wizard.wizardStep).toBe('summary');
    expect(wizard.completedCount).toBe(3);
  });

  it('should handle mixed success and failure', async () => {
    wizard.contentType = 'reviews';
    mockFiles[1] = new File(['Invalid'], 'corrupted.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    await wizard.handleFilesDropped(mockFiles);

    wizard.handleFileCompleted({ detail: { fileIndex: 0, formData: {} } });
    wizard.handleFileError({ detail: { fileIndex: 1, error: 'Extraction failed' } });
    wizard.handleFileCompleted({ detail: { fileIndex: 2, formData: {} } });

    expect(wizard.completedCount).toBe(2);
    expect(wizard.errorCount).toBe(1);
  });

  it('should maintain file order during sequential processing', async () => {
    wizard.contentType = 'reviews';
    await wizard.handleFilesDropped(mockFiles);

    const processedOrder = [];
    wizard.addEventListener('file-processing', (e) => {
      processedOrder.push(e.detail.fileName);
    });

    for (let i = 0; i < mockFiles.length; i++) {
      await wizard.processNextFile();
    }

    expect(processedOrder).toEqual(['review1.docx', 'review2.docx', 'review3.docx']);
  });

  it('should allow skipping files', async () => {
    wizard.contentType = 'reviews';
    await wizard.handleFilesDropped(mockFiles);

    await wizard.processNextFile();
    wizard.handleSkipFile({ detail: { fileIndex: 0 } });

    expect(wizard.files[0].status).toBe('skipped');
    expect(wizard.skippedCount).toBe(1);
    expect(wizard.currentFileIndex).toBe(1);
  });

  it('should validate file types before processing', async () => {
    const invalidFiles = [
      new File(['Content'], 'test.txt', { type: 'text/plain' }),
      new File(['Content'], 'test.pdf', { type: 'application/pdf' })
    ];

    wizard.contentType = 'reviews';
    await wizard.handleFilesDropped(invalidFiles);

    expect(wizard.files.length).toBe(0);
    const error = wizard.shadowRoot.querySelector('.error-message');
    expect(error.textContent).toContain('DOCX');
  });

  it('should handle maximum file limit', async () => {
    const manyFiles = Array(15).fill(null).map((_, i) =>
      new File(['Content'], `review${i}.docx`, {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
    );

    wizard.contentType = 'reviews';
    await wizard.handleFilesDropped(manyFiles);

    expect(wizard.files.length).toBeLessThanOrEqual(10);
    const warning = wizard.shadowRoot.querySelector('.warning-message');
    expect(warning.textContent).toContain('10 files');
  });
});