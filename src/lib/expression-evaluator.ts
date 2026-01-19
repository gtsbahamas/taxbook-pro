// ============================================================
// EXPRESSION EVALUATOR - taxbook-pro
// Generated: 2026-01-19
// ============================================================
//
// SAFE JAVASCRIPT SUBSET EXPRESSION EVALUATOR
//
// This module provides a sandboxed expression evaluator for:
// - State machine guards
// - Business rule conditions
// - Computed fields
// - Dynamic validations
//
// Security Features:
// - No eval() or Function() - uses AST parsing
// - Allowlisted operators and functions only
// - No access to global objects (window, process, etc.)
// - Timeout protection for infinite loops
//
// Supported Operations:
// - Arithmetic: +, -, *, /, %, **
// - Comparison: ==, ===, !=, !==, <, <=, >, >=
// - Logical: &&, ||, !, ?:
// - String: +, .length, .includes(), .startsWith(), .endsWith()
// - Array: .length, .includes(), .some(), .every(), .filter()
// - Object: ., [], in
// - Math: Math.min, Math.max, Math.round, Math.floor, Math.ceil, Math.abs
//
// DEFENSIVE PATTERNS (Inversion Mental Model):
// - What if expression is malicious? -> Strict allowlisting
// - What if expression hangs? -> Timeout protection
// - What if context is missing? -> Graceful undefined handling
//
// ============================================================

import { type Result, ok, err } from "@/types/errors";
import { logger } from "@/lib/observability";

// ============================================================
// TYPES
// ============================================================

export interface EvaluationContext {
  /** The data object being evaluated (e.g., entity data) */
  readonly data: Record<string, unknown>;
  /** Previous data for comparison (optional) */
  readonly previousData?: Record<string, unknown>;
  /** Current user info */
  readonly user?: {
    readonly id: string;
    readonly roles: readonly string[];
  };
  /** Additional context variables */
  readonly vars?: Record<string, unknown>;
}

export interface EvaluationResult<T = unknown> {
  readonly value: T;
  readonly durationMs: number;
}

export interface ExpressionError {
  readonly type: "parse" | "runtime" | "timeout" | "security";
  readonly message: string;
  readonly position?: number;
  readonly expression?: string;
}

// ============================================================
// TOKEN TYPES FOR LEXER
// ============================================================

type TokenType =
  | "NUMBER"
  | "STRING"
  | "BOOLEAN"
  | "NULL"
  | "IDENTIFIER"
  | "OPERATOR"
  | "COMPARATOR"
  | "LOGICAL"
  | "DOT"
  | "BRACKET_OPEN"
  | "BRACKET_CLOSE"
  | "PAREN_OPEN"
  | "PAREN_CLOSE"
  | "COMMA"
  | "QUESTION"
  | "COLON"
  | "EOF";

interface Token {
  type: TokenType;
  value: string | number | boolean | null;
  position: number;
}

// ============================================================
// AST NODE TYPES
// ============================================================

type ASTNode =
  | { type: "Literal"; value: unknown }
  | { type: "Identifier"; name: string }
  | { type: "MemberExpression"; object: ASTNode; property: ASTNode; computed: boolean }
  | { type: "CallExpression"; callee: ASTNode; arguments: ASTNode[] }
  | { type: "BinaryExpression"; operator: string; left: ASTNode; right: ASTNode }
  | { type: "LogicalExpression"; operator: string; left: ASTNode; right: ASTNode }
  | { type: "UnaryExpression"; operator: string; argument: ASTNode }
  | { type: "ConditionalExpression"; test: ASTNode; consequent: ASTNode; alternate: ASTNode }
  | { type: "ArrayExpression"; elements: ASTNode[] };

// ============================================================
// SECURITY: ALLOWLISTED OPERATIONS
// ============================================================

const ALLOWED_BINARY_OPERATORS = new Set([
  "+", "-", "*", "/", "%", "**",
  "==", "===", "!=", "!==",
  "<", "<=", ">", ">=",
  "in",
]);

