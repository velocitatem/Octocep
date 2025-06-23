/**
 * Simple lexer for the DSL
 */

export enum TokenType {
  // Literals
  STRING = 'STRING',
  NUMBER = 'NUMBER', 
  BOOLEAN = 'BOOLEAN',
  IDENTIFIER = 'IDENTIFIER',
  
  // Keywords
  WORKFLOW = 'WORKFLOW',
  PARAM = 'PARAM',
  VAR = 'VAR',
  NODE = 'NODE',
  MODULE = 'MODULE',
  CONNECT = 'CONNECT',
  
  // Punctuation
  LBRACE = 'LBRACE',        // {
  RBRACE = 'RBRACE',        // }
  LPAREN = 'LPAREN',        // (
  RPAREN = 'RPAREN',        // )
  LBRACKET = 'LBRACKET',    // [
  RBRACKET = 'RBRACKET',    // ]
  COMMA = 'COMMA',          // ,
  COLON = 'COLON',          // :
  SEMICOLON = 'SEMICOLON',  // ;
  EQUALS = 'EQUALS',        // =
  ARROW = 'ARROW',          // ->
  DOT = 'DOT',              // .
  
  // Logical operators
  OR = 'OR',                // ||
  AND = 'AND',              // &&
  
  // Special
  TEMPLATE_START = 'TEMPLATE_START',  // ${
  TEMPLATE_END = 'TEMPLATE_END',      // }
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
  
  // Comments
  COMMENT = 'COMMENT'
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export class Lexer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  
  private keywords = new Set([
    'workflow', 'param', 'var', 'node', 'module', 'connect',
    'true', 'false', 'string', 'number', 'boolean', 'array', 'object'
  ]);

  constructor(input: string) {
    this.input = input;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    
    while (this.position < this.input.length) {
      this.skipWhitespace();
      
      if (this.position >= this.input.length) break;
      
      const token = this.nextToken();
      if (token) {
        tokens.push(token);
      }
    }
    
    tokens.push({
      type: TokenType.EOF,
      value: '',
      line: this.line,
      column: this.column
    });
    
    return tokens;
  }

  private nextToken(): Token | null {
    const char = this.input[this.position];
    const line = this.line;
    const column = this.column;

    // Single character tokens
    switch (char) {
      case '{': return this.makeToken(TokenType.LBRACE, this.advance());
      case '}': return this.makeToken(TokenType.RBRACE, this.advance());
      case '(': return this.makeToken(TokenType.LPAREN, this.advance());
      case ')': return this.makeToken(TokenType.RPAREN, this.advance());
      case '[': return this.makeToken(TokenType.LBRACKET, this.advance());
      case ']': return this.makeToken(TokenType.RBRACKET, this.advance());
      case ',': return this.makeToken(TokenType.COMMA, this.advance());
      case ':': return this.makeToken(TokenType.COLON, this.advance());
      case ';': return this.makeToken(TokenType.SEMICOLON, this.advance());
      case '.': return this.makeToken(TokenType.DOT, this.advance());
      case '\n': 
        this.line++;
        this.column = 1;
        return this.makeToken(TokenType.NEWLINE, this.advance());
    }

    // Multi-character tokens
    if (char === '=' && this.peek() === '=') {
      this.advance();
      return this.makeToken(TokenType.EQUALS, this.advance());
    }
    
    if (char === '=') {
      return this.makeToken(TokenType.EQUALS, this.advance());
    }

    if (char === '-' && this.peek() === '>') {
      this.advance();
      return this.makeToken(TokenType.ARROW, this.advance());
    }

    if (char === '$' && this.peek() === '{') {
      this.advance();
      return this.makeToken(TokenType.TEMPLATE_START, this.advance());
    }

    // Logical operators
    if (char === '|' && this.peek() === '|') {
      this.advance();
      return this.makeToken(TokenType.OR, this.advance());
    }

    if (char === '&' && this.peek() === '&') {
      this.advance();
      return this.makeToken(TokenType.AND, this.advance());
    }

    // Comments
    if (char === '/' && this.peek() === '/') {
      return this.readComment();
    }

    if (char === '/' && this.peek() === '*') {
      return this.readBlockComment();
    }

    // Multi-line strings (triple quotes)
    if (char === '"' && this.peek() === '"' && this.peek(2) === '"') {
      return this.readMultiLineString();
    }

    // Strings
    if (char === '"' || char === "'") {
      return this.readString(char);
    }

    // Numbers
    if (this.isDigit(char)) {
      return this.readNumber();
    }

    // Identifiers and keywords
    if (this.isAlpha(char) || char === '_') {
      return this.readIdentifier();
    }

    // Skip unknown characters that might be in strings (more forgiving)
    if (char === '*' || char === '?' || char === '\\' || char === '|' || char === '&') {
      console.warn(`Skipping unexpected character '${char}' at line ${line}, column ${column}`);
      this.advance();
      return this.nextToken(); // Try next character
    }

    // Unknown character
    throw new Error(`Unexpected character '${char}' at line ${line}, column ${column}`);
  }

