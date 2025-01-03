import {LeftOutlined} from "@ant-design/icons";
import {Button} from "antd";
import {CSSProperties} from "react";
import {useLocation, useNavigate, useParams} from "react-router-dom";

interface IProps {
    style?: CSSProperties;
}

export default function BackButton(props: IProps) {
    const {style} = props;

    const {userId = "undefined"} = useParams();
    const {search} = useLocation();
    const navigate = useNavigate();

    return (
        <Button
            type="link"
            icon={<LeftOutlined/>}
            className="!p-0"
            onClick={() => navigate(`${location.pathname.startsWith("/baseline/") ? "/baseline/" : "/"}${userId}${search}`)}
            style={style}
        >
            Back
        </Button>
    );
}