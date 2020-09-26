import {NetworkLink} from './network-link.model';
import {NetworkNode} from './network-node.model';

export class Network {
  directed: boolean;
  graph: any;
  links: NetworkLink[];
  multigraph: boolean;
  nodes: NetworkNode[];
}
