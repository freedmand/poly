class TypeEnv {
  constructor(parentEnv = null) {
    this.parent = parentEnv;
    this.types = new TypeIndex();
    this.typeNames = new Map();
  }

  register(name, type) {
    this.typeNames.set(name, type);
    this.types.set(type, true);
  }

  get(name) {
    if (this.typeNames.has(name)) return this.typeNames.get(name);
    if (this.parent) return this.parent.get(name);
    return null;
  }
}
