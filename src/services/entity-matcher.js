export class EntityMatcher {
  constructor() {
    this.entities = {
      persons: [],
      theaters: [],
      cities: [],
      groups: []
    };
    this.cacheTime = 15 * 60 * 1000; // 15 minutes
    this.lastCacheUpdate = 0;
    this.resolutionCache = new Map();
  }

  setEntities(entities) {
    this.entities = entities;
    this.lastCacheUpdate = Date.now();
  }

  isCacheStale() {
    return Date.now() - this.lastCacheUpdate > this.cacheTime;
  }

  async match(params) {
    const { names, entityType, threshold = 70 } = params;

    if (!this.isValidEntityType(entityType)) {
      throw {
        error: 'INVALID_ENTITY_TYPE',
        message: `Invalid entity type: ${entityType}. Must be one of: person, theater, city, group`
      };
    }

    const entityCollection = this.getEntityCollection(entityType);
    const matches = [];

    for (const name of names) {
      const candidates = this.findSimilarEntities(name, entityCollection, threshold);
      matches.push({
        inputName: name,
        candidates: candidates.map(candidate => ({
          entity: candidate.entity,
          similarity: candidate.similarity,
          reason: candidate.reason,
          confidence: this.getConfidenceLevel(candidate.similarity)
        }))
      });
    }

    return { matches };
  }

  findSimilarEntities(name, entities, threshold) {
    const normalizedName = this.normalizeName(name);
    const candidates = [];

    for (const entity of entities) {
      const normalizedEntityName = this.normalizeName(entity.name);
      const similarity = this.calculateSimilarity(normalizedName, normalizedEntityName);

      if (similarity >= threshold) {
        candidates.push({
          entity,
          similarity,
          reason: this.getSimilarityReason(similarity, name, entity.name)
        });
      }
    }

    return candidates.sort((a, b) => b.similarity - a.similarity);
  }

  calculateSimilarity(str1, str2) {
    if (str1 === str2) return 100;

    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    const similarity = ((maxLength - distance) / maxLength) * 100;

    return Math.round(similarity);
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  normalizeName(name) {
    return name
      .toLowerCase()
      .replace(/['']/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^(van|de|den|der|het|la|le|el)\s+/i, '')
      .replace(/,\s*([^,]+)$/, ' $1');
  }

  getConfidenceLevel(similarity) {
    if (similarity >= 85) return 'high';
    if (similarity >= 70) return 'medium';
    return 'low';
  }

  getSimilarityReason(similarity, inputName, entityName) {
    if (similarity === 100) {
      return 'Exact match';
    } else if (similarity >= 90) {
      return 'Strong name similarity - likely the same entity';
    } else if (similarity >= 80) {
      return 'High name similarity - possible variant or typo';
    } else if (similarity >= 70) {
      return 'Moderate name similarity - review carefully';
    } else {
      return 'Weak name similarity - different entity likely';
    }
  }

  isValidEntityType(type) {
    return ['person', 'theater', 'city', 'group'].includes(type);
  }

  getEntityCollection(type) {
    const collections = {
      person: this.entities.persons,
      theater: this.entities.theaters,
      city: this.entities.cities,
      group: this.entities.groups
    };
    return collections[type] || [];
  }

  async findDuplicates(parsedData, fieldName) {
    const values = Array.isArray(parsedData[fieldName])
      ? parsedData[fieldName]
      : [parsedData[fieldName]];

    const entityType = this.getEntityTypeForField(fieldName);
    const results = [];

    for (const value of values) {
      const matches = await this.findDuplicatesForName(value, entityType);
      if (matches.length > 0) {
        results.push({
          inputName: value,
          candidates: matches
        });
      }
    }

    return results;
  }

  async findDuplicatesForName(name, entityType) {
    if (this.resolutionCache.has(name)) {
      return [this.resolutionCache.get(name)];
    }

    const collection = this.getEntityCollection(entityType);
    return this.findSimilarEntities(name, collection, 70);
  }

  getEntityTypeForField(fieldName) {
    const fieldTypeMap = {
      actors: 'person',
      directors: 'person',
      writers: 'person',
      persons: 'person',
      theater: 'theater',
      city: 'city',
      groups: 'group'
    };
    return fieldTypeMap[fieldName] || 'person';
  }

  cacheResolution(originalName, resolvedEntity) {
    this.resolutionCache.set(originalName, resolvedEntity);
  }

  getCachedResolution(name) {
    return this.resolutionCache.get(name);
  }

  clearCache() {
    this.resolutionCache.clear();
    this.lastCacheUpdate = 0;
  }
}