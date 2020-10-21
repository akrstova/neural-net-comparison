import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {Network} from "../../model/network/network-model.model";
import {Observable, Subscription} from "rxjs";
import * as d3 from 'd3';
import {InputShape} from "../../model/network/input-shape";
import {D3Model} from '../../model/network/d3-model.model';
import validate = WebAssembly.validate;


@Component({
  selector: 'app-network-simple',
  templateUrl: './network-simple.component.html',
  styleUrls: ['./network-simple.component.css']
})
export class NetworkSimpleComponent implements OnInit {

  @Input() graph: Network;
  @Input() events: Observable<void>;
  @ViewChild('container', {static: true}) container: ElementRef;
  private eventsSubscription: Subscription;



  constructor() { }

  ngAfterViewInit(): void {
    this.eventsSubscription = this.events.subscribe((data) => {
      this.loadNetworkLayers(data);
    });
  }

  ngOnInit(): void {
  }

  loadNetworkLayers(data) {
    const containerStyle = {
      'width': 1000,
      'height': 200
    };

    const svg = d3.select(this.container.nativeElement)
      .append('svg')
      .attr('width', containerStyle.width + 'px')
      .attr('height', containerStyle.height + 'px')
    // .attr('id', 'Layer_' + this.networkNodeData.clsName)

    for(const i in data.nodes) {
      // const d3Model = new D3Model(svg, data.nodes);
      // d3Model.drawElements();

      const layer = data.nodes[i] as any;
      const layerShape = this.getInputShape(layer.inputShape);
      const processed = [];

      const maxDepth = Math.min(layerShape.depth, 48);

      for (let j = 0; j < maxDepth; j++) {
        processed.push({
          width: layerShape.width,
          height: layerShape.height
        });
      }
        svg.append('g');

      const links = this.mapLinkIdsToNodePosition(data);

      // @ts-ignore
      const startXOffset = i * 80;

      // if (processed.length > 1) {
      //   // Append multiple rectangles for layers other than Dense
      //   svg.selectAll('rect')
      //     .data(processed)
      //     .enter().append('rect')
      //     .attr('x', (d, i) => 10 + i * this.calculateDistanceBetweenObjects(d.width))
      //     .attr('y', (d, i) => 10 + i * this.calculateDistanceBetweenObjects(d.width))
      //     .attr('width', (d, i) => d.width)
      //     .attr('height', (d, i) => d.height)
      //     .attr('fill', (d, i) => i % 2 === 0 ? 'white' : 'lightgrey')
      //     .attr('stroke', 'black');
      // } else if (processed.length === 1) {
      //   // Append polygon for Dense layers
      //   // const maxHeight = Math.min(processed[0].height, 128);
      //   // const x1 = Math.ceil(maxHeight / Math.tan(45)) + 30;
      //   // const poly = [{'x': startXOffset, 'y': 20},
      //   //   {'x': x1, 'y': maxHeight},
      //   //   {'x': x1 + 10, 'y': maxHeight},
      //   //   {'x': startXOffset + 10, 'y': 10}];
      //   // svg.selectAll('polygon')
      //   //   .data([poly])
      //   //   .enter().append('polygon')
      //   //   .attr('points', (d) => {
      //   //     return d.map((p) => {
      //   //       return [p.x, p.y].join(',');
      //   //     }).join(' ');
      //   //   })
      //   //   .attr('fill', 'lightgrey')
      //   //   .attr('stroke', 'black');
      //   svg.append('rect')
      //     .attr('x', (d, i) => startXOffset)
      //     .attr('y', (d, i) => 10)
      //     .attr('width', (d, i) => 20)
      //     .attr('height', (d, i) => 60)
      //     .attr('fill', (d, i) => i % 2 === 0 ? 'white' : 'white')
      //     .attr('stroke', 'black');
      // }

    svg.append('text')
      .attr('x', startXOffset)
      .attr('y', 100)
      .attr('font-size', '0.8em')
      .text(layer.name)

      svg.append('text')
        .attr('x', startXOffset)
        .attr('y', 120)
        .attr('font-size', '0.8em')
        .text(layerShape.depth + '@' + layerShape.width + 'x' + layerShape.height)

      const layerLinks = links[layer.position];
      for (const l in layerLinks) {
        const position = layerLinks[l] as number;
        const x1 = startXOffset + 80;
        const x2 = x1 + (80 * (position - layer.position));
        const y1 = 30;
        const y2 = 30;
        // svg.append('line')
        //   .style("stroke", "darkgrey")
        //   .style("stroke-width", 2)
        //   .attr("x1", x1)
        //   .attr("x2", x2)
        //   .attr("y1", y1)
        //   .attr("y2", y2);
      }
    }

  }

  getInputShape(inputShape): InputShape {
    const obj = {} as InputShape;
    if (inputShape.length === 4) {
      obj.width = inputShape[1];
      obj.height = inputShape[2];
      obj.depth = inputShape[3];
    } else if (inputShape.length === 2) {
      obj.width = 1;
      obj.height = inputShape[1];
      obj.depth = 1;

    } else if (inputShape.length === 0) {
      obj.width = 0;
      obj.height = 0;
      obj.depth = 0;
    }
    return obj;
  }

  calculateDistanceBetweenObjects(size) {
    return Math.ceil(Math.sqrt(size));
  }

  mapLinkIdsToNodePosition(graph) {
    const result = {}
    for(const i in graph.links) {
      const pair = graph.links[i] as any;
      const source = this.findNodeById(graph.nodes, pair.source).position;
      const target = this.findNodeById(graph.nodes, pair.target).position;
      if (result[source] === undefined) {
        result[source] = [];
      }
      result[source].push(target);
    }
    return result;
  }

  findNodeById(nodes, targetId) {
    for(const i in nodes) {
      const current = nodes[i] as any;
      if (targetId === current.id) {
        return current;
      }
    }
  }

}
