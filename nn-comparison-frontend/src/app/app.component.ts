import {Component, ComponentFactoryResolver, OnInit} from '@angular/core';
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

  attributes = [
    {
      name: "index",
      weight: 1
    },
    {
      name: "name",
      weight: 1
    }, {
      name: "clsName",
      weight: 1
    }, {
      name: "inputShape",
      weight: 1
    }, {
      name: "outputShape",
      weight: 1
    }, {
      name: "numParameter",
      weight: 1
    }
  ]

  firstCyGraph = null;
  secondCyGraph = null;
  nodeMatches = {};  // Matches G1 --> G2
  reverseNodeMatches = {}; // Matches G2 --> G1
  attributeDistanceMatrix = null;

  forceDirected: boolean = false;


  constructor(private componentFactoryResolver: ComponentFactoryResolver,
              private modelsService: ModelsService, private comparisonService: ComparisonService) {
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
    let firstGraph = this.modelGraphs[this.firstModelId];
    let secondGraph = this.modelGraphs[this.secondModelId];
    firstGraph.nodes = this.flattenKeys(firstGraph.nodes);
    secondGraph.nodes = this.flattenKeys(secondGraph.nodes);
    this.comparisonService.compareGraphs(firstGraph, secondGraph, this.selectedAlgorithm, this.selectedMetric, this.attributes)
      .subscribe(data => {
        this.attributeDistanceMatrix = data['distance_matrix'];
        this.nodeMatches = this.parseNodeMatches(data['matches_g1_g2'], firstGraph, secondGraph);
        if (data['matches_g2_g1'] != null)
          this.reverseNodeMatches = this.parseNodeMatchesReverse(data['matches_g2_g1'], firstGraph, secondGraph);
        else
          this.reverseNodeMatches = this.nodeMatches;
      });
  }

  // TODO merge two functions in one with 'direction' argument
  parseNodeMatches(data, firstGraph, secondGraph) {
    let matches = {};
    for (let key in data) {
      if (data.hasOwnProperty(key)) {
        const firstGraphNodeId = firstGraph.nodes[parseInt(key)]['id'];
        let topSimilarNodes = data[key];
        matches[firstGraphNodeId] = [];
        for (let i in topSimilarNodes) {
          matches[firstGraphNodeId].push({
            id: secondGraph.nodes[topSimilarNodes[i][1]]['id'],
            score: topSimilarNodes[i][0]
          })
        }
      }
    }
    return matches;
  }

  parseNodeMatchesReverse(data, firstGraph, secondGraph) {
    let matches = {};
    for (let key in data) {
      if (data.hasOwnProperty(key)) {
        const secondGraphId = secondGraph.nodes[parseInt(key)]['id'];
        let topSimilarNodes = data[key];
        matches[secondGraphId] = [];
        for (let i in topSimilarNodes) {
          matches[secondGraphId].push({
            id: firstGraph.nodes[topSimilarNodes[i][1]]['id'],
            score: topSimilarNodes[i][0]
          })
        }
      }
    }
    return matches;
  }

  flattenKeys(data) {
    let nodes = [];
    for (let i in data) {
      let newData = {}
      let node = data[i];
      Object.keys(node).forEach(key => {
        if (typeof node[key] === 'object' && node[key] !== null && !Array.isArray(node[key])) {
          Object.keys(node[key]).forEach(k => {
            newData[k] = node[key][k];
          })
        } else {
          newData[key] = node[key]
        }
      });
      nodes.push(newData)
    }
    return nodes;
  }

  attributeSliderChanged(item, event) {
    const modifiedIndex = this.attributes.findIndex(el => el.name == item.name);
    this.attributes[modifiedIndex].weight = event.value;
  }

  resetComparison() {
    window.location.reload();
  }

  layoutChanged(event: any) {
    this.forceDirected = event.checked;
  }
}