const ALLOWED_LOGICAL_OPERATORS = new Set(["&&", "||"]);

const ALLOWED_UNARY_OPERATORS = new Set(["!", "-", "+"]);

const ALLOWED_METHODS = new Set([
  // String methods
  "length",
  "includes",
  "startsWith",
  "endsWith",
  "toLowerCase",
  "toUpperCase",
  "trim",
  "split",
  "substring",
  "charAt",
  "indexOf",
  // Array methods
  "some",
  "every",
  "filter",
  "map",
  "find",
  "findIndex",
  "join",
  "slice",
  // Object/utility
  "toString",
  "valueOf",
  "hasOwnProperty",
]);

const ALLOWED_GLOBALS: Record<string, unknown> = {
  Math: {
    min: Math.min,
    max: Math.max,
    round: Math.round,
    floor: Math.floor,
    ceil: Math.ceil,
    abs: Math.abs,
    pow: Math.pow,
    sqrt: Math.sqrt,
  },
  Date: {
    now: Date.now,
  },
  JSON: {
    stringify: JSON.stringify,
  },
  Array: {
    isArray: Array.isArray,
  },
  Object: {
    keys: Object.keys,
    values: Object.values,
  },
  // Constants
  true: true,
  false: false,
  null: null,
  undefined: undefined,
  Infinity: Infinity,
  NaN: NaN,
};

const BLOCKED_IDENTIFIERS = new Set([
  "eval",
  "Function",
  "constructor",
  "__proto__",
  "prototype",
  "window",
  "global",
  "globalThis",
  "process",
  "require",
  "import",
  "module",
  "exports",
  "document",
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "Worker",
  "localStorage",
  "sessionStorage",
  "indexedDB",
]);

// ============================================================
// LEXER
// ============================================================

class Lexer {
  private input: string;
  private position: number = 0;

  constructor(input: string) {
    this.input = input;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.position < this.input.length) {
      this.skipWhitespace();
      if (this.position >= this.input.length) break;

      const char = this.input[this.position];
      const startPos = this.position;

      // Numbers
      if (this.isDigit(char) || (char === "." && this.isDigit(this.peek(1)))) {
        tokens.push(this.readNumber(startPos));
        continue;
      }

      // Strings
      if (char === '"' || char === "'" || char === "`") {
        tokens.push(this.readString(startPos, char));
        continue;
      }

      // Identifiers and keywords
      if (this.isIdentifierStart(char)) {
        tokens.push(this.readIdentifier(startPos));
        continue;
      }

      // Operators and punctuation
      tokens.push(this.readOperator(startPos));
    }

