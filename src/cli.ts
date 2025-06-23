#!/usr/bin/env node

/**
 * Command line interface for the n8n DSL compiler
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { Compiler } from './compiler';

const program = new Command();

program
  .name('n8n-dsl')
  .description('Compile DSL workflows to n8n JSON format')
  .version('0.1.0');

program
  .command('compile')
  .description('Compile DSL file to n8n JSON')
  .argument('<input>', 'Input DSL file')
  .option('-o, --output <file>', 'Output JSON file')
  .option('--no-validate', 'Skip validation')
  .option('--strict', 'Treat warnings as errors')
  .option('--no-auto-layout', 'Disable automatic node positioning')
  .option('--spacing <number>', 'Node spacing for auto-layout', '200')
  .action((input, options) => {
    try {
      // Read input file
      const inputPath = path.resolve(input);
      if (!fs.existsSync(inputPath)) {
        console.error(`Error: Input file '${input}' not found`);
        process.exit(1);
      }

      const dslCode = fs.readFileSync(inputPath, 'utf-8');

      // Compile
      const compiler = new Compiler({
        validate: options.validate,
        strict: options.strict,
        autoLayout: options.autoLayout,
        spacing: parseInt(options.spacing)
      });

      const result = compiler.compile(dslCode);

      // Handle errors
      if (!result.success) {
        console.error('Compilation failed:');
        for (const error of result.errors) {
          const location = error.line ? ` (line ${error.line}:${error.column})` : '';
          console.error(`  ${error.type}: ${error.message}${location}`);
        }
        process.exit(1);
      }

      // Show warnings
      if (result.warnings.length > 0) {
        console.warn('Warnings:');
        for (const warning of result.warnings) {
          const location = warning.line ? ` (line ${warning.line}:${warning.column})` : '';
          console.warn(`  ${warning.type}: ${warning.message}${location}`);
        }
      }

      // Generate output
      const json = JSON.stringify(result.workflow, null, 2);

      if (options.output) {
        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, json);
        console.log(`✓ Compiled successfully to ${options.output}`);
      } else {
        console.log(json);
      }

    } catch (error) {
      console.error(`Error: ${error}`);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate DSL file without generating output')
  .argument('<input>', 'Input DSL file')
  .action((input) => {
    try {
      const inputPath = path.resolve(input);
      if (!fs.existsSync(inputPath)) {
        console.error(`Error: Input file '${input}' not found`);
        process.exit(1);
      }

      const dslCode = fs.readFileSync(inputPath, 'utf-8');
      const compiler = new Compiler();
      const errors = compiler.validateOnly(dslCode);

      if (errors.length === 0) {
        console.log('✓ Validation passed');
      } else {
        console.error('Validation failed:');
        for (const error of errors) {
          const location = error.line ? ` (line ${error.line}:${error.column})` : '';
          console.error(`  ${error.type}: ${error.message}${location}`);
        }
        process.exit(1);
      }

    } catch (error) {
      console.error(`Error: ${error}`);
      process.exit(1);
    }
  });

program
  .command('example')
  .description('Generate example DSL files')
  .option('-t, --type <type>', 'Example type (simple, complex)', 'simple')
  .option('-o, --output <file>', 'Output file', 'example.n8n')
  .action((options) => {
    const examples = {
        // later to MOVE to separe file maybe?
      simple: `workflow "simple-example" {
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
}`,
      complex: `workflow "complex-example" {
  param apiUrl string = "https://api.example.com/data"
  param emailTo string = "user@example.com"
  param threshold number = 100

  var emailSubject = "Report: \${now()}"

  node trigger "trigger.schedule" {
    cron: "0 9 * * *"
  }

  node fetchData "http.request" {
    method: "GET"
    url: apiUrl
    headers: {
      "Content-Type": "application/json"
    }
  }

  node checkData "flow.if" {
    condition: "\${fetchData.output.count} > \${threshold}"
  }

  node processData "data.transform" {
    code: "return items.map(item => ({ ...item.json, processed: true }));"
  }

  node sendAlert "integration.email" {
    to: emailTo
    subject: emailSubject
    body: "Alert: Data count exceeded threshold"
  }

  node sendReport "integration.email" {
    to: emailTo
    subject: emailSubject
    body: "Regular report with processed data"
  }

  connect trigger -> fetchData
  connect fetchData -> checkData
  connect checkData.true -> sendAlert
  connect checkData.false -> processData
  connect processData -> sendReport
}`
    };

    const example = examples[options.type as keyof typeof examples];
    if (!example) {
      console.error('Unknown example type. Available: simple, complex');
      process.exit(1);
    }

    fs.writeFileSync(options.output, example);
    console.log(`✓ Generated ${options.type} example: ${options.output}`);
  });

program.parse();
