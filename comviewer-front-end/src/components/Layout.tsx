import Loading from "@/components/Loading.tsx";
import {lazy, ReactNode, Suspense} from "react";

interface IProps {
    children: ReactNode;
}

export default function Layout(props: IProps) {
    const {children} = props;

    const Vis = lazy(() => import("@/components/Vis"));
    return (
        <div className="w-screen h-screen overflow-hidden flex justify-center">
            <div style={{width: "60%", height: "100%"}}>
                {children}
            </div>
            {location.pathname.startsWith("/baseline/") || (
                <div style={{width: "40%", height: "100%"}}>
                    <Suspense fallback={<Loading size="large"/>}>
                        <Vis/>
                    </Suspense>
                </div>
            )}
        </div>
    );
}