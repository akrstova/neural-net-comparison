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
  @ViewChild('visArea', {static: true}) visArea: ElementRef;
  visWidth: 60;
  visHeight: 60;
  containerStyle: any;

  constructor(private renderer: Renderer2) { }

  ngOnInit(): void {
    const containerStyle = {
      'width': 200,
      'height': 200
    };
    this.layerShape = this.getInputShape(this.networkNodeData.inputShape) as InputShape;
    const processed = [];
    console.log(this.networkNodeData);

    for (let i = 0; i < this.layerShape.depth; i++) {
      processed.push({
        width: this.layerShape.width,
        height: this.layerShape.height
      });
    }

    console.log(this.visHeight);
    // this.renderer.setStyle(this.visArea, 'width', '100px');
    // this.renderer.setStyle(this.visArea, 'height', '100px');

    const svg = d3.select(this.visArea.nativeElement).append('svg')
      .attr('width', containerStyle.width + 'px')
      .attr('height', containerStyle.height + 'px')
      .attr('id', 'Layer_' + this.networkNodeData.clsName)
      .append('g');


    svg.selectAll('rect')
      .data(processed)
      .enter().append('rect')
      .attr('x', (d, i) => 10 + i * this.calculateDistanceBetweenObjects(d.width))
      .attr('y', (d, i) => 10 + i * this.calculateDistanceBetweenObjects(d.width))
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

  calculateDistanceBetweenObjects(size) {
    return Math.ceil(Math.sqrt(size));
  }
}
