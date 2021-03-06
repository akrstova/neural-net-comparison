import {Component, Input, OnChanges, OnInit, Renderer2} from '@angular/core';

import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import popper from 'cytoscape-popper';
import panzoom from 'cytoscape-panzoom';
import * as d3 from 'd3';
import {mergeGraphs} from "../../utils/utils";
import tinycolor from 'tinycolor2';

cytoscape.use(dagre);
cytoscape.use(popper);
cytoscape.use(panzoom);


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

  /deep/ #attr-matrix .ag-header-cell {
    padding: 0;
  }

  /deep/ .cy-panzoom {
    right: 6em;
  }

  `]
})
export class NgCytoComponent implements OnInit, OnChanges {

  @Input() public firstGraph: any;
  @Input() public secondGraph: any;
  @Input() public nodeMatches: any = null;
  @Input() public reverseNodeMatches: any;
  @Input() public distanceMatrix: any;
  @Input() public style: any;
  @Input() public layout: any;
  @Input() public zoom: any;

  @Input() public attributes: any;
  tableColumnDefs: any = null;
  tableRowData: any = null;
  showAttributeMatrix = false;
  panzoomDefaults: any;
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
        .selector('.edge-match')
        .css({
          'curve-style': 'unbundled-bezier',
          'opacity': 0.666,
          'line-color': 'data(colorCode)',
          'target-arrow-shape': 'none',
          'source-arrow-color': 'data(colorCode)',
          'target-arrow-color': 'data(colorCode)',
          'width': 'data(score)',
          // 'label': 'data(label)'
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
        );

    this.panzoomDefaults = {
      zoomFactor: 0.05, // zoom factor per zoom tick
      zoomDelay: 45, // how many ms between zoom ticks
      minZoom: 0.1, // min zoom level
      maxZoom: 10, // max zoom level
      fitPadding: 50, // padding when fitting
      panSpeed: 10, // how many ms in between pan ticks
      panDistance: 10, // max pan distance per tick
      panDragAreaSize: 75, // the length of the pan drag box in which the vector for panning is calculated (bigger = finer control of pan speed and direction)
      panMinPercentSpeed: 0.25, // the slowest speed we can pan by (as a percent of panSpeed)
      panInactiveArea: 8, // radius of inactive area in pan drag box
      panIndicatorMinOpacity: 0.5, // min opacity of pan indicator (the draggable nib); scales from this to 1.0
      zoomOnly: false, // a minimal version of the ui only with zooming (useful on systems with bad mousewheel resolution)
      fitSelector: undefined, // selector of elements to fit
      animateOnFit: function () { // whether to animate on fit
        return false;
      },
      fitAnimationDuration: 1000, // duration of animation on fit

      // icon class names
      sliderHandleIcon: 'fa fa-minus',
      zoomInIcon: 'fa fa-plus',
      zoomOutIcon: 'fa fa-minus',
      resetIcon: 'fa fa-expand'
    };
  }

  public ngOnInit() {
    this.setTableColumns();
    this.tableRowData = [];
  }


  public ngOnChanges(): any {
    this.setTableColumns();
    // Do not render if node matches are empty
    if (Object.keys(this.nodeMatches).length !== 0 && this.nodeMatches.constructor === Object)
      this.render();
  }

  public async render() {
    let cy_container = this.renderer.selectRootElement("#cy");
    let graph = cytoscape({
      container: cy_container,
      layout: this.layout,
      minZoom: this.zoom.min,
      maxZoom: this.zoom.max,
      style: this.style,
      elements: mergeGraphs(this.firstGraph, this.secondGraph)
    });
    graph.panzoom(this.panzoomDefaults);
    await this.colorNodesDiverging(graph.elements());
    this.drawMatchLinks(graph);

    // Node events
    graph.on('click', 'node', (e) => {
      // Move entire graph to the left to make room for attribute matrix
      if (this.showAttributeMatrix == false) {
        graph.pan()['x'] = graph.pan()['x'] - 250;
      }
      this.showAttributeMatrix = true;

      graph.elements().removeClass('best-match').removeClass('faded');
      this.destroyAllPoppers('node-tooltip');
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
          nodeToHighlight.style('background-fill', 'solid');
          const placement = this.isNodeInFirstGraph(nodeToHighlight) ? 'left' : 'right';
          this.createPopper(nodeToHighlight, placement)
        }
      );
    });

    graph.on('click', (e) => {
      if (e.target.length != 1) {
        graph.elements().removeClass('best-match').removeClass('faded');
        this.colorNodesDiverging(graph.elements());
        this.destroyAllPoppers('node-tooltip');
      }
    });

    graph.on('mouseover', 'node', (e) => {
      let node = e.target;
      const placement = this.isNodeInFirstGraph(node) ? 'left' : 'right';
      this.createPopper(node, placement);
    });

    // Edge events
    graph.on('mouseover', 'edge', (e)=> {
      this.createEdgePopper(e.target);
    });

    graph.on('mouseout', 'edge', (e)=> {
      this.destroyAllPoppers('edge-tooltip');
    });


    graph.on('mouseout', (e) => {
        // TODO if the user has clicked on a node, check if all poppers should be destroyed?
        //   this.destroyAllPoppers();
      }
    )

  }

  drawMatchLinks(graph) {
    let elements = graph.elements();
    const firstGraphNodeIds = this.firstGraph.nodes.map((node) => node['data']['id']);
    const firstGraphElements = elements.filter((elem) => firstGraphNodeIds.includes(elem.data('id')));
    if (this.nodeMatches) {
      for (let i = 0; i < firstGraphElements.length; i++) {
        const currentNodeId = firstGraphElements[i].data('id');
        const currentNodeColor = firstGraphElements[i].style('background-color');
        const topMatchId = this.nodeMatches[currentNodeId][0]['id'];
        let score = this.nodeMatches[currentNodeId][0]['score'];
        graph.add([{
          group: 'edges',
          data: {
            id: 'e' + i,
            source: currentNodeId,
            target: topMatchId,
            label: score.toFixed(2),
            score: score >= 1 ? score * 2 : score * 5,
            colorCode: currentNodeColor
          }
        }])
        graph.edges("[id='e" + i + "']").addClass('edge-match')
      }
    }
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
        let topMatchNode = secondGraphElements.filter((elem) => elem.data('id') == topMatchId)[0];
        let currentColor = topMatchNode.style('background-color');
        let newColor = this.hexToRgb(assignedColors[firstGraphNodeIds[i]])
        if (currentColor !== newColor && currentColor !== 'rgb(186,184,184)') {   // rgb(186,184,184) is default grey
          topMatchNode.style('background-color', currentColor);
          topMatchNode.style('background-fill', 'linear-gradient');
          topMatchNode.style('background-gradient-stop-colors', currentColor + ' ' + newColor);
          topMatchNode.style('background-gradient-direction', 'to-right');
        } else {
          topMatchNode.style('background-color', newColor);
        }
        if (score < 0.5) {
          score = 1 - score;
        }
        topMatchNode.style('opacity', score);
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

  createEdgePopper(edge) {
    return edge.popper({
      content: () => {
        let div = document.createElement('div');
        div.innerHTML = edge.data('label');
        div.className = 'edge-tooltip';
        div.style.cssText = 'z-index:9999;' +
          'border:2px solid #eeeeee;' +
          'border-radius: 5px;' +
          'margin: 0 10px 0 10px;' +
          'background-color: #eeeeee;' +
          'font-size: 0.9em;' +
          'color: #666666';
        document.body.appendChild(div);
        return div;
      }
    })
  }

  createPopper(node, placement) {
    return node.popper({
      content: () => {
        const layerType = node.data('clsName');
        const inputShape = node.data('inputShape').filter((elem) => elem != null);
        const outputShape = node.data('outputShape').filter((elem) => elem != null);
        const numParameter = node.data('numParameter');
        let div = document.createElement('div');
        div.className = 'node-tooltip';
        div.style.cssText = 'z-index:9999;' +
          'border:2px solid #eeeeee;' +
          'border-radius: 5px;' +
          'margin: 0 10px 0 10px;' +
          'background-color: #eeeeee;' +
          'font-size: 0.9em;' +
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
          '                        <td>Num parameters:</td>\n' +
          '                        <td>' + numParameter + '</td>\n' +
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

  destroyAllPoppers(className) {
    let elements = document.getElementsByClassName(className);
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
      let sum = 0;
      this.attributes.map((attr) => {
        if (attr.weight !== 0) {
          obj[attr.name] = !isNaN(elem[attr.name]) ? parseFloat(elem[attr.name]).toFixed(2) : elem[attr.name];
          sum += parseFloat(obj[attr.name]);
        }
      });
      obj['Node'] = this.secondGraph['nodes'][index]['data']['name'];
      obj['Sum'] = sum.toFixed(2);
      this.tableRowData.push(obj);
    })
  }

  setTableColumns() {
    this.tableColumnDefs = [];
    this.attributes.map((item) => {
      if (item.weight !== 0)
        this.tableColumnDefs.push({
          field: item.name,
          sortable: true,
          filter: true,
          width: 100,
          cellStyle: {padding: 0}
        });
    });

    // Column for node number which shouldn't be removed
    let found = this.tableColumnDefs.some(el => el.field == 'Node');
    if (!found)
      this.tableColumnDefs.push({
        field: 'Node',
        sortable: true,
        filter: true,
        pinned: 'left',
        width: 100,
        cellStyle: {padding: 0}
      });
    // Column for distance sum which shouldn't be removed
    found = this.tableColumnDefs.some(el => el.field == 'Sum');
    if (!found)
      this.tableColumnDefs.push({
        field: 'Sum',
        sortable: true,
        filter: true,
        pinned: 'right',
        width: 100,
        cellStyle: {padding: 0}
      });
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
  }

  closeAttributeMatrix() {
    this.showAttributeMatrix = false;
  }

}

