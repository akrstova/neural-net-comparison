import numpy as np
import itertools
import networkx as nx
import pickle
import jsonpickle
from networkx.readwrite import json_graph
from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin

from app.model.NodeEmbedding import NodeEmbedding

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['CORS_HEADERS'] = 'Content-Type'


@app.route('/networkx', methods=['POST'])
@cross_origin()
def compare_models():
    graphs = request.get_json()
    first_graph = graphs['firstGraph']
    second_graph = graphs['secondGraph']
    first_graph_x = add_degree_info_to_nodes(json_graph.node_link_graph(first_graph))
    second_graph_x = add_degree_info_to_nodes(json_graph.node_link_graph(second_graph))
    g1_mapped = compare_networkx(first_graph_x, second_graph_x)
    generate_regal_files(first_graph_x, second_graph_x, first_graph['modelName'], second_graph['modelName'])
    unmatched_nodes_g2 = list(set(second_graph_x.nodes) - set(g1_mapped.values()))
    if len(unmatched_nodes_g2) > 0:
        print('Unmatched ', unmatched_nodes_g2)
        for unmatched in unmatched_nodes_g2:
            index = second_graph_x.nodes[unmatched]['index']
            first_graph['nodes'].insert(index, create_empty_node())
    return jsonpickle.dumps({'g1': first_graph['nodes'], 'g2': second_graph['nodes']})


@app.route('/simple', methods=['POST'])
@cross_origin()
def compare_models_networkx():
    graphs = request.get_json()
    first_graph = graphs['firstGraph']
    second_graph = graphs['secondGraph']
    first_graph_x = add_degree_info_to_nodes(json_graph.node_link_graph(first_graph))
    second_graph_x = add_degree_info_to_nodes(json_graph.node_link_graph(second_graph))
    g1_embedded = assign_positions_to_nodes(create_graph_embedding(first_graph_x))
    g2_embedded = assign_positions_to_nodes(create_graph_embedding(second_graph_x))
    # generate_regal_files(first_graph_x, second_graph_x, first_graph['modelName'], second_graph['modelName'])
    g1_embedded = comparison(g1_embedded, g2_embedded)
    return jsonpickle.dumps({'g1': g1_embedded, 'g2': g2_embedded})


def create_empty_node():
    return {
        'clsName': '',
        'config': {},
        'id': 'empty',
        'inputShape': [],
        'name': '',
        'numParameter': 0,
        'outputShape': []
    }


def compare_networkx(g1, g2):
    paths, cost = nx.optimal_edit_paths(g1, g2, node_match=equal_nodes)
    g1_mapped = {}
    for tup in paths[0][0]:
        if tup[0] is not None and tup[1] is not None:
            print(get_node_by_id(g1, tup[0])['name'], " corresponds to ", get_node_by_id(g2, tup[1])['name'])
            node_g1 = get_node_by_id(g1, tup[0])
            node_g2 = get_node_by_id(g2, tup[1])
            g1_mapped[tup[0]] = tup[1]
    return g1_mapped


def add_degree_info_to_nodes(graph):
    i = 0
    for id in graph.nodes:
        in_degree = graph.in_degree(id)
        out_degree = graph.out_degree(id)
        graph.nodes[id]['in_degree'] = in_degree
        graph.nodes[id]['out_degree'] = out_degree
        graph.nodes[id]['index'] = i
        i += 1
    return graph


def equal_nodes(n1, n2):
    return n1['clsName'] == n2['clsName'] and n1['in_degree'] == n2['in_degree'] and n1['out_degree'] == n2[
        'out_degree']


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
            embeddings.append(NodeEmbedding(id=id, name=node['clsName'], in_degree=in_degree, out_degree=out_degree,
                                            clsName=node['clsName'], inputShape=node['inputShape'],
                                            numParameter=node['numParameter']))
    return embeddings


def compute_similarity_nodes(node1, node2):
    return int(node1.name != node2.name) + abs(node1.in_degree - node2.in_degree) + abs(
        node1.out_degree - node2.out_degree) + abs(node1.position - node2.position)


def assign_positions_to_nodes(graph):
    for i in range(len(graph)):
        graph[i].position = i
    return graph


def get_node_by_id(graph, target_id):
    for id in graph.nodes:
        if id == target_id:
            return graph.nodes[id]


def generate_regal_files(g1, g2, id1, id2):
    A1 = nx.to_numpy_matrix(g1)
    A2 = nx.to_numpy_matrix(g2)
    zero_A1 = np.zeros(A1.shape)
    zero_A2 = np.zeros(A2.shape)
    combined_adj_mat = np.vstack((np.hstack((A1, zero_A1)), np.hstack((zero_A2, A2))))
    print(combined_adj_mat)
    combined_g = nx.from_numpy_matrix(combined_adj_mat)
    matrix_file = open(id1 + '+' + id2 + '_combined_edges.txt', 'wb')
    nx.write_edgelist(combined_g, matrix_file)
    true_alignments = {
        0: 7,
        1: 8,
        2: 9,
        3: 10,
        4: 11,
        5: 12,
        6: 13
    }
    true_alignments_file = open(id1 + '+' + id2 + '_edges-mapping-permutation.txt', 'wb')
    pickle.dump(true_alignments, true_alignments_file, protocol=2)
    attributes_g1 = nx.get_node_attributes(g1, 'clsName')
    attributes_g2 = nx.get_node_attributes(g2, 'clsName')
    combined_attributes = np.array(list(attributes_g1.values())+ list(attributes_g2.values()))
    combined_attributes_mat = combined_attributes.reshape(len(combined_attributes), 1)
    attributes_file = open(id1 + '+' + id2 + 'attributes.npy', 'wb')
    np.save(attributes_file, combined_attributes_mat)



if __name__ == '__main__':
    app.run(port=5000, host='0.0.0.0')
