import {Component, Input, OnChanges, OnInit, Renderer2} from '@angular/core';

import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import popper from 'cytoscape-popper';
import * as d3 from 'd3';
import {mergeGraphs} from "../../utils/utils";
import tinycolor from 'tinycolor2';

cytoscape.use(dagre);
cytoscape.use(popper);


@Component({
  selector: 'ng2-cytoscape',
  templateUrl: './ng-cyto.component.html',
  styles: [`#cy {
    height: 100%;
    width: 100%;
    position: absolute;
    left: 0;
    top: 0;
  }
  `]
})
export class NgCytoComponent implements OnInit, OnChanges {

  @Input() public firstGraph: any;
  @Input() public secondGraph: any;
  @Input() public nodeMatches: any;
  @Input() public reverseNodeMatches: any;
  @Input() public distanceMatrix: any;
  @Input() public style: any;
  @Input() public layout: any;
  @Input() public zoom: any;

  @Input() public attributes: any;
  tableColumnDefs: any = null;
  tableRowData: any = null;
  showAttributeMatrix = false;
  // TODO check if these are needed
  private gridApi = null;
  private gridColumnApi = null;


  public constructor(private renderer: Renderer2) {

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
          'color': '#000',
          'font-size': 10
        })
        .selector(':selected')
        .css({
          'border-width': 2,
          'border-color': '#949494',
          'border-style': 'dashed'
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
          'text-opacity': 0.5
        })
        .selector('.best-match')
        .css({
            'opacity': 0.5,
            'border-style': 'solid',
            'border-width': 2,
            'border-color': '#fcba03'
          }
        )

  }

  public ngOnInit() {
    this.setTableColumns();
    this.tableRowData = [];
  }


  public ngOnChanges(): any {
    if (this.nodeMatches)
      this.render();
  }

  public render() {
    let cy_container = this.renderer.selectRootElement("#cy");
    let graph = cytoscape({
      container: cy_container,
      layout: this.layout,
      minZoom: this.zoom.min,
      maxZoom: this.zoom.max,
      style: this.style,
      elements: mergeGraphs(this.firstGraph, this.secondGraph)
    });
    this.colorNodesDiverging(graph.elements());

    graph.on('click', 'node', (e) => {
      this.showAttributeMatrix = true;

      graph.elements().removeClass('best-match').removeClass('faded');
      this.destroyAllPoppers();
      const node = e.target;

      this.renderAttributeDistanceMatrix(node);

      const placement = this.isNodeInFirstGraph(node) ? 'left' : 'right';
      this.createPopper(node, placement)
      const nodeId = node.data('id');
      // Fade all nodes except the one that was clicked
      graph.elements().filter((elem) => elem.data('id') != nodeId).map((elem) => elem.addClass('faded'));

      const matchedNodes = this.nodeMatches[nodeId] ? this.nodeMatches[nodeId] : this.reverseNodeMatches[nodeId];
      const maxScoreIndex = Object.entries(matchedNodes).reduce((a, b) => a[1]['score'] > b[1]['score'] ? a : b)[0];
      const maxScoreNodeId = matchedNodes[maxScoreIndex]['id'];
      const selectedNodeColor = node.style('background-color');
      const brightenedColor = tinycolor(selectedNodeColor).brighten(50).toString();

      let scores = []
      Object.entries(matchedNodes).forEach(
        ([_, value]) => {
          scores.push(value['score'])
        }
      );
      const sequentialColorScale = d3.scaleLinear()
        .range([brightenedColor, selectedNodeColor])
        .domain(d3.extent(scores));

      Object.entries(matchedNodes).forEach(
        ([_, value]) => {
          const score = value['score'];
          const matchedNodeId = value['id'];
          const nodeToHighlight = graph.elements().filter((elem) => elem.data('id') == matchedNodeId)[0];
          if (matchedNodeId == maxScoreNodeId) {
            nodeToHighlight.addClass('best-match')
          }
          nodeToHighlight.style('background-color', sequentialColorScale(score));
          const placement = this.isNodeInFirstGraph(nodeToHighlight) ? 'left' : 'right';
          this.createPopper(nodeToHighlight, placement)
        }
      );
    });

    graph.on('click', (e) => {
      if (e.target.length != 1) {
        graph.elements().removeClass('best-match').removeClass('faded');
        this.colorNodesDiverging(graph.elements());
        this.destroyAllPoppers();
      }
    });

    graph.on('mouseover', 'node', (e) => {
      let node = e.target;
      const placement = this.isNodeInFirstGraph(node) ? 'left' : 'right';
      this.createPopper(node, placement);
    });

    graph.on('mouseout', (e) => {
        // TODO if the user has clicked on a node, check if all poppers should be destroyed?
        //   this.destroyAllPoppers();
      }
    )

  }

  colorNodesDiverging(elements) {
    const firstGraphNodeIds = this.firstGraph.nodes.map((node) => node['data']['id']);
    const secondGraphNodeIds = this.secondGraph.nodes.map((node) => node['data']['id']);
    const firstGraphElements = elements.filter((elem) => firstGraphNodeIds.includes(elem.data('id')));
    const secondGraphElements = elements.filter((elem) => secondGraphNodeIds.includes(elem.data('id')));
    let assignedColors = {};
    const sequentialScale = d3.scaleSequential()
      .domain([0, this.firstGraph.nodes.length])
      .interpolator(d3.interpolateViridis)

    const colorArray = d3.range(this.firstGraph.nodes.length).map((d) => {
      return sequentialScale(d)
    });

    for (let i = 0; i < firstGraphElements.length; i++) {
      firstGraphElements[i].style('background-color', colorArray[i]);
      assignedColors[firstGraphNodeIds[i]] = colorArray[i];
    }
    if (this.nodeMatches) {
      for (let i = 0; i < firstGraphElements.length; i++) {
        const topMatchId = this.nodeMatches[firstGraphElements[i].data('id')][0]['id'];
        let score = this.nodeMatches[firstGraphElements[i].data('id')][0]['score'];
        let node = secondGraphElements.filter((elem) => elem.data('id') == topMatchId)[0];
        let currentColor = node.style('background-color');
        let newColor = this.hexToRgb(assignedColors[firstGraphNodeIds[i]])
        if (currentColor !== newColor && currentColor !== 'rgb(186,184,184)') {   // rgb(186,184,184) is default grey
          node.style('background-color', currentColor);
          node.style('background-fill', 'linear-gradient');
          node.style('background-gradient-stop-colors', currentColor + ' ' + newColor);
          node.style('background-gradient-direction', 'to-right');
        } else {
          node.style('background-color', newColor);
        }
        if (score < 0.5) {
          score = 1 - score;
        }
        node.style('opacity', score);
      }
    }
  }

  hexToRgb(hex) {
    hex = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
      , (m, r, g, b) => '#' + r + r + g + g + b + b)
      .substring(1).match(/.{2}/g)
      .map(x => parseInt(x, 16))

    return "rgb(" + hex[0] + "," + hex[1] + "," + hex[2] + ")";
  }

  isNodeInFirstGraph(node) {
    return this.firstGraph.nodes.filter((elem) => elem['data'] === node.data()).length > 0;
  }

  createPopper(node, placement) {
    return node.popper({
      content: () => {
        const layerType = node.data('clsName');
        const inputShape = node.data('inputShape').filter((elem) => elem != null);
        const outputShape = node.data('outputShape').filter((elem) => elem != null);
        let div = document.createElement('div');
        div.className = 'node-tooltip';
        div.style.cssText = 'z-index:9999;' +
          'border:2px solid #eeeeee;' +
          'border-radius: 5px;' +
          'margin: 0 10px 0 10px;' +
          'background-color: #eeeeee;' +
          'color: #666666';

        div.innerHTML = '<table>\n' +
          '                        <tr>\n' +
          '                        <td>Layer type:</td>\n' +
          '                        <td>' + layerType + '</td>\n' +
          '                        </tr>\n' +
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
      }
    });
  }

  destroyAllPoppers() {
    let elements = document.getElementsByClassName('node-tooltip');
    while (elements.length > 0) {
      elements[0].parentNode.removeChild(elements[0]);
    }
  }

  renderAttributeDistanceMatrix(clickedNode) {
    const clickedNodeIdx = clickedNode.data('index');
    let distances = this.distanceMatrix[clickedNodeIdx];
    this.tableRowData = [];
    distances.map((elem, index) => {
      let obj = {};
      this.attributes.map((attr) => {
        obj[attr.name] = !isNaN(elem[attr.name]) ? parseFloat(elem[attr.name]).toFixed(2) : elem[attr.name];
      });
      obj['Node'] = index;
      this.tableRowData.push(obj);
    })
  }

  setTableColumns() {
    this.tableColumnDefs = [];
    this.attributes.map((item) => {
      this.tableColumnDefs.push({field: item.name, sortable: true, filter: true});
    });
    // Column for node number which shouldn't be removed
    const found = this.tableColumnDefs.some(el => el.field == 'Node');
    if (!found)
      this.tableColumnDefs.push({field: 'Node', sortable: true, filter: true, pinned: 'left', width: 120});
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
  }

}

