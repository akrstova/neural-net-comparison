import { Component, OnInit } from '@angular/core';
import {ModelsService} from '../../service/models.service';
import {Observable} from 'rxjs';
import {Network} from '../../model/network/network-model.model';
import {DropdownOption} from '../../model/options/dropdown-option.model';

@Component({
  selector: 'app-model-comparison',
  templateUrl: './network-comparison.component.html',
  styleUrls: ['./network-comparison.component.css']
})
export class NetworkComparisonComponent implements OnInit {

  allModels = [];
  filteredModels = [];
  firstModel: null;
  secondModel: null;

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
    this.filteredModels = this.allModels.filter(model => model !== this.firstModel);
    this.drawModel(this.firstModel);
    if (this.secondModel !== null) {
      this.drawModel(this.secondModel);
    }
  }

  drawModel(selectedId): any {
    const graph = this.getGraphForModelId(selectedId).subscribe(graph => {
      console.log('Graph');
      console.log(graph);
    });
  }

  getDetailsForModelId(modelId): any {
    return this.modelsService.getDetailsForModelId(modelId);
  }

  getGraphForModelId(modelId): Observable<Network> {
    return this.modelsService.getGraphForModelId(modelId);
  }
}
