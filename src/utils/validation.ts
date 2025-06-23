/**
 * Validation utilities for DSL and n8n workflows
 */

import { Program, WorkflowDeclaration, NodeDeclaration, ConnectionDeclaration } from '../types/dsl';
import { N8nWorkflow } from '../types/n8n';

export interface ValidationError {
  message: string;
  line?: number;
  column?: number;
  type: 'error' | 'warning';
}

export class Validator {
  private errors: ValidationError[] = [];

  validateProgram(program: Program): ValidationError[] {
    this.errors = [];
    this.validateWorkflow(program.workflow);
    return this.errors;
  }

  validateN8nWorkflow(workflow: N8nWorkflow): ValidationError[] {
    this.errors = [];
    
    // Check required fields
    if (!workflow.nodes || workflow.nodes.length === 0) {
      this.addError('Workflow must have at least one node');
    }
    
    if (!workflow.connections) {
      this.addError('Workflow must have connections object');
    }
    
    // Validate nodes
    const nodeNames = new Set<string>();
    for (const node of workflow.nodes || []) {
      if (nodeNames.has(node.name)) {
        this.addError(`Duplicate node name: ${node.name}`);
      }
      nodeNames.add(node.name);
      
      this.validateNode(node);
    }
    
    // Validate connections reference existing nodes
    for (const [sourceName, connections] of Object.entries(workflow.connections || {})) {
      if (!nodeNames.has(sourceName)) {
        this.addError(`Connection source node '${sourceName}' does not exist`);
      }
      
      for (const connType of Object.values(connections)) {
        for (const outputs of connType) {
          for (const conn of outputs) {
            if (!nodeNames.has(conn.node)) {
              this.addError(`Connection target node '${conn.node}' does not exist`);
            }
          }
        }
      }
    }
    
    return this.errors;
  }

  private validateWorkflow(workflow: WorkflowDeclaration): void {
    // Check for duplicate parameter names
    const paramNames = new Set<string>();
    for (const param of workflow.parameters) {
      if (paramNames.has(param.name)) {
        this.addError(`Duplicate parameter name: ${param.name}`, param.line, param.column);
      }
      paramNames.add(param.name);
    }
    
    // Check for duplicate variable names
    const varNames = new Set<string>();
    for (const variable of workflow.variables) {
      if (varNames.has(variable.name)) {
        this.addError(`Duplicate variable name: ${variable.name}`, variable.line, variable.column);
      }
      if (paramNames.has(variable.name)) {
        this.addError(`Variable '${variable.name}' conflicts with parameter name`, variable.line, variable.column);
      }
      varNames.add(variable.name);
    }
    
    // Check for duplicate node names
    const nodeNames = new Set<string>();
    for (const node of workflow.nodes) {
      if (nodeNames.has(node.name)) {
        this.addError(`Duplicate node name: ${node.name}`, node.line, node.column);
      }
      nodeNames.add(node.name);
    }
    
    // Validate connections reference existing nodes
    for (const connection of workflow.connections) {
      if (!nodeNames.has(connection.source.node)) {
        this.addError(
          `Connection source node '${connection.source.node}' does not exist`,
          connection.line,
          connection.column
        );
      }
      
      if (!nodeNames.has(connection.target.node)) {
        this.addError(
          `Connection target node '${connection.target.node}' does not exist`,
          connection.line,
          connection.column
        );
      }
    }
    
    // Check for disconnected nodes (warning)
    const connectedNodes = new Set<string>();
    for (const connection of workflow.connections) {
      connectedNodes.add(connection.source.node);
      connectedNodes.add(connection.target.node);
    }
    
    for (const node of workflow.nodes) {
      if (!connectedNodes.has(node.name)) {
        this.addWarning(
          `Node '${node.name}' is not connected to any other nodes`,
          node.line,
          node.column
        );
      }
    }
  }

  private validateNode(node: any): void {
    if (!node.id) {
      this.addError('Node must have an id');
    }
    
    if (!node.name) {
      this.addError('Node must have a name');
    }
    
    if (!node.type) {
      this.addError('Node must have a type');
    }
    
    if (!node.position || !Array.isArray(node.position) || node.position.length !== 2) {
      this.addError('Node must have a valid position [x, y]');
    }
    
    if (node.parameters === undefined) {
      this.addError('Node must have parameters object');
    }
    
    if (!node.typeVersion) {
      this.addError('Node must have a typeVersion');
    }
  }

  private addError(message: string, line?: number, column?: number): void {
    this.errors.push({
      message,
      line,
      column,
      type: 'error'
    });
  }

  private addWarning(message: string, line?: number, column?: number): void {
    this.errors.push({
      message,
      line,
      column,
      type: 'warning'
    });
  }
}