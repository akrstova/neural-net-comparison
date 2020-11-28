import json
import os
from os import listdir
from os.path import join, isfile
from random import randint
import numpy as np
import itertools
import networkx as nx
import pickle
import jsonpickle
from networkx.readwrite import json_graph
from scipy import spatial
from matplotlib import pyplot as plt
import seaborn as sb
import igraph

from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import requests

from app.model.NodeEmbedding import NodeEmbedding

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['CORS_HEADERS'] = 'Content-Type'
embeddings_g1 = None
embeddings_g2 = None
subst_cost_list = list()


@app.route('/cytoscape', methods=['POST'])
@cross_origin()
def cytoscape():
    graph = request.get_json()
    cy = nx.cytoscape_data(json_graph.node_link_graph(graph))
    print(cy)
    nodes = cy['elements']['nodes']
    for node in nodes:
        node['data']['weight'] = 100
        node['data']['colorCode'] = '#fcba03'
        node['data']['color'] = 'black'
        node['data']['shapeType'] = 'roundrectangle'
        node['data']['label'] = node['data']['clsName']
    cy['elements']['nodes'] = nodes

    edges = cy['elements']['edges']
    for edge in edges:
        edge['data']['colorCode'] = '#cfccc8'
        edge['data']['strength'] = 10
    cy['elements']['edges'] = edges

    return jsonpickle.dumps({'cytoscape_graph': cy})


@app.route('/models', methods=['GET'])
@cross_origin()
def serve_models():
    path = '.'
    model_files = [f for f in listdir(path) if isfile(join(path, f)) and f.endswith('.json')]
    models = []
    for file in model_files:
        with open(file) as f:
            models.append({'modelName': file, 'model': json.load(f)})
    return jsonpickle.dumps({'localModels': models})


@app.route('/igraph', methods=['POST'])
@cross_origin()
def compare_models_igraph():
    graphs = request.get_json()
    first_graph = graphs['firstGraph']
    second_graph = graphs['secondGraph']
    first_graph_x = add_degree_info_to_nodes(json_graph.node_link_graph(first_graph))
    second_graph_x = add_degree_info_to_nodes(json_graph.node_link_graph(second_graph))
    num_nodes_first = len(first_graph_x.nodes)
    num_nodes_second = len(second_graph_x.nodes)
    diff = abs(num_nodes_first - num_nodes_second)
    if num_nodes_first > num_nodes_second:
        for i in range(diff):
            new_node = randint(1000, 9999)
            second_graph_x.add_node(new_node)
            second_graph_x.add_edge(list(second_graph_x.nodes.keys())[-2],
                                    new_node)
    elif num_nodes_first < num_nodes_second:
        for i in range(diff):
            new_node = randint(1000, 9999)
            first_graph_x.add_node(new_node)
            first_graph_x.add_edge(list(first_graph_x.nodes.keys())[-2],
                                   new_node)
    first_igraph = igraph.Graph.from_networkx(first_graph_x)
    second_igraph = igraph.Graph.from_networkx(second_graph_x)
    result = first_igraph.isomorphic_bliss(second_igraph, return_mapping_12=True, return_mapping_21=True)
    print(result)


@app.route('/networkx', methods=['POST'])
@cross_origin()
def compare_models_networkx():
    global subst_cost_list
    subst_cost_list = list()
    graphs = request.get_json()
    first_graph = graphs['firstGraph']
    second_graph = graphs['secondGraph']
    first_graph_x = add_degree_info_to_nodes(json_graph.node_link_graph(first_graph))
    second_graph_x = add_degree_info_to_nodes(json_graph.node_link_graph(second_graph))
    matrix_file, attributes_file, true_alignments_file = generate_regal_files(first_graph_x, second_graph_x,
                                                                              first_graph['modelName'],
                                                                              second_graph['modelName'])
    to_send = {
        'matrix': os.path.abspath(matrix_file),
        'attributes': os.path.abspath(attributes_file),
        'alignments': os.path.abspath(true_alignments_file),
        'g1_nodes': len(first_graph_x.nodes),
        'g2_nodes': len(second_graph_x.nodes),
        'sim_measure': 'Euclidean'
    }
    embeddings = requests.post('http://localhost:8000/embeddings', json=to_send)
    embeddings_arr = np.array(json.loads(embeddings.content))
    global embeddings_g1
    embeddings_g1 = embeddings_arr[:len(first_graph_x.nodes)]
    global embeddings_g2
    embeddings_g2 = embeddings_arr[len(first_graph_x.nodes):]
    g1_mapped = compare_networkx(first_graph_x, second_graph_x, embeddings=True)
    unmatched_nodes_g2 = list(set(second_graph_x.nodes) - set(g1_mapped.values()))
    if len(unmatched_nodes_g2) > 0:
        print('Unmatched ', unmatched_nodes_g2)
        for unmatched in unmatched_nodes_g2:
            index = second_graph_x.nodes[unmatched]['index']
            first_graph['nodes'].insert(index, create_empty_node())
    return jsonpickle.dumps({'g1': first_graph['nodes'], 'g2': second_graph['nodes']})


