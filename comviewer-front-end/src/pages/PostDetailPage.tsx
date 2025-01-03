import BackButton from "@/components/BackButton.tsx";
import NavBar from "@/components/NavBar.tsx";
import {postSelector, setPostId, setUserId} from "@/redux/slices/route-slice.ts";
import {setKeywords} from "@/redux/slices/search-slice.ts";
import {AppDispatch} from "@/redux/store.ts";
import {useUpdateEffect} from "ahooks";
import {Skeleton} from "antd";
import qs from "qs";
import {Fragment, lazy, Suspense, useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import {useLocation, useNavigate, useParams} from "react-router-dom";

export default function PostDetailPage() {
    const dispatch = useDispatch<AppDispatch>();

    const {userId = "undefined", postId} = useParams();
    useEffect(() => {
        dispatch(setPostId(postId));
        dispatch(setUserId(userId));
    }, [userId, postId]);

    const {search} = useLocation();
    useEffect(() => {
        const {search: keywords} = qs.parse(search.replace(/^\?/, ""));
        dispatch(setKeywords(keywords as string));
    }, [search]);

    const navigate = useNavigate();
    const focusId = useSelector(postSelector);
    useUpdateEffect(() => {
        if (location.pathname.startsWith("/baseline/")) return;
        focusId && navigate(`/${userId}/post/${focusId}${search}`);
    }, [focusId, userId]);

    const PostDetail = lazy(() => import("@/components/PostDetail"));
    const Loading = () => (
        <div className="h-full overflow-scroll scrollbar-hide">
            <div className="px-10 pt-4">
                <BackButton style={{padding: 0}}/>
            </div>
            <div className="px-10 py-4">
                <Skeleton paragraph={{rows: 8}} active/>
                {Array.from({length: 2}).map((_, index) => (
                    <Fragment key={index}>
                        <hr className="my-8 border-gray-300"/>
                        <Skeleton avatar active/>
                    </Fragment>
                ))}
            </div>
        </div>
    );
    return (
        <div className="w-full h-full flex flex-col">
            <NavBar/>
            <Suspense fallback={<Loading/>}>
                <PostDetail/>
            </Suspense>
        </div>
    );
}