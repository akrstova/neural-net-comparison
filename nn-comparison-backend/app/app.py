from flask import Flask, request
from flask_cors import CORS, cross_origin
import networkx as nx
from networkx.readwrite import json_graph
import gmatch4py as gm

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['CORS_HEADERS'] = 'Content-Type'


@app.route('/compare', methods=['POST'])
@cross_origin()
def compare_models():
    graphs = request.get_json()
    first_graph = graphs['firstGraph']
    second_graph = graphs['secondGraph']
    first_graph_x = json_graph.node_link_graph(first_graph)
    second_graph_x = json_graph.node_link_graph(second_graph)
    ged = gm.GraphEditDistance(1, 1, 1, 1)
    result = ged.compare([first_graph_x, second_graph_x], None)
    return result


if __name__ == '__main__':
    app.run(port=5000, host='0.0.0.0')
