import Post from "@/components/Post";
import {keywordsSelector} from "@/redux/slices/search-slice.ts";
import {IExtendedPost} from "@/types/post.ts";
import {useInfiniteQuery, useQueryClient} from "@tanstack/react-query";
import {useCreation, useInViewport, usePrevious} from "ahooks";
import {Skeleton} from "antd";
import axios from "axios";
import {Loader2} from "lucide-react";
import {Fragment, useEffect, useRef} from "react";
import {useSelector} from "react-redux";

export default function PostFeed() {
    const keywords = useSelector(keywordsSelector);
    const previousKeywords = usePrevious(keywords);
    const queryClient = useQueryClient();
    const {data, fetchNextPage, isFetchingNextPage} = useInfiniteQuery({
        queryKey: [keywords === "" ? previousKeywords : keywords],
        initialPageParam: 1,
        queryFn: async ({pageParam}) => {
            const url = keywords ? "/api/search/posts" : "/api/posts";
            const formData = keywords ? {keywords, page: pageParam} : {page: pageParam};
            const resp = await axios.post<IExtendedPost[]>(url, formData);
            return resp.data;
        },
        getNextPageParam: (_, pages) => pages.length + 1,
    }, queryClient);
    const posts = useCreation(() => data?.pages.flatMap(page => page), [data]);

    const lastPostRef = useRef<HTMLDivElement | null>(null);
    const [lastPostInViewport] = useInViewport(lastPostRef);
    useEffect(() => {
        lastPostInViewport && fetchNextPage();
    }, [lastPostInViewport]);

    return (
        <div className="h-full overflow-scroll scrollbar-hide">
            {posts ? (
                <div className="flex flex-col space-y-6">
                    {posts.map((post, index) => {
                        if (index < posts.length - 1) {
                            return (
                                <Post
                                    key={post.postId}
                                    post={post}
                                    commentAmt={post.commentlist.length}
                                />
                            );
                        } else {
                            return (
                                <div key={post.postId} ref={lastPostRef}>
                                    <Post
                                        post={post}
                                        commentAmt={post.commentlist.length}
                                    />
                                </div>
                            );
                        }
                    })}
                    {isFetchingNextPage && (
                        <div className="flex justify-center pb-4">
                            <Loader2 className="w-6 h-6 text-hex-165DFF animate-spin"/>
                        </div>
                    )}
                </div>
            ) : (
                <div className="px-6 py-4">
                    {Array.from({length: 6}).map((_, index) => (
                        <Fragment key={index}>
                            <Skeleton paragraph={{rows: 2}} active/>
                            <hr className="my-8 border-gray-300"/>
                        </Fragment>
                    ))}
                </div>
            )}
        </div>
    );
}
