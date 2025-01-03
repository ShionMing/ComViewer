type RecordKey = string | number | symbol;

export function get<K extends RecordKey, V>(record: Record<K, V> | undefined, key: K): V | undefined {
    return record ? record[key] : undefined;
}

export function set<K extends RecordKey, V>(record: Record<K, V>, key: K, value: V): V {
    record[key] = value;
    return value;
}

export function del<K extends RecordKey, V>(record: Record<K, V> | undefined, key: K): V | undefined {
    if (!record) return;
    const value: V | undefined = record[key];
    delete record[key];
    return value;
}

export function has<K extends RecordKey, V>(record: Record<K, V>, key: K): boolean {
    return Object.prototype.hasOwnProperty.call(record, key);
}

export function size<K extends RecordKey, V>(record: Record<K, V>): number {
    return Object.keys(record).length;
}

export function isEmpty<K extends RecordKey, V>(record: Record<K, V>): boolean {
    return size(record) === 0;
}

export function setIfAbsent<K extends RecordKey, V>(record: Record<K, V>, key: K, defaultValue: V | (() => V)): V {
    const value: V | undefined = record[key];
    if (value !== undefined) return value;
    const newValue = defaultValue instanceof Function ? defaultValue() : defaultValue;
    record[key] = newValue;
    return newValue;
}

export function values<K extends RecordKey, V>(record: Record<K, V> | undefined): V[] {
    return record ? Object.values(record) : [];
}

export function entries<K extends RecordKey, V>(record: Record<K, V> | undefined): [string, V][] {
    // const entries: [string, V][] = [];
    // for (const key in record) {
    //     if (Object.prototype.hasOwnProperty.call(record, key)) {
    //         entries.push([key, record[key]]);
    //     }
    // }
    // return entries;
    return record ? Object.entries<V>(record) : [];
}

export default {get, set, del, has, size, isEmpty, setIfAbsent, values, entries};