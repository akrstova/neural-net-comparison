import itertools
import networkx as nx
from networkx.readwrite import json_graph
from flask import Flask, request
from flask_cors import CORS, cross_origin

from app.model.NodeEmbedding import NodeEmbedding

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
    g1_embedded = assign_positions_to_nodes(create_graph_embedding(first_graph_x))
    g2_embedded = assign_positions_to_nodes(create_graph_embedding(second_graph_x))
    for node in g1_embedded:
        all_pairs = list(itertools.product([node], g2_embedded))
        min = 1000
        match = None
        for pair in all_pairs:
            sim = compute_similarity_nodes(pair[0], pair[1])
            if sim < min:
                min = sim
                match = pair[1]
        print("Node {} corresponds with node {}".format(node.name, match.name))
    return result


def create_graph_embedding(graph):
    embeddings = []
    for id in graph.nodes:
        node = graph.nodes[id]
        in_degree = graph.in_degree(id)
        out_degree = graph.out_degree(id)
        if node['clsName'] != '':
            embeddings.append(NodeEmbedding(node['clsName'], in_degree, out_degree))
    return embeddings


def compute_similarity_nodes(node1, node2):
    return int(node1.name != node2.name) + abs(node1.in_degree - node2.in_degree) + abs(
        node1.out_degree - node2.out_degree) + abs(node1.position - node2.position)


def assign_positions_to_nodes(graph):
    for i in range(len(graph)):
        graph[i].position = i
    return graph


if __name__ == '__main__':
    app.run(port=5000, host='0.0.0.0')
