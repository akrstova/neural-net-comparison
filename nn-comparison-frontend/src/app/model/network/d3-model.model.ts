import {InputShape} from "./input-shape";
import {flatten} from "@angular/compiler";

export class D3Model {
    svg: any;
   w = window.innerWidth;
   h = window.innerHeight;

   color1 = '#e0e0e0';
   color2 = '#a0a0a0';
   borderWidth = 1.0;
   borderColor = "black";
   rectOpacity = 0.8;
   betweenSquares = 8;
   betweenLayers = [];
   betweenLayersDefault = 12;

   architecture = [];
   lenet = {
     rects: undefined,
     convs: undefined,
     conv_links: undefined,
     fc_layers: undefined,
     fc_links: undefined
   };
   layer_offsets = [];
   largest_layer_width = 0;
   showLabels = true;

   rect;
   conv;
   link;
   poly;
   line;
   text;
   info;

  constructor(svg, nodes) {
    this.svg = svg;
    this.architecture = nodes;
  }

  getInputShape(inputShape): InputShape {
    const obj = {} as InputShape;
    if (inputShape.length === 4) {
      obj.width = inputShape[1];
      obj.height = inputShape[2];
      obj.depth = inputShape[3];
    } else if (inputShape.length === 2) {
      obj.width = 1;
      obj.height = inputShape[1];
      obj.depth = 1;
    }
    return obj;
  }

  drawElements() {
    console.log(this.architecture);
    let label = "";

    const g = this.svg.append("g");

    g.selectAll('*').remove();

    // lenet.rects = architecture.map((layer, layer_index) => range(layer['numberOfSquares']).map(rect_index => {return {'id':layer_index+'_'+rect_index,'layer':layer_index,'rect_index':rect_index,'width':layer['squareWidth'],'height':layer['squareHeight']}}));

    let inputShapes = this.architecture.map((layer, layer_index) => this.getInputShape(layer['inputShape']));
    console.log('input shapes');
    console.log(inputShapes)
    this.lenet.rects = this.architecture
      .filter((layer) =>
        layer['name'] !== 'Dense' && layer['name'] !== 'Flatten'
      )
      .map((layer, layer_index) => [Array.from(Array(inputShapes[layer_index]['depth']).keys())]
      .map(rect_index => {
        return {
          'id': layer_index+'_'+rect_index,
          'layer':layer_index,
          'rect_index':rect_index,
          'width': inputShapes[layer_index]['width'],
          'height': inputShapes[layer_index]['height']
        }
      }));
    this.lenet.rects = [].concat(...this.lenet.rects);
    console.log('flattened')
    console.log(this.lenet.rects);

    this.lenet.fc_layers = this.architecture
      .filter((layer) => layer['name'] == 'Dense' || layer['name'] == 'Flatten')
      .map((layer, layer_index) => {return {
        'id': 'fc_'+layer_index,
        'layer':layer_index,
        'height': inputShapes[layer_index]['height']
      }});

    this.lenet.fc_links = this.lenet.fc_layers.map(fc =>
    { return [Object.assign({'id':'link_'+fc['layer']+'_0','i':0,'prevSize':10},fc),
      Object.assign({'id':'link_'+fc['layer']+'_1','i':1,'prevSize':10},fc)]});

    this.lenet.fc_links = [].concat(...this.lenet.fc_links);
    this.lenet.fc_links[0]['prevSize'] = 0;                            // hacks
    this.lenet.fc_links[1]['prevSize'] = this.lenet.rects[this.lenet.rects.length - 1]['width'];  // hacks


    this.rect = g.selectAll(".rect")
      .data(this.lenet.rects)
      .enter()
      .append("rect")
      .attr("class", "rect")
      .attr("id", d => d.id)
      .attr("width", d => d.width)
      .attr("height", d => d.height);

    this.poly = g.selectAll(".poly")
      .data(this.lenet.fc_layers)
      .enter()
      .append("polygon")
      .attr("class", "poly")
      .attr("id", d => d.id);

    this.line = g.selectAll(".line")
      .data(this.lenet.fc_links)
      .enter()
      .append("line")
      .attr("class", "line")
      .attr("id", d => d.id);
  }

  positionElements() {

  }

   flatten(arr, result = []) {
    for (let i = 0, length = arr.length; i < length; i++) {
      const value = arr[i];
      if (Array.isArray(value)) {
        this.flatten(value, result);
      } else {
        result.push(value);
      }
    }
    return result;
  };
}

