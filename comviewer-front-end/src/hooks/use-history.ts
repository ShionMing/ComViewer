import {useState} from "react";

export function useHistory<T>(initialValue?: T[], maxLength: number = 0): [T[], { push: (value: T) => void }] {
    const [history, setHistory] = useState<T[]>(initialValue ?? []);
    const push = (value: T) => {
        setHistory(_history => {
            const newHistory = Array.from(_history);
            const index = _history.indexOf(value);
            if (index >= 0) {
                newHistory.splice(index, 1);
            }
            if (maxLength > 0 && newHistory.length >= maxLength) {
                newHistory.pop();
            }
            newHistory.unshift(value);
            return newHistory;
        });
    };
    return [history, {push}];
}