import json


class NodeEmbedding:
    def __init__(self, id, name, in_degree, out_degree, clsName, inputShape, numParameter):
        self.id = id
        self.name = name
        self.in_degree = in_degree
        self.out_degree = out_degree
        self.position = 0
        self.clsName = clsName
        self.inputShape = inputShape
        self.numParameter = numParameter

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__,
                          sort_keys=True, indent=4)
