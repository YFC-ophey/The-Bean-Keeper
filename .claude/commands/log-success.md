# Log Success


You are helping the user log a success/win that occurred during agentic coding. Most people skip this - they only log failures. But understanding WHY things work is just as important as why they fail. Capture what went RIGHT.


## Logs Directory

All logs are stored in: `/Users/opheliachen/Desktop/Claude-code-logs/successes`

- Success: `/successes/success-XXX.md`

- Metadata (for ID tracking): `/metadata.json`

## Your Task


1. **First, review the recent conversation context** to understand what went notably well. Look for:

   - What task was accomplished smoothly

   - What approach was used that worked well

   - Any moments where something just clicked

   - Unusually fast completion

   - First-try successes

   - Elegant solutions

   - Minimal intervention needed

   - Good tool/command usage


2. **Ask 4-6 clarifying questions** to extract WHY it worked. Be SPECIFIC to what actually happened. Examples:

   - "That auth flow came together in under 20 minutes. What about the prompt setup made it work so smoothly?"

   - "You didn't have to correct me once during the refactor. Was that luck or did the context in CLAUDE.md help?"

   - "The solution I suggested was cleaner than what you initially had in mind. What made it click?"


   Questions should cover:

   - **What specifically went well:** Not generic "it worked" but precise win

   - **Why it worked:** The contributing factors

   - **The setup:** What context/prompt/approach was used

   - **Key ingredient:** What was the one thing that made the difference?

   - **Reproducibility:** Could you do this again? Should this become standard practice?


3. **Trace the triggering prompt**: After the interview, identify and quote the EXACT user prompt(s) that led to this success. This is critical for understanding what instruction produced the win. Ask the user to confirm or paste the exact prompt if you can't find it in context.


4. **After getting answers**, read metadata.json to get the next success ID, then create the log file.


5. **Update metadata.json** with the incremented counter.

6. **Pattern Extraction**

After logging success, ask:
"This is the [X]th time this approach worked. 
Should we create a playbook/template/standard practice?"

If yes:
- Extract the pattern
- Add to `/Users/opheliachen/Desktop/Claude-code-logs/patterns`
- Reference in future tasks



