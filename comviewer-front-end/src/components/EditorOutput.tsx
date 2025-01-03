import CustomCodeRenderer from "@/components/CustomCodeRenderer.tsx";
import CustomImageRenderer from "@/components/CustomImageRenderer.tsx";
import Output from "editorjs-react-renderer";

interface IProps {
    content: any;
}

const style = {
    paragraph: {
        fontSize: "0.875rem",
        lineHeight: "1.25rem",
    },
};

export default function EditorOutput(props: IProps) {
    const {content} = props;
    const renderers = {
        image: CustomImageRenderer,
        code: CustomCodeRenderer,
    };
    return (
        <Output
            style={style}
            className="text-sm"
            renderers={renderers}
            data={content}
        />
    );
};
