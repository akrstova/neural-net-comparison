import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Network} from '../model/network/network-model.model';

@Injectable()
export class ModelsService {
  baseUrl = 'http://localhost:8080';
  httpOptions: any;

  constructor(private http: HttpClient) {
  }

  getModelIds(): any {
    return this.http.get(this.baseUrl + '/model-ids');
  }

  getDetailsForModelId(modelId): any {
    return this.http.get(this.baseUrl + '/model/' + modelId);
  }

  async getGraphForModelId(modelId) {
    return await this.http.get<Network>(this.baseUrl + '/model/' + modelId + '/graph').toPromise();
  }

  compareGraphsNetworkX(firstModelGraph: Network, secondModelGraph: Network) {
    const graphsJson = {'firstGraph': firstModelGraph, 'secondGraph': secondModelGraph};
    this.httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }
    return this.http.post('http://localhost:5000/compare', JSON.stringify(graphsJson), this.httpOptions)
  }
}
