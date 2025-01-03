import Loading from "@/components/Loading.tsx";
import {setNavigation} from "@/redux/slices/reading-slice.ts";
import {postSelector, setPostId} from "@/redux/slices/route-slice.ts";
import {keywordsSelector} from "@/redux/slices/search-slice.ts";
import {AppDispatch} from "@/redux/store.ts";
import {useAsyncEffect, useCreation, useReactive, useResetState, useUpdateEffect} from "ahooks";
import axios from "axios";
import * as d3 from "d3";
import {chunk} from "lodash-es";
import {useRef, useState} from "react";
import {useDispatch, useSelector} from "react-redux";

interface IHighlightCircle {
    name: string;
    postList: string[];
    postid: string;
}

interface ICircle {
    name: string;
    children: ICircle[];
    size?: number;
    IS?: number;
    ES?: number;
    id: string;
    // group: number;
    fill?: string | null;
    stroke?: string | null;
}

interface IData {
    circles: ICircle;
    bins: IBin;
}

type Rank = "low" | "medium" | "high";

interface IBinItem {
    rank: Rank;
    value: number;
}

interface IBin {
    IS: IBinItem[];
    ES: IBinItem[];
}

interface ISupport {
    IS: Record<Rank, boolean>;
    ES: Record<Rank, boolean>;
}

