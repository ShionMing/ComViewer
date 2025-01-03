import {SetStateAction, useRef, useState} from "react";

export function useGetState<T>(initialValue: T): [T, () => T, (value: T) => void];

export function useGetState<T>(): [T | undefined, () => T | undefined, (value: T | undefined) => void];

export function useGetState<T>(initialValue?: T) {
    const [state, _setState] = useState(initialValue);
    const latestRef = useRef(initialValue);
    const setState = (value: SetStateAction<T | undefined>) => {
        _setState(value);
        latestRef.current = value instanceof Function ? value(latestRef.current) : value;
    };
    const getState = () => {
        return latestRef.current;
    };
    return [state, getState, setState];
}