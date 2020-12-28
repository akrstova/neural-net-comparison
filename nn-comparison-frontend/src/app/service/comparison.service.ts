import {Injectable} from "@angular/core";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {BehaviorSubject} from "rxjs";

@Injectable()
export class ComparisonService {
  httpOptions: any;
  baseUrl = 'http://localhost:5000';
  urls = {
    'REGAL': this.baseUrl + '/regal',
    'GED': this.baseUrl + '/networkx'
  }
  public isLoading = new BehaviorSubject(false);

  constructor(private http: HttpClient) {
  }

  compareGraphs(firstGraph, secondGraph, algorithm, metric, attributeWeights, gammaStruct, gammaAttr) {
    let graphsJson = null;
    if (algorithm === 'REGAL') {
      graphsJson = {
        'firstGraph': firstGraph,
        'secondGraph': secondGraph,
        'simMeasure': metric,
        'attributeWeights': attributeWeights,
        'gammaStruct': gammaStruct,
        'gammaAttr': gammaAttr
      };
    } else {
      graphsJson = {
        'firstGraph': firstGraph,
        'secondGraph': secondGraph,
        'simMeasure': metric,
        'attributeWeights': attributeWeights
      }
    }

    this.httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      })
    }
    return this.http.post(this.urls[algorithm], JSON.stringify(graphsJson), this.httpOptions)
  }

}
