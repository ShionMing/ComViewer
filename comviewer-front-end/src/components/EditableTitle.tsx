import {useDepState} from "@/hooks/use-dep-state.ts";
import {useBoolean, useClickAway} from "ahooks";
import {Input} from "antd";
import classNames from "classnames";
import {useEffect, useRef} from "react";

interface IProps {
    value?: string;
    onChange?: (value: string) => void;
    editing?: boolean;
    fontSize?: "base" | "lg" | "xl";
    bold?: boolean;
    placeholder?: string;
}

export default function EditableTitle(props: IProps) {
    const {
        value: _value = "",
        onChange,
        editing: _editing = false,
        fontSize = "base",
        bold,
        placeholder,
    } = props;

    const [value, setValue] = useDepState(_value);

    const [editing, {setTrue: startEditing, setFalse: endEditing, set: setEditing}] = useBoolean(false);
    useEffect(() => {
        setEditing(_editing);
    }, [_editing]);
    const onFinish = () => {
        onChange && onChange(value);
        endEditing();
    };

    const editorRef = useRef<HTMLDivElement | null>(null);
    useClickAway(() => {
        onFinish();
    }, editorRef);

    return editing ? (
        <div className="editable-title-wrap" ref={editorRef}>
            <Input
                value={value}
                placeholder={placeholder}
                onChange={e => setValue(e.target.value)}
                onPressEnter={onFinish}
                autoFocus
            />
        </div>
    ) : (
        <div className="editable-title-wrap" onDoubleClick={startEditing}>
            <h1 className={classNames("editable-title-content", `text-${fontSize}`, {"font-bold": bold})}>{value}</h1>
        </div>
    );
}