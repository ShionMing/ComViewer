import BackButton from "@/components/BackButton.tsx";
import Comment from "@/components/Comment.tsx";
import {useGetState} from "@/hooks/use-get-state.ts";
import {useGlobal} from "@/hooks/use-global.ts";
import {useHistory} from "@/hooks/use-history.ts";
import {addFlow} from "@/redux/slices/question-slice.ts";
import {
    addHighlight,
    navigationSelector,
    recolorHighlight,
    removeHighlight,
    selectReadings,
    setNavigation,
} from "@/redux/slices/reading-slice.ts";
import {AppDispatch, RootState} from "@/redux/store.ts";
import {IPost} from "@/types/post.ts";
import RecordUtil from "@/utils/record-util.ts";
import {blue, yellow} from "@ant-design/colors";
import {DeleteOutlined, HighlightOutlined, RobotOutlined} from "@ant-design/icons";
import {useAsyncEffect, useBoolean, useClickAway, useCreation, useScroll, useUpdateEffect} from "ahooks";
import {Button, ColorPicker, Skeleton, Space} from "antd";
import axios from "axios";
import Color from "color";
import {Fragment, ReactNode, useRef, useState} from "react";
import ReactMarkdown from "react-markdown";
import {useDispatch, useSelector} from "react-redux";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import Highlighter from "web-highlighter";
import style from "./index.module.scss";

type ToolBarButtonType =
    "highlight"
    | "question"
    | "recolor"
    | "clear";

