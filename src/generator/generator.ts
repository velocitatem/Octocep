/**
 * Generates n8n workflow JSON from DSL AST
 */

import {
  Program, WorkflowDeclaration, NodeDeclaration, ModuleDeclaration,
  ConnectionDeclaration, Expression, ParameterDeclaration, VariableDeclaration,
  DSL_TO_N8N_NODE_TYPES, DEFAULT_TYPE_VERSIONS
} from '../types/dsl';
import {
  N8nWorkflow, N8nNode, WorkflowConnections, NodeConnection,
  generateNodeId, NodePosition
} from '../types/n8n';
import { getNodeTemplate } from './nodeTemplates';

export interface GeneratorOptions {
  instanceId?: string;
  autoLayout?: boolean;
  startPosition?: [number, number];
  spacing?: number;
}

export class Generator {
  private options: GeneratorOptions;
  private parameters: Map<string, any> = new Map();
  private variables: Map<string, any> = new Map();
  private nodePositions: Map<string, NodePosition> = new Map();
  private currentPosition: [number, number] = [0, 0];

  constructor(options: GeneratorOptions = {}) {
    this.options = {
      autoLayout: true,
      startPosition: [0, 0],
      spacing: 200,
      ...options
    };
    this.currentPosition = [...this.options.startPosition!];
  }

  generate(program: Program): N8nWorkflow {
    const workflow = program.workflow;
    
    // Process parameters and variables
    this.processParameters(workflow.parameters);
    this.processVariables(workflow.variables);
    
    // Generate nodes
    const nodes: N8nNode[] = [];
    for (const nodeDecl of workflow.nodes) {
      const node = this.generateNode(nodeDecl);
      nodes.push(node);
    }
    
    // Generate connections
    const connections = this.generateConnections(workflow.connections, nodes);
    
    // Create workflow
    const n8nWorkflow: N8nWorkflow = {
      nodes,
      connections,
      pinData: {},
      meta: {
        instanceId: this.options.instanceId || this.generateInstanceId()
      },
      name: workflow.name,
      active: false,
      settings: {
        executionOrder: 'v1'
      }
    };
    
    return n8nWorkflow;
  }

  private processParameters(parameters: ParameterDeclaration[]): void {
    for (const param of parameters) {
      // Evaluate default value if it's an expression
      let defaultValue = param.defaultValue;
      if (param.defaultValue && typeof param.defaultValue === 'object' && param.defaultValue.type) {
        defaultValue = this.evaluateExpression(param.defaultValue);
      }
      
      // Store parameter info for template resolution
      this.parameters.set(param.name, {
        type: param.paramType,
        defaultValue: defaultValue,
        required: param.required
      });
    }
  }

  private processVariables(variables: VariableDeclaration[]): void {
    for (const variable of variables) {
      const value = this.evaluateExpression(variable.value);
      this.variables.set(variable.name, value);
    }
  }

  private generateNode(nodeDecl: NodeDeclaration | ModuleDeclaration): N8nNode {
    if (nodeDecl.type === 'ModuleDeclaration') {
      // For now, treat modules as regular nodes
      // In a full implementation, we'd resolve the module
      throw new Error('Module resolution not implemented yet');
    }

    const node = nodeDecl as NodeDeclaration;
    const n8nNodeType = this.mapNodeType(node.nodeType);
    const position = this.getNodePosition(node.name);
    const parameters = this.generateNodeParameters(node.parameters, n8nNodeType);

    return {
      id: generateNodeId(),
      name: node.name,
      type: n8nNodeType,
      position,
      parameters,
      typeVersion: DEFAULT_TYPE_VERSIONS[n8nNodeType] || 1
    };
  }

  private mapNodeType(dslType: string): string {
    const n8nType = DSL_TO_N8N_NODE_TYPES[dslType];
    if (!n8nType) {
      throw new Error(`Unknown node type: ${dslType}`);
    }
    return n8nType;
  }

  private getNodePosition(nodeName: string): NodePosition {
    if (this.nodePositions.has(nodeName)) {
      return this.nodePositions.get(nodeName)!;
    }

    if (this.options.autoLayout) {
      const position: NodePosition = [...this.currentPosition];
      this.nodePositions.set(nodeName, position);
      this.currentPosition[0] += this.options.spacing!;
      return position;
    }

    return [0, 0];
  }

