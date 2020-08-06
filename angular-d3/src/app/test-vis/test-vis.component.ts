import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';


@Component({
  selector: 'app-test-vis',
  templateUrl: './test-vis.component.html',
  styleUrls: ['./test-vis.component.css']
})
export class TestVisComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    d3.json('http://localhost:8080/model-ids').then(data => console.log(data));
  }

}
