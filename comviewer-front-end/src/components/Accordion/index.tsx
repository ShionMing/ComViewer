import {useBoolean, useSize} from "ahooks";
import {Button} from "antd";
import classNames from "classnames";
import {ReactNode, useEffect, useRef} from "react";
import style from "./index.module.scss";

interface IProps {
    children: ReactNode;
    height?: number | string;
    collapsed?: boolean;
    onChange?: (collapsed: boolean) => void;
}

export default function Accordion(props: IProps) {
    const {children, height = 0, collapsed: _collapsed = true, onChange} = props;

    const [collapsed, {setTrue: _collapse, setFalse: _expand, set: setCollapsed}] = useBoolean(true);
    useEffect(() => {
        setCollapsed(_collapsed);
    }, [_collapsed]);
    const collapse = () => {
        _collapse();
        onChange && onChange(true);
    };
    const expand = () => {
        _expand();
        onChange && onChange(false);
    };

    const contentRef = useRef<HTMLDivElement | null>(null);
    const contentSize = useSize(contentRef);

    return (
        <div className={classNames("accordion-wrap", style.accordionWrap)}>
            <div className={classNames("accordion-viewport", style.accordionViewport, {[style.collapsed]: collapsed})}
                 style={{height: collapsed ? height : contentSize?.height}}>
                <div className="accordion-content" ref={contentRef}>
                    {children}
                </div>
            </div>
            <Button type="link" onClick={collapsed ? expand : collapse}>{collapsed ? "Show" : "Hide"}</Button>
        </div>
    );
}