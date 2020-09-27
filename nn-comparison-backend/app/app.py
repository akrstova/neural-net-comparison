from flask import Flask, request
from flask_cors import CORS, cross_origin
from networkx.readwrite import json_graph

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['CORS_HEADERS'] = 'Content-Type'


@app.route('/compare', methods=['POST'])
@cross_origin()
def compare_models():
    graphs = request.get_json()
    first_graph = graphs['firstGraph']
    first_graph_x = json_graph.node_link_graph(first_graph)
    print(first_graph_x)
    return 'TODO'


if __name__ == '__main__':
    app.run(port=5000, host='0.0.0.0')
