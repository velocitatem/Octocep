;;; n8n-dsl-mode.el --- Major mode for N8N DSL files -*- lexical-binding: t; -*-

;; Copyright (C) 2024

;; Author: Tricep Team
;; Keywords: languages, n8n, dsl, workflow
;; Version: 1.0.0
;; Package-Requires: ((emacs "25.1"))
;; URL: https://github.com/tricep/n8n-dsl-syntax

;;; Commentary:

;; This package provides syntax highlighting and editing support for N8N DSL files.
;; The N8N DSL is a Domain Specific Language for defining n8n workflows with
;; a focus on readability, reusability, and maintainability.

;;; Code:

(require 'font-lock)
(require 'syntax)

;; Define the syntax table
(defvar n8n-dsl-mode-syntax-table
  (let ((table (make-syntax-table)))
    ;; Comments
    (modify-syntax-entry ?/ ". 124b" table)
    (modify-syntax-entry ?* ". 23" table)
    (modify-syntax-entry ?\n "> b" table)

    ;; Strings
    (modify-syntax-entry ?\" "\"" table)
    (modify-syntax-entry ?\' "\"" table)
    (modify-syntax-entry ?\` "\"" table)

    ;; Brackets
    (modify-syntax-entry ?\{ "(}" table)
    (modify-syntax-entry ?\} "){" table)
    (modify-syntax-entry ?\[ "(]" table)
    (modify-syntax-entry ?\] ")[" table)
    (modify-syntax-entry ?\( "()" table)
    (modify-syntax-entry ?\) ")(" table)

    ;; Operators
    (modify-syntax-entry ?= "." table)
    (modify-syntax-entry ?> "." table)
    (modify-syntax-entry ?< "." table)
    (modify-syntax-entry ?& "." table)
    (modify-syntax-entry ?| "." table)
    (modify-syntax-entry ?! "." table)

    ;; Underscore as part of word
    (modify-syntax-entry ?_ "w" table)

    table)
  "Syntax table for N8N DSL mode.")

;; Define keywords for font-lock
(defconst n8n-dsl-keywords
  '("workflow" "param" "var" "node" "module" "connect" "output")
  "Keywords for N8N DSL.")

(defconst n8n-dsl-types
  '("string" "number" "boolean" "array" "object")
  "Data types for N8N DSL.")

(defconst n8n-dsl-builtin-functions
  '("now" "file" "env" "json")
  "Built-in functions for N8N DSL.")

(defconst n8n-dsl-node-types
  '("trigger.manual" "trigger.schedule" "trigger.webhook" "trigger.form"
    "http.request" "flow.if" "flow.switch" "flow.splitInBatches"
    "data.set" "data.transform" "data.aggregate"
    "integration.email" "integration.slack" "integration.sheets" "integration.calendar")
  "Common node types for N8N DSL.")

;; Font lock configuration
(defconst n8n-dsl-font-lock-keywords
  `(
    ;; Comments
    ("//.*$" . font-lock-comment-face)
    ("/\\*.*?\\*/" . font-lock-comment-face)

    ;; Keywords
    (,(regexp-opt n8n-dsl-keywords 'words) . font-lock-keyword-face)

    ;; Data types
    (,(regexp-opt n8n-dsl-types 'words) . font-lock-type-face)

    ;; Built-in functions
    (,(concat "\\<" (regexp-opt n8n-dsl-builtin-functions) "\\s-*(") 1 font-lock-function-name-face)

    ;; Workflow declaration
    ("\\<\\(workflow\\)\\s-+\\(\"[^\"]*\"\\)"
     (1 font-lock-keyword-face)
     (2 font-lock-string-face))

    ;; Parameter declaration
    ("\\<\\(param\\)\\s-+\\([a-zA-Z_][a-zA-Z0-9_]*\\)\\s-+\\([a-zA-Z]+\\)"
     (1 font-lock-keyword-face)
     (2 font-lock-variable-name-face)
     (3 font-lock-type-face))

    ;; Variable declaration
    ("\\<\\(var\\)\\s-+\\([a-zA-Z_][a-zA-Z0-9_]*\\)\\s-*="
     (1 font-lock-keyword-face)
     (2 font-lock-variable-name-face))

    ;; Node declaration
    ("\\<\\(node\\)\\s-+\\([a-zA-Z_][a-zA-Z0-9_]*\\)\\s-+\\(\"[^\"]*\"\\)"
     (1 font-lock-keyword-face)
     (2 font-lock-function-name-face)
     (3 font-lock-string-face))

    ;; Module declaration
    ("\\<\\(module\\)\\s-+\\([a-zA-Z_][a-zA-Z0-9_]*\\)\\s-*=\\s-*\\([^\\s-{]+\\)"
     (1 font-lock-keyword-face)
     (2 font-lock-function-name-face)
     (3 font-lock-string-face))

    ;; Connection
    ("\\<\\(connect\\)\\s-+\\([a-zA-Z_][a-zA-Z0-9_.]*\\)\\s-*\\(->\\)\\s-*\\([a-zA-Z_][a-zA-Z0-9_.]*\\)"
     (1 font-lock-keyword-face)
     (2 font-lock-variable-name-face)
     (3 font-lock-builtin-face)
     (4 font-lock-variable-name-face))

    ;; Property assignment
    ("\\<\\([a-zA-Z_][a-zA-Z0-9_]*\\)\\s-*:" 1 font-lock-variable-name-face)

    ;; String interpolation
    ("\\${[^}]*}" . font-lock-preprocessor-face)

    ;; Node types in strings
    (,(concat "\"\\(" (regexp-opt n8n-dsl-node-types) "\\)\"") 1 font-lock-constant-face)

    ;; Numbers
    ("\\<[0-9]+\\(\\.[0-9]+\\)?\\>" . font-lock-constant-face)

    ;; Booleans
    ("\\<\\(true\\|false\\)\\>" . font-lock-constant-face)

    ;; Operators
    ("\\(->\\|>=\\|<=\\|>\\|<\\|==\\|!=\\|&&\\|||\\)" . font-lock-builtin-face)
    )
  "Font lock keywords for N8N DSL mode.")

;; Indentation function
(defun n8n-dsl-indent-line ()
  "Indent current line as N8N DSL code."
  (interactive)
  (let ((indent-col 0)
        (current-line (thing-at-point 'line t)))
    (save-excursion
      (beginning-of-line)
      (let ((prev-line-indent 0))
        ;; Get previous line indentation
        (when (not (bobp))
          (forward-line -1)
          (setq prev-line-indent (current-indentation))
          (let ((prev-line (thing-at-point 'line t)))
            ;; Increase indent after opening braces
            (when (string-match ".*{\\s-*$" prev-line)
              (setq indent-col (+ prev-line-indent 2)))
            ;; Keep same indent for most cases
            (when (= indent-col 0)
              (setq indent-col prev-line-indent))))

        ;; Decrease indent for closing braces
        (when (string-match "^\\s-*}" current-line)
          (setq indent-col (max 0 (- indent-col 2))))))

    ;; Apply indentation
    (indent-line-to indent-col)))

;; Completion at point
(defun n8n-dsl-completion-at-point ()
  "Provide completion at point for N8N DSL."
  (let ((bounds (bounds-of-thing-at-point 'word)))
    (when bounds
      (list (car bounds)
            (cdr bounds)
            (append n8n-dsl-keywords
                    n8n-dsl-types
                    n8n-dsl-builtin-functions
                    n8n-dsl-node-types)
            :exclusive 'no))))

;; Imenu support
(defvar n8n-dsl-imenu-generic-expression
  '(("Workflows" "^\\s-*workflow\\s-+\"\\([^\"]+\\)\"" 1)
    ("Nodes" "^\\s-*node\\s-+\\([a-zA-Z_][a-zA-Z0-9_]*\\)" 1)
    ("Modules" "^\\s-*module\\s-+\\([a-zA-Z_][a-zA-Z0-9_]*\\)" 1)
    ("Parameters" "^\\s-*param\\s-+\\([a-zA-Z_][a-zA-Z0-9_]*\\)" 1)
    ("Variables" "^\\s-*var\\s-+\\([a-zA-Z_][a-zA-Z0-9_]*\\)" 1))
  "Imenu generic expression for N8N DSL mode.")

;; Electric pairs
(defvar n8n-dsl-electric-pairs
  '((?{ . ?})
    (?\[ . ?\])
    (?\( . ?\))
    (?\" . ?\")
    (?\' . ?\')
    (?\` . ?\`))
  "Electric pairs for N8N DSL mode.")

;; Snippets/templates (requires yasnippet)
(defun n8n-dsl-insert-workflow-template ()
  "Insert a basic workflow template."
  (interactive)
  (insert "// Workflow Description\n\n")
  (insert "workflow \"workflow-name\" {\n")
  (insert "  // Parameters\n")
  (insert "  param paramName string = \"defaultValue\"\n\n")
  (insert "  // Variables\n")
  (insert "  var varName = \"value\"\n\n")
  (insert "  // Trigger\n")
  (insert "  node trigger \"trigger.manual\" {\n")
  (insert "    \n")
  (insert "  }\n\n")
  (insert "  // Connections\n")
  (insert "  connect trigger -> nextNode\n")
  (insert "}"))

;; Key bindings
(defvar n8n-dsl-mode-map
  (let ((map (make-sparse-keymap)))
    (define-key map (kbd "C-c C-t") 'n8n-dsl-insert-workflow-template)
    (define-key map (kbd "C-c C-c") 'comment-region)
    (define-key map (kbd "C-c C-u") 'uncomment-region)
    map)
  "Keymap for N8N DSL mode.")

;; Mode definition
;;;###autoload
(define-derived-mode n8n-dsl-mode prog-mode "N8N DSL"
  "Major mode for editing N8N DSL files.

N8N DSL is a Domain Specific Language for defining n8n workflows
with a focus on readability, reusability, and maintainability.

\\{n8n-dsl-mode-map}"
  :syntax-table n8n-dsl-mode-syntax-table

  ;; Font lock
  (setq-local font-lock-defaults '(n8n-dsl-font-lock-keywords nil nil nil nil))

  ;; Comments
  (setq-local comment-start "// ")
  (setq-local comment-end "")
  (setq-local comment-start-skip "//+\\s-*")

  ;; Indentation
  (setq-local indent-line-function 'n8n-dsl-indent-line)
  (setq-local tab-width 2)
  (setq-local indent-tabs-mode nil)

  ;; Completion
  (add-hook 'completion-at-point-functions 'n8n-dsl-completion-at-point nil t)

  ;; Imenu
  (setq-local imenu-generic-expression n8n-dsl-imenu-generic-expression)

  ;; Electric pairs
  (when (fboundp 'electric-pair-local-mode)
    (setq-local electric-pair-pairs n8n-dsl-electric-pairs)
    (electric-pair-local-mode 1))

  ;; Which function mode support
  (when (fboundp 'which-function-mode)
    (setq-local which-func-functions '(n8n-dsl-current-function)))

  ;; Auto-fill mode in comments
  (setq-local adaptive-fill-mode t)
  (setq-local adaptive-fill-first-line-regexp "^\\s-*//\\s-*")
  (setq-local adaptive-fill-regexp "^\\s-*//\\s-*"))

;; Which function support
(defun n8n-dsl-current-function ()
  "Return the name of the current workflow or node."
  (save-excursion
    (beginning-of-line)
    (when (re-search-backward "^\\s-*\\(workflow\\|node\\|module\\)\\s-+\\([^\\s-\"]+\\|\"[^\"]*\"\\)" nil t)
      (let ((type (match-string 1))
            (name (match-string 2)))
        (format "%s %s" type (string-trim name "\"" "\""))))))

;; Auto-mode-alist association
;;;###autoload
(add-to-list 'auto-mode-alist '("\\.n8n\\'" . n8n-dsl-mode))

;; Provide the mode
(provide 'n8n-dsl-mode)

;;; n8n-dsl-mode.el ends here
