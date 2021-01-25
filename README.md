# Neural Networks Comparison
This repository contains the code to a prototype visualization system for comparing neural network models represented as graphs. Note that the code is under continuous development and therefore some parts might not be optimal yet :) 

### Running the project
1. Clone the iNNspector-backend and iNNspector-models repositories and start the Docker containers by running:
```docker-compose start```
This repository contains the structural graphs of some of the example neural network models reported in the paper.

2. Make sure you have all the dependencies installed. 
TODO: 

3. Run the backend application using:
```python nn-comparison-backend/app/app.py```

4. To run the frontend application, start the Angular server by executing
```npm start```
in ```nn-comparison-frontend```.

### TODO
- Add ```requirements.txt``` file
- Dockerize application and deploy on Netlify