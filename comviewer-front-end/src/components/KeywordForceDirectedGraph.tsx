import {useAsyncEffect, useCreation, useLatest, useUpdateEffect} from "ahooks";
import axios from "axios";
import * as d3 from "d3";
import {useRef, useState} from "react";

interface IProps {
    keywords?: string;
}

interface INode extends d3.SimulationNodeDatum {
    id: string;
    group: number;
    expanded?: boolean;
    parent?: string;
}

interface ILink extends d3.SimulationLinkDatum<INode> {
    value: number;
    parent?: string;
}

interface IData {
    node: INode[];
    link: ILink[];
}

export default function KeywordForceDirectedGraph(props: IProps) {
    const {keywords} = props;

    const svgRef = useRef<SVGSVGElement | null>(null);
    const [data, setData] = useState<IData>({
        node: [],
        link: [],
    });
    useAsyncEffect(async () => {
        if (keywords) {
            const resp = await axios.post<IData>("/api/search", {keywords});
            setData(resp.data);
        }
    }, [keywords]);

    const svgWidth = 928;
    const svgHeight = 360;
    const nodeRadius = 8;
    const linkWidth = 2;
    const labelPaddingX = 2;
    const labelPaddingY = 2;

    const svg = useCreation(() => {
        if (!svgRef.current) return;
        const svg = d3.select(svgRef.current)
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .attr("viewBox", [0, 0, svgWidth, svgHeight])
            .attr("style", "max-width: 100%; height: auto;");
        console.log("svg", svg.select(".link"));
        return svg;
    }, [data]);

    const expandedData = useLatest(data);
    const bindLink = <GElement extends d3.BaseType = d3.BaseType, PElement extends d3.BaseType = d3.BaseType>(
        selection: d3.Selection<GElement, any, PElement, any>,
        data: ILink[],
    ) => {
        return selection
            .data(data)
            .join("line")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .attr("stroke-width", d => d.value * 2.4);
    };
    const bindNode = <GElement extends d3.BaseType = d3.BaseType, PElement extends d3.BaseType = d3.BaseType>(
        selection: d3.Selection<GElement, any, PElement, any>,
        data: INode[],
    ) => {
        const node = selection
            .data(data)
            .join("circle")
            .attr("r", nodeRadius)
            .attr("fill", d => d3.schemeCategory10[d.group])
            .attr("stroke", "#fff")
            .attr("stroke-width", linkWidth)
            .style("cursor", "pointer")
            .on("click", onClick);
        node.append("title").text(d => d.id);
        return node;
    };
    const bindLabel = <GElement extends d3.BaseType = d3.BaseType, PElement extends d3.BaseType = d3.BaseType>(
        selection: d3.Selection<GElement, any, PElement, any>,
        data: INode[],
    ) => {
        const label = selection.data(data)
            .join("g")
            .style("cursor", "pointer")
            .on("click", onClick);
        label
            .append("text")
            .text(d => d.id)
            .attr("font-size", 12)
            .attr("dominant-baseline", "hanging")
            .call(texts => {
                texts.each(function () {
                    if (this) {
                        const bbox = this.getBBox();
                        d3.select(this.parentNode as SVGGElement | null)
                            .insert("rect", "text")
                            .attr("x", -labelPaddingX)
                            .attr("y", -labelPaddingY)
                            .attr("width", bbox.width + labelPaddingX * 2)
                            .attr("height", bbox.height + labelPaddingY * 2)
                            .attr("fill", "#f4f4f5");
                    }
                });
            });
        label.append("title").text(d => d.id);
        return label;
    };

    const tick = () => {
        if (!svg) return;
        svg.select(".link")
            .selectAll<SVGLineElement, ILink>("line")
            .attr("x1", d => (d.source as INode).x ?? 0)
            .attr("y1", d => (d.source as INode).y ?? 0)
            .attr("x2", d => (d.target as INode).x ?? 0)
            .attr("y2", d => (d.target as INode).y ?? 0);
        svg.select(".node")
            .selectAll<SVGCircleElement, INode>("circle")
            .attr("cx", d => d.x ?? 0)
            .attr("cy", d => d.y ?? 0);
        svg.select(".label")
            .selectAll<SVGGElement, INode>("g")
            .attr("transform", d => `translate(${(d.x ?? 0) - labelPaddingX}, ${(d.y ?? 0) + nodeRadius + linkWidth})`);
    };
    let simulation: d3.Simulation<INode, ILink> | undefined;
    const simulate = () => {
        simulation?.stop();
        simulation = d3.forceSimulation(expandedData.current.node)
            .force("link", d3.forceLink<INode, ILink>(expandedData.current.link)
                .id(d => d.id)
                .distance(50)
                .strength(1))
            .force("charge", d3.forceManyBody().strength(-1200))
            .force("collision", d3.forceCollide().radius(16))
            .force("center", d3.forceCenter(svgWidth / 2, svgHeight / 2))
            .on("tick", tick);
    };

    const update = () => {
        if (!svg) return;
        const link = svg.select(".link").selectAll("line");
        bindLink(link, expandedData.current.link);
        const node = svg.select(".node").selectAll("circle");
        bindNode(node, expandedData.current.node);
        const label = svg.select(".label").selectAll("g");
        bindLabel(label, expandedData.current.node);
        simulate();
    };
    const expand = (d: INode) => {
        if (!svg) return;
        axios.post<IData>("/api/search/keypoint", {keypoint: d.id})
            .then(({data: respData}) => {
                expandedData.current = {
                    node: [...expandedData.current.node, ...respData.node.map(n => ({...n, parent: d.id}))],
                    link: [...expandedData.current.link, ...respData.link.map(l => ({...l, parent: d.id}))],
                };
                d.expanded = true;
                update();
            });
    };
    const collapse = (d: INode) => {
        expandedData.current = {
            node: expandedData.current.node.filter(n => n.parent !== d.id),
            link: expandedData.current.link.filter(l => l.parent !== d.id),
        };
        d.expanded = false;
        update();
    };
    const onClick = (_: any, d: INode) => {
        if (d.expanded) {
            collapse(d);
        } else {
            expand(d);
        }
    };

    useUpdateEffect(() => {
        if (!svg) return;
        svg.selectChildren().remove();
        const link = svg.append("g")
            .classed("link", true)
            .selectAll();
        bindLink(link, data.link);
        const node = svg.append("g")
            .classed("node", true)
            .selectAll();
        bindNode(node, data.node);
        const label = svg.append("g")
            .classed("label", true)
            .selectAll();
        bindLabel(label, data.node);
        simulate();
    }, [svg, data]);

    return (
        <div>
            <svg ref={svgRef}></svg>
        </div>
    );
}