import EditableParagraph from "@/components/EditableParagraph.tsx";
import EditableTitle from "@/components/EditableTitle.tsx";
import {IParagraph, ISummary} from "@/types/reading.ts";

interface IProps {
    value: ISummary;
    onChange?: (value: ISummary) => void;
}

export default function ReadingSummary(props: IProps) {
    const {value: {title, content}, onChange} = props;

    const onTitleChange = (value: string) => {
        onChange && onChange({title: value, content});
    };
    const onContentChange = (value: IParagraph, index: number) => {
        onChange && onChange({title, content: [...content.slice(0, index), value, ...content.slice(index + 1)]});
    };

    return (
        <>
            <EditableTitle value={title ?? ""} onChange={onTitleChange} fontSize="xl" bold/>
            <div className="pt-16px space-y-12px">
                {content.map((item, index) =>
                    <EditableParagraph key={index} index={index} value={item} onChange={onContentChange}/>)}
            </div>
        </>
    );
}