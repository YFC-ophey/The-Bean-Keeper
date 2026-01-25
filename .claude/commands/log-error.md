Log Error
You are helping the user log an error/failure that just occurred during agentic coding. The PRIMARY goal is to identify what the USER did wrong in their prompting, context management, or harness configuration. This is about building USER skill, not cataloging model failures.

Core Philosophy
Errors in agentic coding are almost always traceable to:

Bad Prompt - Ambiguous, missing constraints, too verbose, wrong structure
Context Rot - Didn't /clear, conversation too long, stale context polluting responses
Bad Harnessing - Wrong agent type, didn't pass context to subagents, missing guardrails
The model is the constant. The user's input is the variable. Focus on the variable.

Logs Directory
All logs are stored in: `/Users/opheliachen/Desktop/Claude-code-logs/errors`

- Errors: `/errors/error-XXX.md`
- Metadata (for ID tracking): `/metadata.json`

Your Task
Review the conversation to identify what went wrong.
Ask 5-8 pointed questions focused on USER behavior:
"Your prompt was 4000 words. What were the 3 most important requirements?"
"Did you specify what NOT to do, or only what to do?"
"When did you last /clear? How full was context?"
"Did you verify the subagents received the critical context?"
"Was this reference material or explicit requirements?"
"What constraints were in your head but not in the prompt?"
Trace the triggering prompt - Get the EXACT prompt that led to failure.
Be critical of the user - They asked for this. Don't soften it.
Log the error with the template below.
Log Template
markdown

# Error #[ID]: [Short Descriptive Name]

**Date:** [Date]

**Project/Context:** [What were you working on]


## What Happened

[2-3 sentences - what went wrong specifically]


## User Error Category

**Primary cause:** [Pick ONE]


### Prompt Errors

- [ ] **Ambiguous instruction** - Could be interpreted multiple ways

- [ ] **Missing constraints** - Didn't specify what NOT to do

- [ ] **Too verbose** - Buried key requirements in walls of text

- [ ] **Reference vs requirements** - Gave reference material, expected extracted requirements

- [ ] **Implicit expectations** - Had requirements in head, not in prompt

- [ ] **No success criteria** - Didn't define what "done" looks like

- [ ] **Wrong abstraction level** - Too high-level or too detailed for the task


### Context Errors

- [ ] **Context rot** - Conversation too long, should have /cleared

- [ ] **Stale context** - Old information polluting new responses

- [ ] **Context overflow** - Too much info degraded performance

- [ ] **Missing context** - Assumed Claude remembered something it didn't

- [ ] **Wrong context** - Irrelevant information drowning signal


### Harness Errors

- [ ] **Subagent context loss** - Critical info didn't reach subagents

- [ ] **Wrong agent type** - Used wrong specialized agent for task

- [ ] **No guardrails** - Didn't constrain agent behavior appropriately

- [ ] **Parallel when sequential needed** - Launched agents that had dependencies

- [ ] **Sequential when parallel possible** - Slow execution due to unnecessary serialization

- [ ] **Missing validation** - No check that agent output was correct

- [ ] **Trusted without verification** - Accepted agent output without review


### Meta Errors

- [ ] **Didn't ask clarifying questions** - Could have caught this earlier

- [ ] **Rushed to implementation** - Skipped planning/verification

- [ ] **Assumed competence** - Expected Claude to infer too much


## The Triggering Prompt

```

[Exact prompt - verbatim]

```


## What Was Wrong With This Prompt

[Be specific and critical. What should have been different?]


## What The User Should Have Said Instead

```

[Rewritten prompt that would have prevented this error]

```


## The Gap

- **What user expected:** [Expected outcome]

- **What user got:** [Actual outcome]

- **Why the gap exists:** [Direct connection to user error above]


## Impact

- **Time wasted:** [X minutes]

- **Rework required:** [What needs to be redone]


## Prevention - User Action Items

1. [Specific action user should take next time]

2. [Another specific action]

3. [Consider adding to personal CLAUDE.md or workflow]


## Pattern Check

- **Seen this before?** [Yes/No - if yes, this is a habit to break]

- **Predictable?** [Should user have anticipated this?]


## One-Line Lesson (for the USER)

[Actionable takeaway about prompting/context/harnessing - NOT about model behavior]


---

*Logged on [timestamp]*

Important
Be CRITICAL of the user - they're logging this to learn, not to feel good
Focus 80% on user error, 20% on model behavior
The goal is to improve USER skill at agentic coding
If the user can't identify their mistake, help them find it
Sanitized logs are useless - be specific and honest