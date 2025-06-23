/**
 * Abstract Syntax Tree types for the DSL
 */

// Base AST node
export interface ASTNode {
  type: string;
  line?: number;
  column?: number;
}

// Parameter types
export type ParameterType = 'string' | 'number' | 'boolean' | 'array' | 'object';

export interface ParameterDeclaration extends ASTNode {
  type: 'ParameterDeclaration';
  name: string;
  paramType: ParameterType;
  defaultValue?: any;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    allowed?: string[];
  };
}

// Variable declaration
export interface VariableDeclaration extends ASTNode {
  type: 'VariableDeclaration';
  name: string;
  value: Expression;
}

// Expressions
export type Expression = 
  | LiteralExpression 
  | IdentifierExpression 
  | FunctionCallExpression 
  | TemplateExpression
  | ObjectExpression
  | ArrayExpression;

export interface LiteralExpression extends ASTNode {
  type: 'LiteralExpression';
  value: string | number | boolean;
}

export interface IdentifierExpression extends ASTNode {
  type: 'IdentifierExpression';
  name: string;
}

export interface FunctionCallExpression extends ASTNode {
  type: 'FunctionCallExpression';
  functionName: string;
  arguments: Expression[];
}

export interface TemplateExpression extends ASTNode {
  type: 'TemplateExpression';
  template: string;
  expressions: Expression[];
}

export interface ObjectExpression extends ASTNode {
  type: 'ObjectExpression';
  properties: { [key: string]: Expression };
}

export interface ArrayExpression extends ASTNode {
  type: 'ArrayExpression';
  elements: Expression[];
}

// Node declaration
export interface NodeDeclaration extends ASTNode {
  type: 'NodeDeclaration';
  name: string;
  nodeType: string;
  parameters: { [key: string]: Expression };
  position?: [number, number];
}

// Module declaration
export interface ModuleDeclaration extends ASTNode {
  type: 'ModuleDeclaration';
  name: string;
  modulePath: string;
  parameters: { [key: string]: Expression };
}

// Connection declaration
export interface ConnectionDeclaration extends ASTNode {
  type: 'ConnectionDeclaration';
  source: {
    node: string;
    output?: string;
  };
  target: {
    node: string;
    input?: string;
  };
}

// Workflow declaration
export interface WorkflowDeclaration extends ASTNode {
  type: 'WorkflowDeclaration';
  name: string;
  parameters: ParameterDeclaration[];
  variables: VariableDeclaration[];
  nodes: (NodeDeclaration | ModuleDeclaration)[];
  connections: ConnectionDeclaration[];
}

// Root AST
export interface Program extends ASTNode {
  type: 'Program';
  workflow: WorkflowDeclaration;
}

// Node type mappings - DSL to n8n
export const DSL_TO_N8N_NODE_TYPES: Record<string, string> = {
  // Triggers
  'trigger.manual': 'n8n-nodes-base.manualTrigger',
  'trigger.schedule': 'n8n-nodes-base.scheduleTrigger', 
  'trigger.webhook': 'n8n-nodes-base.webhook',
  'trigger.form': 'n8n-nodes-base.formTrigger',
  
  // Core nodes
  'data.set': 'n8n-nodes-base.set',
  'data.transform': 'n8n-nodes-base.code',
  'flow.if': 'n8n-nodes-base.if',
  'flow.switch': 'n8n-nodes-base.switch',
  'flow.splitOut': 'n8n-nodes-base.splitOut',
  'flow.aggregate': 'n8n-nodes-base.aggregate',
  
  // HTTP and integrations
  'http.request': 'n8n-nodes-base.httpRequest',
  'integration.email': 'n8n-nodes-base.gmail',
  'integration.slack': 'n8n-nodes-base.slack',
  'integration.sheets': 'n8n-nodes-base.googleSheets',
  
  // Utilities
  'util.note': 'n8n-nodes-base.stickyNote',
  'util.noop': 'n8n-nodes-base.noOp'
};

// Default type versions for nodes
export const DEFAULT_TYPE_VERSIONS: Record<string, number> = {
  'n8n-nodes-base.manualTrigger': 1,
  'n8n-nodes-base.scheduleTrigger': 1.2,
  'n8n-nodes-base.webhook': 2,
  'n8n-nodes-base.formTrigger': 2.2,
  'n8n-nodes-base.set': 3.4,
  'n8n-nodes-base.code': 2,
  'n8n-nodes-base.if': 2.2,
  'n8n-nodes-base.switch': 1,
  'n8n-nodes-base.httpRequest': 4.2,
  'n8n-nodes-base.gmail': 2.1,
  'n8n-nodes-base.googleSheets': 4.6,
  'n8n-nodes-base.stickyNote': 1,
  'n8n-nodes-base.noOp': 1
};