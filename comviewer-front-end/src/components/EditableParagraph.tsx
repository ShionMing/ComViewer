import {useDepState} from "@/hooks/use-dep-state.ts";
import {IParagraph} from "@/types/reading.ts";
import {useBoolean, useClickAway, useCreation} from "ahooks";
import {Input} from "antd";
import {useRef} from "react";
import ReactMarkdown from "react-markdown";

interface IProps {
    index: number;
    value: IParagraph;
    onChange?: (value: IParagraph, index: number) => void;
}

export default function EditableParagraph(props: IProps) {
    const {index, value, onChange} = props;

    const [{subTitle, content}, setValue] = useDepState(value);

    const markdownText = useCreation(() => subTitle ? `${index + 1}. **${subTitle}**:\n${content}` : content, [index, subTitle, content]);

    const [editing, {setTrue: startEditing, setFalse: endEditing}] = useBoolean(false);
    const editorRef = useRef<HTMLDivElement | null>(null);
    useClickAway(() => {
        onChange && onChange({subTitle, content}, index);
        endEditing();
    }, editorRef);

    return editing ? (
        <div className="editable-paragraph-wrap space-y-8px" ref={editorRef}>
            {subTitle && <Input
                value={subTitle}
                onChange={e => setValue({subTitle: e.target.value, content})}
                autoFocus
            />}
            <Input.TextArea
                value={content}
                onChange={e => setValue({subTitle, content: e.target.value})}
                autoFocus
                autoSize
            />
        </div>
    ) : (
        <div className="editable-paragraph-wrap" onDoubleClick={startEditing}>
            <ReactMarkdown className="editable-paragraph-content">{markdownText}</ReactMarkdown>
        </div>
    );
}