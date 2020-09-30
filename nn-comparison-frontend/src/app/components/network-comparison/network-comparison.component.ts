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
  firstModelGraph = {} as Network;
  secondModelGraph = {} as Network;
  firstGraphChangedEvent: Subject<Network> = new Subject<Network>();
  secondGraphChangedEvent: Subject<Network> = new Subject<Network>();
  defaultOption: any;

  constructor(private modelsService: ModelsService) {
    this.defaultOption = new DropdownOption();
    this.defaultOption.modelName = 'Select new model';
  }

  ngOnInit(): void {
    this.getAvailableModels();
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

  async loadGraphs() {
    this.getGraphForModelId(this.firstModelId).then((graph) => {
      this.firstModelGraph = graph;
    });
    this.getGraphForModelId(this.secondModelId).then((graph) => {
      this.secondModelGraph = graph;
      this.compareModels(this.firstModelGraph, this.secondModelGraph);
      this.firstGraphChangedEvent.next(this.firstModelGraph);
      this.secondGraphChangedEvent.next(this.secondModelGraph);
    });
  }

  async selectModel() {
    this.filteredModels = this.allModels.filter(model => model.modelId !== this.firstModelId);
    this.filteredModels.push(this.defaultOption);
    if (this.firstModelId != null && this.secondModelId != null) {
      await this.loadGraphs();
    }
  }

  getDetailsForModelId(modelId): any {
    return this.modelsService.getDetailsForModelId(modelId);
  }

  async getGraphForModelId(modelId): Promise<Network> {
    return await this.modelsService.getGraphForModelId(modelId);
  }

  compareModels(firstGraph, secondGraph) {
    if (firstGraph.nodes.length < secondGraph.nodes.length) {
      for (let i = firstGraph.nodes.length; i < secondGraph.nodes.length; i++) {
        secondGraph.nodes[i].added = true;
        const node = this.createEmptyNode();
        firstGraph.nodes.push(node);
      }
    } else {
      for (let i = secondGraph.nodes.length; i < firstGraph.nodes.length; i++) {
        firstGraph.nodes[i].removed = true;
        const node = this.createEmptyNode();
        secondGraph.nodes.push(node);
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

  getModelSimilarity() {
    return this.modelsService.compareGraphsNetworkX(this.firstModelGraph, this.secondModelGraph).subscribe(data => {
      console.log(data);
    });
  }
}
