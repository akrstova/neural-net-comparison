import { Component, OnInit } from '@angular/core';
import {ModelsService} from '../../service/models.service';
import {Subject} from 'rxjs';
import {Network} from '../../model/network/network-model.model';
import {DropdownOption} from '../../model/options/dropdown-option.model';

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

  constructor(private modelsService: ModelsService) { }

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
      });
  }

  async loadGraphs() {
    this.getGraphForModelId(this.firstModelId).then((graph) => {
      this.firstModelGraph = graph;
      this.firstGraphChangedEvent.next(this.firstModelGraph);
    });
    this.getGraphForModelId(this.secondModelId).then((graph) => {
      this.secondModelGraph = graph;
      this.compareModels(this.firstModelGraph, this.secondModelGraph);
      this.secondGraphChangedEvent.next(this.secondModelGraph);
    });
  }

  async selectModel() {
    this.filteredModels = this.allModels.filter(model => model.modelId !== this.firstModelId);
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
        }
      }
  }
}
