import {keywordsSelector, setKeywords} from "@/redux/slices/search-slice.ts";
import {useDebounceFn, useUpdateEffect} from "ahooks";
import {AutoComplete, ConfigProvider} from "antd";
import {useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {useNavigate, useParams} from "react-router-dom";

export default function SearchBar() {
    const keywords = useSelector(keywordsSelector);
    const [input, setInput] = useState<string | undefined>(keywords);
    useUpdateEffect(() => {
        setInput(keywords);
    }, [keywords]);

    const {userId} = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {run: searchByKeywords} = useDebounceFn((value: string) => {
        dispatch(setKeywords(value));
        navigate(`${location.pathname.startsWith("/baseline/") ? "/baseline/" : "/"}${userId}?search=${value}`);
    }, {wait: 1000});

    const onSelect = (value: string) => {
        setInput(value);
    };

    const onChange = (value: string) => {
        setInput(value);
        searchByKeywords(value);
    };

    return (
        <>
            <ConfigProvider theme={{
                components: {
                    Input: {
                        // hoverBorderColor: "#4096ff",
                        // activeBorderColor: "#1677ff",
                        // activeShadow: "0 0 0 2px rgba(5, 145, 255, 0.1)",
                    },
                },
            }}>
                <AutoComplete
                    value={input}
                    onSelect={onSelect}
                    onChange={onChange}
                    placeholder="Search ComViewer"
                    size="large"
                    style={{width: "100%"}}
                />
            </ConfigProvider>
        </>
    );
}