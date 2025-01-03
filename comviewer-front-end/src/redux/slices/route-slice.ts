import {RootState} from "@/redux/store.ts";
import {createSlice, PayloadAction} from "@reduxjs/toolkit";

export interface IRouteState {
    postId?: string;
    userId: string;
    vis?: "search" | "reading" | "question";
    readingColor?: string;
    questionIndex?: number;
}

const initialState: IRouteState = {userId: "undefined"};

export const routeSlice = createSlice({
    name: "route",
    initialState,
    reducers: {
        setPostId: (state, action: PayloadAction<string | undefined>) => {
            state.postId = action.payload;
        },
        setUserId: (state, action: PayloadAction<string>) => {
            state.userId = action.payload;
        },
        setVis: (state, action: PayloadAction<"search" | "reading" | "question" | undefined>) => {
            state.vis = action.payload;
        },
        setReadingColor: (state, action: PayloadAction<string | undefined>) => {
            state.readingColor = action.payload;
        },
        setQuestionIndex: (state, action: PayloadAction<number | undefined>) => {
            state.questionIndex = action.payload;
        },
    },
});

export const postSelector = (state: RootState) => state.route.postId;

export const userSelector = (state: RootState) => state.route.userId;

export const visSelector = (state: RootState) => state.route.vis;
export const readingColorSelector = (state: RootState) => state.route.readingColor;
export const questionIndexSelector = (state: RootState) => state.route.questionIndex;

export const {setPostId, setUserId, setVis, setReadingColor, setQuestionIndex} = routeSlice.actions;

export default routeSlice.reducer;