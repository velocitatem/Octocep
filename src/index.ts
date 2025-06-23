/**
 * Main entry point for the n8n DSL compiler library
 */

export { Compiler, CompilerOptions, CompilerResult } from './compiler';
export { Parser, ParseError } from './parser/parser';
export { Lexer, Token, TokenType } from './parser/lexer';
export { Generator as N8nGenerator, GeneratorOptions } from './generator/generator';
export { Validator, ValidationError } from './utils/validation';

// Type exports
export * from './types/dsl';
export * from './types/n8n';

// Re-export the Compiler class for the convenience function
import { Compiler, CompilerOptions } from './compiler';

// Main convenience function
export function compileDslToN8n(dslCode: string, options?: CompilerOptions): string {
  const compiler = new Compiler(options);
  return compiler.compileToJson(dslCode);
}