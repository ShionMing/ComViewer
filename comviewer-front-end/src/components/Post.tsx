import EditorOutput from "@/components/EditorOutput.tsx";
import {IPost} from "@/types/post";
import {MessageSquare} from "lucide-react";
import {useRef} from "react";
import {useLocation, useNavigate, useParams} from "react-router-dom";

interface IProps {
    post: IPost;
    commentAmt: number;
}

export default function Post(props: IProps) {
    const {post, commentAmt} = props;

    const pRef = useRef<HTMLParagraphElement>(null);

    const {userId} = useParams();
    const {search} = useLocation();
    const navigate = useNavigate();
    const goDetail = (post: IPost) => {
        navigate(`${location.pathname.startsWith("/baseline/") ? "/baseline/" : "/"}${userId}/post/${post.postId}${search}`);
    };

    return (
        <div className="rounded-md bg-white shadow">
            <div className="px-6 py-4 flex justify-between" onClick={() => goDetail(post)} style={{cursor: "pointer"}}>
                <div className="w-0 flex-1">
                    <div className="max-h-40 mt-1 text-xs text-gray-500">
                        Posted by {post.author} {post.createTime}
                    </div>
                    <div>
                        <h1 className="text-lg font-bold py-2 leading-6 text-gray-900">
                            {post.title}
                        </h1>
                        <br/>
                    </div>

                    <div
                        className="relative text-sm max-h-40 w-full overflow-clip"
                        ref={pRef}>
                        <EditorOutput content={post.text}/>
                        {pRef.current?.clientHeight === 160 ? (
                            <div
                                className="absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-white to-transparent">
                                {post.text}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
            <div className="bg-gray-50 z-20 text-sm px-4 py-4 sm:px-6 w-fit flex items-center gap-2">
                <MessageSquare className="h-4 w-4"/> {commentAmt ?? 0} comments
            </div>
        </div>
    );
}
