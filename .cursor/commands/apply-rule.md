# Apply Rule

## Overview
Apply a specific coding rule to guide code generation, review, or refactoring. This command ensures that all code changes follow the standards defined in the specified rule.

## Available Rules
- `python-basics` - Python coding standards and best practices
- `swift-ios` - Swift/iOS clean code and maintainability standards
- `webdev` - Web development standards for JavaScript, HTML, and CSS
- `architecture-planning` - Architecture, planning, and feedback practices

## Usage
After typing `/apply-rule`, specify which rule to apply:
- `/apply-rule python-basics`
- `/apply-rule swift-ios`
- `/apply-rule webdev`
- `/apply-rule architecture-planning`

## Instructions
1. **Identify the rule**: Determine which rule applies to the current task based on file types or context
2. **Load the rule**: Reference the rule file from `.cursor/rules/{rule-name}/RULE.md`
3. **Apply standards**: All code changes, suggestions, and reviews must strictly follow the guidelines in the specified rule
4. **Enforce consistency**: Ensure any existing code being modified also adheres to the rule's standards

## Example
When applying `swift-ios` rule:
- Use value types over reference types
- Prefer `guard` statements for early returns
- Avoid force unwrapping
- Use weak references in closures
- Follow protocol-oriented design patterns

When applying `python-basics` rule:
- Use modern type hints (`list[str]` not `List[str]`)
- Prefer `dataclasses` for structured data
- Fail loudly with specific exceptions
- Use context managers for resources

## Notes
- Rules are automatically applied based on file globs, but this command ensures explicit adherence
- Use this when you want to ensure a specific rule is followed regardless of file type
- Combine with code review or refactoring tasks for best results

