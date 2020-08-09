import {Component, Input, OnInit} from '@angular/core';
import {Network} from '../../model/network/network-model.model';

@Component({
  selector: 'app-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.css']
})
export class NetworkComponent implements OnInit {

  @Input() graph: Network;

  constructor() { }

  ngOnInit(): void {
  }

}
