import classNames from "classnames";
import {DetailedHTMLProps, HTMLAttributes} from "react";
import style from "./index.module.scss";


export default function DashedButton(props: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
    const {className, children, ...otherProps} = props;

    return (
        <div className={classNames("dashed-btn", style.dashedBtn, className)} {...otherProps}>
            {children}
        </div>
    );
}