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
      authentication: 'none',
      requestMethod: params.method || 'GET'
    };

    // Handle query parameters
    if (params.queryParameters && typeof params.queryParameters === 'object') {
      mapped.sendQuery = true;
      mapped.queryParameters = {
        parameters: Object.entries(params.queryParameters).map(([name, value]) => ({
          name,
          value: String(value)
        }))
      };
    }

    // Handle headers
    if (params.headers && typeof params.headers === 'object') {
      mapped.sendHeaders = true;
      mapped.headerParameters = {
        parameters: Object.entries(params.headers).map(([name, value]) => ({
          name,
          value: String(value)
        }))
      };
    }

    // Handle body for POST/PUT/PATCH requests
    if (params.body && ['POST', 'PUT', 'PATCH'].includes(mapped.method)) {
      mapped.sendBody = true;
      if (typeof params.body === 'string') {
        mapped.contentType = 'raw';
        mapped.rawContentType = 'application/json';
        mapped.body = params.body;
      } else if (typeof params.body === 'object') {
        mapped.contentType = 'json';
        mapped.jsonParameters = {
          parameters: Object.entries(params.body).map(([name, value]) => ({
            name,
            value: String(value)
          }))
        };
      }
    }

    // Handle authentication if provided
    if (params.auth) {
      mapped.authentication = params.auth.type || 'none';
      if (params.auth.type === 'basicAuth') {
        mapped.basicAuth = {
          user: params.auth.username || '',
          password: params.auth.password || ''
        };
      } else if (params.auth.type === 'headerAuth') {
        mapped.headerAuth = {
          name: params.auth.name || 'Authorization',
          value: params.auth.value || ''
        };
      }
    }

    // Additional options
    if (params.timeout) {
      mapped.timeout = Number(params.timeout);
    }

    return mapped;
  }
}

// Gmail node parameter mapping
export class GmailTemplate implements NodeTemplate {
  mapParameters(params: Record<string, any>): Record<string, any> {
    const operation = params.operation || 'send';
    const mapped: Record<string, any> = {
      resource: 'message',
      operation
    };

    if (operation === 'send') {
      mapped.sendTo = params.to || params.sendTo || '';
      mapped.subject = params.subject || '';
      mapped.message = params.body || params.message || '';
      mapped.emailType = params.bodyType || params.emailType || 'text';
      
      // Handle CC and BCC
      if (params.cc) mapped.ccList = params.cc;
      if (params.bcc) mapped.bccList = params.bcc;
      
      // Handle attachments
      if (params.attachments) {
        mapped.attachments = params.attachments;
      }
    } else if (operation === 'get') {
      mapped.messageId = params.messageId || params.id || '';
      mapped.format = params.format || 'resolved';
    } else if (operation === 'getAll') {
      mapped.returnAll = params.returnAll || false;
      if (!params.returnAll) {
        mapped.limit = params.limit || 50;
      }
      if (params.query) mapped.q = params.query;
    }

    return mapped;
  }
}

// If node parameter mapping
export class IfTemplate implements NodeTemplate {
  mapParameters(params: Record<string, any>): Record<string, any> {
    const mapped: Record<string, any> = {
      options: params.options || {}
    };

    // Handle multiple conditions if provided as array
    if (params.conditions && Array.isArray(params.conditions)) {
      mapped.conditions = {
        options: {
          version: 2,
          leftValue: '',
          caseSensitive: params.caseSensitive !== false,
          typeValidation: 'strict'
        },
        combinator: params.combinator || 'and',
        conditions: params.conditions.map((cond: any) => ({
          id: cond.id || this.generateId(),
          leftValue: cond.leftValue || cond.left || '',
          rightValue: cond.rightValue || cond.right || '',
          operator: {
            type: this.getDataType(cond.dataType || this.inferDataType(cond.rightValue || cond.right)),
            operation: this.mapOperation(cond.operator || cond.operation || 'eq')
          }
        }))
      };
      return mapped;
    }

    // Parse single condition string into n8n's condition format
    const condition = params.condition || '';
    
    // Enhanced condition parsing for various comparisons
    const comparisonRegex = /(.+?)\s*(>=|<=|>|<|==|!=|contains|startsWith|endsWith|regex)\s*(.+)/i;
    const match = condition.match(comparisonRegex);
    
    if (match) {
      const [, leftValue, operator, rightValue] = match;
      
      mapped.conditions = {
        options: {
          version: 2,
          leftValue: '',
          caseSensitive: params.caseSensitive !== false,
          typeValidation: 'strict'
        },
        combinator: 'and',
        conditions: [
          {
            id: this.generateId(),
            leftValue: leftValue.trim(),
            rightValue: this.parseValue(rightValue.trim()),
            operator: {
              type: this.getDataType(params.dataType || this.inferDataType(rightValue.trim())),
              operation: this.mapOperation(operator.trim().toLowerCase())
            }
          }
        ]
      };
      return mapped;
    }

    // Handle direct parameter mapping (leftValue, rightValue, operator)
    if (params.leftValue !== undefined || params.rightValue !== undefined) {
      mapped.conditions = {
        options: {
          version: 2,
          leftValue: '',
          caseSensitive: params.caseSensitive !== false,
          typeValidation: 'strict'
        },
        combinator: params.combinator || 'and',
        conditions: [
          {
            id: this.generateId(),
            leftValue: params.leftValue || '',
            rightValue: this.parseValue(params.rightValue),
            operator: {
              type: this.getDataType(params.dataType || this.inferDataType(params.rightValue)),
              operation: this.mapOperation(params.operator || params.operation || 'eq')
            }
          }
        ]
      };
      return mapped;
    }

    // Fallback for empty conditions (will need to be configured)
    mapped.conditions = {
      options: {
        version: 2,
        leftValue: '',
        caseSensitive: true,
        typeValidation: 'strict'
      },
      combinator: 'and',
      conditions: [
        {
          id: this.generateId(),
          leftValue: '',
          rightValue: '',
          operator: {
            type: 'string',
            operation: 'eq'
          }
        }
      ]
    };

    return mapped;
  }

