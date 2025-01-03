export interface IRelative {
    question: string;
}

export interface IQuestion {
    id: string;
    title: string; // 问题
    answer?: string;
    children?: IQuestion[];
    relative?: IRelative[];
}

export interface IFlow {
    id: string;
    text: string;
    questions?: IQuestion[];
    relative?: IRelative[];
}