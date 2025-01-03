import {useDepState} from "@/hooks/use-dep-state.ts";
import {useBoolean, useClickAway} from "ahooks";
import {Input} from "antd";
import {useEffect, useRef} from "react";
import ReactMarkdown from "react-markdown";

interface IProps {
    value?: string;
    onChange?: (value: string) => void;
    editing?: boolean;
    disabled?: boolean;
}

export default function EditableContent(props: IProps) {
    const {value: _value = "", onChange, editing: _editing = false, disabled = false} = props;

    const [value, setValue] = useDepState(_value);

    const [editing, {setTrue: startEditing, setFalse: endEditing, set: setEditing}] = useBoolean(false);
    useEffect(() => {
        disabled || setEditing(_editing);
    }, [_editing]);
    const onDoubleClick = () => {
        disabled || startEditing();
    };

    const editorRef = useRef<HTMLDivElement | null>(null);
    useClickAway(() => {
        onChange && onChange(value);
        endEditing();
    }, editorRef);

    return editing ? (
        <div className="editable-content-wrap space-y-8px" ref={editorRef}>
            <Input.TextArea
                value={value}
                onChange={e => setValue(e.target.value)}
                autoFocus
                autoSize
            />
        </div>
    ) : (
        <div className="editable-content-wrap" onDoubleClick={onDoubleClick}>
            <ReactMarkdown className="editable-content-content">{value}</ReactMarkdown>
        </div>
    );
}