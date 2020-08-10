import {Component, Input, OnInit} from '@angular/core';
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
  visWidth: 30;
  visHeight: 30;

  constructor() { }

  ngOnInit(): void {
    console.log('My data', this.networkNodeData);
    const layerShape = this.getInputShape(this.networkNodeData.inputShape) as InputShape;
    const processed = [];

    for (let i = 0; i < layerShape.depth; i++) {
      processed.push({
        width: layerShape.width,
        height: layerShape.height
      });
    }

    console.log('Shape', layerShape);
    console.log('Processed ', processed);


    const svg = d3.select('.visArea').append('svg')
      .attr('width', this.visHeight)
      .attr('height', this.visHeight)
      .append('g')
      .attr('transform', 'translate(' + this.visWidth / 2 + ',' + this.visHeight / 2 + ')');

    svg.selectAll('rect')
      .data(processed)
      .enter().append('rect')
      .attr('x', (d, i) => 10 + i * 10)
      .attr('y', (d, i) => 10 + i * 10)
      .attr('width', (d, i) => d.width)
      .attr('height', (d, i) => d.height)
      .attr('fill', 'white')
      .attr('stroke', 'black');

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

}
