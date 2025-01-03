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

export default function PostPage() {
    const dispatch = useDispatch<AppDispatch>();

    const {userId = "undefined"} = useParams();
    useEffect(() => {
        dispatch(setPostId(undefined));
        dispatch(setUserId(userId));
    }, [userId]);

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

    const PostFeed = lazy(() => import("@/components/PostFeed"));
    const Loading = () => (
        <div className="h-full overflow-scroll scrollbar-hide px-6 py-4">
            {Array.from({length: 6}).map((_, index) => (
                <Fragment key={index}>
                    <Skeleton paragraph={{rows: 2}} active/>
                    <hr className="my-8 border-gray-300"/>
                </Fragment>
            ))}
        </div>
    );
    return (
        <div className="w-full h-full flex flex-col">
            <NavBar/>
            <Suspense fallback={<Loading/>}>
                <PostFeed/>
            </Suspense>
        </div>
    );
}
