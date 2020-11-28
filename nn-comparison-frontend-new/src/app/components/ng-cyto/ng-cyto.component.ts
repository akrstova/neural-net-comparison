import {Component, OnChanges, Renderer2, ElementRef, Input, Output, EventEmitter} from '@angular/core';

import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import {first} from "rxjs/operators";

cytoscape.use(dagre);

@Component({
  selector: 'ng2-cytoscape',
  template: '<div id="cy"></div>',
  styles: [`#cy {
    height: 100%;
    width: 100%;
    position: absolute;
    left: 0;
    top: 0;
  }`]
})


export class NgCytoComponent implements OnChanges {

  @Input() public firstGraph: any;
  @Input() public secondGraph: any;
  @Input() public nodeMatches: any;
  @Input() public style: any;
  @Input() public layout: any;
  @Input() public zoom: any;

  @Output() select: EventEmitter<any> = new EventEmitter<any>();

  public constructor(private renderer: Renderer2, private el: ElementRef) {

    this.layout = this.layout || {
      name: 'dagre',
      directed: true,
      padding: 0
    };

    this.zoom = this.zoom || {
      min: 0.1,
      max: 1.5
    };

    this.style = this.style || cytoscape.stylesheet()

      .selector('node')
      .css({
        'shape': 'data(shapeType)',
        'width': 'mapData(weight, 40, 80, 20, 60)',
        'content': 'data(name)',
        'text-valign': 'center',
        'text-outline-width': 1,
        'text-outline-color': 'data(colorCode)',
        'background-color': 'data(colorCode)',
        'color': '#fff',
        'font-size': 10
      })
      .selector(':selected')
      .css({
        'border-width': 1,
        'border-color': 'black'
      })
      .selector('edge')
      .css({
        'curve-style': 'bezier',
        'opacity': 0.666,
        'width': 'mapData(strength, 70, 100, 2, 6)',
        'target-arrow-shape': 'triangle',
        'line-color': 'data(colorCode)',
        'source-arrow-color': 'data(colorCode)',
        'target-arrow-color': 'data(colorCode)'
      })
      .selector('edge.questionable')
      .css({
        'line-style': 'dotted',
        'target-arrow-shape': 'diamond'
      })
      .selector('.faded')
      .css({
        'opacity': 0.25,
        'text-opacity': 0
      })
      .selector('.strong-match')
      .css({
        'opacity': 0.5,
        'background-color': 'green'
      })
      .selector('.weak-match')
      .css({
        'opacity': 0.25,
        'background-color': 'green'
        }
      );
  }

  public ngOnChanges(): any {
    this.render();
  }

  public render() {
    let cy_container = this.renderer.selectRootElement("#cy");
    let firstGraph = cytoscape({
      container: cy_container,
      layout: this.layout,
      minZoom: this.zoom.min,
      maxZoom: this.zoom.max,
      style: this.style,
      elements: this.mergeGraphs(this.firstGraph, this.secondGraph)
    });

    firstGraph.on('click', 'node',(e) => {
      const node = e.target;
      const nodeId = node.data('id');
      const matchedNodes = this.nodeMatches[nodeId];
      Object.entries(matchedNodes).forEach(
        ([_, value]) => {
          const matchedNodeId = value['id'];
          const score = value['score'];
          if (score > 0.8)
            firstGraph.elements().filter((elem) => elem.data('id') == matchedNodeId)[0].addClass('strong-match');
          else
            firstGraph.elements().filter((elem) => elem.data('id') == matchedNodeId)[0].addClass('weak-match');
        }
      );
    });

    firstGraph.on('click', function (e) {
      if(e.target.length != 1)
        firstGraph.elements().removeClass('strong-match').removeClass('weak-match');
    });


  }

  mergeGraphs(firstGraph, secondGraph) {
    let combined = {};
    combined['nodes'] = firstGraph['nodes'];
    combined['nodes'] = combined['nodes'].concat(secondGraph['nodes']);
    combined['edges'] = firstGraph['edges'];
    combined['edges'] = combined['edges'].concat(secondGraph['edges']);
    return combined;
  }

}
