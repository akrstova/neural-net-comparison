import json
import os
import pickle
from functools import reduce
from os import listdir
from os.path import join, isfile

import jsonpickle
import networkx as nx
import numpy as np
import requests
from Levenshtein import distance as levenshtein_distance
from flask import Flask, request
from flask_cors import CORS, cross_origin
from networkx.readwrite import json_graph
from scipy import spatial

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
    nodes = cy['elements']['nodes']
    i = 0
    for node in nodes:
        node['data']['index'] = i
        node['data']['weight'] = 100
        node['data']['colorCode'] = '#bab8b8'
        node['data']['color'] = 'black'
        node['data']['shapeType'] = 'roundrectangle'
        node['data']['label'] = node['data']['clsName']
        i += 1
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


@app.route('/networkx', methods=['POST'])
@cross_origin()
def compare_models_networkx():
    # TODO add edge match when source and target node are of the same layer type
    global subst_cost_list
    subst_cost_list = list()
    graphs = request.get_json()
    first_graph = graphs['firstGraph']
    second_graph = graphs['secondGraph']
    global attr_weights
    attr_weights = graphs['attributeWeights']
    attr_weights = {x['name']: x['weight'] for x in attr_weights}
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
    g1_mapped = compare_networkx(first_graph_x, second_graph_x, embeddings=False)
    result = {}
    for (k, v) in g1_mapped.items():
        result[get_node_by_id(first_graph_x, k)['index_original']] = (
            [[1, get_node_by_id(second_graph_x, v)['index_original']]])
    distance_matrix_all_attr = compute_attr_distance_matrix(first_graph_x, second_graph_x, attr_weights)

    return json.dumps({'matches_g1_g2': result, 'distance_matrix': distance_matrix_all_attr})


@app.route('/regal', methods=['POST'])
@cross_origin()
def compare_models_regal():
    data = request.get_json()
    first_graph = data['firstGraph']
    second_graph = data['secondGraph']
    sim_measure = data['simMeasure']
    attr_weights = data['attributeWeights']
    attr_weights = {x['name']: x['weight'] for x in attr_weights}
    gamma_struct = data['gammaStruct']
    gamma_attr = data['gammaAttr']
    first_graph_x = add_degree_info_to_nodes(json_graph.node_link_graph(first_graph))
    second_graph_x = add_degree_info_to_nodes(json_graph.node_link_graph(second_graph))
    matrix_file, attributes_file, true_alignments_file = generate_regal_files(first_graph_x, second_graph_x,
                                                                              first_graph['modelName'],
                                                                              second_graph['modelName'])
    global attribute_names
    distance_matrix_all_attr = compute_attr_distance_matrix(first_graph_x, second_graph_x, attr_weights)
    to_send = {
        'matrix': os.path.abspath(matrix_file),
        'attributes': os.path.abspath(attributes_file),
        'attribute_weights': attr_weights,
        'alignments': os.path.abspath(true_alignments_file),
        'g1_nodes': len(first_graph_x.nodes),
        'g2_nodes': len(second_graph_x.nodes),
        'sim_measure': sim_measure,
        'gamma_struct': gamma_struct,
        'gamma_attr': gamma_attr
    }
    matched_nodes = requests.post('http://localhost:8000/regal', json=to_send)
    return json.dumps({'matches_g1_g2': json.loads(matched_nodes.content)['matches_g1_g2'],
                       'matches_g2_g1': json.loads(matched_nodes.content)['matches_g2_g1'],
                       'distance_matrix': distance_matrix_all_attr})


def compare_networkx(g1, g2, embeddings=False):
    global attribute_names
    attribute_names = {"clsName", "inputShape", "outputShape", "numParameter", "name", "index"}
    attr_map_g1 = {}
    attr_map_g2 = {}
    for attribute in attribute_names:
        normalized_attr = normalize_attr_values(list(nx.get_node_attributes(g1, attribute).values()))
        for i in range(len(normalized_attr)):
            node_idx = list(g1.nodes())[i]
            if node_idx not in attr_map_g1:
                attr_map_g1[node_idx] = {}
            attr_map_g1[node_idx][attribute] = normalized_attr[i]

        normalized_attr = normalize_attr_values(list(nx.get_node_attributes(g2, attribute).values()))
        for i in range(len(normalized_attr)):
            node_idx = list(g2.nodes())[i]
            if node_idx not in attr_map_g2:
                attr_map_g2[node_idx] = {}
            attr_map_g2[node_idx][attribute] = normalized_attr[i]

    nx.set_node_attributes(g1, attr_map_g1)
    nx.set_node_attributes(g2, attr_map_g2)

    if not embeddings:
        paths, cost = nx.optimal_edit_paths(g1, g2, node_match=equal_nodes, node_subst_cost=node_subst,
                                            node_del_cost=node_del, node_ins_cost=node_ins)

    else:
        paths, cost = nx.optimal_edit_paths(g1, g2, node_match=equal_nodes,
                                            node_subst_cost=node_subst_embeddings)
    # Visualize subst cost
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
        graph.nodes[id]['index_original'] = i
        i += 1
    return graph


def equal_nodes(n1, n2):
    return n1['config']['name'] == n2['config']['name'] and n1['in_degree'] == n2['in_degree'] and n1['out_degree'] == \
           n2['out_degree']


