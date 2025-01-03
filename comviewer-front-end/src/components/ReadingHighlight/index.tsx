import EditableParagraph from "@/components/EditableParagraph.tsx";
import {setNavigation} from "@/redux/slices/reading-slice.ts";
import {AppDispatch} from "@/redux/store.ts";
import {IHighlight} from "@/types/reading.ts";
import {AimOutlined} from "@ant-design/icons";
import {Button} from "antd";
import {useDispatch} from "react-redux";
import style from "./index.module.scss";

interface IProps {
    value: IHighlight[];
    onChange?: (value: IHighlight[]) => void;
}

export default function ReadingHighlight(props: IProps) {
    const {value: highlights, onChange} = props;

    const dispatch = useDispatch<AppDispatch>();
    const onNavigate = (highlightId: string, postId: string) => {
        postId && dispatch(setNavigation({highlightId, postId}));
    };

    return (
        <div className="space-y-12px">
            {highlights.map(({text, id, postId}, index) =>
                <div key={index} className={style.readingHighlight}>
                    <EditableParagraph index={index} value={{content: text}} onChange={({content}, index) => {
                        const newHighlight = {...highlights[index], text: content};
                        onChange && onChange([...highlights.slice(0, index), newHighlight, ...highlights.slice(index + 1)]);
                    }}/>
                    <Button type="link" icon={<AimOutlined/>} className="mx-12px"
                            onClick={() => onNavigate(id, postId)}/>
                </div>)}
        </div>
    );
}