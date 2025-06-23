/**
 * TypeScript interfaces for n8n workflow JSON structure
 * Based on analysis of real n8n workflow exports
 */

// Base types
export type NodeId = string;
export type NodeType = string;
export type ConnectionType = 'main' | 'ai_languageModel' | 'ai_outputParser';

// Resource Locator pattern used throughout n8n
export interface ResourceLocator {
  __rl: true;
  value: string | number;
  mode: 'url' | 'list' | 'id' | 'name';
  cachedResultUrl?: string;
  cachedResultName?: string;
}

// Position on n8n canvas
export type NodePosition = [number, number]; // [x, y]

// Node credential reference
export interface NodeCredential {
  id: string;
  name: string;
}

// Connection between nodes
export interface NodeConnection {
  node: string;    // Target node name
  type: ConnectionType;
  index: number;   // Input index on target node
}

// Node connections structure
export interface NodeConnections {
  [outputType: string]: NodeConnection[][]; // [outputIndex][connectionIndex]
}

// Workflow connections structure  
export interface WorkflowConnections {
  [sourceNodeName: string]: NodeConnections;
}

// Base node interface - all nodes must have these fields
export interface BaseNode {
  id: NodeId;              // Required: Unique identifier
  name: string;            // Required: Display name
  type: NodeType;          // Required: Node type (e.g., 'n8n-nodes-base.set')
  position: NodePosition;  // Required: Canvas position
  parameters: Record<string, any>; // Required: Node configuration
  typeVersion: number;     // Required: Node type version for compatibility
}

// Extended node interface with optional fields
export interface N8nNode extends BaseNode {
  disabled?: boolean;      // Optional: Disable node execution
  credentials?: Record<string, NodeCredential>; // Optional: Credential references
  webhookId?: string;      // Optional: For webhook/trigger nodes
  executeOnce?: boolean;   // Optional: Execute only once flag
  notesInFlow?: boolean;   // Optional: Show notes in workflow view
  notes?: string;          // Optional: Node documentation
}

// Workflow metadata
export interface WorkflowMeta {
  instanceId?: string;     // n8n instance identifier
  templateId?: string;     // Template ID if created from template
  templateCredsSetupCompleted?: boolean; // Credential setup status
}

// Workflow settings
export interface WorkflowSettings {
  executionOrder?: 'v0' | 'v1'; // Execution order version
  [key: string]: any;      // Additional settings
}

// Main workflow structure
export interface N8nWorkflow {
  // Required fields
  nodes: N8nNode[];        // Required: Array of workflow nodes
  connections: WorkflowConnections; // Required: Node connection mappings
  
  // Optional fields
  pinData?: Record<NodeId, any>; // Optional: Pinned data for testing
  meta?: WorkflowMeta;     // Optional: Workflow metadata
  name?: string;           // Optional: Workflow name
  id?: string;             // Optional: Workflow identifier
  tags?: string[];         // Optional: Workflow tags
  active?: boolean;        // Optional: Active status
  settings?: WorkflowSettings; // Optional: Workflow settings
  versionId?: string;      // Optional: Version identifier
}

// Common parameter patterns
export interface SetNodeParameters {
  assignments: {
    assignments: Array<{
      id: string;
      name: string;
      type: 'string' | 'number' | 'boolean' | 'array' | 'object';
      value: any;
    }>;
  };
  options?: Record<string, any>;
  includeOtherFields?: boolean;
}

export interface IfNodeParameters {
  conditions: {
    combinator: 'and' | 'or';
    conditions: Array<{
      id: string;
      leftValue: any;
      rightValue: any;
      operator: {
        type: string;
        operation: string;
      };
    }>;
    options?: {
      version?: number;
      leftValue?: string;
      caseSensitive?: boolean;
      typeValidation?: 'strict' | 'loose';
    };
  };
  options?: Record<string, any>;
}

export interface HttpRequestParameters {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  sendBody?: boolean;
  bodyParameters?: {
    parameters: Array<{
      name: string;
      value: any;
    }>;
  };
  options?: Record<string, any>;
}

export interface GoogleSheetsParameters {
  documentId: ResourceLocator;
  sheetName?: ResourceLocator;
  operation?: string;
  columns?: {
    mappingMode: string;
    value?: Record<string, any>;
    schema?: Array<{
      id: string;
      displayName: string;
      required: boolean;
      type: string;
      canBeUsedToMatch: boolean;
      defaultMatch: boolean;
      display: boolean;
      removed?: boolean;
    }>;
    matchingColumns?: string[];
    attemptToConvertTypes?: boolean;
    convertFieldsToString?: boolean;
  };
  options?: Record<string, any>;
}

// Trigger node parameters
export interface ScheduleTriggerParameters {
  rule: {
    interval: Array<{
      triggerAtHour?: number;
      triggerAtMinute?: number;
      field?: string;
    }>;
  };
}

export interface FormTriggerParameters {
  formTitle: string;
  formDescription?: string;
  formFields: {
    values: Array<{
      fieldType: 'text' | 'textarea' | 'number' | 'dropdown' | 'checkbox';
      fieldLabel: string;
      placeholder?: string;
      requiredField?: boolean;
      fieldOptions?: {
        values: Array<{
          option: string;
        }>;
      };
    }>;
  };
  responseMode?: string;
  options?: {
    ignoreBots?: boolean;
    buttonLabel?: string;
    appendAttribution?: boolean;
    respondWithOptions?: {
      values: {
        redirectUrl?: string;
        respondWith?: string;
      };
    };
  };
}

// Utility types for common node categories
export type TriggerNodeType = 
  | 'n8n-nodes-base.scheduleTrigger'
  | 'n8n-nodes-base.googleSheetsTrigger'
  | 'n8n-nodes-base.formTrigger'
  | 'n8n-nodes-base.manualTrigger'
  | 'n8n-nodes-base.webhook';

export type CoreNodeType =
  | 'n8n-nodes-base.set'
  | 'n8n-nodes-base.code'
  | 'n8n-nodes-base.if'
  | 'n8n-nodes-base.splitOut'  
  | 'n8n-nodes-base.aggregate'
  | 'n8n-nodes-base.splitInBatches';

export type ServiceNodeType =
  | 'n8n-nodes-base.googleSheets'
  | 'n8n-nodes-base.gmail'
  | 'n8n-nodes-base.googleCalendar'
  | 'n8n-nodes-base.httpRequest';

export type LangChainNodeType =
  | '@n8n/n8n-nodes-langchain.chainLlm'
  | '@n8n/n8n-nodes-langchain.lmChatAzureOpenAi'
  | '@n8n/n8n-nodes-langchain.outputParserStructured';

export type UtilityNodeType =
  | 'n8n-nodes-base.stickyNote'
  | 'n8n-nodes-base.noOp'
  | 'n8n-nodes-base.convertToFile';

// Type guards for node identification
export function isTriggerNode(type: NodeType): type is TriggerNodeType {
  return type.includes('Trigger') || type === 'n8n-nodes-base.webhook';
}

export function isServiceNode(type: NodeType): type is ServiceNodeType {
  return ['googleSheets', 'gmail', 'googleCalendar', 'httpRequest'].some(service => 
    type.includes(service)
  );
}

export function isLangChainNode(type: NodeType): type is LangChainNodeType {
  return type.startsWith('@n8n/n8n-nodes-langchain');
}

// Helper functions for workflow manipulation
export function createNode(
  type: NodeType, 
  name: string, 
  position: NodePosition,
  parameters: Record<string, any> = {},
  typeVersion: number = 1
): N8nNode {
  return {
    id: generateNodeId(),
    name,
    type,
    position,
    parameters,
    typeVersion
  };
}

export function generateNodeId(): NodeId {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function createConnection(
  sourceNode: string,
  targetNode: string,
  sourceOutput: number = 0,
  targetInput: number = 0,
  connectionType: ConnectionType = 'main'
): [string, NodeConnections] {
  return [sourceNode, {
    [connectionType]: [
      [
        {
          node: targetNode,
          type: connectionType,
          index: targetInput
        }
      ]
    ]
  }];
}