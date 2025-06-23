# N8N DSL Syntax Specification

## Overview
A Bicep-inspired Domain Specific Language (DSL) for defining n8n workflows with a focus on readability, reusability, and maintainability.

## Core Syntax Elements

### 1. Workflow Declaration
```bicep
workflow "workflow-name" {
  // Workflow content
}
```

### 2. Parameters
Parameters allow workflows to be configurable and reusable:
```bicep
param paramName type = defaultValue
param paramName type // Required parameter
```

**Supported Types:**
- `string`: Text values
- `number`: Numeric values  
- `boolean`: True/false values
- `array`: Array of values
- `object`: Key-value objects

### 3. Variables
Variables for computed values and expressions:
```bicep
var computedValue = expression
var timestamp = now()
var apiEndpoint = "https://api.${domain}/v1"
```

### 4. Node Declaration
Two main ways to declare nodes:

#### Inline Nodes
```bicep
node nodeName "nodeType" {
  // Node parameters
  param1: value1
  param2: value2
}
```

#### Module Nodes (Reusable)
```bicep
module nodeName = ./path/to/module.n8n {
  param1: value1
  param2: value2
}
```

### 5. Connections
Connect nodes using arrow syntax:
```bicep
connect sourceNode.output -> targetNode.input
connect sourceNode -> targetNode  // Default main connection
```

### 6. Built-in Functions
- `now()`: Current timestamp
- `now(timezone)`: Timestamp in specific timezone
- `file(path)`: Read file content
- `env(varName)`: Environment variable
- `json(object)`: Convert to JSON string

### 7. Expressions
Support for dynamic values:
```bicep
subject: "Report for ${now('yyyy-MM-dd')}"
url: "https://api.${domain}/users/${userId}"
```

## Node Types

### Core Node Types
- `trigger.manual`: Manual trigger
- `trigger.schedule`: Scheduled trigger
- `trigger.webhook`: Webhook trigger
- `http.request`: HTTP request
- `data.set`: Set data values
- `data.transform`: Transform data with code
- `flow.if`: Conditional branching
- `flow.switch`: Multiple branch switch
- `integration.email`: Send email
- `integration.slack`: Slack integration
- `integration.sheets`: Google Sheets

### Node Parameters
Each node type has specific parameters. Common patterns:

#### HTTP Request Node
```bicep
node fetchData "http.request" {
  method: "GET"
  url: apiEndpoint
  headers: {
    "Authorization": "Bearer ${token}"
    "Content-Type": "application/json"
  }
}
```

#### Email Node
```bicep
node sendEmail "integration.email" {
  to: recipientEmail
  subject: emailSubject
  body: emailBody
  bodyType: "text" // or "html"
}
```

#### Transform Node
```bicep
node transform "data.transform" {
  code: file("./transform.js")
  // or inline
  code: `
    return items.map(item => ({
      ...item,
      processed: true
    }));
  `
}
```

## Module System

### Module Definition
Create reusable components as modules:

**File: modules/httpGet.n8n**
```bicep
// Parameters exposed by module
param url string
param headers object = {}

// Internal node
node request "http.request" {
  method: "GET"
  url: url
  headers: headers
}

// Export the output
output result = request.output
```

### Module Usage
```bicep
module fetchData = ./modules/httpGet.n8n {
  url: "https://api.example.com/data"
  headers: {
    "Authorization": "Bearer ${token}"
  }
}
```

## Advanced Features

### Conditional Execution
```bicep
node checkStatus "flow.if" {
  condition: "${fetchData.output.status} == 'active'"
}

connect fetchData -> checkStatus
connect checkStatus.true -> processData
connect checkStatus.false -> logError
```

### Loops and Batching
```bicep
node processBatch "flow.splitInBatches" {
  batchSize: 10
}

connect fetchData -> processBatch
connect processBatch -> processItem
connect processItem -> processBatch.continue
```

### Error Handling
```bicep
node fetchData "http.request" {
  url: apiUrl
  continueOnFail: true
}

node handleError "flow.if" {
  condition: "${fetchData.output.error} != null"
}

connect fetchData -> handleError
connect handleError.true -> logError
connect handleError.false -> processData
```

## Positioning and Layout

### Manual Positioning
```bicep
node start "trigger.manual" {
  position: [0, 0]
}

node process "data.transform" {
  position: [200, 0]
  code: transformScript
}
```

### Auto-layout (Default)
The compiler automatically positions nodes in a logical flow when positions aren't specified.

## Comments and Documentation
```bicep
// Single line comment

/*
  Multi-line comment
  for detailed documentation
*/

workflow "example" {
  // This workflow processes daily reports
  param reportDate string = now('yyyy-MM-dd')
  
  /* 
   * Fetch data from API
   * Handles rate limiting automatically
   */
  node fetchData "http.request" {
    url: "${apiBase}/reports/${reportDate}"
  }
}
```

## Validation and Type Safety

### Parameter Validation
```bicep
param email string {
  pattern: "^[^@]+@[^@]+\.[^@]+$"
  description: "Valid email address"
}

param count number {
  min: 1
  max: 100
  description: "Number of items to process"
}
```

### Required vs Optional
```bicep
param required string        // Required parameter
param optional string = ""   // Optional with default
param optional2 string?      // Optional, can be null
```