    tokens.push({ type: "EOF", value: null, position: this.position });
    return tokens;
  }

  private skipWhitespace(): void {
    while (this.position < this.input.length && /\s/.test(this.input[this.position])) {
      this.position++;
    }
  }

  private peek(offset: number = 0): string {
    return this.input[this.position + offset] || "";
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private isIdentifierStart(char: string): boolean {
    return /[a-zA-Z_$]/.test(char);
  }

  private isIdentifierPart(char: string): boolean {
    return /[a-zA-Z0-9_$]/.test(char);
  }

  private readNumber(startPos: number): Token {
    let value = "";
    let hasDecimal = false;

    while (this.position < this.input.length) {
      const char = this.input[this.position];
      if (this.isDigit(char)) {
        value += char;
        this.position++;
      } else if (char === "." && !hasDecimal) {
        hasDecimal = true;
        value += char;
        this.position++;
      } else {
        break;
      }
    }

    return { type: "NUMBER", value: parseFloat(value), position: startPos };
  }

  private readString(startPos: number, quote: string): Token {
    this.position++; // Skip opening quote
    let value = "";

    while (this.position < this.input.length) {
      const char = this.input[this.position];
      if (char === quote) {
        this.position++;
        break;
      }
      if (char === "\\") {
        this.position++;
        const escaped = this.input[this.position];
        switch (escaped) {
          case "n": value += "\n"; break;
          case "t": value += "\t"; break;
          case "r": value += "\r"; break;
          default: value += escaped;
        }
      } else {
        value += char;
      }
      this.position++;
    }

    return { type: "STRING", value, position: startPos };
  }

  private readIdentifier(startPos: number): Token {
    let value = "";

    while (this.position < this.input.length && this.isIdentifierPart(this.input[this.position])) {
      value += this.input[this.position];
      this.position++;
    }

    // Keywords
    if (value === "true") return { type: "BOOLEAN", value: true, position: startPos };
    if (value === "false") return { type: "BOOLEAN", value: false, position: startPos };
    if (value === "null") return { type: "NULL", value: null, position: startPos };

    return { type: "IDENTIFIER", value, position: startPos };
  }

  private readOperator(startPos: number): Token {
    const char = this.input[this.position];
    const next = this.peek(1);
    const nextNext = this.peek(2);

    // Three-character operators
    if (char === "=" && next === "=" && nextNext === "=") {
      this.position += 3;
      return { type: "COMPARATOR", value: "===", position: startPos };
    }
    if (char === "!" && next === "=" && nextNext === "=") {
      this.position += 3;
      return { type: "COMPARATOR", value: "!==", position: startPos };
    }

    // Two-character operators
    if (char === "=" && next === "=") {
      this.position += 2;
      return { type: "COMPARATOR", value: "==", position: startPos };
    }
    if (char === "!" && next === "=") {
      this.position += 2;
      return { type: "COMPARATOR", value: "!=", position: startPos };
    }
    if (char === "<" && next === "=") {
      this.position += 2;
      return { type: "COMPARATOR", value: "<=", position: startPos };
    }
    if (char === ">" && next === "=") {
      this.position += 2;
      return { type: "COMPARATOR", value: ">=", position: startPos };
    }
    if (char === "&" && next === "&") {
      this.position += 2;
      return { type: "LOGICAL", value: "&&", position: startPos };
    }
    if (char === "|" && next === "|") {
      this.position += 2;
      return { type: "LOGICAL", value: "||", position: startPos };
    }
    if (char === "*" && next === "*") {
      this.position += 2;
      return { type: "OPERATOR", value: "**", position: startPos };
    }

    // Single-character operators
    this.position++;
    switch (char) {
      case ".": return { type: "DOT", value: ".", position: startPos };
      case "[": return { type: "BRACKET_OPEN", value: "[", position: startPos };
      case "]": return { type: "BRACKET_CLOSE", value: "]", position: startPos };
      case "(": return { type: "PAREN_OPEN", value: "(", position: startPos };
      case ")": return { type: "PAREN_CLOSE", value: ")", position: startPos };
      case ",": return { type: "COMMA", value: ",", position: startPos };
      case "?": return { type: "QUESTION", value: "?", position: startPos };
      case ":": return { type: "COLON", value: ":", position: startPos };
      case "+":
      case "-":
      case "*":
      case "/":
      case "%":
        return { type: "OPERATOR", value: char, position: startPos };
      case "<":
      case ">":
        return { type: "COMPARATOR", value: char, position: startPos };
      case "!":
        return { type: "LOGICAL", value: "!", position: startPos };
      default:
        throw new Error(`Unexpected character: ${char} at position ${startPos}`);
    }
  }
}

// ============================================================
// PARSER
// ============================================================

class Parser {
  private tokens: Token[];
  private position: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ASTNode {
    const result = this.parseExpression();
    if (this.current().type !== "EOF") {
      throw new Error(`Unexpected token: ${JSON.stringify(this.current())}`);
    }
    return result;
  }

  private current(): Token {
    return this.tokens[this.position] || { type: "EOF", value: null, position: -1 };
  }

  private advance(): Token {
    return this.tokens[this.position++];
  }

  private parseExpression(): ASTNode {
    return this.parseConditional();
  }

