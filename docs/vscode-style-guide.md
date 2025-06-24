# VS Code Style Guide for .n8n Files

This comprehensive guide covers VS Code setup, configuration, and best practices for working with .n8n DSL files in the Tricep project.

## Table of Contents

- [Quick Setup](#quick-setup)
- [VS Code Configuration](#vs-code-configuration)
- [Language Support](#language-support)
- [Code Formatting](#code-formatting)
- [Snippets and Shortcuts](#snippets-and-shortcuts)
- [Development Workflow](#development-workflow)
- [Style Guidelines](#style-guidelines)
- [Troubleshooting](#troubleshooting)

---

## Quick Setup

### 1. Install Recommended Extensions

Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run:
```
Extensions: Show Recommended Extensions
```

Install all recommended extensions listed in `.vscode/extensions.json`.

### 2. Configure VS Code Settings

The project includes pre-configured VS Code settings in `.vscode/settings.json`. These settings will automatically apply when you open the workspace.

### 3. Verify Language Support

Open any `.n8n` file - you should see:
- ✅ Syntax highlighting for N8N DSL keywords
- ✅ File association with "n8n-dsl" language
- ✅ Code snippets available (type `workflow` and press Tab)

---

## VS Code Configuration

### Workspace Settings

The `.vscode/settings.json` file configures:

#### File Associations
```json
"files.associations": {
  "*.n8n": "n8n-dsl"
}
```

#### Editor Settings for .n8n Files
- **Indentation**: 2 spaces, no tabs
- **Line length**: 80/120 character rulers
- **Format on save**: Enabled
- **Bracket colorization**: Enabled
- **Word wrap**: Disabled for better readability

#### Font and Display
- **Recommended fonts**: Fira Code, JetBrains Mono, Cascadia Code
- **Font ligatures**: Enabled for better symbol rendering
- **Font size**: 14px with 1.5 line height

### Tasks Configuration

Pre-configured tasks in `.vscode/tasks.json`:

- **Compile Current File**: `Ctrl+Shift+P` → "Tasks: Run Task" → "Compile Current N8N File"
- **Validate File**: Validates syntax and structure
- **Watch Mode**: Auto-compile on file changes
- **Format Files**: Formats all .n8n files in project

### Debug Configuration

Launch configurations in `.vscode/launch.json`:

- **Debug N8N DSL Compiler**: Debug the compilation process
- **Debug Current N8N File**: Debug compilation of current file
- **Test Parser**: Run parser tests
- **Validate Workflow**: Validate current workflow

---

## Language Support

### Syntax Highlighting

The `.vscode/syntaxes/n8n-dsl.tmLanguage.json` provides:

#### Keyword Highlighting
- `workflow`, `node`, `module`, `param`, `var`, `connect`
- Built-in functions: `now()`, `file()`, `env()`, `json()`

#### String and Expression Support
- String interpolation: `"Hello ${name}"`
- Template literals: `` `Multi-line content` ``
- Expressions: `${variable.property}`

#### Type Recognition
- Data types: `string`, `number`, `boolean`, `array`, `object`
- Node types: `"http.request"`, `"trigger.schedule"`, etc.

### File Association

VS Code automatically recognizes `.n8n` files and applies:
- Correct syntax highlighting
- Language-specific settings
- Available code snippets
- Formatting rules

---

## Code Formatting

### Prettier Configuration

The `.prettierrc.n8n` file configures formatting:

```json
{
  "printWidth": 120,
  "tabWidth": 2,
  "useTabs": false,
  "singleQuote": false,
  "bracketSpacing": true,
  "endOfLine": "lf"
}
```

### Format on Save

Automatically formats code when saving files:
- Fixes indentation
- Aligns brackets and braces
- Normalizes quotes
- Removes trailing whitespace

### Manual Formatting

- **Format Document**: `Shift+Alt+F` (Windows/Linux) or `Shift+Option+F` (Mac)
- **Format Selection**: `Ctrl+K, Ctrl+F` (Windows/Linux) or `Cmd+K, Cmd+F` (Mac)

---

## Snippets and Shortcuts

### Basic Snippets

| Trigger | Description | Shortcut |
|---------|-------------|----------|
| `workflow` | Basic workflow structure | Tab |
| `param` | Parameter declaration | Tab |
| `var` | Variable declaration | Tab |
| `connect` | Node connection | Tab |

### Node Snippets

| Trigger | Description |
|---------|-------------|
| `trigger-manual` | Manual trigger node |
| `trigger-schedule` | Schedule trigger with cron |
| `trigger-webhook` | Webhook trigger |
| `http-request` | HTTP request node |
| `if-node` | Conditional/if node |
| `transform-node` | Data transformation node |
| `set-data` | Set data node |
| `email-node` | Email integration node |

### Complex Workflows

| Trigger | Description |
|---------|-------------|
| `daily-report` | Complete daily report workflow |
| `webhook-processor` | Webhook processing with validation |
| `http-with-error` | HTTP request with error handling |

### Usage Example

1. Type `workflow` in a new .n8n file
2. Press `Tab` to expand the snippet
3. Use `Tab` to navigate between placeholders
4. Fill in the values

```n8n
// Auto-generated from 'workflow' snippet
workflow "my-workflow" {
  // Parameters
  param paramName string = "defaultValue"
  
  // Variables
  var varName = "value"
  
  // Trigger
  node trigger "trigger.manual" {
    // cursor positioned here
  }
  
  // Connections
  connect trigger -> nextNode
}
```

---

## Development Workflow

### File Organization

```
project/
├── examples/                 # Example workflows
│   ├── daily-report.n8n
│   ├── lead-processor.n8n
│   └── social-media-monitor.n8n
├── modules/                  # Reusable modules
│   ├── authentication.n8n
│   ├── error-handling.n8n
│   └── data-validation.n8n
├── workflows/               # Main workflows
│   ├── production/
│   ├── staging/
│   └── development/
└── compiled-outputs/        # Generated JSON files
```

### Development Process

1. **Create New Workflow**
   - Use `workflow` snippet for basic structure
   - Define parameters and variables first
   - Add nodes incrementally

2. **Test and Validate**
   - Use `Ctrl+Shift+P` → "Tasks: Run Task" → "Validate N8N File"
   - Check compilation: "Compile Current N8N File"

3. **Debug Issues**
   - Use error lens for inline error display
   - Check problems panel (`Ctrl+Shift+M`)
   - Use debug configurations for complex issues

4. **Format and Clean**
   - Save file (auto-formats)
   - Run "Format N8N Files" task for project-wide formatting

### Keyboard Shortcuts

| Action | Windows/Linux | Mac | Description |
|--------|---------------|-----|-------------|
| **File Operations** |
| New File | `Ctrl+N` | `Cmd+N` | Create new file |
| Save | `Ctrl+S` | `Cmd+S` | Save and format |
| Save All | `Ctrl+K, S` | `Cmd+Option+S` | Save all files |
| **Navigation** |
| Go to Line | `Ctrl+G` | `Cmd+G` | Jump to line number |
| Go to Symbol | `Ctrl+Shift+O` | `Cmd+Shift+O` | Navigate to workflow/node |
| Find in Files | `Ctrl+Shift+F` | `Cmd+Shift+F` | Search across project |
| **Editing** |
| Format Document | `Shift+Alt+F` | `Shift+Option+F` | Format current file |
| Comment Line | `Ctrl+/` | `Cmd+/` | Toggle line comment |
| Block Comment | `Shift+Alt+A` | `Shift+Option+A` | Toggle block comment |
| **Development** |
| Command Palette | `Ctrl+Shift+P` | `Cmd+Shift+P` | Access all commands |
| Quick Open | `Ctrl+P` | `Cmd+P` | Quick file navigation |
| Problems Panel | `Ctrl+Shift+M` | `Cmd+Shift+M` | View errors/warnings |

---

## Style Guidelines

### General Formatting

#### Indentation
- Use **2 spaces** for indentation
- Never use tabs
- Maintain consistent indentation levels

```n8n
// ✅ Good
workflow "example" {
  param name string = "default"
  
  node trigger "trigger.manual" {
    position: [0, 0]
  }
}

// ❌ Bad (inconsistent indentation)
workflow "example" {
    param name string = "default"
  
node trigger "trigger.manual" {
      position: [0, 0]
  }
}
```

#### Line Length
- Prefer **80 characters** per line
- Maximum **120 characters** (hard limit)
- Break long lines at logical points

```n8n
// ✅ Good
node sendEmail "integration.email" {
  to: recipientEmail
  subject: "Daily Report"
  body: `
    Report generated on: ${now()}
    Total records: ${data.length}
  `
}

// ❌ Bad (too long)
node sendEmail "integration.email" { to: recipientEmail, subject: "Daily Report", body: `Report generated on: ${now()} with ${data.length} records` }
```

### Naming Conventions

#### Workflow Names
- Use **kebab-case** for workflow names
- Be descriptive and specific
- Include purpose/domain

```n8n
// ✅ Good
workflow "user-onboarding-email"
workflow "daily-sales-report"
workflow "api-error-notification"

// ❌ Bad
workflow "workflow1"
workflow "userStuff"
workflow "REPORT"
```

#### Node Names
- Use **camelCase** for node names
- Start with verb when appropriate
- Be descriptive about purpose

```n8n
// ✅ Good
node fetchUserData "http.request"
node validateInput "flow.if"
node sendWelcomeEmail "integration.email"

// ❌ Bad
node node1 "http.request"
node check "flow.if"
node email "integration.email"
```

#### Parameters and Variables
- Use **camelCase** for parameter and variable names
- Use descriptive names
- Avoid abbreviations unless common

```n8n
// ✅ Good
param recipientEmail string = "admin@company.com"
param maxRetryCount number = 3
var currentTimestamp = now()
var apiEndpointUrl = "https://api.company.com/v1"

// ❌ Bad
param e string = "admin@company.com"
param cnt number = 3
var ts = now()
var url = "https://api.company.com/v1"
```

### Code Organization

#### Parameter and Variable Ordering
```n8n
workflow "example" {
  // 1. Documentation comment
  
  // 2. Parameters (required first, then optional)
  param apiUrl string
  param apiToken string = env("API_TOKEN")
  param retryCount number = 3
  
  // 3. Variables (computed values)
  var timestamp = now()
  var requestHeaders = {
    "Authorization": "Bearer ${apiToken}"
  }
  
  // 4. Nodes (triggers first, then logical flow)
  // 5. Connections (at the end)
}
```

#### Node Grouping
Group related nodes with comments:

```n8n
workflow "user-registration" {
  // Trigger
  node webhook "trigger.webhook" {
    path: "/register"
  }
  
  // Validation
  node validateInput "flow.if" {
    condition: "${webhook.output.email} != null"
  }
  
  // Data Processing
  node processUser "data.transform" {
    // transformation logic
  }
  
  node saveUser "http.request" {
    // save to database
  }
  
  // Notifications
  node sendWelcomeEmail "integration.email" {
    // welcome email
  }
  
  // Error Handling
  node handleError "integration.email" {
    // error notification
  }
  
  // Connections
  connect webhook -> validateInput
  connect validateInput.true -> processUser
  connect processUser -> saveUser
  connect saveUser -> sendWelcomeEmail
  connect validateInput.false -> handleError
}
```

### Comments and Documentation

#### File Headers
Start each workflow with a descriptive comment:

```n8n
// User Registration Workflow
// Handles new user signups via webhook, validates data,
// saves to database, and sends welcome email
//
// Dependencies: User API, Email service
// Trigger: POST /api/register
```

#### Inline Comments
- Explain complex logic
- Document external dependencies
- Clarify business rules

```n8n
// Check if user already exists (prevents duplicates)
node checkExistingUser "http.request" {
  method: "GET"
  url: "${userApiUrl}/users/${webhook.output.email}"
}

// Calculate user tier based on company size
// Tier 1: 1-10 employees, Tier 2: 11-100, Tier 3: 100+
node calculateUserTier "data.transform" {
  code: `
    const companySize = items[0].json.companySize;
    let tier = 1;
    if (companySize > 100) tier = 3;
    else if (companySize > 10) tier = 2;
    return [{ json: { ...items[0].json, tier } }];
  `
}
```

### Error Handling Patterns

#### Consistent Error Handling
```n8n
// Always include continueOnFail for external requests
node fetchData "http.request" {
  url: apiUrl
  continueOnFail: true
}

// Check for errors
node checkApiSuccess "flow.if" {
  condition: "${fetchData.output.statusCode} >= 200 && ${fetchData.output.statusCode} < 300"
}

// Handle errors consistently
node handleApiError "integration.email" {
  to: "admin@company.com"
  subject: "API Error Alert"
  body: `
    API request failed:
    URL: ${apiUrl}
    Status: ${fetchData.output.statusCode}
    Error: ${fetchData.output.error}
    Time: ${now()}
  `
}
```

### Module Organization

#### Module Structure
```n8n
// modules/email-notification.n8n
// Reusable email notification module

param recipient string
param subject string
param message string
param priority string = "normal"

node sendEmail "integration.email" {
  to: recipient
  subject: subject
  body: `
    ${message}
    
    ---
    Priority: ${priority}
    Sent: ${now()}
  `
  bodyType: "text"
}

// Export the result
output result = sendEmail.output
```

#### Module Usage
```n8n
// Use descriptive module names
module notifyAdmin = ./modules/email-notification.n8n {
  recipient: "admin@company.com"
  subject: "Workflow Completed"
  message: "The daily report workflow has completed successfully"
  priority: "low"
}

module alertUser = ./modules/email-notification.n8n {
  recipient: userEmail
  subject: "Action Required"
  message: "Please review your account settings"
  priority: "high"
}
```

---

## Troubleshooting

### Common Issues

#### Syntax Highlighting Not Working
1. Check file association: `.n8n` should map to `n8n-dsl`
2. Reload VS Code window: `Ctrl+Shift+P` → "Developer: Reload Window"
3. Verify `.vscode/syntaxes/n8n-dsl.tmLanguage.json` exists

#### Formatting Not Applied
1. Check if Prettier extension is installed
2. Verify `.prettierrc.n8n` exists in project root
3. Check VS Code setting: `"editor.defaultFormatter": "esbenp.prettier-vscode"`

#### Snippets Not Available
1. Verify `.vscode/snippets/n8n-dsl.json` exists
2. Check language mode: Should show "n8n-dsl" in status bar
3. Try reloading window

#### Tasks Not Running
1. Check `.vscode/tasks.json` exists
2. Verify npm scripts exist in `package.json`
3. Ensure project is properly installed: `npm install`

### Debug Mode

#### Enable Debug Logging
Add to VS Code settings:
```json
{
  "n8n-dsl.debug": true,
  "n8n-dsl.verbose": true
}
```

#### Check Output Panel
1. `View` → `Output`
2. Select "N8N DSL" from dropdown
3. Look for error messages and warnings

### Performance Optimization

#### For Large Projects
```json
{
  "files.watcherExclude": {
    "**/compiled-outputs/**": true,
    "**/dist/**": true
  },
  "search.exclude": {
    "**/compiled-outputs": true,
    "**/dist": true
  }
}
```

#### Memory Settings
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "off",
  "typescript.suggest.autoImports": false
}
```

---

## Advanced Configuration

### Custom Themes

#### Recommended Themes for N8N DSL
- **One Dark Pro**: Excellent contrast for syntax highlighting
- **Material Theme**: Clean, modern appearance
- **Synthwave '84**: High contrast, retro aesthetic

#### Custom Color Customization
Add to settings.json:
```json
{
  "editor.tokenColorCustomizations": {
    "[One Dark Pro]": {
      "textMateRules": [
        {
          "scope": "keyword.control.workflow.n8n-dsl",
          "settings": {
            "foreground": "#C678DD",
            "fontStyle": "bold"
          }
        },
        {
          "scope": "string.quoted.double.node-type.n8n-dsl",
          "settings": {
            "foreground": "#98C379"
          }
        }
      ]
    }
  }
}
```

### Workspace Configuration

#### Multi-root Workspace
For managing multiple N8N projects:
```json
{
  "folders": [
    {
      "name": "Main Project",
      "path": "./tricep"
    },
    {
      "name": "Modules",
      "path": "./n8n-modules"
    },
    {
      "name": "Examples",
      "path": "./n8n-examples"
    }
  ],
  "settings": {
    "n8n-dsl.moduleResolution": [
      "./tricep/modules",
      "./n8n-modules"
    ]
  }
}
```

---

## Conclusion

This style guide provides a comprehensive setup for working with .n8n files in VS Code. The configuration ensures:

- **Consistent formatting** across the team
- **Enhanced productivity** with snippets and shortcuts
- **Better code quality** with validation and error detection
- **Smooth development workflow** with integrated tools

For questions or improvements to this guide, please refer to the project documentation or open an issue in the repository.

### Quick Reference Card

| Feature | File | Purpose |
|---------|------|---------|
| Settings | `.vscode/settings.json` | Editor configuration |
| Extensions | `.vscode/extensions.json` | Recommended extensions |
| Tasks | `.vscode/tasks.json` | Build and validation tasks |
| Debug | `.vscode/launch.json` | Debug configurations |
| Syntax | `.vscode/syntaxes/n8n-dsl.tmLanguage.json` | Syntax highlighting |
| Snippets | `.vscode/snippets/n8n-dsl.json` | Code snippets |
| Formatting | `.prettierrc.n8n` | Code formatting rules |