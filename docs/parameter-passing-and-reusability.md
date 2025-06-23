# Parameter Passing and Reusability in N8N DSL

## Overview
This document details the parameter passing mechanisms and reusability features of the N8N DSL, focusing on making workflows modular, maintainable, and configurable.

## Parameter System

### 1. Workflow Parameters
Workflows can accept parameters to make them configurable and reusable across different environments.

```bicep
workflow "configurable-workflow" {
  // Required parameters (must be provided)
  param apiUrl string
  param apiKey string
  
  // Optional parameters with defaults
  param timeout number = 30000
  param retryCount number = 3
  param environment string = "production"
  
  // Typed arrays and objects
  param recipients array = ["admin@company.com"]
  param config object = {
    enableLogging: true
    debugMode: false
  }
}
```

### 2. Parameter Types and Validation
```bicep
workflow "validated-workflow" {
  // String with pattern validation
  param email string {
    pattern: "^[^@]+@[^@]+\\.[^@]+$"
    description: "Valid email address"
  }
  
  // Number with range validation
  param batchSize number {
    min: 1
    max: 1000
    default: 100
    description: "Items to process per batch"
  }
  
  // Enum-like string validation
  param logLevel string {
    allowed: ["debug", "info", "warn", "error"]
    default: "info"
  }
  
  // Required vs optional
  param database string        // Required
  param backupEnabled boolean? // Optional, can be null
}
```

### 3. Environment-Specific Parameters
```bicep
workflow "multi-environment" {
  param environment string = "development"
  
  // Environment-specific configuration
  var apiUrl = environment == "production" 
    ? "https://api.prod.company.com" 
    : "https://api.dev.company.com"
    
  var dbConnectionString = environment == "production"
    ? env("PROD_DB_CONNECTION")
    : env("DEV_DB_CONNECTION")
}
```

## Module System for Reusability

### 1. Creating Reusable Modules
Modules encapsulate common functionality and can be reused across workflows.

**File: modules/httpRequest.n8n**
```bicep
module "httpRequest" {
  // Input parameters
  param url string
  param method string = "GET"
  param headers object = {}
  param body object? = null
  param timeout number = 30000
  param retries number = 3
  
  // Internal logic with retry mechanism
  node request "http.request" {
    url: url
    method: method
    headers: headers
    body: body
    timeout: timeout
    continueOnFail: true
  }
  
  node checkSuccess "flow.if" {
    condition: "${request.output.statusCode} >= 200 && ${request.output.statusCode} < 300"
  }
  
  node retry "flow.if" {
    condition: "${request.output.attempts} < ${retries}"
  }
  
  // Retry logic
  connect request -> checkSuccess
  connect checkSuccess.false -> retry
  connect retry.true -> request  // Loop back for retry
  
  // Outputs
  output success = checkSuccess.output.true
  output data = request.output.body
  output statusCode = request.output.statusCode
  output error = request.output.error
}
```

### 2. Module Composition
Modules can use other modules for complex functionality.

**File: modules/apiWithAuth.n8n**
```bicep
module "apiWithAuth" {
  param baseUrl string
  param endpoint string
  param apiKey string
  param method string = "GET"
  param payload object? = null
  
  // Compose with basic HTTP module
  module httpCall = ./httpRequest.n8n {
    url: "${baseUrl}/${endpoint}"
    method: method
    headers: {
      "Authorization": "Bearer ${apiKey}"
      "Content-Type": "application/json"
    }
    body: payload
  }
  
  // Add logging
  node logRequest "data.set" {
    assignments: {
      logEntry: {
        timestamp: "${now()}"
        endpoint: endpoint
        method: method
        success: "${httpCall.success}"
      }
    }
  }
  
  connect httpCall -> logRequest
  
  // Export outputs
  output data = httpCall.data
  output success = httpCall.success
  output statusCode = httpCall.statusCode
}
```

### 3. Module Inheritance and Overrides
```bicep
module "extendedApi" extends "./apiWithAuth.n8n" {
  // Inherit all parameters and add new ones
  param cacheEnabled boolean = true
  param cacheTtl number = 300
  
  // Override behavior
  node cacheCheck "flow.if" {
    condition: cacheEnabled
  }
  
  node getFromCache "data.get" {
    key: "cache_${endpoint}_${JSON.stringify(payload)}"
  }
  
  // Modified connection flow
  connect cacheCheck.true -> getFromCache
  connect getFromCache.miss -> parent.httpCall
  connect cacheCheck.false -> parent.httpCall
}
```

## Advanced Parameter Patterns

### 1. Dynamic Parameter Resolution
```bicep
workflow "dynamic-config" {
  param configSource string = "environment" // "environment", "file", "api"
  
  // Dynamic configuration loading
  var config = configSource == "environment" 
    ? {
        apiUrl: env("API_URL")
        apiKey: env("API_KEY")
      }
    : configSource == "file"
    ? json(file("./config.json"))
    : httpGet("https://config.company.com/api-config").body
}
```

### 2. Parameter Transformation
```bicep
workflow "parameter-transformation" {
  param emailList string // Comma-separated emails
  param schedule string  // Cron expression or simple schedule
  
  // Transform parameters
  var emails = emailList.split(",").map(e => e.trim())
  var cronExpression = schedule.startsWith("every") 
    ? parseCronFromNatural(schedule)  // "every 5 minutes" -> "*/5 * * * *"
    : schedule
}
```

### 3. Conditional Parameters
```bicep
workflow "conditional-params" {
  param notificationMethod string {
    allowed: ["email", "slack", "webhook"]
  }
  
  // Conditional parameters based on notification method
  param emailTo string? {
    required: notificationMethod == "email"
    description: "Required when using email notifications"
  }
  
  param slackChannel string? {
    required: notificationMethod == "slack"
    description: "Required when using Slack notifications"
  }
  
  param webhookUrl string? {
    required: notificationMethod == "webhook"
    description: "Required when using webhook notifications"
  }
}
```

## Reusability Patterns

### 1. Template Workflows
Create workflow templates that can be instantiated with different parameters.

**File: templates/dataProcessor.n8n**
```bicep
template "dataProcessor" {
  param sourceType string {
    allowed: ["api", "database", "file"]
  }
  param transformScript string
  param outputDestination string
  
  // Dynamic source based on type
  node source = sourceType == "api" 
    ? "http.request" { url: sourceConfig.url }
    : sourceType == "database"
    ? "database.query" { query: sourceConfig.query }
    : "file.read" { path: sourceConfig.path }
  
  node transform "data.transform" {
    code: file(transformScript)
  }
  
  node output "data.write" {
    destination: outputDestination
  }
  
  connect source -> transform -> output
}
```

### 2. Workflow Libraries
Organize related workflows into libraries for easy reuse.

**File: libraries/ecommerce/orderProcessing.n8n**
```bicep
library "ecommerce" {
  
  workflow "processOrder" {
    param orderId string
    param customerEmail string
    
    module validateOrder = ./modules/orderValidator.n8n { orderId }
    module updateInventory = ./modules/inventoryManager.n8n { orderId }
    module sendConfirmation = ./modules/emailSender.n8n {
      to: customerEmail
      template: "orderConfirmation"
      data: { orderId }
    }
    
    connect validateOrder.success -> updateInventory
    connect updateInventory.success -> sendConfirmation
  }
  
  workflow "processReturn" {
    param returnId string
    param reason string
    
    // Return processing logic
  }
}
```

### 3. Configuration Profiles
Use profiles for different deployment scenarios.

**File: profiles/production.n8n**
```bicep
profile "production" {
  defaults: {
    timeout: 60000
    retries: 5
    logLevel: "error"
    enableMetrics: true
  }
  
  variables: {
    apiUrl: "https://api.prod.company.com"
    dbConnection: env("PROD_DB_CONNECTION")
    smtpServer: "smtp.company.com"
  }
}
```

**File: profiles/development.n8n**
```bicep
profile "development" extends "production" {
  defaults: {
    timeout: 10000
    retries: 1
    logLevel: "debug"
    enableMetrics: false
  }
  
  variables: {
    apiUrl: "https://api.dev.company.com"
    dbConnection: env("DEV_DB_CONNECTION")
    smtpServer: "localhost:1025" // Local mail catcher
  }
}
```

## Best Practices for Reusability

### 1. Module Design Principles
```bicep
// ✅ Good: Single responsibility, clear interface
module "emailSender" {
  param to string
  param subject string  
  param body string
  param bodyType string = "text"
  
  output sent boolean
  output messageId string
}

// ❌ Bad: Too many responsibilities
module "emailAndSlackAndWebhook" {
  // Too complex, should be separate modules
}
```

### 2. Parameter Naming Conventions
```bicep
// ✅ Good: Consistent, descriptive names
param apiUrl string         // Clear what it contains
param maxRetryCount number  // Clear with type indicator
param isDebugEnabled boolean // Boolean prefix

// ❌ Bad: Ambiguous names
param url string      // Which URL?
param count number    // Count of what?
param flag boolean    // What flag?
```

### 3. Documentation and Examples
```bicep
module "dataTransformer" {
  /**
   * Transforms data using a JavaScript function
   * 
   * @param inputData - The data to transform
   * @param transformFunction - JavaScript code as string
   * @param options - Additional transformation options
   * 
   * @example
   * module transform = ./dataTransformer.n8n {
   *   inputData: apiResponse.data
   *   transformFunction: "items.map(item => ({ id: item.id, name: item.title }))"
   *   options: { validateOutput: true }
   * }
   */
  param inputData any
  param transformFunction string
  param options object = { validateOutput: false }
  
  // Implementation...
}
```

## Summary

The N8N DSL provides robust parameter passing and reusability through:

- **Strong Parameter System**: Type validation, defaults, conditional requirements
- **Module Composition**: Reusable components with clear interfaces
- **Template Workflows**: Parameterized workflow patterns
- **Configuration Profiles**: Environment-specific settings
- **Library Organization**: Grouped related functionality

This enables teams to build maintainable, scalable workflow automation with consistent patterns and reduced duplication.