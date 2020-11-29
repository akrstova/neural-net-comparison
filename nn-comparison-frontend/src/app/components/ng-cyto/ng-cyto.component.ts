import {Component, OnChanges, Renderer2, ElementRef, Input, Output, EventEmitter} from '@angular/core';

import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import popper from 'cytoscape-popper';
import qtip from 'cytoscape-qtip';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';


cytoscape.use(dagre);
cytoscape.use(popper);
cytoscape.use(qtip);

@Component({
  selector: 'ng2-cytoscape',
  template: '<div id="cy"></div>',
  styles: [`#cy {
    height: 100%;
    width: 100%;
    position: absolute;
    left: 0;
    top: 0;
  }
  `]
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

    this.style = this.style ||
      cytoscape.stylesheet()
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
        )

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

    firstGraph.on('click', 'node', (e) => {
      firstGraph.elements().removeClass('strong-match').removeClass('weak-match');
      this.destroyAllPoppers();
      const node = e.target;
      const nodeId = node.data('id');
      const matchedNodes = this.nodeMatches[nodeId];
      Object.entries(matchedNodes).forEach(
        ([_, value]) => {
          const score = value['score'];
          const matchedNodeId = value['id'];
          const nodeToHighlight = firstGraph.elements().filter((elem) => elem.data('id') == matchedNodeId)[0];
          if (score > 0.8) {
            nodeToHighlight.addClass('strong-match');
          } else {
            nodeToHighlight.addClass('weak-match');
          }
          this.createPopper(nodeToHighlight, 'right')
        }
      );
    });

    firstGraph.on('click', (e) => {
      if (e.target.length != 1) {
        firstGraph.elements().removeClass('strong-match').removeClass('weak-match');
        this.destroyAllPoppers();
      }
    });


    firstGraph.on('mouseover', 'node', (e) => {
      let node = e.target;
      this.createPopper(node, 'left');
    });

    firstGraph.on('mouseout', (e) => {
        // this.destroyAllPoppers();
      }
    )

  }

  createPopper(node, placement) {
    let popper = node.popper({
      content: () => {
        const inputShape = node.data('inputShape');
        const outputShape = node.data('outputShape');
        let div = document.createElement('div');
        div.className = 'node-tooltip';
        div.style.cssText = 'z-index:9999;border:1px solid black;margin-right: 5px;background-color:white;';

        div.innerHTML = '<table>\n' +
          '                        <tr>\n' +
          '                        <td>Input shape:</td>\n' +
          '                        <td>' + inputShape + '</td>\n' +
          '                        </tr>\n' +
          '                        <tr>\n' +
          '                        <td>Output shape:</td>\n' +
          '                        <td>' + outputShape + '</td>\n' +
          '                        </tr>\n' +
          '                        <tr>\n' +
          '                        </table>';

        document.body.appendChild(div);

        return div;
      },
      popper: {
        'placement': placement
      } // my popper options here
    });
    console.log('Popper', popper);
    return popper;
  }

  destroyAllPoppers() {
    let elements = document.getElementsByClassName('node-tooltip');
    while (elements.length > 0) {
      elements[0].parentNode.removeChild(elements[0]);
    }
  }

  mergeGraphs(firstGraph, secondGraph) {
    let combined = {};
    combined['nodes'] = firstGraph['nodes'];
    combined['nodes'] = combined['nodes'].concat(secondGraph['nodes']);
    combined['edges'] = firstGraph['edges'];
    combined['edges'] = combined['edges'].concat(secondGraph['edges']);
    return combined;
  }

  makeTippy(node, text) {
    var ref = node.popperRef();

    // unfortunately, a dummy element must be passed
    // as tippy only accepts a dom element as the target
    // https://github.com/atomiks/tippyjs/issues/661
    var dummyDomEle = document.createElement('div');

    // @ts-ignore
    var tip = tippy(dummyDomEle, {
      onCreate: function (instance) { // mandatory
        // patch the tippy's popper reference so positioning works
        // https://atomiks.github.io/tippyjs/misc/#custom-position
        // @ts-ignore
        instance.popperInstance.reference = ref;
      },
      lazy: false, // mandatory
      trigger: 'manual', // mandatory

      // dom element inside the tippy:
      content: function () { // function can be better for performance
        var div = document.createElement('div');

        div.innerHTML = text;

        return div;
      },

      // your own preferences:
      arrow: true,
      placement: 'bottom',
      hideOnClick: false,
      multiple: true,
      sticky: true,

      // if interactive:
      interactive: true,
      appendTo: document.body // or append dummyDomEle to document.body
    });

    return tip;
  };
}
