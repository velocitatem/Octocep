/**
 * Node-specific parameter templates and mappings
 */

export interface NodeTemplate {
  mapParameters(params: Record<string, any>): Record<string, any>;
}

// HTTP Request node parameter mapping
export class HttpRequestTemplate implements NodeTemplate {
  mapParameters(params: Record<string, any>): Record<string, any> {
    const mapped: Record<string, any> = {
      method: params.method || 'GET',
      url: params.url || '',
    };

    if (params.headers && typeof params.headers === 'object') {
      mapped.sendHeaders = true;
      mapped.headerParameters = {
        parameters: Object.entries(params.headers).map(([name, value]) => ({
          name,
          value: String(value)
        }))
      };
    }

    if (params.body) {
      mapped.sendBody = true;
      mapped.bodyParameters = {
        parameters: Object.entries(params.body).map(([name, value]) => ({
          name,
          value: String(value)
        }))
      };
    }

    return mapped;
  }
}

// Gmail node parameter mapping
export class GmailTemplate implements NodeTemplate {
  mapParameters(params: Record<string, any>): Record<string, any> {
    return {
      operation: 'send',
      sendTo: params.to || '',
      subject: params.subject || '',
      message: params.body || '',
      emailType: params.bodyType || 'text',
      ...params
    };
  }
}

// If node parameter mapping
export class IfTemplate implements NodeTemplate {
  mapParameters(params: Record<string, any>): Record<string, any> {
    // Parse condition string into n8n's condition format
    const condition = params.condition || '';
    
    // Simple condition parsing for basic comparisons
    const comparisonRegex = /(.+?)\s*(>=|<=|>|<|==|!=)\s*(.+)/;
    const match = condition.match(comparisonRegex);
    
    if (match) {
      const [, leftValue, operator, rightValue] = match;
      
      return {
        conditions: {
          options: {
            caseSensitive: true,
            leftValue: '',
            typeValidation: 'strict'
          },
          conditions: [
            {
              id: this.generateId(),
              leftValue: leftValue.trim(),
              rightValue: rightValue.trim(),
              operator: {
                type: this.getOperatorType(rightValue.trim()),
                operation: this.mapOperator(operator.trim())
              }
            }
          ],
          combinator: 'and'
        }
      };
    }

    // Fallback for simple conditions
    return {
      conditions: {
        options: {
          caseSensitive: true,
          leftValue: '',
          typeValidation: 'strict'
        },
        conditions: [
          {
            id: this.generateId(),
            leftValue: condition,
            rightValue: 'true',
            operator: {
              type: 'boolean',
              operation: 'equal'
            }
          }
        ],
        combinator: 'and'
      }
    };
  }

  private mapOperator(op: string): string {
    switch (op) {
      case '==': return 'equal';
      case '!=': return 'notEqual';
      case '>': return 'larger';
      case '<': return 'smaller';
      case '>=': return 'largerEqual';
      case '<=': return 'smallerEqual';
      default: return 'equal';
    }
  }

  private getOperatorType(value: string): string {
    // Check if it's a number
    if (!isNaN(Number(value))) {
      return 'number';
    }
    // Check if it's a boolean
    if (value === 'true' || value === 'false') {
      return 'boolean';
    }
    // Default to string
    return 'string';
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Schedule Trigger parameter mapping
export class ScheduleTriggerTemplate implements NodeTemplate {
  mapParameters(params: Record<string, any>): Record<string, any> {
    if (params.cron) {
      // Parse cron expression
      const cronParts = params.cron.split(' ');
      if (cronParts.length >= 5) {
        const [minute, hour, dayOfMonth, month, dayOfWeek] = cronParts;
        
        return {
          rule: {
            interval: [
              {
                field: 'cronExpression',
                cronExpression: params.cron
              }
            ]
          }
        };
      }
    }

    return {
      rule: {
        interval: [
          {
            field: 'hours',
            hoursInterval: 1
          }
        ]
      }
    };
  }
}

// Code/Transform node parameter mapping
export class CodeTemplate implements NodeTemplate {
  mapParameters(params: Record<string, any>): Record<string, any> {
    return {
      mode: 'runOnceForAllItems',
      jsCode: params.code || 'return items;'
    };
  }
}

// Set node parameter mapping
export class SetTemplate implements NodeTemplate {
  mapParameters(params: Record<string, any>): Record<string, any> {
    const assignments: any[] = [];
    
    if (params.assignments && typeof params.assignments === 'object') {
      for (const [key, value] of Object.entries(params.assignments)) {
        assignments.push({
          id: this.generateId(),
          name: key,
          value: String(value),
          type: this.getValueType(value)
        });
      }
    }

    return {
      assignments: {
        assignments
      },
      options: {}
    };
  }

  private getValueType(value: any): string {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return 'string';
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Manual Trigger - no special parameters needed
export class ManualTriggerTemplate implements NodeTemplate {
  mapParameters(params: Record<string, any>): Record<string, any> {
    return {};
  }
}

// Node template registry
export const NODE_TEMPLATES: Record<string, NodeTemplate> = {
  'n8n-nodes-base.httpRequest': new HttpRequestTemplate(),
  'n8n-nodes-base.gmail': new GmailTemplate(),
  'n8n-nodes-base.if': new IfTemplate(),
  'n8n-nodes-base.scheduleTrigger': new ScheduleTriggerTemplate(),
  'n8n-nodes-base.code': new CodeTemplate(),
  'n8n-nodes-base.set': new SetTemplate(),
  'n8n-nodes-base.manualTrigger': new ManualTriggerTemplate(),
};

export function getNodeTemplate(nodeType: string): NodeTemplate | null {
  return NODE_TEMPLATES[nodeType] || null;
}