import {NetworkNode} from './network-node.model';
import {Type} from '@angular/core';

export class NetworkItem {
  constructor(public component: Type<any>, public data: NetworkNode) {
  }
}
