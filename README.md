# N8N DSL Compiler

A Domain Specific Language (DSL) compiler that converts human-readable workflow definitions to n8n JSON format.

## Features

- **Bicep-inspired syntax** for defining workflows
- **Type-safe parameters** with validation
- **Automatic node positioning** with customizable layout
- **Comprehensive validation** with helpful error messages
- **CLI tool** for compilation and validation
- **Module system** for reusable components (planned)

## Installation

```bash
npm install
npm run build
```

## Quick Start

### 1. Create a DSL file

```bicep
workflow "my-workflow" {
  param apiUrl string = "https://api.example.com/data"
  param emailTo string = "user@example.com"

  node trigger "trigger.manual" {
  }

  node fetchData "http.request" {
    method: "GET"
    url: apiUrl
  }

  node sendEmail "integration.email" {
    to: emailTo
    subject: "Data Retrieved"
    body: "Successfully fetched data from API"
  }

  connect trigger -> fetchData
  connect fetchData -> sendEmail
}
```

### 2. Compile to n8n JSON

```bash
npx ts-node src/cli.ts compile test/simple-workflow.n8n -o output.json
```

### 3. Import into n8n

Copy the generated JSON and import it into your n8n instance.

## CLI Commands

### Compile
```bash
npx ts-node src/cli.ts compile <input.n8n> [options]
```

Options:
- `-o, --output <file>` - Output JSON file
- `--no-validate` - Skip validation
- `--strict` - Treat warnings as errors
- `--no-auto-layout` - Disable automatic positioning
- `--spacing <number>` - Node spacing (default: 200)

### Validate
```bash
npx ts-node src/cli.ts validate <input.n8n>
```

### Generate Examples
```bash
npx ts-node src/cli.ts example --type simple --output example.n8n
```

## DSL Syntax

### Workflow Declaration
```bicep
workflow "workflow-name" {
  // Content
}
```

### Parameters
```bicep
param name string = "default"     // Optional with default
param required string             // Required parameter
param count number = 10           // Number parameter
param enabled boolean = true      // Boolean parameter
```

### Variables
```bicep
var computed = "value-${param}"
var timestamp = now()
```

### Nodes
```bicep
node nodeName "node.type" {
  param1: "value"
  param2: 123
  param3: {
    nested: "object"
  }
}
```

### Connections
```bicep
connect sourceNode -> targetNode
connect sourceNode.output -> targetNode.input
```

## Supported Node Types

### Triggers
- `trigger.manual` - Manual trigger
- `trigger.schedule` - Scheduled trigger
- `trigger.webhook` - Webhook trigger

### Core Nodes
- `http.request` - HTTP request
- `data.set` - Set data
- `data.transform` - Transform with code
- `flow.if` - Conditional branching

### Integrations
- `integration.email` - Email (Gmail)
- `integration.sheets` - Google Sheets
- `integration.slack` - Slack

## Library Usage

```typescript
import { Compiler } from './src/compiler';

const dslCode = `
workflow "example" {
  node trigger "trigger.manual" {}
  node request "http.request" {
    url: "https://api.example.com"
  }
  connect trigger -> request
}
`;

const compiler = new Compiler();
const result = compiler.compile(dslCode);

if (result.success) {
  console.log(JSON.stringify(result.workflow, null, 2));
} else {
  console.error('Compilation failed:', result.errors);
}
```

## Project Structure

```
src/
├── parser/          # Lexer and parser
├── generator/       # JSON generation
├── types/          # TypeScript interfaces
├── utils/          # Validation utilities
├── compiler.ts     # Main compiler class
├── cli.ts         # Command line interface
└── index.ts       # Library entry point
```

## Testing

Test the compiler with the provided example:

```bash
npx ts-node src/cli.ts compile test/simple-workflow.n8n -o test-output.json
```

The generated JSON should be valid n8n workflow format that can be imported directly.

## Roadmap

- [ ] Module system implementation
- [ ] More node type support
- [ ] Template expressions
- [ ] Configuration profiles
- [ ] IDE language server
- [ ] Visual DSL editor

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT