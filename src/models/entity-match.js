export class EntityMatch {
  constructor(entity, similarity, reason) {
    if (!entity || !entity.id || !entity.name) {
      throw new Error('Entity must have id and name properties');
    }

    if (similarity < 0 || similarity > 100) {
      throw new Error('Similarity must be between 0 and 100');
    }

    if (!reason || reason.trim() === '') {
      throw new Error('Match reason is required');
    }

    this.entity = entity;
    this.similarity = similarity;
    this.reason = reason;
    this.confidence = this.calculateConfidence();
  }

  calculateConfidence() {
    if (this.similarity >= 85) return 'high';
    if (this.similarity >= 70) return 'medium';
    return 'low';
  }

  isHighConfidence() {
    return this.confidence === 'high';
  }

  isMediumConfidence() {
    return this.confidence === 'medium';
  }

  isLowConfidence() {
    return this.confidence === 'low';
  }

  isExactMatch() {
    return this.similarity === 100;
  }

  isLikelyMatch() {
    return this.similarity >= 85;
  }

  isPossibleMatch() {
    return this.similarity >= 70 && this.similarity < 85;
  }

  isUnlikelyMatch() {
    return this.similarity < 70;
  }

  validate() {
    if (this.similarity >= 85 && this.confidence !== 'high') {
      throw new Error('High similarity should have high confidence');
    }

    if (this.similarity >= 70 && this.similarity < 85 && this.confidence !== 'medium') {
      throw new Error('Medium similarity should have medium confidence');
    }

    if (this.similarity < 70 && this.similarity >= 50 && this.confidence !== 'low') {
      throw new Error('Low similarity should have low confidence');
    }

    return true;
  }

  toJSON() {
    return {
      entity: this.entity,
      similarity: this.similarity,
      reason: this.reason,
      confidence: this.confidence
    };
  }

  static createExactMatch(entity) {
    return new EntityMatch(
      entity,
      100,
      'Exact match found'
    );
  }

  static createHighSimilarityMatch(entity, similarity) {
    if (similarity < 85) {
      throw new Error('High similarity match requires similarity >= 85');
    }

    return new EntityMatch(
      entity,
      similarity,
      'Strong name similarity - likely the same entity'
    );
  }

  static createMediumSimilarityMatch(entity, similarity) {
    if (similarity < 70 || similarity >= 85) {
      throw new Error('Medium similarity match requires 70 <= similarity < 85');
    }

    return new EntityMatch(
      entity,
      similarity,
      'Moderate name similarity - review carefully'
    );
  }

  static createLowSimilarityMatch(entity, similarity) {
    if (similarity < 50 || similarity >= 70) {
      throw new Error('Low similarity match requires 50 <= similarity < 70');
    }

    return new EntityMatch(
      entity,
      similarity,
      'Weak name similarity - different entity likely'
    );
  }

  static sortBySimiliarity(matches) {
    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  static filterByConfidence(matches, minConfidence) {
    const confidenceLevels = {
      'high': 3,
      'medium': 2,
      'low': 1
    };

    const minLevel = confidenceLevels[minConfidence] || 1;

    return matches.filter(match => {
      const matchLevel = confidenceLevels[match.confidence];
      return matchLevel >= minLevel;
    });
  }

  static groupByEntity(matches) {
    const grouped = {};

    for (const match of matches) {
      const entityId = match.entity.id;

      if (!grouped[entityId]) {
        grouped[entityId] = {
          entity: match.entity,
          matches: []
        };
      }

      grouped[entityId].matches.push(match);
    }

    return Object.values(grouped);
  }

  static findBestMatch(matches) {
    if (!matches || matches.length === 0) {
      return null;
    }

    const sorted = EntityMatch.sortBySimiliarity(matches);
    return sorted[0];
  }

  static hasHighConfidenceMatch(matches) {
    return matches.some(match => match.isHighConfidence());
  }

  static summarizeMatches(matches) {
    return {
      total: matches.length,
      exact: matches.filter(m => m.isExactMatch()).length,
      high: matches.filter(m => m.isHighConfidence()).length,
      medium: matches.filter(m => m.isMediumConfidence()).length,
      low: matches.filter(m => m.isLowConfidence()).length,
      bestMatch: EntityMatch.findBestMatch(matches)
    };
  }
}