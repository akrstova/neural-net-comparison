import keras
from tensorflow.keras import backend
from tensorflow.keras.applications.vgg16 import VGG16
from tensorflow.keras.applications.inception_v3 import InceptionV3
from tensorflow.keras.applications.resnet50 import ResNet50
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Flatten, Dense, Dropout


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


if __name__ == '__main__':
    generate_and_export_models()
