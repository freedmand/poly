# Incomplete Python script that checks JS files for circular imports.

import os, re

ENTRY_POINT = 'lib/run_tests.js'

def getImports(fn):
  with open(fn, 'r') as f:
    contents = f.read()
    imports = re.findall("^import .*?\'([^']+)\';$", contents, re.MULTILINE)
    dirname = os.path.dirname(fn)
    return [os.path.normpath(os.path.join(dirname, importFile)) for
            importFile in imports]

def add(_, dirname, names):
  for name in names:
    if name.endswith('.js'):
      fn = os.path.join(dirname, name)
      print fn
      for importFile in getImports(fn):
        print ' ', os.path.normpath(os.path.join(dirname, importFile))

importDepths = {}

def printImports(fn, spaces=0):
  print (' ' * spaces) + fn
  imports = getImports(fn)
  for i in imports:
    if i in importDepths and importDepths[i] < spaces:
      print ' ' * (spaces + 2) + i + '(i)'
    else:
      importDepths[i] = spaces
      printImports(i, spaces + 1)

printImports(ENTRY_POINT)