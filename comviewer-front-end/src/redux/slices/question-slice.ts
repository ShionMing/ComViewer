import {setQuestionIndex, setVis} from "@/redux/slices/route-slice.ts";
import {RootState} from "@/redux/store.ts";
import {IFlow, IQuestion, IRelative} from "@/types/question.ts";
import ObjectUtil from "@/utils/object-util.ts";
import RecordUtil from "@/utils/record-util.ts";
import {uid} from "@/utils/uid-util.ts";
import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import axios from "axios";

export type QuestionState = Record<string, IFlow[]>;

const initialState: QuestionState = {};

function findByIds(flow: IFlow, ids: string[]) {
    let target: IQuestion | undefined;
    let questions = flow.questions;
    for (const id of ids) {
        if (!questions) return;
        target = questions.find(q => q.id === id);
        if (!target) return;
        questions = target.children;
    }
    return target;
}

function findQuestion(flow: IFlow, questionId: string, parentIds?: string[]) {
    let target: IQuestion | undefined;
    if (parentIds && parentIds.length > 0) {
        target = findByIds(flow, [...parentIds, questionId]);
    } else {
        target = flow.questions?.find(q => q.id === questionId);
    }
    return target;
}

export const addFlow = createAsyncThunk<void, {
    text: string,
    userId: string,
}, {
    state: RootState
}>(
    "question/addFlow",
    async (payload, {getState, dispatch}) => {
        const {text, userId} = payload;
        const id = uid();
        const flow: IFlow = {id, text};
        dispatch(_addFlow({flow, userId}));
        dispatch(setVis("question"));
        const flows = RecordUtil.get(getState().question, userId);
        flows && dispatch(setQuestionIndex(flows.length - 1));
        const {data: relative} = await axios.post<{ question: string }[]>("/api/reading/question", {text});
        dispatch(_setRelative({relative, flowId: id, userId}));
    },
);

export const addQuestion = createAsyncThunk<void, {
    title: string,
    parentIds: string[],
    flowId: string,
    userId: string,
}, {
    state: RootState
}>(
    "question/addQuestion",
    async (payload, {dispatch}) => {
        const {title, parentIds, flowId, userId} = payload;
        const questionId = uid();
        dispatch(_addQuestion({question: {id: questionId, title}, parentIds, flowId, userId}));
        const {data: {answer}} = await axios.post<{ answer: string }>("/api/reading/answer", {question: title});
        dispatch(_setQuestion({answer, questionId, parentIds, flowId, userId}));
        const {data: relative} = await axios.post<{ question: string }[]>("/api/reading/question", {text: answer});
        dispatch(_setRelative({relative, questionId, parentIds, flowId, userId}));
    },
);

export const setQuestion = createAsyncThunk<void, {
    title?: string,
    answer?: string,
    questionId: string,
    parentIds: string[],
    flowId: string,
    userId: string,
}, {
    state: RootState
}>(
    "question/setQuestion",
    async (payload, {dispatch}) => {
        const {title, answer: _answer, questionId, parentIds, flowId, userId} = payload;
        let answer: string | undefined;
        if (_answer) {
            answer = _answer;
        } else if (title) {
            dispatch(_setQuestion({title, questionId, parentIds, flowId, userId}));
            const resp = await axios.post<{ answer: string }>("/api/reading/answer", {question: title});
            answer = resp.data.answer;
        }
        if (!answer) return;
        dispatch(_setQuestion({answer, questionId, parentIds, flowId, userId}));
        const {data: relative} = await axios.post<{ question: string }[]>("/api/reading/question", {text: answer});
        dispatch(_setRelative({relative, questionId, parentIds, flowId, userId}));
    },
);

export const questionSlice = createSlice({
    name: "question",
    initialState,
    reducers: {
        _addFlow(state, action: PayloadAction<{ flow: IFlow, userId: string }>) {
            const {flow, userId} = action.payload;
            RecordUtil.setIfAbsent(state, userId, []).push(flow);
        },
        _addQuestion(state, action: PayloadAction<{
            question: IQuestion,
            parentIds: string[],
            flowId: string,
            userId: string
        }>) {
            const {question, parentIds, flowId, userId} = action.payload;
            const flow = RecordUtil.get(state, userId)?.find(f => f.id === flowId);
            if (!flow) return;
            if (parentIds.length > 0) {
                const parent = findByIds(flow, parentIds);
                parent && ObjectUtil.setIfAbsent(parent, "children", [] as IQuestion[]).push(question);
            } else {
                ObjectUtil.setIfAbsent(flow, "questions", [] as IQuestion[]).push(question);
            }
        },
        _setRelative(state, action: PayloadAction<{
            relative: IRelative[],
            questionId?: string,
            parentIds?: string[],
            flowId: string,
            userId: string
        }>) {
            const {relative, questionId, parentIds, flowId, userId} = action.payload;
            const flow = RecordUtil.get(state, userId)?.find(f => f.id === flowId);
            if (!flow) return;
            if (questionId) {
                const target = findQuestion(flow, questionId, parentIds);
                if (!target) return;
                target.relative = relative;
            } else {
                flow.relative = relative;
            }
        },
        _setQuestion(state, action: PayloadAction<{
            title?: string,
            answer?: string,
            questionId: string,
            parentIds: string[],
            flowId: string,
            userId: string,
        }>) {
            const {title, answer, questionId, parentIds, flowId, userId} = action.payload;
            const flow = RecordUtil.get(state, userId)?.find(f => f.id === flowId);
            if (!flow) return;
            const target = findQuestion(flow, questionId, parentIds);
            if (!target) return;
            if (title) {
                target.title = title;
            }
            target.answer = answer;
        },
    },
});

export const selectFlows = (state: RootState, userId: string): IFlow[] | undefined => RecordUtil.get(state.question, userId);

const {_addFlow, _addQuestion, _setRelative, _setQuestion} = questionSlice.actions;

export default questionSlice.reducer;