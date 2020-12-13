import {Injectable} from "@angular/core";
import {HttpClient, HttpHeaders} from "@angular/common/http";

@Injectable()
export class ComparisonService {
  httpOptions: any;
  baseUrl = 'http://localhost:5000';
  urls = {
    'REGAL': this.baseUrl + '/regal',
    'GED': this.baseUrl + '/networkx'
  }

  constructor(private http: HttpClient) {
  }

  compareGraphs(firstGraph, secondGraph, algorithm, metric, useEmbeddings) {
    const graphsJson = {'firstGraph': firstGraph, 'secondGraph': secondGraph, 'simMeasure': metric};
    this.httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin':'*'
      })
    }
    return this.http.post(this.urls[algorithm], JSON.stringify(graphsJson), this.httpOptions)
  }

}
