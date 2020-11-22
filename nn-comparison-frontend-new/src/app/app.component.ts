import {Component, OnInit} from '@angular/core';
import {ModelsService} from "./service/models.service";
import {Network} from "./model/network/network-model.model";

class Model {
  id: string;
  name: string;
  graph: Network;

  constructor(modelId, modelName, graph) {
    this.id = modelId;
    this.name = modelName;
    this.graph = graph;
  }
}


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  // Setup comparison
  modelGroups = {};
  modelGraphs = {}; // Easier for passing graphs to the comparison
  firstModel = null;
  secondModel = null;

  algorithms = ['GED', 'REGAL', 'Custom'];
  selectedAlgorithm = null;

  metrics = ['Manhattan', 'Euclidean', 'Cosine']

  disableMetric = true;
  selectedMetric = null;

  disableEmbeddings = true;
  useEmbeddings = false;
  node_name: string;

  firstCyGraph = null;
  secondCyGraph = null;

  constructor(private modelsService: ModelsService) {
  }

  ngOnInit(): void {
    this.getAvailableModels();
  }

  getAvailableModels() {
    // Get models from iNNspector
    let innspectorModels = [];
    this.modelsService.getModelIds().subscribe(data => {
      data.map((entry) => {
        this.modelsService.getDetailsForModelId(entry).subscribe(result => {
          this.modelsService.getGraphForModelId(result['id']).subscribe(graph => {
            innspectorModels.push(new Model(result['id'], result['label'], graph as Network));
            this.modelGraphs[result['id']] = graph;
          })
        });
      });
      this.modelGroups['innspector'] = innspectorModels;
    });
    // Get locally stored models
    this.modelsService.getLocalModels().subscribe(data => {

      data['localModels'].map((entry) => {
        const id = Math.random().toString(36).substring(7);
        const name = entry['modelName'];
        const graph = entry['model'];
        const model = new Model(id, name, graph);
        // Get base model name from file name and add to corresponding group of model
        const modelType = name.split('_')[0];
        if (!this.modelGroups[modelType])
          this.modelGroups[modelType] = [];
        this.modelGroups[name.split('_')[0]].push(model);
        this.modelGraphs[id] = graph;
      });
    });
  }


  selectAlgorithm() {
    if (this.selectedAlgorithm != "GED" && this.selectedAlgorithm != "REGAL") {
      this.disableMetric = true;
      this.disableEmbeddings = true;
    } else {
      this.disableEmbeddings = false;
      if (this.selectedAlgorithm == "REGAL") {
        this.disableMetric = false;
      }
    }
  }

  compareModels() {
    this.modelsService.getGraphAsCytoscape(this.modelGraphs[this.firstModel]).subscribe(data => {
      this.firstCyGraph = this.addPropertiesToCyGraph(data['cytoscape_graph']['elements']);
      console.log('modified', this.firstCyGraph)
    });
    this.modelsService.getGraphAsCytoscape(this.modelGraphs[this.secondModel]).subscribe(data => {
      this.secondCyGraph = data['cytoscape_graph']['elements'];
    })
  }

  addPropertiesToCyGraph(cyGraph) {
    // Add node properties
    for (const i in cyGraph.nodes) {
      let nodeData = cyGraph.nodes[i];
      nodeData['weight'] = 100;
      nodeData['shapeType'] = 'roundrectangle';
      nodeData['colorCode'] = 'blue';
    }
  }

}