  private makeToken(type: TokenType, value: string): Token {
    return {
      type,
      value,
      line: this.line,
      column: this.column - value.length
    };
  }

  private advance(): string {
    const char = this.input[this.position];
    this.position++;
    this.column++;
    return char;
  }

  private peek(offset: number = 1): string {
    const pos = this.position + offset;
    return pos < this.input.length ? this.input[pos] : '';
  }

  private skipWhitespace(): void {
    while (this.position < this.input.length) {
      const char = this.input[this.position];
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
      } else {
        break;
      }
    }
  }

  private readString(quote: string): Token {
    const start = this.column;
    let value = '';
    this.advance(); // Skip opening quote

    while (this.position < this.input.length) {
      const char = this.input[this.position];
      
      if (char === quote) {
        this.advance(); // Skip closing quote
        return {
          type: TokenType.STRING,
          value,
          line: this.line,
          column: start
        };
      }
      
      if (char === '\\') {
        this.advance();
        const escaped = this.advance();
        switch (escaped) {
          case 'n': value += '\n'; break;
          case 't': value += '\t'; break;
          case 'r': value += '\r'; break;
          case '\\': value += '\\'; break;
          case '"': value += '"'; break;
          case "'": value += "'"; break;
          case '/': value += '/'; break;  // Allow escaped forward slashes
          default: value += escaped; break;
        }
      } else if (char === '\n') {
        this.line++;
        this.column = 1;
        value += this.advance();
      } else {
        value += this.advance();
      }
    }

    throw new Error(`Unterminated string at line ${this.line}, column ${start}`);
  }

  private readMultiLineString(): Token {
    const start = this.column;
    let value = '';
    
    // Skip opening triple quotes
    this.advance(); 
    this.advance(); 
    this.advance();

    while (this.position < this.input.length - 2) {
      const char = this.input[this.position];
      
      // Check for closing triple quotes
      if (char === '"' && this.peek() === '"' && this.peek(2) === '"') {
        this.advance(); // Skip first closing quote
        this.advance(); // Skip second closing quote  
        this.advance(); // Skip third closing quote
        return {
          type: TokenType.STRING,
          value: value.trim(), // Trim whitespace from multi-line strings
          line: this.line,
          column: start
        };
      }
      
      if (char === '\n') {
        this.line++;
        this.column = 1;
        value += this.advance();
      } else {
        value += this.advance();
      }
    }

    throw new Error(`Unterminated multi-line string at line ${this.line}, column ${start}`);
  }

  private readNumber(): Token {
    const start = this.column;
    let value = '';
    
    while (this.position < this.input.length && 
           (this.isDigit(this.input[this.position]) || this.input[this.position] === '.')) {
      value += this.advance();
    }

    return {
      type: TokenType.NUMBER,
      value,
      line: this.line,
      column: start
    };
  }

  private readIdentifier(): Token {
    const start = this.column;
    let value = '';
    
    while (this.position < this.input.length && 
           (this.isAlphaNumeric(this.input[this.position]) || this.input[this.position] === '_')) {
      value += this.advance();
    }

    // Check if it's a keyword
    const type = this.keywords.has(value.toLowerCase()) ? 
      this.getKeywordType(value.toLowerCase()) : TokenType.IDENTIFIER;

    return {
      type,
      value,
      line: this.line,
      column: start
    };
  }

  private readComment(): Token {
    const start = this.column;
    let value = '';
    
    // Skip //
    this.advance();
    this.advance();
    
    while (this.position < this.input.length && this.input[this.position] !== '\n') {
      value += this.advance();
    }

    return {
      type: TokenType.COMMENT,
      value: value.trim(),
      line: this.line,
      column: start
    };
  }

  private readBlockComment(): Token {
    const start = this.column;
    let value = '';
    
    // Skip /*
    this.advance();
    this.advance();
    
    while (this.position < this.input.length - 1) {
      if (this.input[this.position] === '*' && this.input[this.position + 1] === '/') {
        this.advance(); // Skip *
        this.advance(); // Skip /
        break;
      }
      
      if (this.input[this.position] === '\n') {
        this.line++;
        this.column = 1;
      }
      
      value += this.advance();
    }

    return {
      type: TokenType.COMMENT,
      value: value.trim(),
      line: this.line,
      column: start
    };
  }

  private getKeywordType(keyword: string): TokenType {
    switch (keyword) {
      case 'workflow': return TokenType.WORKFLOW;
      case 'param': return TokenType.PARAM;
      case 'var': return TokenType.VAR;
      case 'node': return TokenType.NODE;
      case 'module': return TokenType.MODULE;
      case 'connect': return TokenType.CONNECT;
      case 'true':
      case 'false': return TokenType.BOOLEAN;
      default: return TokenType.IDENTIFIER;
    }
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || 
           (char >= 'A' && char <= 'Z');
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
}