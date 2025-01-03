import CommentSub from "@/components/CommentSub.tsx";
import {IComment} from "@/types/post";
import ReactMarkdown from "react-markdown";

interface IProps extends Pick<IComment, "commentId" | "text" | "author" | "avatar" | "createTime" | "commentsublist"> {
}

export default function Comment(props: IProps) {
    const {commentId, text, author, avatar, createTime, commentsublist} = props;

    return (
        <>
            <div className="comment p-4" id={`comment-${commentId}`}>
                <div className="flex items-center gap-x-2 mb-12px">
                    <div className="mr-8px rounded-full overflow-hidden">
                        <img src={avatar ?? "/avatar/communityIcon_jxbrkfsppv481.png"} width={40} height={40}/>
                    </div>
                    <p className="text-sm font-medium text-gray-900 unselectable">{author}</p>
                    <p className="max-h-40 truncate text-xs text-zinc-500 unselectable">{createTime}</p>
                </div>
                <ReactMarkdown>{text}</ReactMarkdown>
            </div>
            {commentsublist.map(comment => (
                <CommentSub
                    key={comment.commentId}
                    text={comment.text}
                    author={comment.author}
                    avatar={comment.avatar}
                    createTime={comment.createTime}
                />
            ))}
            <hr className="my-8 border-gray-300"/>
        </>
    );
}