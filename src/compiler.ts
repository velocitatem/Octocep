/**
 * Main compiler class that orchestrates parsing and generation
 */

import { Parser, ParseError } from './parser/parser';
import { Generator, GeneratorOptions } from './generator/generator';
import { Validator, ValidationError } from './utils/validation';
import { N8nWorkflow } from './types/n8n';
import { Program } from './types/dsl';

export interface CompilerOptions extends GeneratorOptions {
  validate?: boolean;
  strict?: boolean; // Fail on warnings
}

export interface CompilerResult {
  success: boolean;
  workflow?: N8nWorkflow;
  ast?: Program;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export class Compiler {
  private options: CompilerOptions;

  constructor(options: CompilerOptions = {}) {
    this.options = {
      validate: true,
      strict: false,
      autoLayout: true,
      ...options
    };
  }

  compile(dslCode: string): CompilerResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      // Parse DSL to AST
      const parser = new Parser(dslCode);
      const ast = parser.parse();

      // Validate AST if requested
      if (this.options.validate) {
        const validator = new Validator();
        const validationErrors = validator.validateProgram(ast);
        
        for (const error of validationErrors) {
          if (error.type === 'error') {
            errors.push(error);
          } else {
            warnings.push(error);
          }
        }
        
        // Stop if validation errors found
        if (errors.length > 0) {
          return {
            success: false,
            ast,
            errors,
            warnings
          };
        }
        
        // Stop if strict mode and warnings found
        if (this.options.strict && warnings.length > 0) {
          return {
            success: false,
            ast,
            errors: warnings, // Treat warnings as errors in strict mode
            warnings: []
          };
        }
      }

      // Generate n8n workflow JSON
      const generator = new Generator(this.options);
      const workflow = generator.generate(ast);

      // Validate generated workflow if requested
      if (this.options.validate) {
        const validator = new Validator();
        const workflowErrors = validator.validateN8nWorkflow(workflow);
        
        for (const error of workflowErrors) {
          if (error.type === 'error') {
            errors.push(error);
          } else {
            warnings.push(error);
          }
        }
        
        if (errors.length > 0) {
          return {
            success: false,
            workflow,
            ast,
            errors,
            warnings
          };
        }
      }

      return {
        success: true,
        workflow,
        ast,
        errors,
        warnings
      };

    } catch (error) {
      if (error instanceof ParseError) {
        errors.push({
          message: error.message,
          line: error.token.line,
          column: error.token.column,
          type: 'error'
        });
      } else {
        errors.push({
          message: `Compilation error: ${error}`,
          type: 'error'
        });
      }

      return {
        success: false,
        errors,
        warnings
      };
    }
  }

  compileToJson(dslCode: string): string {
    const result = this.compile(dslCode);
    
    if (!result.success) {
      const errorMessage = result.errors.map(e => e.message).join('\n');
      throw new Error(`Compilation failed:\n${errorMessage}`);
    }
    
    return JSON.stringify(result.workflow, null, 2);
  }

  validateOnly(dslCode: string): ValidationError[] {
    try {
      const parser = new Parser(dslCode);
      const ast = parser.parse();
      
      const validator = new Validator();
      return validator.validateProgram(ast);
    } catch (error) {
      if (error instanceof ParseError) {
        return [{
          message: error.message,
          line: error.token.line,
          column: error.token.column,
          type: 'error'
        }];
      }
      
      return [{
        message: `Parse error: ${error}`,
        type: 'error'
      }];
    }
  }
}