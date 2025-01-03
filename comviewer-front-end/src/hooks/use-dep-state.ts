import {useUpdateEffect} from "ahooks";
import {Dispatch, SetStateAction, useState} from "react";

export function useDepState<S>(dep: S): [S, Dispatch<SetStateAction<S>>];

export function useDepState<D, S = D>(dep: D, compute: (dep: D) => S): [S, Dispatch<SetStateAction<S>>];

export function useDepState<D, S = D>(dep: D, compute?: (dep: D) => S): [D | S, Dispatch<SetStateAction<D | S>>] {
    const [state, setState] = useState(compute ? compute(dep) : dep);
    useUpdateEffect(() => {
        setState(compute ? compute(dep) : dep);
    }, [dep]);
    return [state, setState];
}