  private mapOperation(op: string): string {
    const operationMap: Record<string, string> = {
      '==': 'eq',
      '!=': 'ne',
      '>': 'gt',
      '<': 'lt',
      '>=': 'gte',
      '<=': 'lte',
      'contains': 'contains',
      'startswith': 'startsWith',
      'endswith': 'endsWith',
      'regex': 'regex',
      'equal': 'eq',
      'notequal': 'ne',
      'larger': 'gt',
      'smaller': 'lt',
      'largerequal': 'gte',
      'smallerequal': 'lte',
      'eq': 'eq',
      'ne': 'ne',
      'gt': 'gt',
      'lt': 'lt',
      'gte': 'gte',
      'lte': 'lte'
    };
    return operationMap[op.toLowerCase()] || 'eq';
  }

  private getDataType(type: string | any): string {
    if (typeof type === 'string') {
      const typeMap: Record<string, string> = {
        'string': 'string',
        'number': 'number',
        'boolean': 'boolean',
        'array': 'array',
        'object': 'object',
        'datetime': 'dateTime',
        'date': 'dateTime'
      };
      return typeMap[type.toLowerCase()] || 'string';
    }
    return 'string';
  }

  private inferDataType(value: any): string {
    if (typeof value === 'number') {
      return 'number';
    }
    if (typeof value === 'boolean') {
      return 'boolean';
    }
    if (typeof value === 'string') {
      // Check if it's a number string
      if (!isNaN(Number(value)) && value.trim() !== '') {
        return 'number';
      }
      // Check if it's a boolean string
      if (value === 'true' || value === 'false') {
        return 'boolean';
      }
      // Check if it's a date string
      if (!isNaN(Date.parse(value))) {
        return 'dateTime';
      }
    }
    // Default to string
    return 'string';
  }

