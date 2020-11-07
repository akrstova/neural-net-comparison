import random

import keras
import tensorflow
from tensorflow.keras import backend
from tensorflow.keras.applications.vgg16 import VGG16
from tensorflow.keras.applications.inception_v3 import InceptionV3
from tensorflow.keras.applications.resnet50 import ResNet50
from tensorflow.keras.models import Model, Sequential
from tensorflow.keras.layers import Input, Flatten, Dense, Dropout, Conv2D, LSTM, GRU, SimpleRNN, BatchNormalization, MaxPooling2D, AveragePooling2D, GlobalMaxPooling2D


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
            model_json = head_model.to_json()

            outfile = 'KerasModels/{0}_{1}.json'.format(model_type, str(i))
            with open(outfile, 'w') as file:
                file.write(model_json)


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
    model_json = model.to_json()

    outfile = 'KerasModels/Custom/{0}.json'.format('Sequential')
    with open(outfile, 'w') as file:
        file.write(model_json)


if __name__ == '__main__':
    # generate_and_export_models()
    generate_and_export_models_sequential()