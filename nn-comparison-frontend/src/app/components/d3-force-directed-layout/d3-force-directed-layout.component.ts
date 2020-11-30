import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import * as d3 from 'd3';
import {mergeGraphs} from "../../utils/utils";


@Component({
  selector: 'd3-force-directed-layout',
  templateUrl: './d3-force-directed-layout.component.html',
  styleUrls: ['./d3-force-directed-layout.component.css']
})
export class D3ForceDirectedLayoutComponent implements OnInit, OnChanges {
  @Input() public firstGraph: any;
  @Input() public secondGraph: any;
  @Input() public nodeMatches: any;

  private graphData: any;
  private width = 750;
  private height = 750;
  private margin = ({top: 80, right: 30, bottom: 30, left: 80})

  constructor() {
  }

  ngOnInit(): void {
    this.graphData = mergeGraphs(this.firstGraph, this.secondGraph);
  }

  ngOnChanges(): any {
    this.graphData = mergeGraphs(this.firstGraph, this.secondGraph);
    this.createGraph(this.graphData);
  }


  createGraph(data) {

    let drag = simulation => {

      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    const links = data.edges.map(d => d.data);
    const nodes = data.nodes.map(d => d.data);

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id))
      .force("charge", d3.forceManyBody())
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .force('collide', d3.forceCollide(function (d) {
        return d.id === "j" ? 100 : 50
      }))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))


    const svg = d3.select('#main-svg');

    const link = svg.append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`)
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 2);

    const node = svg.append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 15)
      .attr("fill", '#9e9b9b')
      .call(drag(simulation));

    const text = svg.append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`)
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .text((d) => d.clsName)
      .call(drag(simulation));


    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

      text
        .attr("dx", d => d.x)
        .attr("dy", d => d.y)
    });
    return svg.node();
  }


}