  private parseConditional(): ASTNode {
    let node = this.parseLogicalOr();

    if (this.current().type === "QUESTION") {
      this.advance(); // ?
      const consequent = this.parseExpression();
      if (this.current().type !== "COLON") {
        throw new Error("Expected ':' in conditional expression");
      }
      this.advance(); // :
      const alternate = this.parseExpression();
      node = { type: "ConditionalExpression", test: node, consequent, alternate };
    }

    return node;
  }

  private parseLogicalOr(): ASTNode {
    let node = this.parseLogicalAnd();

    while (this.current().type === "LOGICAL" && this.current().value === "||") {
      const operator = this.advance().value as string;
      const right = this.parseLogicalAnd();
      node = { type: "LogicalExpression", operator, left: node, right };
    }

    return node;
  }

  private parseLogicalAnd(): ASTNode {
    let node = this.parseEquality();

    while (this.current().type === "LOGICAL" && this.current().value === "&&") {
      const operator = this.advance().value as string;
      const right = this.parseEquality();
      node = { type: "LogicalExpression", operator, left: node, right };
    }

    return node;
  }

  private parseEquality(): ASTNode {
    let node = this.parseComparison();

    while (this.current().type === "COMPARATOR" &&
           ["==", "===", "!=", "!=="].includes(this.current().value as string)) {
      const operator = this.advance().value as string;
      const right = this.parseComparison();
      node = { type: "BinaryExpression", operator, left: node, right };
    }

    return node;
  }

  private parseComparison(): ASTNode {
    let node = this.parseAdditive();

    while (this.current().type === "COMPARATOR" &&
           ["<", "<=", ">", ">="].includes(this.current().value as string)) {
      const operator = this.advance().value as string;
      const right = this.parseAdditive();
      node = { type: "BinaryExpression", operator, left: node, right };
    }

    // Handle 'in' operator
    if (this.current().type === "IDENTIFIER" && this.current().value === "in") {
      this.advance();
      const right = this.parseAdditive();
      node = { type: "BinaryExpression", operator: "in", left: node, right };
    }

    return node;
  }

  private parseAdditive(): ASTNode {
    let node = this.parseMultiplicative();

    while (this.current().type === "OPERATOR" &&
           ["+", "-"].includes(this.current().value as string)) {
      const operator = this.advance().value as string;
      const right = this.parseMultiplicative();
      node = { type: "BinaryExpression", operator, left: node, right };
    }

    return node;
  }

  private parseMultiplicative(): ASTNode {
    let node = this.parseUnary();

    while (this.current().type === "OPERATOR" &&
           ["*", "/", "%", "**"].includes(this.current().value as string)) {
      const operator = this.advance().value as string;
      const right = this.parseUnary();
      node = { type: "BinaryExpression", operator, left: node, right };
    }

    return node;
  }

  private parseUnary(): ASTNode {
    if (this.current().type === "LOGICAL" && this.current().value === "!") {
      const operator = this.advance().value as string;
      const argument = this.parseUnary();
      return { type: "UnaryExpression", operator, argument };
    }

    if (this.current().type === "OPERATOR" &&
        ["-", "+"].includes(this.current().value as string)) {
      const operator = this.advance().value as string;
      const argument = this.parseUnary();
      return { type: "UnaryExpression", operator, argument };
    }

    return this.parseMemberOrCall();
  }

  private parseMemberOrCall(): ASTNode {
    let node = this.parsePrimary();

    while (true) {
      if (this.current().type === "DOT") {
        this.advance();
        if (this.current().type !== "IDENTIFIER") {
          throw new Error("Expected identifier after '.'");
        }
        const property: ASTNode = { type: "Identifier", name: this.advance().value as string };
        node = { type: "MemberExpression", object: node, property, computed: false };
      } else if (this.current().type === "BRACKET_OPEN") {
        this.advance();
        const property = this.parseExpression();
        if (this.current().type !== "BRACKET_CLOSE") {
          throw new Error("Expected ']'");
        }
        this.advance();
        node = { type: "MemberExpression", object: node, property, computed: true };
      } else if (this.current().type === "PAREN_OPEN") {
        this.advance();
        const args: ASTNode[] = [];
        while (this.current().type !== "PAREN_CLOSE") {
          args.push(this.parseExpression());
          if (this.current().type === "COMMA") {
            this.advance();
          }
        }
        this.advance();
        node = { type: "CallExpression", callee: node, arguments: args };
      } else {
        break;
      }
    }

    return node;
  }

