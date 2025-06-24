# Node Templates Documentation

This document provides comprehensive documentation for all available node templates in the Tricep DSL system. Each template handles the mapping of DSL parameters to n8n's internal node structure.

## Overview

Node templates are TypeScript classes that implement the `NodeTemplate` interface. They transform user-friendly DSL parameters into the specific parameter format expected by n8n nodes.

## Available Node Templates

- [HTTP Request Node](#http-request-node)
- [Gmail Node](#gmail-node)
- [If Node (Decision)](#if-node-decision)
- [Schedule Trigger Node](#schedule-trigger-node)
- [Code Node](#code-node)
- [Edit Fields (Set) Node](#edit-fields-set-node)
- [Manual Trigger Node](#manual-trigger-node)

---

## HTTP Request Node

**Type:** `n8n-nodes-base.httpRequest`  
**Template Class:** `HttpRequestTemplate`

Makes HTTP requests to external APIs and services.

### Parameters

#### Basic Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `method` | string | No | HTTP method (GET, POST, PUT, DELETE, PATCH). Default: 'GET' |
| `url` | string | Yes | Target URL for the request |
| `timeout` | number | No | Request timeout in milliseconds |

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `queryParameters` | object | Key-value pairs for URL query parameters |

```typescript
queryParameters: {
  page: "1",
  limit: "10",
  filter: "active"
}
```

#### Headers

| Parameter | Type | Description |
|-----------|------|-------------|
| `headers` | object | HTTP headers to include in the request |

```typescript
headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer token123",
  "User-Agent": "MyApp/1.0"
}
```

#### Request Body

| Parameter | Type | Description |
|-----------|------|-------------|
| `body` | string \| object | Request body for POST/PUT/PATCH requests |

**String Body:**
```typescript
body: '{"name": "John", "email": "john@example.com"}'
```

**Object Body:**
```typescript
body: {
  name: "John",
  email: "john@example.com"
}
```

#### Authentication

| Parameter | Type | Description |
|-----------|------|-------------|
| `auth` | object | Authentication configuration |
| `auth.type` | string | Authentication type: 'basicAuth', 'headerAuth', 'none' |
| `auth.username` | string | Username for basic auth |
| `auth.password` | string | Password for basic auth |
| `auth.name` | string | Header name for header auth |
| `auth.value` | string | Header value for header auth |

**Basic Authentication:**
```typescript
auth: {
  type: "basicAuth",
  username: "myuser",
  password: "mypass"
}
```

**Header Authentication:**
```typescript
auth: {
  type: "headerAuth",
  name: "Authorization",
  value: "Bearer token123"
}
```

### Example Usage

```typescript
const httpParams = {
  method: "POST",
  url: "https://api.example.com/users",
  headers: {
    "Content-Type": "application/json"
  },
  body: {
    name: "John Doe",
    email: "john@example.com"
  },
  auth: {
    type: "headerAuth",
    name: "Authorization",
    value: "Bearer mytoken"
  },
  timeout: 30000
};
```

---

## Gmail Node

**Type:** `n8n-nodes-base.gmail`  
**Template Class:** `GmailTemplate`

Integrates with Gmail for sending and managing emails.

### Parameters

#### Basic Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `operation` | string | No | Gmail operation: 'send', 'get', 'getAll'. Default: 'send' |

#### Send Operation Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `to` \| `sendTo` | string | Yes | Recipient email address |
| `subject` | string | Yes | Email subject |
| `body` \| `message` | string | Yes | Email content |
| `bodyType` \| `emailType` | string | No | Content type: 'text', 'html'. Default: 'text' |
| `cc` \| `ccList` | string | No | CC recipients (comma-separated) |
| `bcc` \| `bccList` | string | No | BCC recipients (comma-separated) |
| `attachments` | array | No | File attachments |

#### Get Operation Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `messageId` \| `id` | string | Yes | Gmail message ID |
| `format` | string | No | Response format: 'resolved', 'raw'. Default: 'resolved' |

#### Get All Operation Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `returnAll` | boolean | No | Return all messages. Default: false |
| `limit` | number | No | Maximum messages to return. Default: 50 |
| `query` | string | No | Gmail search query |

### Example Usage

**Send Email:**
```typescript
const gmailParams = {
  operation: "send",
  to: "recipient@example.com",
  subject: "Meeting Reminder",
  body: "Don't forget about our meeting tomorrow at 2 PM.",
  bodyType: "text",
  cc: "manager@example.com",
  attachments: ["document.pdf"]
};
```

**Get Messages:**
```typescript
const gmailParams = {
  operation: "getAll",
  returnAll: false,
  limit: 10,
  query: "from:important@company.com"
};
```

---

## If Node (Decision)

**Type:** `n8n-nodes-base.if`  
**Template Class:** `IfTemplate`

Creates conditional logic branches in workflows.

### Parameters

#### Multiple Conditions

| Parameter | Type | Description |
|-----------|------|-------------|
| `conditions` | array | Array of condition objects |
| `combinator` | string | Logic operator: 'and', 'or'. Default: 'and' |
| `caseSensitive` | boolean | Case-sensitive comparison. Default: true |

#### Single Condition

| Parameter | Type | Description |
|-----------|------|-------------|
| `condition` | string | Condition expression (e.g., "value > 10") |
| `leftValue` | any | Left operand |
| `rightValue` | any | Right operand |
| `operator` \| `operation` | string | Comparison operator |
| `dataType` | string | Data type for comparison |

#### Condition Object Structure

```typescript
{
  leftValue: any,        // Left operand
  rightValue: any,       // Right operand  
  operator: string,      // Comparison operator
  dataType?: string      // Optional data type
}
```

#### Supported Operators

| Operator | Operation Code | Description |
|----------|----------------|-------------|
| `==` | `eq` | Equal |
| `!=` | `ne` | Not equal |
| `>` | `gt` | Greater than |
| `<` | `lt` | Less than |
| `>=` | `gte` | Greater than or equal |
| `<=` | `lte` | Less than or equal |
| `contains` | `contains` | String contains |
| `startsWith` | `startsWith` | String starts with |
| `endsWith` | `endsWith` | String ends with |
| `regex` | `regex` | Regular expression match |

#### Data Types

- `string` - Text values
- `number` - Numeric values
- `boolean` - True/false values
- `dateTime` - Date and time values
- `array` - Array values
- `object` - Object values

### Example Usage

**Multiple Conditions:**
```typescript
const ifParams = {
  conditions: [
    {
      leftValue: "{{ $json.age }}",
      rightValue: 18,
      operator: "gte",
      dataType: "number"
    },
    {
      leftValue: "{{ $json.status }}",
      rightValue: "active",
      operator: "eq",
      dataType: "string"
    }
  ],
  combinator: "and"
};
```

**Single Condition String:**
```typescript
const ifParams = {
  condition: "{{ $json.score }} > 80"
};
```

**Direct Parameters:**
```typescript
const ifParams = {
  leftValue: "{{ $json.temperature }}",
  rightValue: 25,
  operator: "gt",
  dataType: "number"
};
```

---

## Schedule Trigger Node

**Type:** `n8n-nodes-base.scheduleTrigger`  
**Template Class:** `ScheduleTriggerTemplate`

Triggers workflows on a schedule.

### Parameters

#### Basic Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `triggerInterval` \| `interval` | string | Interval type: 'seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'custom' |

#### Cron Expression

| Parameter | Type | Description |
|-----------|------|-------------|
| `cron` \| `cronExpression` | string | Cron expression for custom scheduling |

#### Interval-Specific Parameters

**Seconds:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `secondsInterval` \| `seconds` | number | Interval in seconds. Default: 30 |

**Minutes:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `minutesInterval` \| `minutes` | number | Interval in minutes. Default: 5 |

**Hours:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `hoursInterval` \| `hours` | number | Interval in hours. Default: 1 |

**Days:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `daysInterval` \| `days` | number | Interval in days. Default: 1 |
| `triggerAtHour` | number | Hour to trigger (0-23) |
| `triggerAtMinute` | number | Minute to trigger (0-59) |

**Weeks:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `weeksInterval` \| `weeks` | number | Interval in weeks. Default: 1 |
| `triggerAtDay` | number \| array | Day(s) of week (0-6, 0=Sunday) |
| `triggerAtHour` | number | Hour to trigger (0-23) |
| `triggerAtMinute` | number | Minute to trigger (0-59) |

**Months:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `monthsInterval` \| `months` | number | Interval in months. Default: 1 |
| `triggerAtDayOfMonth` | number | Day of month to trigger (1-31) |
| `triggerAtHour` | number | Hour to trigger (0-23) |
| `triggerAtMinute` | number | Minute to trigger (0-59) |

### Example Usage

**Hourly Schedule:**
```typescript
const scheduleParams = {
  triggerInterval: "hours",
  hoursInterval: 2
};
```

**Daily Schedule with Specific Time:**
```typescript
const scheduleParams = {
  triggerInterval: "days",
  daysInterval: 1,
  triggerAtHour: 9,
  triggerAtMinute: 30
};
```

**Weekly Schedule:**
```typescript
const scheduleParams = {
  triggerInterval: "weeks",
  weeksInterval: 1,
  triggerAtDay: [1, 3, 5], // Monday, Wednesday, Friday
  triggerAtHour: 14,
  triggerAtMinute: 0
};
```

**Cron Expression:**
```typescript
const scheduleParams = {
  triggerInterval: "custom",
  cron: "0 30 9 * * MON-FRI" // 9:30 AM on weekdays
};
```

---

## Code Node

**Type:** `n8n-nodes-base.code`  
**Template Class:** `CodeTemplate`

Executes custom JavaScript code for data transformation.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` \| `jsCode` | string | Yes | JavaScript code to execute |
| `mode` | string | No | Execution mode: 'runOnceForAllItems', 'runOnceForEachItem'. Default: 'runOnceForAllItems' |
| `onError` | string | No | Error handling: 'stopWorkflow', 'continueRegularOutput', 'continueErrorOutput' |
| `continueOnFail` | boolean | No | Continue workflow on error. Default: false |

### Execution Modes

- **runOnceForAllItems**: Execute code once with all input items
- **runOnceForEachItem**: Execute code once for each input item

### Example Usage

**Transform All Items:**
```typescript
const codeParams = {
  mode: "runOnceForAllItems",
  code: `
    return items.map(item => ({
      ...item.json,
      processedAt: new Date().toISOString(),
      total: item.json.price * item.json.quantity
    }));
  `
};
```

**Process Each Item:**
```typescript
const codeParams = {
  mode: "runOnceForEachItem",
  code: `
    const data = $input.item.json;
    return {
      id: data.id,
      fullName: data.firstName + ' ' + data.lastName,
      isAdult: data.age >= 18
    };
  `,
  continueOnFail: true
};
```

---

## Edit Fields (Set) Node

**Type:** `n8n-nodes-base.set`  
**Template Class:** `SetTemplate`

Adds, updates, or removes fields in data items.

### Parameters

#### Basic Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `mode` | string | Operation mode: 'manual', 'expression'. Default: 'manual' |
| `duplicateItem` | boolean | Create duplicate items. Default: false |
| `includeOtherFields` | boolean | Include other fields in output. Default: true |

#### Manual Mode Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `assignments` | array \| object | Field assignments |
| `fields` | object | Alternative field assignments format |

#### Expression Mode Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `expression` | string | JavaScript expression for field assignment |

#### Assignment Object Structure

```typescript
{
  name: string,     // Field name
  value: any,       // Field value
  type?: string     // Value type (auto-detected if not specified)
}
```

#### Options

| Parameter | Type | Description |
|-----------|------|-------------|
| `dotNotation` | boolean | Support dot notation for nested fields |
| `ignoreConversionErrors` | boolean | Ignore type conversion errors |

### Example Usage

**Manual Mode with Object:**
```typescript
const setParams = {
  mode: "manual",
  assignments: {
    fullName: "John Doe",
    age: 30,
    isActive: true
  },
  includeOtherFields: true
};
```

**Manual Mode with Array:**
```typescript
const setParams = {
  mode: "manual",
  assignments: [
    { name: "status", value: "processed", type: "string" },
    { name: "processedAt", value: new Date().toISOString(), type: "string" },
    { name: "count", value: 1, type: "number" }
  ]
};
```

**Expression Mode:**
```typescript
const setParams = {
  mode: "expression",
  expression: `{
    id: $json.id,
    fullName: $json.firstName + ' ' + $json.lastName,
    processedAt: new Date().toISOString()
  }`
};
```

**With Options:**
```typescript
const setParams = {
  mode: "manual",
  fields: {
    "user.profile.name": "John Doe",
    "user.profile.age": 30
  },
  options: {
    dotNotation: true,
    ignoreConversionErrors: true
  }
};
```

---

## Manual Trigger Node

**Type:** `n8n-nodes-base.manualTrigger`  
**Template Class:** `ManualTriggerTemplate`

Manually triggers workflow execution.

### Parameters

This node requires no parameters. It's used to start workflows manually.

### Example Usage

```typescript
const manualTriggerParams = {};
```

---

## Usage in DSL

Node templates are automatically selected based on the node type specified in your DSL. The template system handles the parameter mapping transparently.

Example DSL usage:
```
node httpRequest {
  type: "n8n-nodes-base.httpRequest"
  method: "GET"
  url: "https://api.example.com/data"
  headers: {
    "Authorization": "Bearer token"
  }
}
```

The `HttpRequestTemplate` will automatically map these parameters to n8n's internal structure.