def compute_similarity_nodes(node1, node2):
    global attribute_names
    global attr_weights
    dist = 0
    for attr in attribute_names:
        dist += compute_distance_nodes_per_attr(node1, node2, attr, attr_weights)
    return dist


def compute_distance_nodes_per_attr(node1, node2, attr, attr_weights=None):
    if isinstance(node1[attr], str) and isinstance(node2[attr], str):
        return attr_weights[attr] * levenshtein_distance(node1[attr], node2[attr]) / float(max(len(node1[attr]), len(node2[attr])))
    elif (isinstance(node1[attr], int) and isinstance(node2[attr], int)) or (
            isinstance(node1[attr], float) and isinstance(node2[attr], float)):
        return attr_weights[attr] * abs(node1[attr] - node2[attr])
    else:
        return attr_weights[attr] * int(np.all(node1[attr] != node2[attr]))


def node_subst(n1, n2):
    return compute_similarity_nodes(n1, n2)


def node_subst_embeddings(n1, n2):
    cost = compute_similarity_node_embeddings(embeddings_g1[n1['index']], embeddings_g2[n2['index']])
    global subst_cost_list
    subst_cost_list.append(cost)
    return cost


def node_del(n1):
    return 4  # TODO model this as a function


def node_ins(n2):
    return 5


def compute_similarity_node_embeddings(e1, e2):
    return spatial.distance.cosine(e1.tolist(), e2.tolist())


def get_node_by_id(graph, target_id):
    for id in graph.nodes:
        if id == target_id:
            return graph.nodes[id]


def generate_regal_files(g1, g2, id1, id2):
    global attribute_names
    attribute_names = {"clsName", "inputShape", "outputShape", "numParameter", "name", "index"}
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

    # Attribute matrix should be NxA, where N is number of nodes and A is number of attributes
    # attribute_names = {"clsName", "inputShape", "outputShape"}
    attributes_values = {}
    for attribute in attribute_names:
        attributes_values[attribute] = normalize_attr_values(
            list(nx.get_node_attributes(g1, attribute).values()) +
            list(nx.get_node_attributes(g2, attribute).values()))

    # Add node positions (indexes) as attributes
    attributes_values['index'] = [idx / len(g1.nodes) for idx, x in enumerate(g1.nodes)] + [idx / len(g2.nodes) for
                                                                                            idx, x in
                                                                                            enumerate(g2.nodes)]
    combined_attributes = np.empty([len(attributes_values[list(attributes_values.keys())[0]]), 1])
    for k, v in attributes_values.items():
        combined_attributes = np.hstack((combined_attributes, np.array(v).reshape(-1, 1)))

    attribute_file = id1 + '+' + id2 + 'attributes.npy'
    combined_attributes_named = np.vstack((np.array(list(attributes_values.keys())), combined_attributes[:, 1:]))
    np.save(id1 + '+' + id2 + 'attributes.npy', combined_attributes_named)
    return matrix_file.name, attribute_file, true_alignments_file.name


def normalize_attr_values(values):
    all_numeric = all(isinstance(item, int) or isinstance(item, float) for item in values)
    if all_numeric:
        return normalize_list_elems(values)
    elif all(isinstance(s, str) for s in values):
        return values
    elif isinstance(values, list) and isinstance(values[0][1], int):
        new_values = []
        for v in values:
            try:
                if any(isinstance(x, list) for x in v):
                    v = [item for sublist in v for item in sublist]
                v = [1 if x is None else x for x in v]
                result = reduce(lambda x, y: x * y, v)
                new_values.append(result)
            except Exception as e:
                print('Exception thrown: ', v, values, e)
        return normalize_list_elems(new_values)


def normalize_list_elems(arr):
    arr = np.array(arr)
    return list((arr - arr.min()) / (arr.max() - arr.min()))


def compute_attr_distance_matrix(g1, g2, attr_weights):
    attribute_names = set(attr_weights.keys())
    attr_map_g1 = {}
    attr_map_g2 = {}
    for attribute in attribute_names:
        normalized_attr = normalize_attr_values(list(nx.get_node_attributes(g1, attribute).values()))
        for i in range(len(normalized_attr)):
            node_idx = list(g1.nodes())[i]
            if node_idx not in attr_map_g1:
                attr_map_g1[node_idx] = {}
            attr_map_g1[node_idx][attribute] = normalized_attr[i]

        normalized_attr = normalize_attr_values(list(nx.get_node_attributes(g2, attribute).values()))
        for i in range(len(normalized_attr)):
            node_idx = list(g2.nodes())[i]
            if node_idx not in attr_map_g2:
                attr_map_g2[node_idx] = {}
            attr_map_g2[node_idx][attribute] = normalized_attr[i]

    nx.set_node_attributes(g1, attr_map_g1)
    nx.set_node_attributes(g2, attr_map_g2)

    nodes1 = np.array(list(g1.nodes()))
    nodes2 = np.array(list(g2.nodes()))
    mat = [[{} for i in range(len(nodes2))] for j in range(len(nodes1))]
    for i in range(len(nodes1)):
        for j in range(len(nodes2)):
            for attr in attribute_names:
                node1 = g1.nodes[nodes1[i]]
                node2 = g2.nodes[nodes2[j]]
                mat[i][j][attr] = compute_distance_nodes_per_attr(node1, node2, attr, attr_weights)
    return mat


if __name__ == '__main__':
    app.run(port=5000, host='0.0.0.0')
