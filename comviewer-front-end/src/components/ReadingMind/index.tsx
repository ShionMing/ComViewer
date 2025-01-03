import {useGlobalMounted} from "@/hooks/use-global.ts";
import {ISummary} from "@/types/reading.ts";
import {uid} from "@/utils/uid-util.ts";
import {useUpdateEffect} from "ahooks";
import MindElixir from "mind-elixir";
import {useRef} from "react";
import style from "./index.module.scss";

interface IProps {
    value: ISummary;
}

export default function ReadingMind(props: IProps) {
    const {value: summary} = props;

    const wrapRef = useRef<HTMLDivElement | null>(null);

    const mind = useGlobalMounted(() => {
        if (!wrapRef.current) return;
        const _mind = new MindElixir({
            el: wrapRef.current,
            direction: MindElixir.RIGHT,
            draggable: true,
            keypress: true, // 快捷键
            toolBar: true, // 常驻工具栏
            nodeMenu: false, // 左键点击选中节点出现菜单窗口
            contextMenu: true,  // 右键点击节点出现选项菜单
        });
        _mind.init(MindElixir.new("Topic"));
        return _mind;
    });

    useUpdateEffect(() => {
        if (!mind) return;
        const data = MindElixir.new(summary.title ?? "Topic");
        data.nodeData.children = summary.content.map((p, i) => ({
            id: uid(),
            topic: p.subTitle ?? `Title${i + 1}`,
        }));
        mind.refresh(data);
    }, [mind, summary]);

    return (
        <div ref={wrapRef} className={style.readingMindMapWrap}></div>
    );
}