/**
 * Simple recursive descent parser for the DSL
 */

import { Token, TokenType, Lexer } from './lexer';
import {
  Program, WorkflowDeclaration, ParameterDeclaration, VariableDeclaration,
  NodeDeclaration, ModuleDeclaration, ConnectionDeclaration, Expression,
  LiteralExpression, IdentifierExpression, ObjectExpression, ArrayExpression,
  TemplateExpression, ParameterType
} from '../types/dsl';

export class ParseError extends Error {
  constructor(message: string, public token: Token) {
    super(`${message} at line ${token.line}, column ${token.column}`);
  }
}

export class Parser {
  private tokens: Token[];
  private current: number = 0;

  constructor(input: string) {
    const lexer = new Lexer(input);
    this.tokens = lexer.tokenize().filter(t => 
      t.type !== TokenType.COMMENT && 
      t.type !== TokenType.NEWLINE
    );
  }

  parse(): Program {
    try {
      const workflow = this.parseWorkflow();
      
      // Check for EOF, but don't throw if we're already at EOF
      if (!this.isAtEnd()) {
        this.expect(TokenType.EOF);
      }
      
      return {
        type: 'Program',
        workflow,
        line: 1,
        column: 1
      };
    } catch (error) {
      if (error instanceof ParseError) {
        throw error;
      }
      throw new ParseError(`Unexpected error: ${error}`, this.getCurrentToken());
    }
  }

  private parseWorkflow(): WorkflowDeclaration {
    this.expect(TokenType.WORKFLOW);
    const name = this.expect(TokenType.STRING).value;
    this.expect(TokenType.LBRACE);

    const parameters: ParameterDeclaration[] = [];
    const variables: VariableDeclaration[] = [];
    const nodes: (NodeDeclaration | ModuleDeclaration)[] = [];
    const connections: ConnectionDeclaration[] = [];

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      if (this.check(TokenType.PARAM)) {
        parameters.push(this.parseParameter());
      } else if (this.check(TokenType.VAR)) {
        variables.push(this.parseVariable());
      } else if (this.check(TokenType.NODE)) {
        nodes.push(this.parseNode());
      } else if (this.check(TokenType.MODULE)) {
        nodes.push(this.parseModule());
      } else if (this.check(TokenType.CONNECT)) {
        connections.push(this.parseConnection());
      } else {
        throw new ParseError(`Unexpected token '${this.getCurrentToken().value}'`, this.getCurrentToken());
      }
    }

    this.expect(TokenType.RBRACE);

