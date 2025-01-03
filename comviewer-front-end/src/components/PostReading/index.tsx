import Loading from "@/components/Loading.tsx";
import ReadingHighlight from "@/components/ReadingHighlight";
import ReadingSummary from "@/components/ReadingSummary.tsx";
import {selectReadings, setHighlights, setSummary} from "@/redux/slices/reading-slice.ts";
import {readingColorSelector, setReadingColor, userSelector} from "@/redux/slices/route-slice.ts";
import {AppDispatch, RootState} from "@/redux/store.ts";
import {IHighlight, IReading, ISummary} from "@/types/reading.ts";
import RecordUtil from "@/utils/record-util.ts";
import {Empty} from "@arco-design/web-react";
import {useCreation, useUpdateEffect} from "ahooks";
import {Segmented, Skeleton, Tabs, Tag} from "antd";
import {lazy, ReactNode, Suspense, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import style from "./index.module.scss";

type Option = "Highlight" | "Summary" | "Mind Map";

export default function PostReading() {
    const userId = useSelector(userSelector);

    const readings = useSelector((state: RootState) => selectReadings(state, userId));
    const dispatch = useDispatch<AppDispatch>();
    const onHighlightChange = (highlights: IHighlight[], color: string) => {
        dispatch(setHighlights({userId, color, highlights}));
    };
    const onSummaryChange = (summary: ISummary, color: string) => {
        dispatch(setSummary({userId, color, summary}));
    };

    const [option, setOption] = useState<Option>("Highlight");
    const ReadingMind = lazy(() => import("@/components/ReadingMind"));
    const optionRenders: Record<Option, (reading: IReading) => ReactNode> = {
        Highlight: ({highlights, color}) =>
            <ReadingHighlight value={highlights} onChange={value => onHighlightChange(value, color)}/>,
        Summary: ({summary, color}) => summary ? (
            <Loading loading={summary.loading} size="large" style={{overflow: "hidden"}}>
                <ReadingSummary value={summary} onChange={value => onSummaryChange(value, color)}/>
            </Loading>
        ) : (
            <Skeleton paragraph={{rows: 8}} active/>
        ),
        "Mind Map": ({summary}) => summary && !summary.loading ? (
            <Suspense fallback={<Loading size="large"/>}>
                <ReadingMind value={summary}/>
            </Suspense>
        ) : (
            <Loading size="large"/>
        ),
    };

    const tabPanelRender = (reading: IReading) => {
        const colorVar: string = "--reading-highlight-color";
        return (
            <div className="h-full flex flex-col items-center space-y-16px" style={{[colorVar]: reading.color}}>
                <Segmented<Option>
                    options={["Highlight", "Summary", "Mind Map"]}
                    value={option}
                    onChange={setOption}
                />
                <div className={style.readingTabsContent} onWheel={event => event.stopPropagation()}>
                    {optionRenders[option](reading)}
                </div>
            </div>
        );
    };

    const tabs = useCreation<{
        key: string,
        label: ReactNode,
        children: ReactNode
    }[]>(() => readings ? RecordUtil.values(readings)
        .filter(reading => reading.highlights.length > 0)
        .map(reading => ({
            key: reading.color,
            label: <Tag color={reading.color} bordered={false}>{reading.summary?.title ?? "Title"}</Tag>,
            children: tabPanelRender(reading),
        })) : [], [readings, option]);

    const [activeKey, setActiveKey] = useState<string>();
    const onTabChange = (value: string) => {
        setActiveKey(value);
    };

    const readingColor = useSelector(readingColorSelector);
    useUpdateEffect(() => {
        if (!readingColor) return;
        setActiveKey(readingColor);
        dispatch(setReadingColor(undefined));
    }, [readingColor]);

    return tabs.length > 0 ? (
        <div className={style.readingTabs}>
            <Tabs
                type="card"
                items={tabs}
                activeKey={activeKey}
                onChange={onTabChange}
                popupClassName={style.readingTabsPopup}
                hideAdd
            />
        </div>
    ) : (
        <Empty imgSrc="/icon/empty_list.png" description="Try to mark what you think helps."/>
    );
}
