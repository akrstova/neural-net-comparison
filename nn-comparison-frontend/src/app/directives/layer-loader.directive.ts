import {Directive, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[appLayerLoader]'
})
export class LayerLoaderDirective {

  constructor(public viewContainerRef: ViewContainerRef) { }

}
