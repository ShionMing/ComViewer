import {useCreation, useMount, useUnmount} from "ahooks";
import {useState} from "react";

export function useGlobal<T>(factory: () => T, dispose?: (global: T) => void) {
    const global = useCreation(factory, []);
    useUnmount(() => {
        dispose && dispose(global);
    });
    return global;
}

export function useGlobalMounted<T>(factory: () => T, dispose?: (global?: T) => void) {
    const [global, setGlobal] = useState<T>();
    useMount(() => {
        setGlobal(factory);
    });
    useUnmount(() => {
        dispose && dispose(global);
    });
    return global;
}