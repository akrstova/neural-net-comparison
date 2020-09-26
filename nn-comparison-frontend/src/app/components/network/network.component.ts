import {AfterViewInit, Component, ComponentFactoryResolver, Input, OnInit, ViewChild} from '@angular/core';
import {Network} from '../../model/network/network-model.model';
import {LayerLoaderDirective} from '../../directives/layer-loader.directive';
import {GeneralLayerComponent} from '../layers/general-layer/general-layer.component';
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
  @ViewChild(LayerLoaderDirective, {static: true}) layerLoader: LayerLoaderDirective;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) {}

  ngAfterViewInit(): void {
    this.eventsSubscription = this.events.subscribe((data) => {
      this.loadNetworkLayers(data);
    });
  }

  loadNetworkLayers(data): void {
    if (data != null) {
      for (const node of data.nodes) {
        const layer = new NetworkItem(GeneralLayerComponent, node as NetworkNode);
        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(layer.component);

        const viewContainerRef = this.layerLoader.viewContainerRef;

        const componentRef = viewContainerRef.createComponent<GeneralLayerComponent>(componentFactory);
        componentRef.instance.networkNodeData = layer.data;
      }
    }
  }
}