  private parseValue(value: any): any {
    if (typeof value === 'string') {
      // Check if it's a number
      if (!isNaN(Number(value)) && value.trim() !== '') {
        return Number(value);
      }
      // Check if it's a boolean
      if (value === 'true') return true;
      if (value === 'false') return false;
    }
    return value;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Schedule Trigger parameter mapping
export class ScheduleTriggerTemplate implements NodeTemplate {
  mapParameters(params: Record<string, any>): Record<string, any> {
    const triggerInterval = params.triggerInterval || params.interval || 'custom';
    
    // Handle cron expressions
    if (params.cron || triggerInterval === 'custom') {
      const cronExpression = params.cron || params.cronExpression;
      if (cronExpression) {
        return {
          triggerInterval: 'custom',
          expression: cronExpression
        };
      }
    }
    
    // Handle predefined intervals
    const mapped: Record<string, any> = {
      triggerInterval
    };
    
    switch (triggerInterval) {
      case 'seconds':
        mapped.secondsInterval = params.secondsInterval || params.seconds || 30;
        break;
      case 'minutes':
        mapped.minutesInterval = params.minutesInterval || params.minutes || 5;
        break;
      case 'hours':
        mapped.hoursInterval = params.hoursInterval || params.hours || 1;
        break;
      case 'days':
        mapped.daysInterval = params.daysInterval || params.days || 1;
        if (params.triggerAtHour !== undefined) {
          mapped.triggerAtHour = params.triggerAtHour;
        }
        if (params.triggerAtMinute !== undefined) {
          mapped.triggerAtMinute = params.triggerAtMinute;
        }
        break;
      case 'weeks':
        mapped.weeksInterval = params.weeksInterval || params.weeks || 1;
        if (params.triggerAtDay !== undefined) {
          mapped.triggerAtDay = Array.isArray(params.triggerAtDay) 
            ? params.triggerAtDay 
            : [params.triggerAtDay];
        }
        if (params.triggerAtHour !== undefined) {
          mapped.triggerAtHour = params.triggerAtHour;
        }
        if (params.triggerAtMinute !== undefined) {
          mapped.triggerAtMinute = params.triggerAtMinute;
        }
        break;
      case 'months':
        mapped.monthsInterval = params.monthsInterval || params.months || 1;
        if (params.triggerAtDayOfMonth !== undefined) {
          mapped.triggerAtDayOfMonth = params.triggerAtDayOfMonth;
        }
        if (params.triggerAtHour !== undefined) {
          mapped.triggerAtHour = params.triggerAtHour;
        }
        if (params.triggerAtMinute !== undefined) {
          mapped.triggerAtMinute = params.triggerAtMinute;
        }
        break;
      default:
        // Default to hourly if no valid interval specified
        mapped.triggerInterval = 'hours';
        mapped.hoursInterval = 1;
    }
    
    return mapped;
  }
}

// Code node parameter mapping
export class CodeTemplate implements NodeTemplate {
  mapParameters(params: Record<string, any>): Record<string, any> {
    const mode = params.mode || 'runOnceForAllItems';
    const mapped: Record<string, any> = {
      mode,
      jsCode: params.code || params.jsCode || 'return items;'
    };
    
    // Handle different execution modes
    if (mode === 'runOnceForEachItem') {
      mapped.mode = 'runOnceForEachItem';
    } else {
      mapped.mode = 'runOnceForAllItems';
    }
    
    // Handle additional options
    if (params.onError) {
      mapped.onError = params.onError; // 'stopWorkflow' or 'continueRegularOutput' or 'continueErrorOutput'
    }
    
    // Handle continue on fail
    if (params.continueOnFail !== undefined) {
      mapped.continueOnFail = Boolean(params.continueOnFail);
    }
    
    return mapped;
  }
}

// Edit Fields (Set) node parameter mapping
export class SetTemplate implements NodeTemplate {
  mapParameters(params: Record<string, any>): Record<string, any> {
    const mode = params.mode || 'manual';
    const mapped: Record<string, any> = {
      mode,
      duplicateItem: params.duplicateItem || false,
      includeOtherFields: params.includeOtherFields !== false // default true
    };
    
    if (mode === 'manual') {
      const assignments: any[] = [];
      
      // Handle assignments from different input formats
      if (params.assignments && Array.isArray(params.assignments)) {
        // Direct assignments array
        assignments.push(...params.assignments.map((assignment: any) => ({
          id: assignment.id || this.generateId(),
          name: assignment.name || assignment.field || '',
          value: assignment.value,
          type: assignment.type || this.getValueType(assignment.value)
        })));
      } else if (params.assignments && typeof params.assignments === 'object') {
        // Object format assignments
        for (const [key, value] of Object.entries(params.assignments)) {
          assignments.push({
            id: this.generateId(),
            name: key,
            value: value,
            type: this.getValueType(value)
          });
        }
      } else if (params.fields && typeof params.fields === 'object') {
        // Alternative fields format
        for (const [key, value] of Object.entries(params.fields)) {
          assignments.push({
            id: this.generateId(),
            name: key,
            value: value,
            type: this.getValueType(value)
          });
        }
      }
      
      mapped.assignments = {
        assignments
      };
    } else if (mode === 'expression') {
      mapped.expression = params.expression || '{}';
    }
    
    // Handle options
    const options: Record<string, any> = {};
    if (params.dotNotation !== undefined) {
      options.dotNotation = Boolean(params.dotNotation);
    }
    if (params.ignoreConversionErrors !== undefined) {
      options.ignoreConversionErrors = Boolean(params.ignoreConversionErrors);
    }
    mapped.options = options;
    
    return mapped;
  }

  private getValueType(value: any): string {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'array';
    if (value === null) return 'null';
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