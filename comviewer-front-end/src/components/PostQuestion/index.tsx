import Accordion from "@/components/Accordion";
import DashedButton from "@/components/DashedButton";
import EditableContent from "@/components/EditableContent.tsx";
import EditableTitle from "@/components/EditableTitle.tsx";
import Loading from "@/components/Loading.tsx";
import {addQuestion, selectFlows, setQuestion} from "@/redux/slices/question-slice.ts";
import {questionIndexSelector, setQuestionIndex, userSelector} from "@/redux/slices/route-slice.ts";
import {AppDispatch, RootState} from "@/redux/store.ts";
import {IQuestion, IRelative} from "@/types/question.ts";
import {PlusOutlined} from "@ant-design/icons";
import {Carousel, Empty} from "@arco-design/web-react";
import {useBoolean, useCreation, useUpdateEffect} from "ahooks";
import {Card, Collapse} from "antd";
import classNames from "classnames";
import {createContext, DetailedHTMLProps, HTMLAttributes, useEffect, useRef, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import style from "./index.module.scss";

const context = createContext<{ flowId?: string, userId?: string }>({});

function RelativeQuestions(props: {
    data?: IRelative[],
    parentIds: string[],
    onCreate?: () => void,
    card?: boolean,
}) {
    const {data, parentIds, onCreate: _onCreate, card} = props;

    const [created, {setTrue: startCreating, setFalse: endCreating}] = useBoolean(false);

    const dispatch = useDispatch<AppDispatch>();
    const onSelect = (title: string, flowId?: string, userId?: string) =>
        flowId && userId && dispatch(addQuestion({title, parentIds, flowId, userId}));
    const onCreate = () => {
        startCreating();
        _onCreate && _onCreate();
    };
    const onFinish = (title: string, flowId?: string, userId?: string) => {
        title && flowId && userId && dispatch(addQuestion({title, parentIds, flowId, userId}));
        endCreating();
    };

    const renderRelative = () => {
        const children = (
            <context.Consumer>
                {({flowId, userId}) => (
                    <>
                        {data?.map(item => item.question).map((question, index) => question && (
                            <DashedButton key={index} onClick={() => onSelect(question, flowId, userId)}>
                                {question}
                            </DashedButton>
                        ))}
                        <DashedButton className="space-x-4px" onClick={onCreate}>
                            <PlusOutlined/>
                            <span>New Question</span>
                        </DashedButton>
                    </>
                )}
            </context.Consumer>
        );
        return card ? <Card>{children}</Card> : children;
    };

    if (created) {
        return (
            <context.Consumer>
                {({flowId, userId}) => (
                    <div className={style.relativeQuestions}>
                        <NewQuestionCard onFinish={value => onFinish(value, flowId, userId)}/>
                    </div>
                )}
            </context.Consumer>
        );
    } else {
        return renderRelative();
    }
}

function QuestionCard(props: {
    id: string,
    question: string,
    answer?: string,
    parentIds: string[],
    current?: boolean;
} & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
    const {id, question, answer, parentIds, current = true, className, ...otherProps} = props;


    const [collapsed, {set: setCollapsed, setTrue: collapse}] = useBoolean(true);
    const onCollapsedChange = (value: boolean) => {
        setCollapsed(value);
    };
    useEffect(() => {
        current || collapse();
    }, [current]);

    const dispatch = useDispatch<AppDispatch>();
    const onQuestionChange = (title: string, flowId?: string, userId?: string) => {
        flowId && userId && dispatch(setQuestion({title, questionId: id, parentIds, flowId, userId}));
    };
    const onAnswerChange = (answer: string, flowId?: string, userId?: string) => {
        flowId && userId && dispatch(setQuestion({answer, questionId: id, parentIds, flowId, userId}));
    };

    const renderAnswer = (flowId?: string, userId?: string) => {
        if (question && answer) {
            return (
                <Accordion height={64} collapsed={collapsed} onChange={onCollapsedChange}>
                    <EditableContent
                        value={answer}
                        onChange={value => onAnswerChange(value, flowId, userId)}
                    />
                </Accordion>
            );
        } else if (question) {
            return (
                <Loading/>
            );
        }
    };
    return (
        <context.Consumer>
            {({flowId, userId}) => (
                <div className={classNames(style.questionCard, className)} {...otherProps}>
                    <Card title={
                        <EditableTitle
                            placeholder="Input your question here"
                            value={question}
                            onChange={value => onQuestionChange(value, flowId, userId)}
                        />}
                    >
                        {renderAnswer(flowId, userId)}
                    </Card>
                </div>
            )}
        </context.Consumer>
    );
}

function NewQuestionCard(props: {
    onFinish?: (value: string) => void,
} & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
    const {onFinish, className, ...otherProps} = props;

    const onChange = (value: string) => {
        onFinish && onFinish(value);
    };

    return (
        <div className={classNames(style.questionCard, className)} {...otherProps}>
            <Card title={<EditableTitle placeholder="Input your question here" onChange={onChange} editing/>}>
                <EditableContent disabled/>
            </Card>
        </div>
    );
}

function QuestionCards(props: { data?: IQuestion[], relative?: IRelative[], parentIds?: string[] }) {
    const {data, relative, parentIds = []} = props;

    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const onIndexChange = (value: number) => {
        setCurrentIndex(value);
    };

    const currentData = useCreation(() => {
        if (!data) return;
        if (currentIndex >= data.length) return;
        return data[currentIndex];
    }, [data, currentIndex]);
    const childrenParentIds = useCreation(() => {
        if (!data) return [];
        if (currentIndex >= data.length) return parentIds;
        return [...parentIds, data[currentIndex].id];
    }, [data, currentIndex, parentIds]);

    const renderQuestions = () => {
        if (!data) return;
        return (
            <div className={classNames(style.questionCards, {
                [style.first]: currentIndex === 0,
                [style.last]: currentIndex === data.length,
            })}>
                <Carousel
                    animation="card"
                    indicatorPosition="outer"
                    showArrow="never"
                    onChange={onIndexChange}
                    miniRender
                    style={{width: "100%"}}
                >
                    {data.map((question, index) => (
                        <QuestionCard
                            key={question.id}
                            id={question.id}
                            question={question.title}
                            answer={question.answer}
                            parentIds={parentIds}
                            current={index === currentIndex}
                        />
                    ))}
                    {relative && (
                        <div className={style.relativeCard}>
                            <RelativeQuestions data={relative} parentIds={parentIds} card/>
                        </div>
                    )}
                </Carousel>
            </div>
        );
    };
    const renderRelative = () => {
        if (data && currentIndex >= data.length) return;
        return (
            <RelativeQuestions data={parentIds.length > 0 ? currentData?.relative : relative}
                               parentIds={childrenParentIds}/>
        );
    };
    const renderChildren = () => {
        if (currentData?.children && currentData.children.length > 0) {
            return (
                <QuestionCards data={currentData.children} relative={currentData.relative}
                               parentIds={childrenParentIds}/>
            );
        } else {
            return renderRelative();
        }
    };
    return (
        <>
            {renderQuestions()}
            {renderChildren()}
        </>
    );
}

export default function PostQuestion() {
    const userId = useSelector(userSelector);

    const flows = useSelector((state: RootState) => selectFlows(state, userId));

    const items = useCreation(() => flows?.map((flow, index) => ({
        key: index.toString(),
        label: flow.text,
        children: (
            <context.Provider value={{flowId: flow.id, userId}}>
                <div className="flex flex-col items-center space-y-16px">
                    <QuestionCards data={flow.questions} relative={flow.relative}/>
                </div>
            </context.Provider>
        ),
    })), [flows]);

    const [activeKeys, setActiveKeys] = useState<string[]>([]);
    const onChange = (value: string | string[]) => {
        setActiveKeys(Array.isArray(value) ? value : [value]);
    };

    const questionIndex = useSelector(questionIndexSelector);
    const dispatch = useDispatch<AppDispatch>();
    const wrapRef = useRef<HTMLDivElement | null>(null);
    useUpdateEffect(() => {
        if (questionIndex === undefined) return;
        setActiveKeys([questionIndex.toString()]);
        dispatch(setQuestionIndex(undefined));
        if (!wrapRef.current) return;
        wrapRef.current.scrollTo({top: wrapRef.current.scrollHeight, behavior: "smooth"});
    }, [questionIndex]);

    return items && items.length > 0 ? (
        <div className={style.questionCollapse} ref={wrapRef} onWheel={event => event.stopPropagation()}>
            <Collapse items={items} activeKey={activeKeys} onChange={onChange}/>
        </div>
    ) : (
        <Empty imgSrc="/icon/empty_list.png" description="Try to ask what you have questions about."/>
    );
}