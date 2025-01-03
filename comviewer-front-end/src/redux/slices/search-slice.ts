import {RootState} from "@/redux/store.ts";
import {createSlice, PayloadAction} from "@reduxjs/toolkit";

export interface ISearchState {
    keywords?: string;
}

const initialState: ISearchState = {};

export const searchSlice = createSlice({
    name: "search",
    initialState,
    reducers: {
        setKeywords: (state, action: PayloadAction<string>) => {
            state.keywords = action.payload;
        },
    },
});

export const keywordsSelector = (state: RootState) => state.search.keywords;

export const {setKeywords} = searchSlice.actions;

export default searchSlice.reducer;