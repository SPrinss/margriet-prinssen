import '../fixtures/test-setup.js';

describe('Form Pre-population Integration', () => {
  let wizard;
  let reviewForm;
  let interviewForm;

  beforeEach(async () => {
    document.body.innerHTML = `
      <mp-upload-wizard></mp-upload-wizard>
      <mp-review-form></mp-review-form>
      <mp-interview-form></mp-interview-form>
    `;
    wizard = document.querySelector('mp-upload-wizard');
    reviewForm = document.querySelector('mp-review-form');
    interviewForm = document.querySelector('mp-interview-form');
    await wizard.updateComplete;
  });

  it('should populate review form with parsed data', async () => {
    const parsedData = {
      title: 'Het Verdriet van de Zuiderzee',
      name: 'Test Play',
      actors: ['Jasper Stoop', 'Nick Silva'],
      directors: ['Geert Lageveen'],
      writers: ['Geert Lageveen'],
      groups: ['Orkater'],
      city: 'Amsterdam',
      theater: 'Royal Theater',
      performanceDate: '2022-08-13',
      reviewContent: '<p>Amazing performance...</p>'
    };

    reviewForm.populateForm(parsedData);
    await reviewForm.updateComplete;

    expect(reviewForm.getValue('title')).toBe('Het Verdriet van de Zuiderzee');
    expect(reviewForm.getValue('name')).toBe('Test Play');
    expect(reviewForm.getValue('city')).toBe('Amsterdam');
    expect(reviewForm.getValue('theater')).toBe('Royal Theater');
    expect(reviewForm.getValue('performanceDate')).toBe('2022-08-13');
  });

  it('should populate interview form with parsed data', async () => {
    const parsedData = {
      title: 'Interview with Geert Lageveen',
      persons: ['Geert Lageveen', 'Belle van Heerikhuizen'],
      interviewDate: '2022-08-13',
      content: '<p>Interview content...</p>'
    };

    interviewForm.populateForm(parsedData);
    await interviewForm.updateComplete;

    expect(interviewForm.getValue('title')).toBe('Interview with Geert Lageveen');
    expect(interviewForm.getValue('persons')).toEqual(['Geert Lageveen', 'Belle van Heerikhuizen']);
    expect(interviewForm.getValue('interviewDate')).toBe('2022-08-13');
  });

  it('should preserve user edits over parsed data', async () => {
    const parsedData = {
      title: 'Original Title',
      name: 'Original Play',
      city: 'Amsterdam',
      theater: 'Original Theater',
      performanceDate: '2022-08-13',
      reviewContent: '<p>Content</p>'
    };

    reviewForm.populateForm(parsedData);
    await reviewForm.updateComplete;

    reviewForm.setValue('title', 'Edited Title');
    reviewForm.setValue('theater', 'Edited Theater');

    const formData = reviewForm.getFormData();
    expect(formData.title).toBe('Edited Title');
    expect(formData.theater).toBe('Edited Theater');
    expect(formData.name).toBe('Original Play');
  });

  it('should handle array fields (actors, directors, writers)', async () => {
    const parsedData = {
      actors: ['Actor 1', 'Actor 2', 'Actor 3'],
      directors: ['Director 1'],
      writers: ['Writer 1', 'Writer 2']
    };

    reviewForm.populateForm(parsedData);
    await reviewForm.updateComplete;

    const actorInputs = reviewForm.shadowRoot.querySelectorAll('[name="actors"]');
    expect(actorInputs.length).toBe(3);
    expect(actorInputs[0].value).toBe('Actor 1');
    expect(actorInputs[2].value).toBe('Actor 3');
  });

  it('should validate required fields before submission', async () => {
    const incompleteData = {
      title: 'Test Title'
    };

    reviewForm.populateForm(incompleteData);
    await reviewForm.updateComplete;

    const isValid = reviewForm.validateForm();
    expect(isValid).toBe(false);

    const errors = reviewForm.getValidationErrors();
    expect(errors).toContain('name');
    expect(errors).toContain('city');
    expect(errors).toContain('theater');
  });

  it('should handle date formatting', async () => {
    const parsedData = {
      performanceDate: '13-08-2022'
    };

    reviewForm.populateForm(parsedData);
    await reviewForm.updateComplete;

    const formattedDate = reviewForm.getValue('performanceDate');
    expect(formattedDate).toBe('2022-08-13');
  });

  it('should preserve HTML in content fields', async () => {
    const parsedData = {
      reviewContent: '<p>First paragraph</p><p>Second paragraph</p><ul><li>List item</li></ul>'
    };

    reviewForm.populateForm(parsedData);
    await reviewForm.updateComplete;

    const content = reviewForm.getValue('reviewContent');
    expect(content).toContain('<p>');
    expect(content).toContain('<ul>');
    expect(content).toContain('<li>');
  });

  it('should integrate with wizard file processing', async () => {
    const mockFile = new File(['Content'], 'review.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    wizard.contentType = 'reviews';
    await wizard.handleFilesDropped([mockFile]);

    const processedFile = {
      parsedData: {
        title: 'Parsed Title',
        name: 'Parsed Play',
        city: 'Amsterdam',
        theater: 'Theater',
        performanceDate: '2022-08-13',
        reviewContent: '<p>Content</p>'
      }
    };

    wizard.files[0] = { ...wizard.files[0], ...processedFile };
    wizard.showFormForFile(0);

    await new Promise(resolve => setTimeout(resolve, 100));

    const displayedForm = wizard.shadowRoot.querySelector('mp-review-form');
    expect(displayedForm.getValue('title')).toBe('Parsed Title');
  });

  it('should handle form submission', async () => {
    const parsedData = {
      title: 'Test Title',
      name: 'Test Play',
      city: 'Amsterdam',
      theater: 'Test Theater',
      performanceDate: '2022-08-13',
      reviewContent: '<p>Content</p>'
    };

    reviewForm.populateForm(parsedData);
    await reviewForm.updateComplete;

    let submittedData = null;
    reviewForm.addEventListener('form-submit', (e) => {
      submittedData = e.detail;
    });

    reviewForm.submitForm();

    expect(submittedData).toEqual(parsedData);
  });

  it('should clear form after successful submission', async () => {
    const parsedData = {
      title: 'Test Title',
      name: 'Test Play',
      city: 'Amsterdam',
      theater: 'Test Theater',
      performanceDate: '2022-08-13',
      reviewContent: '<p>Content</p>'
    };

    reviewForm.populateForm(parsedData);
    await reviewForm.updateComplete;

    reviewForm.submitForm();
    reviewForm.clearForm();

    expect(reviewForm.getValue('title')).toBe('');
    expect(reviewForm.getValue('name')).toBe('');
    expect(reviewForm.getValue('city')).toBe('');
  });
});