import {Component, OnInit} from '@angular/core';
import {ModelsService} from '../../service/models.service';
import {Subject} from 'rxjs';
import {Network} from '../../model/network/network-model.model';
import {DropdownOption} from '../../model/options/dropdown-option.model';
import {NetworkNode} from '../../model/network/network-node.model';

@Component({
  selector: 'app-network-comparison',
  templateUrl: './network-comparison.component.html',
  styleUrls: ['./network-comparison.component.css']
})
export class NetworkComparisonComponent implements OnInit {

  allModels = [];
  filteredModels = [];
  firstModelId: null;
  secondModelId: null;
  simMeasure = 'Euclidean';
  firstModelGraph = {} as Network;
  secondModelGraph = {} as Network;
  firstGraphChangedEvent: Subject<Network> = new Subject<Network>();
  secondGraphChangedEvent: Subject<Network> = new Subject<Network>();
  defaultOption: any;
  comparisonEnabled: boolean;
  matchesRegal: any;

  constructor(private modelsService: ModelsService) {
    this.defaultOption = new DropdownOption();
    this.defaultOption.modelName = 'Select new model';
  }

  ngOnInit(): void {
    this.getAvailableModels();
  }

  restartComparison() {
    if(this.secondModelId != null) {
      window.location.reload();
    }
  }

  getAvailableModels(): void {
    return this.modelsService.getModelIds()
      .subscribe(data => {
        data.map((entry) => {
          this.getDetailsForModelId(entry).subscribe(result => {
            const model = {} as DropdownOption;
            model.modelId = result.id;
            model.modelName = result.label;
            this.allModels.push(model);
          });
        });
        this.allModels.push(this.defaultOption);
        this.filteredModels.push(this.defaultOption);
      });
  }

  getModelLabelById(id) {
    for (const i in this.allModels) {
      const model = this.allModels[i] as any
      if ((model as any).modelId ==id ) {
        return (model as any).modelName;
      }
    }
  }

  async loadGraphs() {
    this.getGraphForModelId(this.firstModelId).then((graph) => {
      this.firstModelGraph = graph;
      this.firstModelGraph['modelName'] = this.getModelLabelById(this.firstModelId);
    });
    this.getGraphForModelId(this.secondModelId).then(async (graph) => {
      this.secondModelGraph = graph;
      this.secondModelGraph['modelName'] = this.getModelLabelById(this.secondModelId);
    });
  }


  async selectModel() {
    this.filteredModels = this.allModels.filter(model => model.modelId !== this.firstModelId);
    this.filteredModels.push(this.defaultOption);
    if (this.firstModelId != null && this.secondModelId != null) {
      await this.loadGraphs();
      this.comparisonEnabled = true;
    }
  }

  getDetailsForModelId(modelId): any {
    return this.modelsService.getDetailsForModelId(modelId);
  }

  async getGraphForModelId(modelId): Promise<Network> {
    return await this.modelsService.getGraphForModelId(modelId);
  }

  async callRegalComparison() {
    await this.compareRegal(this.firstModelGraph, this.secondModelGraph, this.simMeasure);
    await this.firstGraphChangedEvent.next(this.firstModelGraph);
    this.secondGraphChangedEvent.next(this.secondModelGraph);
  }

  async compareRegal(firstGraph, secondGraph, simMeasure) {
    const data = await this.modelsService.compareGraphsRegal(this.firstModelGraph, this.secondModelGraph, simMeasure).toPromise();
    this.matchesRegal = data['data'];
    console.log(data);
  }

  async callNetworkxComparison() {
    console.log(this.firstModelGraph);
    console.log(this.secondModelGraph);
    await this.compareNetworkx(this.firstModelGraph, this.secondModelGraph);
    await this.firstGraphChangedEvent.next(this.firstModelGraph);
    this.secondGraphChangedEvent.next(this.secondModelGraph);
  }

  async compareNetworkx(firstGraph, secondGraph) {
    const data = await this.modelsService.compareGraphsNetworkX(this.firstModelGraph, this.secondModelGraph).toPromise();
    firstGraph.nodes = data['g1'];
    secondGraph.nodes = data['g2'];
    this.makeGraphsSameLength(firstGraph, secondGraph);
  }

  async callCustomComparison() {
    await this.compareCustom(this.firstModelGraph, this.secondModelGraph);
    await this.firstGraphChangedEvent.next(this.firstModelGraph);
    this.secondGraphChangedEvent.next(this.secondModelGraph);
  }


  async compareCustom(firstGraph, secondGraph) {
    const data = await this.modelsService.compareGraphsSimple(this.firstModelGraph, this.secondModelGraph).toPromise();
    firstGraph.nodes = data['g1'];
    secondGraph.nodes = data['g2'];
    for (let i = 0; i < firstGraph.nodes.length; i++) {
      const current = firstGraph.nodes[i] as NetworkNode;
      if (current.match_id) {
        const matchId = this.getIndexOfMatchedNode(current.match_id, secondGraph);
        for (let j = i; j < matchId; j++) {
          const insertedNode = this.createEmptyNode();
          insertedNode['position'] = j;
          firstGraph.nodes.splice(j, 0, insertedNode);
        }
      }
    }
    this.makeGraphsSameLength(firstGraph, secondGraph);
  }

  async callIGraphComparison() {
    await this.compareIGraph(this.firstModelGraph, this.secondModelGraph);
    await this.firstGraphChangedEvent.next(this.firstModelGraph);
    this.secondGraphChangedEvent.next(this.secondModelGraph);
  }

  async compareIGraph(firstGraph, secondGraph) {
    const data = await this.modelsService.compareGraphsIGraph(this.firstModelGraph, this.secondModelGraph).toPromise();
  }

  makeGraphsSameLength(firstGraph, secondGraph) {
    const node = this.createEmptyNode();
    if (firstGraph.nodes.length < secondGraph.nodes.length) {
      for (let i = firstGraph.nodes.length; i < secondGraph.nodes.length; i++) {
        node['position'] = i;
        firstGraph.nodes.push(node);
      }
    } else {
      for (let i = secondGraph.nodes.length; i < firstGraph.nodes.length; i++) {
        node['position'] = i;
        secondGraph.nodes.push(node);
      }
    }
  }

  getIndexOfMatchedNode(nodeId, graph) {
    for (let i = 0; i < graph.nodes.length; i++) {
      const current = graph.nodes[i] as NetworkNode;
      if (current.id === nodeId) {
        return current.position;
      }
    }
  }

  createEmptyNode() {
    const node = new NetworkNode();
    node.clsName = '';
    node.config = null;
    node.inputShape = [];
    node.name = '';
    node.id = '1';
    node.numParameter = 0;
    return node;
  }

}
