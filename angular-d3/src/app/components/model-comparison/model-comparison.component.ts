import { Component, OnInit } from '@angular/core';
import {ModelsService} from '../../service/models.service';

@Component({
  selector: 'app-model-comparison',
  templateUrl: './model-comparison.component.html',
  styleUrls: ['./model-comparison.component.css']
})
export class ModelComparisonComponent implements OnInit {

  allModels = [];
  filteredModels = ['Please select first model'];
  firstModel: any;
  secondModel: any;

  constructor(private modelsService: ModelsService) { }

  ngOnInit(): void {
    this.getAvailableModels();
  }

  getAvailableModels(): void {
    return this.modelsService.getModelIds()
      .subscribe(data => {
        data.map((entry) => {
          this.getDetailsForModelId(entry).subscribe(result => {
            this.allModels.push(result.label);
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
    const graph = this.getGraphForModelId(selectedId);
    console.log(graph);
  }

  getDetailsForModelId(modelId): any {
    return this.modelsService.getDetailsForModelId(modelId);
  }

  getGraphForModelId(modelId): any {
    return this.modelsService.getGraphForModelId(modelId);
  }
}