export default function CirclePack() {
    const keywords = useSelector(keywordsSelector);

    const circleRef = useRef<SVGSVGElement | null>(null);
    const binESRef = useRef<SVGSVGElement | null>(null);
    const binISRef = useRef<SVGSVGElement | null>(null);

    const circleState = useReactive<{
        data?: ICircle,
        focus?: d3.HierarchyCircularNode<ICircle>,
        hover?: d3.HierarchyCircularNode<ICircle>,
    }>({});
    const [binData, setBinData] = useState<IBin | undefined>();
    const initialBinData = useRef<IBin | undefined>();
    const [loading, setLoading] = useState(true);
    useAsyncEffect(async () => {
        if (keywords) {
            setLoading(true);
            const resp = await axios.post<IData>("/api/search/circle", {keywords});
            circleState.data = resp.data.circles;
            setBinData(resp.data.bins);
            initialBinData.current = resp.data.bins;
            setLoading(false);
        }
    }, [keywords]);

    const [support, setSupport, resetSupport] = useResetState<ISupport>({
        IS: {high: false, medium: false, low: false},
        ES: {high: false, medium: false, low: false},
    });

    const circleWidth = 900;
    const circleHeight = 900;
    const circleSvg = useCreation(() => {
        if (!circleRef.current) return;
        const svg = d3.select(circleRef.current)
            .attr("viewBox", `-${circleWidth / 2} -${circleHeight / 2} ${circleWidth} ${circleHeight}`)
            .attr("width", circleWidth)
            .attr("height", circleWidth)
            .style("max-width", "100%")
            .style("height", "auto")
            .style("background-color", "#F4F4F5");
        svg.selectChildren().remove();
        return svg;
    }, [circleState.data]);

    const color = d3.scaleOrdinal<string>().range(d3.schemeCategory10);
    const colorCircle = (d: d3.HierarchyCircularNode<ICircle>) => {
        if (d.depth == 1) return "white";
        while (d.depth > 2) {
            if (!d.parent) return null;
            d = d.parent;
        }
        const newColor = d3.hsl(color(d.data.name));
        newColor.l += d.depth == 1 ? 0 : d.depth * 0.01;
        return newColor.formatHex();
    };
    const colorStroke = (d: d3.HierarchyCircularNode<ICircle>) => {
        if (d.depth == 1) return null;
        while (d.depth > 2) {
            if (!d.parent) return null;
            d = d.parent;
        }
        const newColor = d3.hsl(color(d.data.name));
        return newColor.formatHex();
    };
    const recoverStroke = (d: d3.HierarchyCircularNode<ICircle>) => {
        const stroke = d.data.stroke;
        if (stroke !== undefined) return stroke;
        const newStroke = colorStroke(d);
        d.data.stroke = newStroke;
        return newStroke;
    };

    useUpdateEffect(() => {
        if (!circleSvg || !circleState.data) return;

        let view = [0, 0, 0] as d3.ZoomView;
        const pack = d3.pack<ICircle>().size([circleHeight, circleWidth]).padding(3);
        const root = pack(d3.hierarchy(circleState.data).sum(d => d.size ?? 0).sort((a, b) => d3.descending(a.value, b.value)));
        circleState.focus = root;

        const node = circleSvg.append("g")
            .classed("node", true)
            .selectAll()
            // .data(root.descendants().slice(1))
            .data(root.descendants())
            .join("g")
            .attr("fill", d => d.depth < 4 ? color(String(d.depth)) : "white")
            // .attr("transform", d => `translate(${d.x - width + 500}, ${d.y - height + 300})`)
            // .attr("pointer-events", d => !d.children ? "none" : null)
            .style("cursor", "pointer");

        const tip = circleSvg.append("g")
            .classed("tooltip", true)
            .style("pointer-events", "none");
        const lines = (keywords?: string) => chunk(String(keywords).split(" "), 5);
        const appendLabel = (d: d3.HierarchyCircularNode<ICircle>) => {
            const k = circleWidth / view[2];
            const x = (d.x - view[0] + d.r * 0.4) * k;
            const y = (d.y - view[1] + d.r * 0.4) * k;
            const label = tip.append("g")
                .classed("label", true)
                .classed("topic", d.depth === 2)
                .classed("post", d.depth === 3)
                .classed(!circleState.focus || circleState.focus.depth < 2 ? "depth1" : "depth2", true)
                .attr("transform", `translate(${x}, ${y})`);
            label.append("text")
                .selectAll()
                .data(lines(d.data.name))
                .join("tspan")
                .text(d => d.join(" "))
                .attr("x", 0)
                .attr("y", (_, index) => `${index * 1.2}em`)
                .attr("font-size", 18)
                .attr("dominant-baseline", "hanging")
                .style("color", "black");
            return label;
        };
        let labelTimer: NodeJS.Timeout | undefined;

        const circle = node.append("circle")
            .attr("r", d => d.r)
            .attr("fill", d => {
                const fill = d.depth < 4 ? colorCircle(d) : "white";
                d.data.fill = fill;
                return fill;
            })
            .attr("fill-opacity", 0.5)
            .attr("stroke", d => {
                const stroke = colorStroke(d);
                d.data.stroke = stroke;
                return stroke;
            })
            .classed("topic", d => d.depth === 2)
            .classed("post", d => d.depth === 3)
            .classed("comment", d => d.depth === 4)
            .attr("display", d => d.depth === 4 ? "none" : null)
            .classed("support", true)
            .classed("ES-low", d => d.data.ES === 1)
            .classed("ES-medium", d => d.data.ES === 2)
            .classed("ES-high", d => d.data.ES === 3)
            .classed("IS-low", d => d.data.IS === 1)
            .classed("IS-medium", d => d.data.IS === 2)
            .classed("IS-high", d => d.data.IS === 3)
            .on("mouseover", function (this, event, d) {
                if (d.depth > 1) {
                    if (d.depth === 3) {
                        circleState.hover = d; // 获取鼠标悬浮部分的 node 中的数据
                    }
                    d3.select(this).attr("stroke", "white");
                    if (!circleState.focus || circleState.focus.depth < 3 || d.depth < 3) {
                        if (d.depth !== 2) {
                            clearTimeout(labelTimer);
                            tip.selectAll(`.topic.depth${!circleState.focus || circleState.focus.depth < 2 ? 1 : 2}`).style("display", "none");
                            appendLabel(d);
                        }
                    }
                }
                event.stopPropagation();
            })
            .on("mouseout", function (this, event, d) {
                circleState.hover = undefined;
                this.classList.contains("focus") || d3.select(this).attr("stroke", () => recoverStroke(d));
                clearTimeout(labelTimer);
                labelTimer = setTimeout(() => {
                    tip.selectAll(`.topic.depth${!circleState.focus || circleState.focus.depth < 2 ? 1 : 2}`).style("display", null);
                }, 1000);
                tip.selectAll(".post").remove();
                event.stopPropagation();
            })
            .on("click", function (this, event, d) {
                if (d.depth === 1) {
                    zoom(root);
                } else if (circleState.focus !== d) {
                    zoom(d);
                }
                event.stopPropagation();
            });

        const zoomTo = (v: d3.ZoomView) => {
            const k = circleWidth / v[2];
            node.attr("transform", d => `translate(${(d.x - v[0]) * k}, ${(d.y - v[1]) * k})`);
            circle.attr("r", d => d.r * k);
            view = v;
        };
        const zoom = (d: d3.HierarchyCircularNode<ICircle>) => {
            if (d === circleState.focus) return;

            d3.transition()
                .duration(750)
                .tween("zoom", () => {
                    const i = d3.interpolateZoom(view, [circleState.focus?.x ?? 0, circleState.focus?.y ?? 0, (circleState.focus?.r ?? 0) * 2] as d3.ZoomView);
                    return t => zoomTo(i(t));
                });

            if (d.depth !== 2) tip.selectAll(".topic.depth2").remove();
            if (d.depth < 2) {
                setTimeout(() => {
                    tip.selectAll(".topic.depth1").style("display", null);
                }, 1000);
            } else if (d.depth === 2) {
                tip.selectAll(".topic.depth1").style("display", "none");
                setTimeout(() => {
                    appendLabel(d);
                }, 1000);
            }
            if (d.depth === 3 || circleState.focus && circleState.focus.depth === 3) resetSupport(); // 进入或退出 comment 层级重置 support
            circleState.focus = d;
        };
        zoomTo([circleState.focus.x, circleState.focus.y, circleState.focus.r * 2]);

        node.selectAll<SVGCircleElement, d3.HierarchyCircularNode<ICircle>>(".topic")
            .call(topics => {
                topics.each(d => {
                    appendLabel(d);
                });
            });
    }, [circleState.data]);

    const dispatch = useDispatch<AppDispatch>();
    useUpdateEffect(() => {
        console.log("focus", circleState.focus);
        if (!circleState.focus) return;

        if (circleState.focus.depth === 3) {
            dispatch(setPostId(circleState.focus.data.id));
        } else if (circleState.focus.depth > 3) {
            let d: d3.HierarchyCircularNode<ICircle> = circleState.focus;
            while (d.depth > 3) {
                if (!d.parent) break;
                d = d.parent;
            }
            if (circleState.focus.depth === 4) {
                dispatch(setNavigation({commentId: circleState.focus.data.id, postId: d.data.id}));
            } else {
                dispatch(setPostId(d.data.id));
            }
        }

        circleSvg?.selectAll(".comment").attr("display", () => circleState.focus && circleState.focus.depth < 3 ? "none" : null);

        const ranks: Rank[] = ["low", "medium", "high"];
        const ES = [0, 0, 0];
        const IS = [0, 0, 0];
        // 当 focus 变化，对应柱状图中的长度发生变化
        // 获取当前 focus 下的 IS ES 统计结果, 不考虑是否为 null, 在设置按钮效果上保持一致
        if (!circleState.focus.children) return;
        if (!circleState.focus.children[0].data.ES) {
            setBinData(initialBinData.current);
            return;
        }
        circleState.focus.children?.forEach((item) => {
            if (item.data.ES) ES[item.data.ES - 1] += 1;
            if (item.data.IS) IS[item.data.IS - 1] += 1;
        });
        setBinData({
            ES: ranks.map((rank, index) => ({rank, value: ES[index]})),
            IS: ranks.map((rank, index) => ({rank, value: IS[index]})),
        });
    }, [circleState.focus]);

    useUpdateEffect(() => {
        if (!binData) return;

        const renderBin = (elem: SVGElement | null, data: IBinItem[], type: "ES" | "IS") => {
            if (!elem) return;

            const barHeight = 40;
            const strokeWidth = 4;
            const paddingX = 100;
            const paddingY = 16;
            const width = 600;
            const height = barHeight * data.length + barHeight / 4 * (data.length + 1) + paddingY * 2;

            const svg = d3.select(elem)
                .attr("width", width)
                .attr("height", height)
                .attr("viewBox", [0, 0, width, height])
                .style("max-width", "100%")
                .style("height", "auto")
                .style("margin", "0 auto");
            svg.selectChildren().remove();

            const xScale = d3.scaleLinear()
                .range([paddingX, width - paddingX])
                .domain([0, d3.max(data, d => (d.value)) as number]);
            const yScale = d3.scaleBand()
                .domain(["high", "medium", "low"])
                .rangeRound([paddingY, height - paddingY])
                .padding(0.2);

            const fill = () => {
                return type === "ES" ? "#ffc069" : "#69b1ff";
            };
            const stroke = (d: IBinItem) => {
                if (support[type][d.rank]) {
                    return type === "ES" ? "#fa8c16" : "#1677ff";
                } else {
                    return type === "ES" ? "#ffc069" : "#69b1ff";
                }
            };

            const chart = svg.append("g")
                .attr("transform", `translate(10, 0)`);
            chart.append("g")
                .selectAll()
                .data(data)
                .join("rect")
                .attr("x", xScale(0))
                .attr("y", d => yScale(d.rank) ?? 0)
                .attr("width", d => xScale(d.value) - xScale(0))
                .attr("height", barHeight - strokeWidth * 2)
                .attr("fill", fill)
                .attr("stroke", stroke)
                .attr("stroke-width", strokeWidth);
            chart.append("g")
                .selectAll()
                .data(data)
                .join("text")
                .attr("font-size", 24)
                .attr("fill", "black")
                .attr("text-anchor", "start")
                .attr("dominant-baseline", "middle")
                .text(d => d.value)
                .attr("x", d => xScale(d.value) + 20)
                .attr("y", d => yScale(d.rank) ?? 0)
                .attr("dy", barHeight / 2);
            chart.append("g")
                .attr("transform", `translate(${paddingX}, 0)`)
                .style("font-size", 24)
                .call(d3.axisLeft(yScale).tickSizeInner(8).tickSizeOuter(0));

            chart.selectAll<SVGRectElement, IBinItem>("rect")
                .style("cursor", "pointer")
                .on("click", function (this, _, d) {
                    setSupport(prevSupport => {
                        return {
                            ...prevSupport,
                            [type]: {
                                ...prevSupport[type],
                                [d.rank]: !prevSupport[type][d.rank],
                            },
                        };
                    });
                });
        };

        renderBin(binESRef.current, binData.ES, "ES");
        renderBin(binISRef.current, binData.IS, "IS");
    }, [binData, support]);

    useUpdateEffect(() => {
        if (!circleSvg) return;
        // support 指定位置为 true 的部分显示，其他部分隐藏
        const filterBy = (type: "ES" | "IS", overlying = false) => {
            const ranks: Rank[] = ["low", "medium", "high"];
            ranks.forEach(rank => {
                circleSvg.selectAll<SVGCircleElement, d3.HierarchyCircularNode<ICircle>>(`.${type}-${rank}`)
                    .style("display", function (this, d) {
                        if (!circleState.focus || circleState.focus.depth < 3) { // post 层级
                            if (d.children) { // post 节点
                                if (support[type][rank]) return overlying ? this.style.display : null;
                            } else { // comment 节点
                                if (ranks.some((r, i) => support[type][r] && d.parent && d.parent.data[type] === i + 1)) return overlying ? this.style.display : null;
                            }
                        } else { // comment 层级
                            if (d.children) { // post 节点
                                return null;
                            } else { // comment 节点
                                if (ranks.some((r, i) => support[type][r] && d.data[type] === i + 1)) return overlying ? this.style.display : null;
                            }
                        }
                        return "none";
                    });
            });
        };
        if (support.ES.low || support.ES.medium || support.ES.high) {
            filterBy("ES");
            if (support.IS.low || support.IS.medium || support.IS.high) {
                filterBy("IS", true);
            }
        } else if (support.IS.low || support.IS.medium || support.IS.high) {
            filterBy("IS");
        } else {
            circleSvg.selectAll<SVGCircleElement, d3.HierarchyCircularNode<ICircle>>(".support")
                .style("display", null);
        }
    }, [support, circleState.focus?.depth]);

    const setHighlight = (highlight: IHighlightCircle) => {
        if (!circleSvg) return;
        circleSvg.selectAll<SVGCircleElement, d3.HierarchyCircularNode<ICircle>>(".node .post")
            .filter(d => !!(d.parent && d.parent.data.name === highlight.name
                && d.data.id !== highlight.postid && highlight.postList.includes(d.data.id)))
            .attr("stroke", "black")
            .classed("similar", true);
    };
    const resetHighlight = (classNames: string[]) => {
        if (!circleSvg) return;
        for (const className of classNames) {
            circleSvg.selectAll<SVGCircleElement, d3.HierarchyCircularNode<ICircle>>("." + className)
                .attr("stroke", recoverStroke)
                .attr("stroke-width", null)
                .classed(className, false);
        }
    };

    const focusHighlight = useRef<IHighlightCircle>();
    const fetchHighlight = async (postid: string, name: string, postlist: string[]) => {
        const {data} = await axios.post<IHighlightCircle>("/api/similarity/post", {postid, name, postlist});
        return {...data, postid};
    };
    // const {run: updateHoverHighlight} = useDebounceFn(async (postid: string, name: string, postlist: string[]) => {
    //     const highlight = await fetchHighlight(postid, name, postlist);
    //     setHighlight(highlight);
    // }, {wait: 1000});
    // useUpdateEffect(() => {
    //     if (!circleSvg) return;
    //     resetHighlight(["similar"]);
    //     if (circleState.hover) {
    //         const postid = circleState.hover.data.id;
    //         const parent = circleState.hover.parent;
    //         if (!parent) return;
    //         const name = parent.data.name;
    //         if (!parent.children) return;
    //         const postlist = parent.children.map(d => d.data.id);
    //         updateHoverHighlight(postid, name, postlist);
    //     } else if (focusHighlight.current) {
    //         setHighlight(focusHighlight.current);
    //     }
    // }, [circleState.hover]);

    const postid = useSelector(postSelector);
    useUpdateEffect(() => {
        if (!circleSvg) return;
        resetHighlight(["focus", "similar"]);
        focusHighlight.current = undefined;
        if (!postid) return;
        let name: string | undefined = undefined;
        let postlist: string[] | undefined = undefined;
        circleSvg.selectAll<SVGCircleElement, d3.HierarchyCircularNode<ICircle>>(".node .post")
            .filter(d => d.data.id === postid)
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .classed("focus", true)
            .call(circles => {
                circles.each(d => {
                    name = d.parent?.data.name;
                    postlist = d.parent?.children?.map(item => item.data.id);
                });
            });
        if (!name || !postlist) return;
        fetchHighlight(postid, name, postlist)
            .then(highlight => {
                setHighlight(highlight);
                focusHighlight.current = highlight;
            });
    }, [circleState.data, postid]);

    return (
        <Loading loading={loading} size="large">
            <div className="w-full h-full px-16px flex flex-col justify-around">
                <svg ref={circleRef}></svg>
                {binData && (
                    <div className="flex justify-center items-center">
                        <div className="flex flex-col justify-around items-center">
                            <p className="text-center">
                                {`${!circleState.focus || circleState.focus.depth < 3 ? "Seeking" : "Providing"} Emotional Support`}
                            </p>
                            <svg ref={binESRef}></svg>
                        </div>
                        <div className="flex flex-col justify-around items-center">
                            <p className="text-center">
                                {`${!circleState.focus || circleState.focus.depth < 3 ? "Seeking" : "Providing"} Informational Support`}
                            </p>
                            <svg ref={binISRef}></svg>
                        </div>
                    </div>
                )}
            </div>
        </Loading>
    );
}