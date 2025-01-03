export function setIfAbsent<T extends { [key: string]: any }, K extends keyof T, V extends Pick<T, K>[K]>(
    obj: T,
    key: K,
    defaultValue: V | (() => V),
): V {
    const value: V | undefined = obj[key];
    if (value !== undefined) return value;
    const newValue = defaultValue instanceof Function ? defaultValue() : defaultValue;
    obj[key] = newValue;
    return newValue;
}

export default {setIfAbsent};