  private parsePrimary(): ASTNode {
    const token = this.current();

    switch (token.type) {
      case "NUMBER":
      case "STRING":
      case "BOOLEAN":
      case "NULL":
        this.advance();
        return { type: "Literal", value: token.value };

      case "IDENTIFIER":
        this.advance();
        return { type: "Identifier", name: token.value as string };

      case "PAREN_OPEN":
        this.advance();
        const expr = this.parseExpression();
        if (this.current().type !== "PAREN_CLOSE") {
          throw new Error("Expected ')'");
        }
        this.advance();
        return expr;

      case "BRACKET_OPEN":
        return this.parseArrayLiteral();

      default:
        throw new Error(`Unexpected token: ${token.type} (${token.value}) at position ${token.position}`);
    }
  }

  private parseArrayLiteral(): ASTNode {
    this.advance(); // [
    const elements: ASTNode[] = [];

    while (this.current().type !== "BRACKET_CLOSE") {
      elements.push(this.parseExpression());
      if (this.current().type === "COMMA") {
        this.advance();
      }
    }

    this.advance(); // ]
    return { type: "ArrayExpression", elements };
  }
}

// ============================================================
// EVALUATOR
// ============================================================

class Evaluator {
  private context: EvaluationContext;
  private timeout: number;
  private startTime: number = 0;

  constructor(context: EvaluationContext, timeout: number = 1000) {
    this.context = context;
    this.timeout = timeout;
  }

  evaluate(node: ASTNode): unknown {
    this.startTime = Date.now();
    return this.evaluateNode(node);
  }

  private checkTimeout(): void {
    if (Date.now() - this.startTime > this.timeout) {
      throw new Error("Expression evaluation timeout");
    }
  }

  private evaluateNode(node: ASTNode): unknown {
    this.checkTimeout();

    switch (node.type) {
      case "Literal":
        return node.value;

      case "Identifier":
        return this.resolveIdentifier(node.name);

      case "MemberExpression":
        return this.evaluateMember(node);

      case "CallExpression":
        return this.evaluateCall(node);

      case "BinaryExpression":
        return this.evaluateBinary(node);

      case "LogicalExpression":
        return this.evaluateLogical(node);

      case "UnaryExpression":
        return this.evaluateUnary(node);

      case "ConditionalExpression":
        return this.evaluateConditional(node);

      case "ArrayExpression":
        return node.elements.map(el => this.evaluateNode(el));

      default:
        throw new Error(`Unknown node type: ${(node as ASTNode).type}`);
    }
  }

  private resolveIdentifier(name: string): unknown {
    // Security check
    if (BLOCKED_IDENTIFIERS.has(name)) {
      throw new Error(`Access to '${name}' is not allowed`);
    }

    // Check context variables first
    if (name === "data") return this.context.data;
    if (name === "previousData") return this.context.previousData;
    if (name === "user") return this.context.user;

    // Check custom variables
    if (this.context.vars && name in this.context.vars) {
      return this.context.vars[name];
    }

    // Check data properties
    if (name in this.context.data) {
      return this.context.data[name];
    }

    // Check allowed globals
    if (name in ALLOWED_GLOBALS) {
      return ALLOWED_GLOBALS[name];
    }

    return undefined;
  }

