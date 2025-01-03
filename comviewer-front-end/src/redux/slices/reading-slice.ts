import {setReadingColor, setVis} from "@/redux/slices/route-slice.ts";
import {RootState} from "@/redux/store.ts";
import {IHighlight, IReading, ISummary} from "@/types/reading.ts";
import RecordUtil from "@/utils/record-util.ts";
import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import axios from "axios";

export interface INavigation {
    postId: string;
    highlightId?: string;
    commentId?: string;
}

export interface IReadingState {
    data: Record<string, Record<string, IReading>>; // userId, color
    navigation?: INavigation;
}

export const addHighlight = createAsyncThunk<void, {
    highlight: IHighlight,
    color: string,
    userId: string,
}, {
    state: RootState
}>(
    "reading/addHighlight",
    async (payload, {getState, dispatch}) => {
        const {highlight, color, userId} = payload;
        const state = getState().reading;
        const reading = RecordUtil.get(RecordUtil.get(state.data, userId), color);
        if (!reading || reading.highlights.length === 0) {
            dispatch(setVis("reading"));
            dispatch(setReadingColor(color));
        }
        dispatch(_addHighlight({highlight, color, userId}));
        const highlights = reading?.highlights ?? [];
        const text = highlights.map(h => h.text);
        const {data: summary} = await axios.post<ISummary>("/api/summarize/post", {text});
        dispatch(setSummary({summary, color, userId}));
    },
);

export const removeHighlight = createAsyncThunk<void, {
    highlightId?: string,
    color: string,
    userId: string,
}, {
    state: RootState
}>(
    "reading/removeHighlight",
    async (payload, {getState, dispatch}) => {
        const {highlightId, color, userId} = payload;
        if (!highlightId) return;
        const state = getState().reading;
        const prevHighlights = RecordUtil.get(RecordUtil.get(state.data, userId), color)?.highlights;
        if (!prevHighlights) return;
        const text: string[] = [];
        let found = false;
        for (const highlight of prevHighlights) {
            text.push(highlight.text);
            if (highlight.id === highlightId) found = true;
        }
        if (!found) return;
        dispatch(_removeHighlight({highlightId, color, userId}));
        const {data: summary} = await axios.post<ISummary>("/api/summarize/post", {text});
        dispatch(setSummary({summary, color, userId}));
    },
);

export const recolorHighlight = createAsyncThunk<void, {
    highlightId: string,
    prevColor?: string;
    newColor: string,
    userId: string,
}, {
    state: RootState
}>(
    "reading/recolorHighlight",
    async (payload, {getState, dispatch}) => {
        const {highlightId, prevColor, newColor, userId} = payload;
        const state = getState().reading;
        const color2ReadingsMap = RecordUtil.get(state.data, userId);
        if (!color2ReadingsMap) return;
        let prevReading: IReading | undefined = undefined;
        let prevHighlight: IHighlight | undefined = undefined;
        if (prevColor) {
            prevReading = RecordUtil.get(color2ReadingsMap, prevColor);
            if (!prevReading) return;
            const index = prevReading.highlights.findIndex(h => h.id === highlightId);
            if (index < 0) return;
            prevHighlight = prevReading.highlights[index];
        } else {
            for (const reading of RecordUtil.values(color2ReadingsMap)) {
                const index = reading.highlights.findIndex(h => h.id === highlightId);
                if (index >= 0) {
                    prevReading = reading;
                    prevHighlight = reading.highlights[index];
                    break;
                }
            }
        }
        if (!prevReading || !prevHighlight) return;
        dispatch(_recolorHighlight({highlightId, prevColor: prevReading.color, newColor, userId}));
        const newReading = RecordUtil.get(color2ReadingsMap, newColor);
        const newText = newReading ? newReading.highlights.map(h => h.text) : [];
        const {data: newSummary} = await axios.post<ISummary>("/api/summarize/post", {text: newText});
        dispatch(setSummary({summary: newSummary, color: newColor, userId}));
        const prevText = Array.from(prevReading.highlights.values()).filter(h => h.id !== highlightId).map(h => h.text);
        const {data: prevSummary} = await axios.post<ISummary>("/api/summarize/post", {text: prevText});
        dispatch(setSummary({summary: prevSummary, color: prevReading.color, userId}));
    },
);

export const setHighlights = createAsyncThunk<void, {
    highlights: IHighlight[],
    color: string,
    userId: string,
}, {
    state: RootState
}>(
    "reading/setHighlights",
    async (payload, {dispatch}) => {
        const {highlights, color, userId} = payload;
        dispatch(_setHighlights({highlights, color, userId}));
        const text = highlights.map(h => h.text);
        const {data: summary} = await axios.post<ISummary>("/api/summarize/post", {text});
        dispatch(setSummary({summary, color, userId}));
    },
);

