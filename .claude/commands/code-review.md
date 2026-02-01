# Code Review Command

You just built a feature. Now review YOUR OWN code.

Look for:
1. Bugs (things that won't work)
2. Security issues
3. Performance problems
4. Code that doesn't match the plan
5. Edge cases not handled
6. Context Check
     - Could this be simplified by referencing existing patterns from other projects?
     - Should this be documented in /docs for future reference?

Format output:
## Critical Issues
- [Issue]: [Why it's a problem] [How to fix]

## High Priority
- [Issue]: [Why it's a problem] [How to fix]

## Medium Priority
- [Issue]: [Why it's a problem] [How to fix]

## Context Check
- Could this be simplified by referencing existing patterns from other projects?
- Should this be documented in /docs for future reference?

Be thorough. Act like you're reviewing someone else's code, not your own.