  private evaluateMember(node: ASTNode & { type: "MemberExpression" }): unknown {
    const object = this.evaluateNode(node.object);

    if (object === null || object === undefined) {
      return undefined;
    }

    let propertyName: string;
    if (node.computed) {
      propertyName = String(this.evaluateNode(node.property));
    } else if (node.property.type === "Identifier") {
      propertyName = node.property.name;
    } else {
      throw new Error("Invalid property access");
    }

    // Security check for property access
    if (BLOCKED_IDENTIFIERS.has(propertyName)) {
      throw new Error(`Access to '${propertyName}' is not allowed`);
    }

    if (typeof object === "object" && object !== null) {
      return (object as Record<string, unknown>)[propertyName];
    }

    if (typeof object === "string") {
      if (propertyName === "length") return object.length;
      if (ALLOWED_METHODS.has(propertyName)) {
        return (object as unknown as Record<string, unknown>)[propertyName];
      }
    }

    if (Array.isArray(object)) {
      if (propertyName === "length") return object.length;
      if (ALLOWED_METHODS.has(propertyName)) {
        return (object as unknown as Record<string, unknown>)[propertyName];
      }
      const index = parseInt(propertyName, 10);
      if (!isNaN(index)) {
        return object[index];
      }
    }

    return undefined;
  }

  private evaluateCall(node: ASTNode & { type: "CallExpression" }): unknown {
    const args = node.arguments.map(arg => this.evaluateNode(arg));

    // Handle method calls
    if (node.callee.type === "MemberExpression") {
      const obj = this.evaluateNode(node.callee.object);
      let methodName: string;

      if (node.callee.property.type === "Identifier") {
        methodName = node.callee.property.name;
      } else {
        methodName = String(this.evaluateNode(node.callee.property));
      }

      // Security check
      if (!ALLOWED_METHODS.has(methodName)) {
        throw new Error(`Method '${methodName}' is not allowed`);
      }

      if (obj !== null && obj !== undefined) {
        const method = (obj as Record<string, unknown>)[methodName];
        if (typeof method === "function") {
          return (method as (...a: unknown[]) => unknown).call(obj, ...args);
        }
      }

      return undefined;
    }

    // Handle global function calls (Math.min, etc.)
    if (node.callee.type === "Identifier") {
      const funcName = node.callee.name;
      const func = this.resolveIdentifier(funcName);
      if (typeof func === "function") {
        return (func as (...a: unknown[]) => unknown)(...args);
      }
      throw new Error(`'${funcName}' is not a function`);
    }

    throw new Error("Invalid call expression");
  }

  private evaluateBinary(node: ASTNode & { type: "BinaryExpression" }): unknown {
    const op = node.operator;

    if (!ALLOWED_BINARY_OPERATORS.has(op)) {
      throw new Error(`Operator '${op}' is not allowed`);
    }

    const left = this.evaluateNode(node.left);
    const right = this.evaluateNode(node.right);

    switch (op) {
      case "+":
        if (typeof left === "string" || typeof right === "string") {
          return String(left) + String(right);
        }
        return (left as number) + (right as number);
      case "-": return (left as number) - (right as number);
      case "*": return (left as number) * (right as number);
      case "/": return (left as number) / (right as number);
      case "%": return (left as number) % (right as number);
      case "**": return (left as number) ** (right as number);
      case "==": return left == right;
      case "===": return left === right;
      case "!=": return left != right;
      case "!==": return left !== right;
      case "<": return (left as number) < (right as number);
      case "<=": return (left as number) <= (right as number);
      case ">": return (left as number) > (right as number);
      case ">=": return (left as number) >= (right as number);
      case "in":
        if (Array.isArray(right)) {
          return right.includes(left);
        }
        if (typeof right === "object" && right !== null) {
          return String(left) in right;
        }
        return false;
      default:
        throw new Error(`Unknown operator: ${op}`);
    }
  }

  private evaluateLogical(node: ASTNode & { type: "LogicalExpression" }): unknown {
    const op = node.operator;

    if (!ALLOWED_LOGICAL_OPERATORS.has(op)) {
      throw new Error(`Logical operator '${op}' is not allowed`);
    }

    const left = this.evaluateNode(node.left);

    // Short-circuit evaluation
    switch (op) {
      case "&&": return left ? this.evaluateNode(node.right) : left;
      case "||": return left ? left : this.evaluateNode(node.right);
      default:
        throw new Error(`Unknown logical operator: ${op}`);
    }
  }

