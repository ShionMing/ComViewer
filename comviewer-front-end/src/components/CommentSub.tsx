import {IComment} from "@/types/post.ts";
import ReactMarkdown from "react-markdown";

interface IProps extends Pick<IComment, "text" | "author" | "avatar" | "createTime"> {
}

export default function CommentSub(props: IProps) {
    const {text, author, avatar, createTime} = props;

    return (
        <div className="pl-16 pt-2">
            <div className="flex items-center gap-x-2 mb-12px">
                <div className="mr-8px rounded-full overflow-hidden">
                    <img src={avatar ?? "/avatar/communityIcon_jxbrkfsppv481.png"} width={40} height={40}/>
                </div>
                <p className="text-sm font-medium text-gray-900 unselectable">{author}</p>
                <p className="max-h-40 truncate text-xs text-zinc-500 unselectable">{createTime}</p>
            </div>
            <ReactMarkdown>{text}</ReactMarkdown>
        </div>
    );
}