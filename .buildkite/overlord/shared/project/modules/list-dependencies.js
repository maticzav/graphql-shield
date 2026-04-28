#!/usr/bin/env node

const fs = require('fs')
const stdinBuffer = fs.readFileSync(0) // STDIN_FILENO = 0

const dependencyGraph = JSON.parse(stdinBuffer.toString())

const dependencies = new Set()
const stack = []

if (dependencyGraph.dependencies) {
  stack.push(dependencyGraph.dependencies)
}

while (stack.length > 0) {
  const current = stack.pop()

  for (key of Object.keys(current)) {

    if (!dependencies.has(key)) {
      dependencies.add(key)
      if (current[key].dependencies) {
        stack.push(current[key].dependencies)
      }
    }
  }
}

console.log(Array.from(dependencies).join('\n'))
