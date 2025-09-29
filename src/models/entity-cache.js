export class EntityCache {
  constructor() {
    this.persons = [];
    this.theaters = [];
    this.cities = [];
    this.groups = [];
    this.lastUpdated = 0;
    this.isStale = false;
    this.expirationTime = 15 * 60 * 1000; // 15 minutes
    this.updatePromises = {};
  }

  setEntities(type, entities) {
    const validTypes = ['persons', 'theaters', 'cities', 'groups'];

    if (!validTypes.includes(type)) {
      throw new Error(`Invalid entity type: ${type}`);
    }

    if (!Array.isArray(entities)) {
      throw new Error('Entities must be an array');
    }

    this[type] = entities;
    this.lastUpdated = Date.now();
    this.isStale = false;
  }

  setAllEntities(entities) {
    if (!entities || typeof entities !== 'object') {
      throw new Error('Invalid entities object');
    }

    this.persons = entities.persons || [];
    this.theaters = entities.theaters || [];
    this.cities = entities.cities || [];
    this.groups = entities.groups || [];
    this.lastUpdated = Date.now();
    this.isStale = false;
  }

  getEntities(type) {
    const validTypes = ['persons', 'theaters', 'cities', 'groups'];

    if (!validTypes.includes(type)) {
      throw new Error(`Invalid entity type: ${type}`);
    }

    this.checkStaleness();
    return this[type] || [];
  }

  getAllEntities() {
    this.checkStaleness();

    return {
      persons: this.persons,
      theaters: this.theaters,
      cities: this.cities,
      groups: this.groups
    };
  }

  addEntity(type, entity) {
    const validTypes = ['persons', 'theaters', 'cities', 'groups'];

    if (!validTypes.includes(type)) {
      throw new Error(`Invalid entity type: ${type}`);
    }

    if (!entity || !entity.id || !entity.name) {
      throw new Error('Entity must have id and name properties');
    }

    const existingIndex = this[type].findIndex(e => e.id === entity.id);

    if (existingIndex >= 0) {
      this[type][existingIndex] = entity;
    } else {
      this[type].push(entity);
    }

    this.lastUpdated = Date.now();
  }

  removeEntity(type, entityId) {
    const validTypes = ['persons', 'theaters', 'cities', 'groups'];

    if (!validTypes.includes(type)) {
      throw new Error(`Invalid entity type: ${type}`);
    }

    const index = this[type].findIndex(e => e.id === entityId);

    if (index >= 0) {
      this[type].splice(index, 1);
      this.lastUpdated = Date.now();
      return true;
    }

    return false;
  }

  findEntity(type, predicate) {
    const entities = this.getEntities(type);
    return entities.find(predicate);
  }

  searchEntities(type, searchTerm) {
    const entities = this.getEntities(type);
    const normalizedSearch = searchTerm.toLowerCase().trim();

    return entities.filter(entity =>
      entity.name.toLowerCase().includes(normalizedSearch)
    );
  }

  checkStaleness() {
    const now = Date.now();
    const age = now - this.lastUpdated;

    this.isStale = age > this.expirationTime;

    if (this.isStale) {
      console.warn('Entity cache is stale and needs refresh');
    }

    return this.isStale;
  }

  markStale() {
    this.isStale = true;
  }

  refresh() {
    this.lastUpdated = Date.now();
    this.isStale = false;
  }

  clear() {
    this.persons = [];
    this.theaters = [];
    this.cities = [];
    this.groups = [];
    this.lastUpdated = 0;
    this.isStale = true;
  }

  async updateFromAPI(apiClient) {
    try {
      const [persons, theaters, cities, groups] = await Promise.all([
        apiClient.getEntities('persons'),
        apiClient.getEntities('theaters'),
        apiClient.getEntities('cities'),
        apiClient.getEntities('groups')
      ]);

      this.setAllEntities({
        persons: persons || [],
        theaters: theaters || [],
        cities: cities || [],
        groups: groups || []
      });

      return true;
    } catch (error) {
      console.error('Failed to update entity cache from API:', error);
      this.setAllEntities({
        persons: [],
        theaters: [],
        cities: [],
        groups: []
      });
      return false;
    }
  }

  getCacheAge() {
    if (this.lastUpdated === 0) return Infinity;
    return Date.now() - this.lastUpdated;
  }

  isExpired() {
    return this.getCacheAge() > this.expirationTime;
  }

  getStatistics() {
    return {
      persons: this.persons.length,
      theaters: this.theaters.length,
      cities: this.cities.length,
      groups: this.groups.length,
      total: this.persons.length + this.theaters.length + this.cities.length + this.groups.length,
      lastUpdated: this.lastUpdated,
      isStale: this.isStale,
      cacheAge: this.getCacheAge(),
      isExpired: this.isExpired()
    };
  }

  toJSON() {
    return {
      persons: this.persons,
      theaters: this.theaters,
      cities: this.cities,
      groups: this.groups,
      lastUpdated: this.lastUpdated,
      isStale: this.isStale
    };
  }
}