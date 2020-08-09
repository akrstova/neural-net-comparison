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
   this.firstModelGraph = await this.getGraphForModelId(this.firstModelId);
   this.firstGraphChangedEvent.next();

  }

  async selectModel() {
    if (this.firstModelId != null && this.secondModelId != null) {
      await this.loadGraphs();
    }
  }

  async selectFirstModel() {
    this.filteredModels = this.allModels.filter(model => model.modelId !== this.firstModelId);
    this.getGraphForModelId(this.firstModelId).then((graph) => {
      this.firstGraphChangedEvent.next(graph);
    });
  }

  async selectSecondModel() {
    this.getGraphForModelId(this.secondModelId).then((graph) => {
      this.secondGraphChangedEvent.next(graph);
    });
  }


  getDetailsForModelId(modelId): any {
    return this.modelsService.getDetailsForModelId(modelId);
  }

  async getGraphForModelId(modelId): Promise<Network> {
    return await this.modelsService.getGraphForModelId(modelId);
  }
}
