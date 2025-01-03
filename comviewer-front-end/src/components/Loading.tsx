import {Spin} from "@arco-design/web-react";
import classNames from "classnames";
import {CSSProperties, ReactNode} from "react";

type Size = "small" | "default" | "large";

interface IProps {
    loading?: boolean;
    size?: Size;
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
}

export default function Loading(props: IProps) {
    const {loading, size = "default", className, style, children} = props;

    const size2Number: Record<Size, number> = {
        small: 20,
        default: 30,
        large: 40,
    };

    return (
        <Spin
            loading={loading}
            size={size2Number[size]}
            className={classNames(className, "block w-full h-full flex justify-center items-center")}
            style={style}
        >
            {children}
        </Spin>
    );
}