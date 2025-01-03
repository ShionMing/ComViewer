import {useGetState} from "@/hooks/use-get-state.ts";
import {Carousel} from "@arco-design/web-react";
import {CarouselHandle} from "@arco-design/web-react/lib/Carousel/interface";
import {useCreation, useUpdateEffect} from "ahooks";
import {isValidElement, ReactNode, useRef, WheelEvent} from "react";

interface IProps {
    current?: number;
    onChange?: (index: number) => void;
    items: ReactNode[];
}

export default function Slide(props: IProps) {
    const {current, onChange, items} = props;

    const validItems = useCreation(() => items.filter(item => isValidElement(item)), [items]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, getCurrentIndex, setCurrentIndex] = useGetState<number>(current ?? 0);

    const carouselRef = useRef<CarouselHandle>();
    const onWheel = (event: WheelEvent<HTMLDivElement>) => {
        if (!carouselRef.current) return;
        const prevIndex = getCurrentIndex();
        const newIndex = event.deltaY > 0 ? prevIndex + 1 : prevIndex - 1;
        if (newIndex >= 0 && newIndex < validItems.length) {
            carouselRef.current.goto({
                index: newIndex,
                isNegative: newIndex < prevIndex,
            });
        }
    };

    useUpdateEffect(() => {
        if (current === undefined || !carouselRef.current) return;
        const prevIndex = getCurrentIndex();
        carouselRef.current.goto({
            index: current,
            isNegative: current < prevIndex,
        });
    }, [current]);

    const onIndexChange = (index: number) => {
        setCurrentIndex(index);
        onChange && onChange(index);
    };

    return (
        <div className="w-full h-full" onWheel={onWheel}>
            <Carousel
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                carousel={carouselRef}
                onChange={onIndexChange}
                direction="vertical"
                indicatorType="never"
                showArrow="never"
                style={{width: "100%", height: "100%"}}
            >
                {validItems.map((item, index) => (
                    <div key={index} className="w-full h-full bg-hex-f4f4f5">
                        {item}
                    </div>
                ))}
            </Carousel>
        </div>
    );
}