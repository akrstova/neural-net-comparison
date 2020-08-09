import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Network} from '../model/network/network-model.model';

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

  async getGraphForModelId(modelId) {
    return await this.http.get<Network>(this.baseUrl + '/model/' + modelId + '/graph').toPromise();
  }

}
