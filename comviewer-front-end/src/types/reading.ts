import {DomMeta} from "web-highlighter/dist/types";

export interface IHighlight {
    id: string;
    text: string;
    start: DomMeta;
    end: DomMeta;
    postId: string;
    extra?: any;
}

export interface IParagraph {
    subTitle?: string;
    content: string;
}

export interface ISummary {
    title?: string;
    content: IParagraph[];
    loading?: boolean;
}

export interface IMindConclusion {
    id: string;
    text: string;
    parent: string;
    start: number;
    end: number;
}

export interface IMindLink {
    id: string;
    label: string;
    from: string;
    to: string;
    delta1: {
        x: number;
        y: number;
    };
    delta2: {
        x: number;
        y: number;
    };
}

export interface IMind {
    conclusions: IMindConclusion[],
    links: IMindLink[],
}

export interface IReading {
    userId: string;
    color: string;
    highlights: IHighlight[];
    summary?: ISummary;
    mind: IMind;
}