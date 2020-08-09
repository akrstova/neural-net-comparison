import { Component, OnInit } from '@angular/core';
import {ModelsService} from '../../service/models.service';
import {Observable} from 'rxjs';
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

  selectModel(): void {
    this.filteredModels = this.allModels.filter(model => model !== this.firstModelId);
    if (this.firstModelId != null) {
      console.log(this.firstModelId);
      this.getGraphForModelId(this.firstModelId).subscribe(graph => {
        this.firstModelGraph = graph;
      });
    }
    if (this.secondModelId != null) {
      this.getGraphForModelId(this.secondModelId).subscribe(graph => this.secondModelGraph = graph);
    }
  }

  getDetailsForModelId(modelId): any {
    return this.modelsService.getDetailsForModelId(modelId);
  }

  getGraphForModelId(modelId): Observable<Network> {
    return this.modelsService.getGraphForModelId(modelId);
  }
}
