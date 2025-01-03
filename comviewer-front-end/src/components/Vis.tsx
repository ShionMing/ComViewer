import CirclePack from "@/components/CirclePack.tsx";
import PostQuestion from "@/components/PostQuestion";
import PostReading from "@/components/PostReading";
import Slide from "@/components/Slide.tsx";
import {postSelector, setVis, userSelector, visSelector} from "@/redux/slices/route-slice.ts";
import {keywordsSelector} from "@/redux/slices/search-slice.ts";
import {AppDispatch} from "@/redux/store.ts";
import {useUpdateEffect} from "ahooks";
import {useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";

export default function Vis() {
    const keywords = useSelector(keywordsSelector);

    const [detailed, setDetailed] = useState<boolean>(false);
    const userId = useSelector(userSelector);
    const postId = useSelector(postSelector);
    useEffect(() => {
        setDetailed(location.pathname.startsWith(`/${userId}/post/`));
    }, [userId, postId]);

    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const onChange = (index: number) => {
        setCurrentIndex(index);
    };

    const vis = useSelector(visSelector);
    const dispatch = useDispatch<AppDispatch>();
    useUpdateEffect(() => {
        if (!vis) return;
        const visNames = keywords ? ["search", "reading", "question"] : ["reading", "question"];
        const newIndex = visNames.indexOf(vis);
        if (newIndex < 0) return;
        setCurrentIndex(newIndex);
        dispatch(setVis(undefined));
    }, [vis]);

    return (
        <div className="w-full h-full bg-hex-f4f4f5">
            <Slide
                current={currentIndex}
                onChange={onChange}
                items={[
                    keywords && <CirclePack/>,
                    detailed && <PostReading/>,
                    detailed && <PostQuestion/>,
                ]}
            />
        </div>
    );
}