  private evaluateUnary(node: ASTNode & { type: "UnaryExpression" }): unknown {
    const op = node.operator;

    if (!ALLOWED_UNARY_OPERATORS.has(op)) {
      throw new Error(`Unary operator '${op}' is not allowed`);
    }

    const argument = this.evaluateNode(node.argument);

    switch (op) {
      case "!": return !argument;
      case "-": return -(argument as number);
      case "+": return +(argument as number);
      default:
        throw new Error(`Unknown unary operator: ${op}`);
    }
  }

  private evaluateConditional(node: ASTNode & { type: "ConditionalExpression" }): unknown {
    const test = this.evaluateNode(node.test);
    return test ? this.evaluateNode(node.consequent) : this.evaluateNode(node.alternate);
  }
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Evaluate an expression against a context.
 *
 * @example
 * ```typescript
 * const result = evaluate("data.amount > 100 && data.status === 'active'", {
 *   data: { amount: 150, status: 'active' }
 * });
 * // result.value === true
 * ```
 */
export function evaluate<T = unknown>(
  expression: string,
  context: EvaluationContext,
  options: { timeout?: number } = {}
): Result<EvaluationResult<T>, ExpressionError> {
  const startTime = Date.now();
  const timeout = options.timeout ?? 1000;

  try {
    // Lexical analysis
    const lexer = new Lexer(expression);
    const tokens = lexer.tokenize();

    // Parse to AST
    const parser = new Parser(tokens);
    const ast = parser.parse();

    // Evaluate
    const evaluator = new Evaluator(context, timeout);
    const value = evaluator.evaluate(ast) as T;

    return ok({
      value,
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Determine error type
    let type: ExpressionError["type"] = "runtime";
    if (message.includes("timeout")) type = "timeout";
    if (message.includes("not allowed")) type = "security";
    if (message.includes("Unexpected") || message.includes("Expected")) type = "parse";

    logger.warn("Expression evaluation failed", {
      expression,
      error: message,
      type,
    });

    return err({
      type,
      message,
      expression,
    });
  }
}

/**
 * Evaluate an expression and return boolean result.
 * Non-boolean results are coerced to boolean.
 */
export function evaluateBoolean(
  expression: string,
  context: EvaluationContext,
  options: { timeout?: number } = {}
): Result<boolean, ExpressionError> {
  const result = evaluate<unknown>(expression, context, options);
  if (!result.ok) return result;
  return ok(Boolean(result.value.value));
}

/**
 * Validate that an expression is syntactically correct
 * without evaluating it.
 */
export function validateExpression(expression: string): Result<void, ExpressionError> {
  try {
    const lexer = new Lexer(expression);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    parser.parse();
    return ok(undefined);
  } catch (error) {
    return err({
      type: "parse",
      message: error instanceof Error ? error.message : String(error),
      expression,
    });
  }
}

/**
 * Create a reusable compiled expression for better performance
 * when evaluating the same expression multiple times.
 */
export function compile<T = unknown>(expression: string): Result<CompiledExpression<T>, ExpressionError> {
  try {
    const lexer = new Lexer(expression);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    return ok({
      expression,
      evaluate: (context: EvaluationContext, options?: { timeout?: number }) => {
        const startTime = Date.now();
        const timeout = options?.timeout ?? 1000;

        try {
          const evaluator = new Evaluator(context, timeout);
          const value = evaluator.evaluate(ast) as T;
          return ok({ value, durationMs: Date.now() - startTime });
        } catch (error) {
          return err({
            type: "runtime" as const,
            message: error instanceof Error ? error.message : String(error),
            expression,
          });
        }
      },
    });
  } catch (error) {
    return err({
      type: "parse",
      message: error instanceof Error ? error.message : String(error),
      expression,
    });
  }
}

export interface CompiledExpression<T = unknown> {
  readonly expression: string;
  evaluate: (
    context: EvaluationContext,
    options?: { timeout?: number }
  ) => Result<EvaluationResult<T>, ExpressionError>;
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
