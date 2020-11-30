export function mergeGraphs(firstGraph, secondGraph) {
  let combined = {};
  combined['nodes'] = firstGraph['nodes'];
  combined['nodes'] = combined['nodes'].concat(secondGraph['nodes']);
  combined['edges'] = firstGraph['edges'];
  combined['edges'] = combined['edges'].concat(secondGraph['edges']);
  return combined;
}
