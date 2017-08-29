# Python script that checks JS files for circular imports and prints cycles
# using Tarjan's algorithm. If it does not print anything, the code is free of
# circular imports.
#
# Usage:
#   python import_checker.py

import os, re
from collections import defaultdict
from itertools import chain

ENTRY_POINT = 'lib/run_tests.js'

def getImports(fn):
  with open(fn, 'r') as f:
    contents = f.read()
    imports = re.findall("^import .*?\'([^']+)\';$", contents, re.MULTILINE)
    dirname = os.path.dirname(fn)
    return [os.path.normpath(os.path.join(dirname, importFile)) for
            importFile in imports]

# Returns all the edges in the graph.
def getEdges(startingFn, visited=None):
  if visited is None:
    visited = defaultdict(bool)
  imports = getImports(startingFn)
  edges = []
  for i in imports:
    edges += [(startingFn, i)]
    if not visited[i]:
      visited[i] = True
      edges += getEdges(i, visited)
  return edges

# from https://gist.github.com/JonasGroeger/5459190
class Graph(object):
    def __init__(self, edges, vertices=()):
        edges = list(list(x) for x in edges)
        self.edges = edges
        self.vertices = set(chain(*edges)).union(vertices)
        self.tails = defaultdict(list)
        for head, tail in self.edges:
            self.tails[head].append(tail)

    @classmethod
    def from_dict(cls, edge_dict):
        return cls((k, v) for k, vs in edge_dict.items() for v in vs)

class _StrongCC(object):
    def strong_connect(self, head):
        lowlink, count, stack = self.lowlink, self.count, self.stack
        lowlink[head] = count[head] = self.counter = self.counter + 1
        stack.append(head)

        for tail in self.graph.tails[head]:
            if tail not in count:
                self.strong_connect(tail)
                lowlink[head] = min(lowlink[head], lowlink[tail])
            elif count[tail] < count[head]:
                if tail in self.stack:
                    lowlink[head] = min(lowlink[head], count[tail])

        if lowlink[head] == count[head]:
            component = []
            while stack and count[stack[-1]] >= count[head]:
                component.append(stack.pop())
            self.connected_components.append(component)

    def __call__(self, graph):
        self.graph = graph
        self.counter = 0
        self.count = dict()
        self.lowlink = dict()
        self.stack = []
        self.connected_components = []

        for v in self.graph.vertices:
            if v not in self.count:
                self.strong_connect(v)

        return self.connected_components

strongly_connected_components = _StrongCC()

edges = getEdges(ENTRY_POINT)
for edgeGroup in strongly_connected_components(Graph(edges)):
  if len(edgeGroup) == 1:
    continue
  print edgeGroup