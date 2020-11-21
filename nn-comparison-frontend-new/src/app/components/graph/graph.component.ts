import {Component, Output, EventEmitter, Input} from "@angular/core";
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

cytoscape.use(dagre);

@Component({
  selector: 'cy-graph',
  templateUrl: './graph.component.html',
  styles: [`
    ng2-cytoscape {
      height: 100vh;
      float: left;
      width: 100%;
      position: relative;
    }`],
})

export class GraphComponent {

  @Input() graphData: any
  node_name: string;

  layout = {
    name: 'dagre',
    rankDir: 'LR',
    directed: true,
    padding: 0
  };

  constructor() {
    console.log("EEEEE");
    // TODO assign weights, shapes and colors to nodes
    console.log(this.graphData);
  }

  nodeChange(event) {
    this.node_name = event;
  }

}
