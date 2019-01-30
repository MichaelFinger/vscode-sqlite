interface StringConvertable {
    toString: () => string;
}

export class TypedMap<K extends StringConvertable, V> {
    private map: {[key: string]: V};

    constructor() {
        this.map = {};
    }

    set(key: K, value: V) {
        this.map[key.toString()] = value;
    }

    get(key: K): V {
        return this.map[key.toString()];
    }
}