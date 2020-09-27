from flask import Flask, request
from flask_cors import CORS, cross_origin
import networkx as nx
from networkx.readwrite import json_graph

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
    result = nx.graph_edit_distance(first_graph_x, second_graph_x, roots=('139798833639120', '139798838186512'))
    return result


if __name__ == '__main__':
    app.run(port=5000, host='0.0.0.0')
