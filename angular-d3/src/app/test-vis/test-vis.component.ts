import { Component, OnInit } from '@angular/core';
import {ModelsService} from '../service/models.service';


@Component({
  selector: 'app-test-vis',
  templateUrl: './test-vis.component.html',
  styleUrls: ['./test-vis.component.css']
})
export class TestVisComponent implements OnInit {

  allModels = [];
  filteredModels = ['Please select first model'];

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

  selectFirstModel(selectedValue): void {
    const firstModel = selectedValue.target.value;
    this.filteredModels = this.allModels.filter(model => model !== firstModel);
    this.getDetailsForModelId(firstModel);
  }

  getDetailsForModelId(modelId): any {
    return this.modelsService.getDetailsForModelId(modelId);
  }

}
