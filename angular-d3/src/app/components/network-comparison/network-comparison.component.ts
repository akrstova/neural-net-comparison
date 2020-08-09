import { Component, OnInit } from '@angular/core';
import {ModelsService} from '../../service/models.service';
import {Observable, of, Subject} from 'rxjs';
import {Network} from '../../model/network/network-model.model';
import {DropdownOption} from '../../model/options/dropdown-option.model';
import {map} from 'rxjs/operators';

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
  graphChangedEvent: Subject<void> = new Subject<void>();

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
   console.log('WAITING FOR 1', this.firstModelGraph);
   this.secondModelGraph = await this.getGraphForModelId(this.secondModelId);
   console.log('WAITING FOR 2', this.secondModelGraph);
   this.graphChangedEvent.next();
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
}
