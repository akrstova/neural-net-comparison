import {Component, ElementRef, Input, OnInit, Renderer2, ViewChild} from '@angular/core';
import {NetworkNode} from '../../../model/network/network-node.model';
import * as d3 from 'd3';
import {InputShape} from '../../../model/network/input-shape';


@Component({
  selector: 'app-general-layer',
  templateUrl: './general-layer.component.html',
  styleUrls: ['./general-layer.component.css']
})
export class GeneralLayerComponent implements OnInit {

  @Input() networkNodeData: NetworkNode;
  @Input() layerShape: any;
  @ViewChild('parent', {static: true}) parentContainer: ElementRef;
  // @ViewChild('visArea', {static: true}) visArea: ElementRef;
  containerStyle: any;

  constructor(private renderer: Renderer2) {
  }

  ngOnInit(): void {
    const containerStyle = {
      'width': 200,
      'height': 200
    };

    this.layerShape = this.getInputShape(this.networkNodeData.inputShape) as InputShape;
    const processed = [];

    const maxDepth = Math.min(this.layerShape.depth, 48);

    for (let i = 0; i < maxDepth; i++) {
      processed.push({
        width: this.layerShape.width,
        height: this.layerShape.height
      });
    }

    const svg = d3.select(this.parentContainer.nativeElement)
      .append('g');

    if (processed.length > 1) {
      // Append multiple rectangles for layers other than Dense
      svg.selectAll('rect')
        .data(processed)
        .enter().append('rect')
        .attr('x', (d, i) => 10 + i * this.calculateDistanceBetweenObjects(d.width))
        .attr('y', (d, i) => 10 + i * this.calculateDistanceBetweenObjects(d.width))
        .attr('width', (d, i) => d.width)
        .attr('height', (d, i) => d.height)
        .attr('fill', (d, i) => i % 2 === 0 ? 'white' : 'lightgrey')
        .attr('stroke', 'black');
    } else if (processed.length === 1) {
      // Append polygon for Dense layers
      const maxHeight = Math.min(processed[0].height, 128);
      const x1 = Math.ceil(maxHeight / Math.tan(45)) + 30;
      const poly = [{'x': 10, 'y': 10},
        {'x': x1, 'y': maxHeight},
        {'x': x1 + 10, 'y': maxHeight},
        {'x': 20, 'y': 10}];
      svg.selectAll('polygon')
        .data([poly])
        .enter().append('polygon')
        .attr('points', (d) => {
          return d.map((p) => {
            return [p.x, p.y].join(',');
          }).join(' ');
        })
        .attr('fill', 'lightgrey')
        .attr('stroke', 'black');
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
    }
    return obj;
  }

  calculateDistanceBetweenObjects(size) {
    return Math.ceil(Math.sqrt(size));
  }
}
