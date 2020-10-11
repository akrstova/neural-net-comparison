import {AfterViewInit, Component, ComponentFactoryResolver, Input, OnInit, ViewChild} from '@angular/core';
import {Network} from '../../model/network/network-model.model';
import {NetworkNode} from '../../model/network/network-node.model';
import {NetworkItem} from '../../model/network/network-item';
import {Observable, Subscription} from 'rxjs';

@Component({
  selector: 'app-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.css']
})
export class NetworkComponent implements AfterViewInit {

  private eventsSubscription: Subscription;

  @Input() graph: Network;
  @Input() events: Observable<void>;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) {}

  ngAfterViewInit(): void {
    this.eventsSubscription = this.events.subscribe((data) => {
      this.loadNetworkLayers(data);
    });
  }

  loadNetworkLayers(data): void {

  }
}
