import {Component, OnInit} from '@angular/core';
import {ModelsService} from "./service/models.service";
import {Network} from "./model/network/network-model.model";
import {ComparisonService} from "./service/comparison.service";

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
  firstModelId = null;
  secondModelId = null;

  algorithms = ['GED', 'REGAL', 'Custom'];
  selectedAlgorithm = 'REGAL'; //default option

  metrics = ['Manhattan', 'Euclidean', 'Cosine']
  selectedMetric = 'Cosine';
  disableMetric = true;

  disableEmbeddings = true;
  useEmbeddings = false;
  node_name: string;

  firstCyGraph = null;
  secondCyGraph = null;

  constructor(private modelsService: ModelsService, private comparisonService: ComparisonService) {
  }

  ngOnInit(): void {
    this.selectAlgorithm();
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
            graph['modelName'] = result['label'];
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
        graph['modelName'] = name;
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

  getCyGraphs() {
    this.modelsService.getGraphAsCytoscape(this.modelGraphs[this.firstModelId]).subscribe(data => {
      this.firstCyGraph = data['cytoscape_graph']['elements'];
    });
    this.modelsService.getGraphAsCytoscape(this.modelGraphs[this.secondModelId]).subscribe(data => {
      this.secondCyGraph = data['cytoscape_graph']['elements'];
    });
  }

  compareModels() {
    this.getCyGraphs();
    let nodeMatches = {}
    const firstGraph = this.modelGraphs[this.firstModelId];
    const secondGraph = this.modelGraphs[this.secondModelId];
    this.comparisonService.compareGraphs(firstGraph, secondGraph, this.selectedAlgorithm, this.selectedMetric, this.useEmbeddings)
      .subscribe(data => {
        let result = data['data'];
        for (let key in result) {
          if (result.hasOwnProperty(key))
            nodeMatches[firstGraph.nodes[parseInt(key)]['id']] = secondGraph.nodes[result[key]]['id'];
        }
      });
  }

  resetComparison() {
    window.location.reload();
  }
}
