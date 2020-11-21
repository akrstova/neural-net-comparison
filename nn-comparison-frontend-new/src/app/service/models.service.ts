import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Network} from '../model/network/network-model.model';

@Injectable()
export class ModelsService {
  baseUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  getLocalModels(): any {
    return this.http.get('http://localhost:5000/models');
  }

  getModelIds(): any {
    return this.http.get(this.baseUrl + '/model-ids');
  }

  getDetailsForModelId(modelId): any {
    return this.http.get(this.baseUrl + '/model/' + modelId);
  }

  getGraphForModelId(modelId) {
    return this.http.get(this.baseUrl + '/model/' + modelId + '/graph');
  }

  getGraphAsCytoscape(graph) {
    console.log(graph)
    return this.http.post('http://localhost:5000/cytoscape', graph)
  }
}
