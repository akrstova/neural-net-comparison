import itertools
import networkx as nx
import json
import jsonpickle
from networkx.readwrite import json_graph
from flask import Flask, request, jsonify
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
    result = nx.graph_edit_distance(first_graph_x, second_graph_x)
    g1_embedded = assign_positions_to_nodes(create_graph_embedding(first_graph_x))
    g2_embedded = assign_positions_to_nodes(create_graph_embedding(second_graph_x))
    g1_embedded = comparison(g1_embedded, g2_embedded)
    return jsonpickle.dumps({'g1': g1_embedded, 'g2': g2_embedded})


def simple_comparison(g1_embedded, g2_embedded):
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


def comparison(g1, g2):
    last_matched_pos = -1
    for i in range(len(g1)):
        cur_node = g1[i]
        for j in range(last_matched_pos + 1, len(g2)):
            if cur_node.name == g2[j].name:
                last_matched_pos = j
                print("Node {} {} at pos {} from G1 corresponds to node {} {} from G2 at pos".format(cur_node.name,
                                                                                                     cur_node.id,
                                                                                                     cur_node.position,
                                                                                                     g2[j].name,
                                                                                                     g2[j].id,
                                                                                                     g2[j].position))
                cur_node.match_id = g2[j].id
                break
    return g1


def create_graph_embedding(graph):
    embeddings = []
    for id in graph.nodes:
        node = graph.nodes[id]
        in_degree = graph.in_degree(id)
        out_degree = graph.out_degree(id)
        if node['clsName'] != '':
            embeddings.append(NodeEmbedding(id, node['clsName'], in_degree, out_degree))
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