@app.route('/simple', methods=['POST'])
@cross_origin()
def compare_models():
    graphs = request.get_json()
    first_graph = graphs['firstGraph']
    second_graph = graphs['secondGraph']
    first_graph_x = add_degree_info_to_nodes(json_graph.node_link_graph(first_graph))
    second_graph_x = add_degree_info_to_nodes(json_graph.node_link_graph(second_graph))
    g1_embedded = assign_positions_to_nodes(create_graph_embedding(first_graph_x))
    g2_embedded = assign_positions_to_nodes(create_graph_embedding(second_graph_x))
    g1_embedded = comparison(g1_embedded, g2_embedded)
    return jsonpickle.dumps({'g1': g1_embedded, 'g2': g2_embedded})


@app.route('/regal', methods=['POST'])
@cross_origin()
def compare_models_regal():
    data = request.get_json()
    first_graph = data['firstGraph']
    second_graph = data['secondGraph']
    sim_measure = data['simMeasure']
    first_graph_x = add_degree_info_to_nodes(json_graph.node_link_graph(first_graph))
    second_graph_x = add_degree_info_to_nodes(json_graph.node_link_graph(second_graph))
    matrix_file, attributes_file, true_alignments_file = generate_regal_files(first_graph_x, second_graph_x,
                                                                              first_graph['modelName'],
                                                                              second_graph['modelName'])
    to_send = {
        'matrix': os.path.abspath(matrix_file),
        'attributes': os.path.abspath(attributes_file),
        'alignments': os.path.abspath(true_alignments_file),
        'g1_nodes': len(first_graph_x.nodes),
        'g2_nodes': len(second_graph_x.nodes),
        'sim_measure': sim_measure
    }
    matched_nodes = requests.post('http://localhost:8000/regal', json=to_send)
    return jsonpickle.dumps({'data': json.loads(matched_nodes.content)})


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


def compare_networkx(g1, g2, embeddings=False):
    if not embeddings:
        paths, cost = nx.optimal_edit_paths(g1, g2, node_match=equal_nodes, node_del_cost=node_del,
                                            node_ins_cost=node_ins,
                                            node_subst_cost=node_subst)

    else:
        paths, cost = nx.optimal_edit_paths(g1, g2, node_match=equal_nodes, node_del_cost=node_del,
                                            node_ins_cost=node_ins,
                                            node_subst_cost=node_subst_embeddings)
    # Visualize subst cost
    global subst_cost_list
    subst_cost_list = np.array(subst_cost_list)
    subst_cost_list = np.reshape(subst_cost_list, (len(g1.nodes), len(g2.nodes)))
    for n in range(len(g1.nodes)):
        plt.plot(subst_cost_list[n])
        plt.ylabel('Cost for matching node {}'.format(n))
        plt.show()
    g1_mapped = {}
    for tup in paths[0][0]:
        if tup[0] is not None and tup[1] is not None:
            print(get_node_by_id(g1, tup[0])['name'], " corresponds to ", get_node_by_id(g2, tup[1])['name'])
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
    return n1['config']['name'] == n2['config']['name'] and n1['in_degree'] == n2['in_degree'] and n1['out_degree'] == \
           n2['out_degree']


def node_subst(n1, n2):
    cost = compute_similarity_nodes(n1, n2)
    global subst_cost_list
    subst_cost_list.append(cost)
    return cost


def node_subst_embeddings(n1, n2):
    cost = compute_similarity_node_embeddings(embeddings_g1[n1['index']], embeddings_g2[n2['index']])
    global subst_cost_list
    subst_cost_list.append(cost)
    return cost


def node_del(n1):
    return 4


def node_ins(n1):
    return 5


def compute_similarity_node_embeddings(e1, e2):
    return spatial.distance.cosine(e1.tolist(), e2.tolist())


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
    return int(node1['clsName'] != node2['clsName']) + abs(node1['in_degree'] - node2['in_degree']) + abs(
        node1['out_degree'] - node2['out_degree'])


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
    A1_stack = np.hstack((A1, zero_A1))
    A2_stack = np.hstack((zero_A2, A2))
    shape_diff = np.subtract(A1_stack.shape, A2_stack.shape)
    if shape_diff is not None:
        # G1 has more nodes
        if shape_diff[0] > 0:
            A2_stack = np.pad(A2_stack, ((shape_diff[0], 0), (0, shape_diff[1])), mode='constant')
        else:
            A1_stack = np.pad(A1_stack, ((0, abs(shape_diff[0])), (0, abs(shape_diff[1]))), mode='constant')

    combined_adj_mat = np.vstack((A1_stack, A2_stack))
    print(combined_adj_mat)
    combined_g = nx.from_numpy_matrix(combined_adj_mat)
    matrix_file = open(id1 + '+' + id2 + '_combined_edges.txt', 'wb')
    nx.write_edgelist(combined_g, matrix_file)
    true_alignments = {
        0: 0,
        1: 1,
        2: 2,
        3: 3,
        4: 4,
        5: 5,
        6: 6
    }
    true_alignments_file = open(id1 + '+' + id2 + '_edges-mapping-permutation.txt', 'wb')
    pickle.dump(true_alignments, true_alignments_file, protocol=2)
    attributes_g1 = nx.get_node_attributes(g1, 'clsName')
    attributes_g2 = nx.get_node_attributes(g2, 'clsName')
    combined_attributes = np.array(list(attributes_g1.values()) + list(attributes_g2.values()))
    combined_attributes_mat = combined_attributes.reshape(len(combined_attributes), 1)
    attributes_file = open(id1 + '+' + id2 + 'attributes.npy', 'wb')
    np.save(attributes_file, combined_attributes_mat)
    return matrix_file.name, attributes_file.name, true_alignments_file.name


if __name__ == '__main__':
    app.run(port=5000, host='0.0.0.0')
