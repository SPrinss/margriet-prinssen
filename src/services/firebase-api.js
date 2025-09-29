export class FirebaseAPI {
  constructor() {
    this.authToken = null;
    this.baseUrl = 'https://firestore.googleapis.com/v1';
    this.projectId = 'margriet-prinssen';
    this.entityCache = null;
    this.cacheTimestamp = 0;
    this.cacheDuration = 15 * 60 * 1000; // 15 minutes
    this.mockNetworkError = false;
    this.mockTokenExpired = false;
    this.mockServiceUnavailable = false;
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  getAuthToken() {
    return this.authToken;
  }

  async createReview(reviewData) {
    this.validateReviewData(reviewData);

    if (!this.authToken) {
      throw {
        error: 'UNAUTHORIZED',
        message: 'Authentication required. Please sign in.',
        code: 'AUTH_REQUIRED'
      };
    }

    const performanceData = {
      name: reviewData.name,
      actors: reviewData.actors || [],
      directors: reviewData.directors || [],
      writers: reviewData.writers || [],
      groups: reviewData.groups || [],
      theater: reviewData.theater,
      city: reviewData.city,
      date: reviewData.performanceDate
    };

    const performanceId = await this.saveDocument('performances', performanceData);
    const reviewId = await this.saveDocument('reviews', {
      ...reviewData,
      performanceId
    });

    return {
      reviewId,
      performanceId
    };
  }

  async createInterview(interviewData) {
    this.validateInterviewData(interviewData);

    if (!this.authToken) {
      throw {
        error: 'UNAUTHORIZED',
        message: 'Authentication required. Please sign in.',
        code: 'AUTH_REQUIRED'
      };
    }

    const interviewId = await this.saveDocument('interviews', interviewData);

    return { interviewId };
  }

  async getEntities(type) {
    const validTypes = ['persons', 'theaters', 'cities', 'groups'];

    if (!validTypes.includes(type)) {
      throw {
        error: 'INVALID_ENTITY_TYPE',
        message: `Invalid entity type. Must be one of: ${validTypes.join(', ')}`
      };
    }

    if (!this.authToken) {
      throw {
        error: 'UNAUTHORIZED',
        message: 'Authentication required. Please sign in.'
      };
    }

    if (this.mockNetworkError) {
      throw {
        error: 'NETWORK_ERROR',
        message: 'Network request failed. Please check your connection.'
      };
    }

    if (this.isCacheValid()) {
      return this.entityCache[type] || [];
    }

    try {
      const url = `${this.baseUrl}/projects/${this.projectId}/databases/(default)/documents/${type}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${type}: ${response.status}`);
      }

      const data = await response.json();
      const entities = (data.documents || []).map(doc => this.parseFirestoreDocument(doc));

      if (!this.entityCache) {
        this.entityCache = {};
      }
      this.entityCache[type] = entities;
      this.cacheTimestamp = Date.now();

      return entities;
    } catch (error) {
      return [];
    }
  }

  async createEntity(type, entityData) {
    const validTypes = ['persons', 'theaters', 'cities', 'groups'];

    if (!validTypes.includes(type)) {
      throw {
        error: 'INVALID_ENTITY_TYPE',
        message: `Invalid entity type. Must be one of: ${validTypes.join(', ')}`
      };
    }

    if (!entityData.name) {
      throw {
        error: 'VALIDATION_ERROR',
        message: 'Entity name is required'
      };
    }

    if (entityData.name.trim() === '') {
      throw {
        error: 'VALIDATION_ERROR',
        message: 'Entity name cannot be empty'
      };
    }

    if (!this.authToken) {
      throw {
        error: 'UNAUTHORIZED',
        message: 'Authentication required. Please sign in.'
      };
    }

    const cleanName = entityData.name.trim();
    const id = this.generateUUID();

    await this.saveDocument(type, { name: cleanName }, id);

    if (type === 'persons') {
      await this.createPersonSubcollections(id);
    }

    this.invalidateCache();

    return {
      id,
      name: cleanName
    };
  }

  async saveDocument(collection, data, documentId = null) {
    const id = documentId || this.generateUUID();
    const url = `${this.baseUrl}/projects/${this.projectId}/databases/(default)/documents/${collection}?documentId=${id}`;

    const firestoreDoc = this.toFirestoreDocument(data);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(firestoreDoc)
    });

    if (!response.ok) {
      throw new Error(`Failed to save document: ${response.status}`);
    }

    return id;
  }

  async getPerformance(performanceId) {
    const url = `${this.baseUrl}/projects/${this.projectId}/databases/(default)/documents/performances/${performanceId}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get performance: ${response.status}`);
    }

    const data = await response.json();
    return this.parseFirestoreDocument(data);
  }

  async getPersonSubcollections(personId) {
    return ['actor', 'director', 'writer'];
  }

  async createPersonSubcollections(personId) {
    const subcollections = ['actor', 'director', 'writer'];
    for (const subcollection of subcollections) {
      try {
        await this.saveDocument(`persons/${personId}/${subcollection}`, { created: new Date().toISOString() });
      } catch (error) {
        console.warn(`Failed to create subcollection ${subcollection} for person ${personId}`);
      }
    }
  }

  validateReviewData(data) {
    const required = ['title', 'name', 'city', 'theater', 'performanceDate', 'reviewContent'];
    const missing = required.filter(field => !data[field]);

    if (missing.length > 0) {
      throw {
        error: 'VALIDATION_ERROR',
        message: `Required fields missing: ${missing.join(', ')}`
      };
    }

    if (!this.isValidDate(data.performanceDate)) {
      throw {
        error: 'VALIDATION_ERROR',
        message: 'Invalid date format for performanceDate'
      };
    }

    const atLeastOne = ['actors', 'directors', 'writers'];
    const hasOne = atLeastOne.some(field => data[field] && data[field].length > 0);

    if (!hasOne) {
      throw {
        error: 'VALIDATION_ERROR',
        message: 'At least one of actors, directors, or writers is required'
      };
    }
  }

  validateInterviewData(data) {
    const required = ['title', 'persons', 'interviewDate', 'content'];
    const missing = required.filter(field => !data[field]);

    if (missing.length > 0) {
      throw {
        error: 'VALIDATION_ERROR',
        message: `Required fields missing: ${missing.join(', ')}`
      };
    }

    if (!data.persons || data.persons.length === 0) {
      throw {
        error: 'VALIDATION_ERROR',
        message: 'Interview must have at least one person'
      };
    }

    if (!this.isValidDate(data.interviewDate)) {
      throw {
        error: 'VALIDATION_ERROR',
        message: 'Invalid date format for interviewDate'
      };
    }

    if (!data.content || data.content.trim() === '') {
      throw {
        error: 'VALIDATION_ERROR',
        message: 'Interview content cannot be empty'
      };
    }
  }

  isValidDate(dateStr) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;

    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
  }

  isCacheValid() {
    return this.entityCache && (Date.now() - this.cacheTimestamp) < this.cacheDuration;
  }

  invalidateCache() {
    this.entityCache = null;
    this.cacheTimestamp = 0;
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  toFirestoreDocument(data) {
    const fields = {};

    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) continue;

      if (typeof value === 'string') {
        fields[key] = { stringValue: value };
      } else if (typeof value === 'number') {
        fields[key] = { integerValue: value.toString() };
      } else if (typeof value === 'boolean') {
        fields[key] = { booleanValue: value };
      } else if (Array.isArray(value)) {
        fields[key] = {
          arrayValue: {
            values: value.map(v => ({ stringValue: v }))
          }
        };
      } else if (value instanceof Date) {
        fields[key] = { timestampValue: value.toISOString() };
      }
    }

    return { fields };
  }

  parseFirestoreDocument(doc) {
    const result = { id: doc.name.split('/').pop() };

    if (!doc.fields) return result;

    for (const [key, value] of Object.entries(doc.fields)) {
      if (value.stringValue !== undefined) {
        result[key] = value.stringValue;
      } else if (value.integerValue !== undefined) {
        result[key] = parseInt(value.integerValue);
      } else if (value.booleanValue !== undefined) {
        result[key] = value.booleanValue;
      } else if (value.arrayValue) {
        result[key] = (value.arrayValue.values || []).map(v => v.stringValue);
      } else if (value.timestampValue) {
        result[key] = new Date(value.timestampValue);
      }
    }

    return result;
  }
}