    return {
      type: 'WorkflowDeclaration',
      name,
      parameters,
      variables,
      nodes,
      connections,
      line: this.getCurrentToken().line,
      column: this.getCurrentToken().column
    };
  }

  private parseParameter(): ParameterDeclaration {
    this.expect(TokenType.PARAM);
    const name = this.expect(TokenType.IDENTIFIER).value;
    const paramType = this.expect(TokenType.IDENTIFIER).value as ParameterType;
    
    let defaultValue: any = undefined;
    let required = true;

    if (this.match(TokenType.EQUALS)) {
      defaultValue = this.parseExpression();
      required = false;
    }

    return {
      type: 'ParameterDeclaration',
      name,
      paramType,
      defaultValue,
      required,
      line: this.getCurrentToken().line,
      column: this.getCurrentToken().column
    };
  }

  private parseVariable(): VariableDeclaration {
    this.expect(TokenType.VAR);
    const name = this.expect(TokenType.IDENTIFIER).value;
    this.expect(TokenType.EQUALS);
    const value = this.parseExpression();

    return {
      type: 'VariableDeclaration',
      name,
      value,
      line: this.getCurrentToken().line,
      column: this.getCurrentToken().column
    };
  }

  private parseNode(): NodeDeclaration {
    this.expect(TokenType.NODE);
    const name = this.expect(TokenType.IDENTIFIER).value;
    const nodeType = this.expect(TokenType.STRING).value;
    this.expect(TokenType.LBRACE);

    const parameters: { [key: string]: Expression } = {};
    
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const paramName = this.expect(TokenType.IDENTIFIER).value;
      this.expect(TokenType.COLON);
      const paramValue = this.parseExpression();
      parameters[paramName] = paramValue;
      
      // Optional comma
      this.match(TokenType.COMMA);
    }

    this.expect(TokenType.RBRACE);

    return {
      type: 'NodeDeclaration',
      name,
      nodeType,
      parameters,
      line: this.getCurrentToken().line,
      column: this.getCurrentToken().column
    };
  }

  private parseModule(): ModuleDeclaration {
    this.expect(TokenType.MODULE);
    const name = this.expect(TokenType.IDENTIFIER).value;
    this.expect(TokenType.EQUALS);
    const modulePath = this.expect(TokenType.STRING).value;
    this.expect(TokenType.LBRACE);

    const parameters: { [key: string]: Expression } = {};
    
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const paramName = this.expect(TokenType.IDENTIFIER).value;
      this.expect(TokenType.COLON);
      const paramValue = this.parseExpression();
      parameters[paramName] = paramValue;
      
      // Optional comma
      this.match(TokenType.COMMA);
    }

    this.expect(TokenType.RBRACE);

    return {
      type: 'ModuleDeclaration',
      name,
      modulePath,
      parameters,
      line: this.getCurrentToken().line,
      column: this.getCurrentToken().column
    };
  }

  private parseConnection(): ConnectionDeclaration {
    this.expect(TokenType.CONNECT);
    
    // Parse source (node.output or just node)
    const sourceNode = this.expect(TokenType.IDENTIFIER).value;
    let sourceOutput = 'main';
    
    if (this.match(TokenType.DOT)) {
      // Allow identifiers or keywords like 'true', 'false' for connection outputs
      if (this.check(TokenType.IDENTIFIER)) {
        sourceOutput = this.advance().value;
      } else if (this.check(TokenType.BOOLEAN)) {
        sourceOutput = this.advance().value;
      } else {
        throw new ParseError(`Expected connection output name`, this.getCurrentToken());
      }
    }

    this.expect(TokenType.ARROW);

    // Parse target (node.input or just node)
    const targetNode = this.expect(TokenType.IDENTIFIER).value;
    let targetInput = 'main';
    
    if (this.match(TokenType.DOT)) {
      // Allow identifiers or keywords like 'true', 'false' for connection inputs
      if (this.check(TokenType.IDENTIFIER)) {
        targetInput = this.advance().value;
      } else if (this.check(TokenType.BOOLEAN)) {
        targetInput = this.advance().value;
      } else {
        throw new ParseError(`Expected connection input name`, this.getCurrentToken());
      }
    }

    return {
      type: 'ConnectionDeclaration',
      source: { node: sourceNode, output: sourceOutput },
      target: { node: targetNode, input: targetInput },
      line: this.getCurrentToken().line,
      column: this.getCurrentToken().column
    };
  }

  private parseExpression(): Expression {
    return this.parseTemplateExpression();
  }

  private parseTemplateExpression(): Expression {
    if (this.check(TokenType.STRING)) {
      const value = this.advance().value;
      
      // Check if it contains template syntax
      if (value.includes('${')) {
        return {
          type: 'TemplateExpression',
          template: value,
          expressions: [], // Would need more sophisticated parsing for actual expressions
          line: this.getCurrentToken().line,
          column: this.getCurrentToken().column
        };
      }
      
      return {
        type: 'LiteralExpression',
        value,
        line: this.getCurrentToken().line,
        column: this.getCurrentToken().column
      };
    }

    return this.parsePrimary();
  }

  private parsePrimary(): Expression {
    if (this.match(TokenType.STRING)) {
      return {
        type: 'LiteralExpression',
        value: this.previous().value,
        line: this.previous().line,
        column: this.previous().column
      };
    }

    if (this.match(TokenType.NUMBER)) {
      const value = parseFloat(this.previous().value);
      return {
        type: 'LiteralExpression',
        value,
        line: this.previous().line,
        column: this.previous().column
      };
    }

    if (this.match(TokenType.BOOLEAN)) {
      const value = this.previous().value === 'true';
      return {
        type: 'LiteralExpression',
        value,
        line: this.previous().line,
        column: this.previous().column
      };
    }

    if (this.match(TokenType.IDENTIFIER)) {
      return {
        type: 'IdentifierExpression',
        name: this.previous().value,
        line: this.previous().line,
        column: this.previous().column
      };
    }

    if (this.match(TokenType.LBRACE)) {
      return this.parseObject();
    }

    if (this.match(TokenType.LBRACKET)) {
      return this.parseArray();
    }

    throw new ParseError(`Unexpected token '${this.getCurrentToken().value}'`, this.getCurrentToken());
  }

  private parseObject(): ObjectExpression {
    const properties: { [key: string]: Expression } = {};
    
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      // Allow both identifiers and string literals as object keys
      let key: string;
      if (this.check(TokenType.IDENTIFIER)) {
        key = this.advance().value;
      } else if (this.check(TokenType.STRING)) {
        key = this.advance().value;
      } else {
        throw new ParseError(`Expected property name`, this.getCurrentToken());
      }
      
      this.expect(TokenType.COLON);
      const value = this.parseExpression();
      properties[key] = value;
      
      if (!this.match(TokenType.COMMA)) {
        break;
      }
    }

    this.expect(TokenType.RBRACE);

    return {
      type: 'ObjectExpression',
      properties,
      line: this.getCurrentToken().line,
      column: this.getCurrentToken().column
    };
  }

  private parseArray(): ArrayExpression {
    const elements: Expression[] = [];
    
    while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
      elements.push(this.parseExpression());
      
      if (!this.match(TokenType.COMMA)) {
        break;
      }
    }

    this.expect(TokenType.RBRACKET);

    return {
      type: 'ArrayExpression',
      elements,
      line: this.getCurrentToken().line,
      column: this.getCurrentToken().column
    };
  }

  // Utility methods
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.getCurrentToken().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.getCurrentToken().type === TokenType.EOF;
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private getCurrentToken(): Token {
    return this.tokens[this.current];
  }

  private expect(type: TokenType): Token {
    if (this.check(type)) {
      return this.advance();
    }
    
    throw new ParseError(
      `Expected ${type} but got ${this.getCurrentToken().type}`, 
      this.getCurrentToken()
    );
  }
}