export default function PostDetail() {
    const [data, setData] = useState<IPost>();
    const [loading, setLoading] = useState(true);

    const wrapRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);

    const {userId = "undefined", postId} = useParams();
    useAsyncEffect(async () => {
        if (!postId) return;
        setLoading(true);
        const resp = await axios.post<IPost[]>("/api/focus/posts", {postid: [postId]});
        setData(resp.data[0]);
        setLoading(false);
    }, [postId]);

    const selectedRange = useRef<Range>();
    const selectedHighlight = useRef<{ id: string }>();

    const [toolBarPosition, setToolBarPosition] = useState<{ x: number, y: number }>({x: 0, y: 0});
    const [toolBarButtonTypes, setToolBarButtonTypes] = useState<ToolBarButtonType[]>([]);
    const [toolBarVisible, {setTrue: showToolBar, setFalse: _hideToolBar}] = useBoolean(false);
    const hideToolBar = () => {
        _hideToolBar();
        selectedRange.current = undefined;
        selectedHighlight.current = undefined;
    };

    const defaultColor = Color("#ffffaa");
    const [highlightColor, getHighlightColor, setHighlightColor] = useGetState(defaultColor);
    const [colorHistory, {push: pushColorHistory}] = useHistory<Color<string>>([], 10);
    const colorPresets = useCreation(() => [
        {label: "latest", colors: colorHistory.map(c => c.hex())},
        {label: "yellow", colors: yellow},
        {label: "blue", colors: blue},
    ], [colorHistory]);
    const getDomColor = (dom: HTMLElement): Color<string> => {
        return Color(dom.style.getPropertyValue("--highlight-color"));
    };
    const setDomColor = (dom: HTMLElement, color: Color<string> | string) => {
        color = typeof color === "string" ? Color(color) : color;
        dom.style.setProperty("--highlight-color", color.rgb().string());
        dom.style.setProperty("--highlight-color-opacity-0", color.alpha(0).rgb().string());
    };

    const highlighter = useGlobal(() => {
        const _highlighter = new Highlighter({
            exceptSelectors: [".unselectable"],
            verbose: true,
        });
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        _highlighter.hooks.Render.WrapNode.tap((id: string, dom: HTMLElement) => {
            dom.classList.add(style.highlight);
            const color = getHighlightColor();
            setDomColor(dom, color);
            dom.addEventListener("click", () => {
                const dom = _highlighter.getDoms(id)[0];
                const rect = dom.getClientRects()[0];
                setToolBarPosition({x: rect.left, y: rect.top});
                setToolBarButtonTypes(["recolor", "question", "clear"]);
                const color = getDomColor(dom);
                setHighlightColor(color);
                showToolBar();
                selectedHighlight.current = {id};
            });
            return dom;
        });
        return _highlighter;
    }, (_highlighter) => {
        _highlighter.dispose();
    });

    const readings = useSelector((state: RootState) => selectReadings(state, userId));
    useUpdateEffect(() => {
        if (!data) return;
        RecordUtil.entries(readings)
            .forEach(([colorHex, reading]) => {
                reading.highlights.filter(highlight => highlight.postId === postId)
                    .forEach(highlight => {
                        highlighter.fromStore(highlight.start, highlight.end, highlight.text, highlight.id, highlight.extra);
                        const doms = highlighter.getDoms(highlight.id);
                        doms.forEach(dom => {
                            dom.classList.add(style.highlight);
                            setDomColor(dom, colorHex);
                        });
                    });
            });
        return () => {
            highlighter.removeAll();
        };
    }, [data, readings]);

    const dispatch = useDispatch<AppDispatch>();

    const highlight = () => {
        if (!postId || !selectedRange.current) return;
        const text = selectedRange.current.toString();
        const {id, startMeta, endMeta, extra} = highlighter.fromRange(selectedRange.current);
        const color = getHighlightColor();
        dispatch(addHighlight({
            highlight: {id, text, start: startMeta, end: endMeta, extra, postId},
            color: color.hex(),
            userId,
        }));
        pushColorHistory(color);
        window.getSelection()?.removeAllRanges();
        hideToolBar();
    };

    const question = () => {
        if (!selectedRange.current && !selectedHighlight.current) return;
        const text = selectedRange.current ? selectedRange.current.toString() :
            highlighter.getDoms(selectedHighlight.current!.id).map(dom => dom.textContent).join("");
        dispatch(addFlow({text, userId}));
    };

    const recolor = () => {
        if (!selectedHighlight.current) return;
        const {id: highlightId} = selectedHighlight.current;
        const doms = highlighter.getDoms(highlightId);
        const prevColor = getDomColor(doms[0]);
        const newColor = getHighlightColor();
        for (const dom of doms) {
            setDomColor(dom, newColor);
        }
        dispatch(recolorHighlight({highlightId, prevColor: prevColor.hex(), newColor: newColor.hex(), userId}));
        pushColorHistory(newColor);
    };

    const clear = () => {
        if (!selectedHighlight.current) return;
        const {id: highlightId} = selectedHighlight.current;
        highlighter.remove(highlightId);
        const color = getHighlightColor();
        dispatch(removeHighlight({highlightId, color: color.hex(), userId}));
        hideToolBar();
    };

    const select = () => {
        const selection = window.getSelection();
        if (!selection || !selection.toString()) {
            hideToolBar();
            return;
        }
        const range = selection.getRangeAt(0);
        const rect = range.getClientRects()[0];
        setToolBarPosition({x: rect.left, y: rect.top});
        setToolBarButtonTypes(["highlight", "question"]);
        showToolBar();
        selectedRange.current = range;
    };
    const resumeSelection = () => {
        if (!selectedRange.current) return;
        const selection = window.getSelection();
        if (!selection) return;
        selection.removeAllRanges();
        selection.addRange(selectedRange.current);
    };

    const toolBarButtonRenders: Record<ToolBarButtonType, (() => ReactNode)> = {
        highlight: () => <Fragment key="highlight">
            <ColorPicker
                value={highlightColor.hex()}
                presets={colorPresets}
                onChangeComplete={value => {
                    const color = Color(value.toHexString());
                    setHighlightColor(color);
                    resumeSelection();
                }}
                onOpenChange={resumeSelection}
                disabledAlpha
                className="!border-hex-d9d9d9 !hover:bg-hex-f4f4f5 !hover:border-hex-d9d9d9 !shadow-none"
                style={{
                    borderRight: "none",
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                }}
            />
            <Button
                className="!hover:text-hex-1f1f1f !hover:bg-hex-f4f4f5 !hover:border-hex-d9d9d9"
                icon={<HighlightOutlined/>}
                onClick={highlight}
            >
                Highlight
            </Button>
        </Fragment>,
        question: () => <Button
            key="question"
            className="!hover:text-hex-1f1f1f !hover:bg-hex-f4f4f5 !hover:border-hex-d9d9d9"
            icon={<RobotOutlined/>}
            onClick={question}
        >
            Question
        </Button>,
        recolor: () => <Fragment key="recolor">
            <ColorPicker
                value={highlightColor.hex()}
                presets={colorPresets}
                onChangeComplete={value => {
                    const color = Color(value.toHexString());
                    setHighlightColor(color);
                }}
                disabledAlpha
                className="!border-hex-d9d9d9 !hover:bg-hex-f4f4f5 !hover:border-hex-d9d9d9 !shadow-none"
                style={{
                    borderRight: "none",
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                }}
            />
            <Button
                className="!hover:text-hex-1f1f1f !hover:bg-hex-f4f4f5 !hover:border-hex-d9d9d9"
                icon={<HighlightOutlined/>}
                onClick={recolor}
            >
                Recolor
            </Button>
        </Fragment>,
        clear: () => <Button
            key="clear"
            className="!border-hex-d9d9d9 !hover:text-hex-ff4d4f !hover:bg-hex-fff2f0 !hover:border-hex-ff4d4f"
            icon={<DeleteOutlined/>}
            onClick={clear}
            danger
        >
            Clear
        </Button>,
    };

    // FIXME: 失效
    useClickAway(() => {
        hideToolBar();
    }, [wrapRef, document.querySelector(".ant-popover.ant-color-picker")]);

    const scroll = useScroll(wrapRef);
    const prevScroll = useRef<{ left: number, top: number } | undefined>();
    useUpdateEffect(() => {
        const scrollY = scroll?.top ?? 0;
        const prevScrollY = prevScroll.current?.top ?? 0;
        setToolBarPosition(({x, y}) => ({x, y: y + prevScrollY - scrollY}));
        prevScroll.current = scroll;
    }, [scroll]);

    const navigation = useSelector(navigationSelector);
    const {search} = useLocation();
    const navigate = useNavigate();
    useUpdateEffect(() => {
        if (!navigation) return;
        navigate(`/${userId}/post/${navigation.postId}${search}`);
    }, [navigation]);

    const flash = (target: HTMLElement | HTMLElement[]) => {
        target = Array.isArray(target) ? target : [target];
        for (const dom of target) {
            dom.classList.add(style.flash);
            dom.addEventListener("animationend", (event) => {
                dom.classList.remove(style.flash);
                event.stopPropagation();
            }, {once: true});
        }
    };
    const scrollTo = (target: HTMLElement | HTMLElement[]) => new Promise<void>((resolve, reject) => {
        if (!wrapRef.current || !contentRef.current) {
            reject();
            return;
        }
        target = Array.isArray(target) ? target : [target];
        const offsetTop = target[0].offsetTop;
        let totalHeight: number = 0;
        for (const dom of target) {
            let height: number = 0;
            for (const rect of dom.getClientRects()) {
                if (rect.width > 0) height += rect.height;
            }
            totalHeight += height;
        }
        const scrollTop = offsetTop + totalHeight / 2 - wrapRef.current.clientHeight / 2;
        if (wrapRef.current.scrollTop === scrollTop) {
            resolve();
            return;
        }
        if (scrollTop <= 0 && wrapRef.current.scrollTop <= 0) {
            resolve();
            return;
        }
        if (scrollTop + wrapRef.current.clientHeight >= contentRef.current.clientHeight &&
            wrapRef.current.scrollTop + wrapRef.current.clientHeight >= contentRef.current.clientHeight) {
            resolve();
            return;
        }
        wrapRef.current.scrollTo({top: scrollTop, behavior: "smooth"});
        wrapRef.current.addEventListener("scrollend", () => {
            resolve();
        }, {once: true});
    });
    useUpdateEffect(() => {
        if (loading) {
            wrapRef.current?.scrollTo({top: 0});
            return;
        }
        if (!navigation) return;
        const {highlightId, commentId} = navigation;
        if (highlightId) {
            const doms = highlighter.getDoms(highlightId);
            scrollTo(doms).then(() => {
                flash(doms);
            });
        } else if (commentId) {
            const dom = document.getElementById(`comment-${commentId}`);
            if (!dom) return;
            scrollTo(dom).then(() => {
                flash(dom);
            });
        }
        dispatch(setNavigation(undefined));
    }, [navigation, loading]);

    const renderToolBar = () => {
        if (location.pathname.startsWith("/baseline/")) return;
        if (!toolBarVisible) return;
        return (
            <Space.Compact className="absolute bg-hex-ffffff rounded-6px shadow-lg" style={{
                left: toolBarPosition.x,
                top: toolBarPosition.y - 36,
            }}>
                {toolBarButtonTypes.map(type => toolBarButtonRenders[type]())}
            </Space.Compact>
        );
    };
    return (
        <div className="h-full overflow-scroll scrollbar-hide text-base" ref={wrapRef}>
            <div className="relative" ref={contentRef}>
                <div className="px-10 pt-4">
                    <BackButton style={{padding: 0}}/>
                </div>
                {data && !loading ? (
                    <div className="px-10 py-4" onMouseUp={select}>
                        <p className="max-h-40 mt-1 truncate text-xs text-gray-500 unselectable">
                            Posted by {data.author} {data.createTime}
                        </p>
                        <h1 className="text-xl font-bold py-8 leading-6 text-gray-900">{data.title}</h1>
                        <ReactMarkdown>{data.text}</ReactMarkdown>
                        <hr className="my-8 border-gray-300"/>
                        {data.commentlist?.map((comment) => (
                            <Comment
                                key={comment.commentId}
                                commentId={comment.commentId}
                                text={comment.text}
                                author={comment.author}
                                avatar={comment.avatar}
                                createTime={comment.createTime}
                                commentsublist={comment.commentsublist}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="px-10 py-4">
                        <Skeleton paragraph={{rows: 8}} active/>
                        {Array.from({length: 2}).map((_, index) => (
                            <Fragment key={index}>
                                <hr className="my-8 border-gray-300"/>
                                <Skeleton avatar active/>
                            </Fragment>
                        ))}
                    </div>
                )}
            </div>
            {renderToolBar()}
        </div>
    );
}
