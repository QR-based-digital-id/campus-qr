const fs = require("fs");

const code = fs.readFileSync("server.js", "utf-8");

// Define operator patterns
const operatorsList = [
  "if", "return", "const", "=", "=>", "!", "?", ":", "+", "-", "*", "/", "%", "==", "===",
  "!=", "!==", ">", "<", ">=", "<=", "&&", "||", ".", ",", ";", "{", "}", "(", ")"
];

// Extract tokens
const tokens = code.match(/[a-zA-Z_][a-zA-Z0-9_]*|==|===|!=|!==|=>|[{}();.,=+\-*/%!<>]/g) || [];

// Count operators and operands
let operators = {};
let operands = {};

tokens.forEach(token => {
  if (operatorsList.includes(token)) {
    operators[token] = (operators[token] || 0) + 1;
  } else {
    operands[token] = (operands[token] || 0) + 1;
  }
});

// Calculate values
const n1 = Object.keys(operators).length;
const n2 = Object.keys(operands).length;
const N1 = Object.values(operators).reduce((a, b) => a + b, 0);
const N2 = Object.values(operands).reduce((a, b) => a + b, 0);

const N = N1 + N2;
const n = n1 + n2;
const V = N * Math.log2(n || 1);
const D = (n1 / 2) * (N2 / (n2 || 1));
const E = D * V;

console.log("\n🔹 Halstead Metrics Results\n");

console.log("Operators:", operators);
console.log("Operands:", operands);

console.log("\n--- METRICS ---");
console.log("n1 (distinct operators):", n1);
console.log("n2 (distinct operands):", n2);
console.log("N1 (total operators):", N1);
console.log("N2 (total operands):", N2);

console.log("Program Length (N):", N);
console.log("Vocabulary (n):", n);
console.log("Volume (V):", V.toFixed(2));
console.log("Difficulty (D):", D.toFixed(2));
console.log("Effort (E):", E.toFixed(2));