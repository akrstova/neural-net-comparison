import {Component, Input, OnInit} from '@angular/core';
import {NetworkNode} from '../../../model/network/network-node.model';

@Component({
  selector: 'app-general-layer',
  templateUrl: './general-layer.component.html',
  styleUrls: ['./general-layer.component.css']
})
export class GeneralLayerComponent implements OnInit {

  @Input() networkNodeData: NetworkNode;

  constructor() { }

  ngOnInit(): void {
  }

}