  private generateNodeParameters(
    parameters: { [key: string]: Expression }, 
    nodeType: string
  ): Record<string, any> {
    // First evaluate all expressions to get raw parameter values
    const rawParams: Record<string, any> = {};
    for (const [key, expr] of Object.entries(parameters)) {
      rawParams[key] = this.evaluateExpression(expr);
    }
    
    // Apply node-specific parameter mapping
    const template = getNodeTemplate(nodeType);
    if (template) {
      return template.mapParameters(rawParams);
    }
    
    // Fallback to raw parameters if no template found
    return rawParams;
  }

  private evaluateExpression(expr: Expression): any {
    switch (expr.type) {
      case 'LiteralExpression':
        return expr.value;
        
      case 'IdentifierExpression':
        // Check variables first, then parameters
        if (this.variables.has(expr.name)) {
          return this.variables.get(expr.name);
        }
        if (this.parameters.has(expr.name)) {
          const param = this.parameters.get(expr.name);
          return param.defaultValue;
        }
        // If not found in variables/parameters, return as string (might be a parameter reference)
        return expr.name;
        
      case 'ObjectExpression':
        const obj: Record<string, any> = {};
        for (const [key, value] of Object.entries(expr.properties)) {
          obj[key] = this.evaluateExpression(value);
        }
        return obj;
        
      case 'ArrayExpression':
        return expr.elements.map(elem => this.evaluateExpression(elem));
        
      case 'TemplateExpression':
        return this.evaluateTemplate(expr.template);
        
      default:
        throw new Error(`Unsupported expression type: ${(expr as any).type}`);
    }
  }

  private evaluateTemplate(template: string): string {
    // Simple template evaluation - replace ${varName} with variable values
    return template.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      const trimmed = varName.trim();
      
      if (this.variables.has(trimmed)) {
        return String(this.variables.get(trimmed));
      }
      
      if (this.parameters.has(trimmed)) {
        const param = this.parameters.get(trimmed);
        return String(param.defaultValue || '');
      }
      
      // Handle built-in functions
      if (trimmed.startsWith('now(')) {
        return new Date().toISOString();
      }
      
      if (trimmed.startsWith('env(')) {
        const envVar = trimmed.match(/env\(['"]([^'"]+)['"]\)/)?.[1];
        return process.env[envVar || ''] || '';
      }
      
      return match; // Return original if not found
    });
  }

  private generateConnections(
    connections: ConnectionDeclaration[], 
    nodes: N8nNode[]
  ): WorkflowConnections {
    const nodeNameToName = new Map<string, string>();
    for (const node of nodes) {
      nodeNameToName.set(node.name, node.name);
    }

    const result: WorkflowConnections = {};

    for (const conn of connections) {
      const sourceName = conn.source.node;
      const targetName = conn.target.node;
      
      // Validate nodes exist
      if (!nodeNameToName.has(sourceName)) {
        throw new Error(`Source node '${sourceName}' not found`);
      }
      if (!nodeNameToName.has(targetName)) {
        throw new Error(`Target node '${targetName}' not found`);
      }

      // Initialize source connections if not exists
      if (!result[sourceName]) {
        result[sourceName] = {};
      }

      const connectionType = this.mapConnectionType(conn.source.output || 'main');
      const outputIndex = this.mapOutputIndex(conn.source.output || 'main');
      const inputIndex = 0;  // Simplified - always use first input

      if (!result[sourceName][connectionType]) {
        result[sourceName][connectionType] = [];
      }

      if (!result[sourceName][connectionType][outputIndex]) {
        result[sourceName][connectionType][outputIndex] = [];
      }

      const nodeConnection: NodeConnection = {
        node: targetName,
        type: connectionType as any,
        index: inputIndex
      };

      result[sourceName][connectionType][outputIndex].push(nodeConnection);
    }

    return result;
  }

  private mapConnectionType(dslType: string): string {
    // Map DSL connection types to n8n connection types
    switch (dslType) {
      case 'main':
      case 'output':
      case 'true':
      case 'false':
        return 'main';
      case 'error':
        return 'main'; // n8n uses main for error connections too
      default:
        return 'main';
    }
  }

  private mapOutputIndex(dslOutput: string): number {
    // Map DSL output names to n8n output indices
    switch (dslOutput) {
      case 'main':
      case 'output':
      case 'true':
        return 0;
      case 'false':
        return 1;
      default:
        return 0;
    }
  }

  private generateInstanceId(): string {
    return Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
}

export { Generator as N8nGenerator };