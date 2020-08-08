import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class ModelsService {
  baseUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {
  }

  getModelIds(): any {
    return this.http.get(this.baseUrl + '/model-ids');
  }

  getDetailsForModelId(modelId): any {
    return this.http.get(this.baseUrl + '/model/' + modelId);
  }

  getGraphForModelId(modelId): any {
    return this.http.get(this.baseUrl + '/model/' + modelId + '/graph');
  }

}
