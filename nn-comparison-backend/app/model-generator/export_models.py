import json
import random
import networkx as nx
from tensorflow.keras.applications.vgg16 import VGG16
from tensorflow.keras.applications.inception_v3 import InceptionV3
from tensorflow.keras.applications.resnet50 import ResNet50
from tensorflow.keras.models import Model, Sequential
from tensorflow.keras.layers import Input, Flatten, Dense, Dropout, Conv2D, LSTM, GRU, SimpleRNN, BatchNormalization, \
    MaxPooling2D, AveragePooling2D, GlobalMaxPooling2D


def generate_and_export_models():
    # Properties common for all models
    num_classes = 20

    # Changing parameters
    base_architectures = ['VGG16', 'InceptionV3', 'ResNet50']
    input_shapes = [(256, 256, 3), (224, 224, 3), (128, 128, 3), (75, 75, 3)]
    dense_sizes = [4096, 2048, 1024, 512]
    dropout_values = [0.5, 0.2, 0.3, 0.1]
    for model_type in base_architectures:
        # Make 4 variations of each model
        for i in range(4):
            if model_type == 'VGG16':
                # load vgg16 without dense layer and with Theano dim ordering
                base_model = VGG16(weights='imagenet', include_top=False, input_shape=input_shapes[i])
            elif model_type == 'InceptionV3':
                base_model = InceptionV3(weights='imagenet', include_top=False, input_shape=input_shapes[i])
            else:
                base_model = ResNet50(weights='imagenet', include_top=False, input_shape=input_shapes[i])

            x = Flatten()(base_model.output)
            x = Dense(dense_sizes[i], activation='relu')(x)
            x = Dropout(dropout_values[i])(x)
            predictions = Dense(num_classes, activation='softmax')(x)

            # create graph of your new model
            head_model = Model(base_model.input, predictions)

            # compile the model
            head_model.compile(optimizer='rmsprop', loss='categorical_crossentropy', metrics=['accuracy'])
            model_graph = model_to_networkx_graph(head_model)

            outfile = 'KerasModels/{0}_{1}.json'.format(model_type, str(i))
            with open(outfile, 'w') as file:
                json.dump(nx.json_graph.node_link_data(model_graph), file, indent=4)


# TODO fix size compatibility and layer logic
def generate_and_export_models_sequential():
    model_size = random.randint(5, 8)
    num_classes = random.randint(2, 10)
    input_shapes = [(256, 256, 3), (224, 224, 3), (128, 128, 3), (75, 75, 3)]
    layer_types = ['Conv2D', 'MaxPooling2D', 'AveragePooling2D', 'GlobalMaxPooling2D',
                   'BatchNormalization', 'Dropout']

    model = Sequential()
    input_shape_idx = random.randint(0, len(input_shapes) - 1)
    model.add(Input(shape=input_shapes[input_shape_idx]))  # 250x250 RGB images
    for i in range(model_size - 2):
        layer_idx = random.randint(0, len(layer_types) - 1)
        layer_to_add = layer_types[layer_idx]
        if layer_to_add == 'Conv2D':
            filters = 2 ** random.randint(1, 6)
            kernel_size = random.randint(2, 10)
            model.add(Conv2D(filters, kernel_size))
        elif layer_to_add == 'LSTM':
            units = 2 ** random.randint(4, 6)
            model.add(LSTM(units))
        elif layer_to_add == 'GRU':
            units = 2 ** random.randint(4, 6)
            model.add(GRU(units))
        elif layer_to_add == 'SimpleRNN':
            units = 2 ** random.randint(4, 6)
            model.add(SimpleRNN(units))
        elif layer_to_add == 'MaxPooling2D':
            pool_size = 2 ** random.randint(1, 3)
            model.add(MaxPooling2D(pool_size=(pool_size, pool_size)))
        elif layer_to_add == 'AveragePooling2D':
            pool_size = 2 ** random.randint(1, 3)
            model.add(AveragePooling2D(pool_size=(pool_size, pool_size)))
        elif layer_to_add == 'GlobalMaxPooling2D':
            model.add(GlobalMaxPooling2D())
        elif layer_to_add == 'BatchNormalization':
            model.add(BatchNormalization())
        elif layer_to_add == 'Dropout':
            dropout = round(random.uniform(0.1, 0.6), 1)
            model.add(Dropout(dropout))

    # Finally add the output layer
    model.add(Dense(num_classes))
    model.compile(optimizer='rmsprop', loss='categorical_crossentropy', metrics=['accuracy'])

    outfile = 'KerasModels/Custom/{0}.json'.format('Sequential')
    model_graph = model_to_networkx_graph(model)

    for n in model_graph.nodes():
        node = model_graph.nodes[n]
        corr_layers = [l for l in model.layers if l.name == node["name"]]

        if len(corr_layers) == 1:
            corr_layer = corr_layers[0]
            node["config"] = corr_layer.get_config()

        # Input layer has no shape information. Extract from config and append
        if node["clsName"] == "InputLayer":
            node["clsName"] = "Input"
            node["inputShape"] = node["config"]["batch_input_shape"]
            node["outputShape"] = node["config"]["batch_input_shape"]

    with open(outfile, "w") as f:
        json.dump(nx.json_graph.node_link_data(model_graph), f, indent=4)


def model_to_networkx_graph(model):
    relevant_nodes = []
    for v in model._nodes_by_depth.values():
        relevant_nodes += v

    nodes = []
    links = []

    for layer in model.layers:
        layer_id = str(id(layer))

        # Iterate over inbound nodes to extract links that end in current layer
        for node in layer._inbound_nodes:
            if node in relevant_nodes:
                for inbound_layer, _, _, _ in node.iterate_inbound():
                    inbound_layer_id = str(id(inbound_layer))
                    links.append({
                        "id_from": inbound_layer_id,
                        "id_to": layer_id,
                    })

        nodes.append({
            "id": layer_id,
            "name": layer.name,
            "clsName": layer.__class__.__name__,
            "inputShape": layer.input_shape,
            "outputShape": layer.output_shape,
            "numParameter": layer.count_params()
        })

    # Create directed networkx-graph
    nx_graph = nx.DiGraph()

    # Add nodes to graph and append attributes
    nx_graph.add_nodes_from([node["id"] for node in nodes])
    nx.set_node_attributes(nx_graph, {node["id"]: node for node in nodes})

    # Add edges to graph
    nx_graph.add_edges_from([(link["id_from"], link["id_to"]) for link in links])

    return nx_graph


if __name__ == '__main__':
    generate_and_export_models()
    # generate_and_export_models_sequential()