const initialState: IReadingState = {data: {}};

export const readingSlice = createSlice({
    name: "reading",
    initialState,
    reducers: {
        _addHighlight(state, action: PayloadAction<{ highlight: IHighlight, color: string, userId: string }>) {
            const {highlight, color, userId} = action.payload;
            const readings = RecordUtil.setIfAbsent(state.data, userId, {});
            const reading = RecordUtil.setIfAbsent(readings, color, () => ({
                userId,
                color,
                highlights: [],
                mind: {
                    conclusions: [],
                    links: [],
                },
            }));
            const index = reading.highlights.findIndex(h => h.id === highlight.id);
            if (index >= 0) {
                reading.highlights[index] = highlight;
            } else {
                reading.highlights.push(highlight);
            }
            if (reading.summary) {
                reading.summary.loading = true;
            }
        },
        _removeHighlight(state, action: PayloadAction<{ highlightId?: string, color: string, userId: string }>) {
            const {highlightId, color, userId} = action.payload;
            if (highlightId) {
                const reading = RecordUtil.get(RecordUtil.get(state.data, userId), color);
                if (!reading) return;
                const index = reading.highlights.findIndex(h => h.id === highlightId);
                if (index < 0) return;
                reading.highlights.splice(index, 1);
                if (reading.summary) {
                    reading.summary.loading = true;
                }
            } else {
                RecordUtil.del(RecordUtil.get(state.data, userId), color);
            }
        },
        _recolorHighlight(state, action: PayloadAction<{
            highlightId: string,
            prevColor: string,
            newColor: string,
            userId: string
        }>) {
            if (!action.payload) return;
            const {highlightId, prevColor, newColor, userId} = action.payload;
            const color2ReadingsMap = RecordUtil.get(state.data, userId);
            if (!color2ReadingsMap) return;
            const prevReading = RecordUtil.get(color2ReadingsMap, prevColor);
            if (!prevReading) return;
            const prevHighlightIndex = prevReading.highlights.findIndex(h => h.id === highlightId);
            if (prevHighlightIndex < 0) return;
            if (prevReading.summary) {
                prevReading.summary.loading = true;
            }
            const highlight = prevReading.highlights.splice(prevHighlightIndex, 1)[0];
            const newReading = RecordUtil.setIfAbsent(color2ReadingsMap, newColor, () => ({
                userId,
                color: newColor,
                highlights: [],
                mind: {
                    conclusions: [],
                    links: [],
                },
            }));
            const newHighlightIndex = newReading.highlights.findIndex(h => h.id === highlightId);
            if (newHighlightIndex >= 0) {
                newReading.highlights[newHighlightIndex] = highlight;
            } else {
                newReading.highlights.push(highlight);
            }
            if (newReading.summary) {
                newReading.summary.loading = true;
            }
        },
        _setHighlights(state, action: PayloadAction<{ highlights: IHighlight[], color: string, userId: string }>) {
            const {highlights, color, userId} = action.payload;
            const reading = RecordUtil.get(RecordUtil.get(state.data, userId), color);
            if (!reading) return;
            reading.highlights = highlights;
            if (reading.summary) {
                reading.summary.loading = true;
            }
        },
        setSummary(state, action: PayloadAction<{ userId: string, color: string, summary: ISummary }>) {
            const {userId, color, summary} = action.payload;
            const reading = RecordUtil.get(RecordUtil.get(state.data, userId), color);
            if (!reading) return;
            reading.summary = summary;
        },
        setNavigation(state, action: PayloadAction<INavigation | undefined>) {
            state.navigation = action.payload;
        },
    },
});

export const selectAllReadings = (state: RootState) => state.reading;

export const selectReadings = (state: RootState, userId: string): Record<string, IReading> | undefined => RecordUtil.get(state.reading.data, userId);

export const selectReadingsByColor = (state: RootState, userId: string, color: string): IReading | undefined => RecordUtil.get(RecordUtil.get(state.reading.data, userId), color);

export const selectHighlights = (state: RootState, userId: string, postId: string): IHighlight[] | undefined =>
    RecordUtil.values(RecordUtil.get(state.reading.data, userId))?.flatMap(({highlights}) => highlights.filter(h => h.postId === postId));

export const selectHighlightsByColor = (state: RootState, userId: string, postId: string, color: string): IHighlight[] | undefined =>
    RecordUtil.get(RecordUtil.get(state.reading.data, userId), color)?.highlights.filter(h => h.postId === postId);

export const navigationSelector = (state: RootState) => state.reading.navigation;

const {
    setSummary,
    setNavigation,
    _addHighlight,
    _removeHighlight,
    _recolorHighlight,
    _setHighlights,
} = readingSlice.actions;
export {setSummary, setNavigation};

export default readingSlice.reducer;
