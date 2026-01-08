# Groq API Cost Analysis for The Bean Keeper

## Overview

This document provides a detailed cost analysis for using Groq AI's Llama 3.1 8B Instant model to extract structured coffee information from OCR text in The Bean Keeper app.

## Groq Pricing (2025)

**Model**: `llama-3.1-8b-instant`

| Token Type | Cost per 1M Tokens |
|------------|-------------------|
| Input      | $0.05             |
| Output     | $0.08             |

**Context Window**: 8K tokens (128K version available at same price)

## Implementation Details

### Current Setup

File: `server/groq.ts`

```typescript
const completion = await groq.chat.completions.create({
  model: "llama-3.1-8b-instant",
  messages: [
    { role: "system", content: "..." },
    { role: "user", content: "Extract coffee info from: {ocrText}" }
  ],
  response_format: { type: "json_object" },
  max_tokens: 1000,
  temperature: 0
});
```

### Token Usage Per Entry

#### Input Tokens (Prompt + OCR Text)

| Component | Estimated Tokens |
|-----------|-----------------|
| System message | ~70 tokens |
| User prompt template | ~210 tokens |
| OCR text from coffee bag | ~200-500 tokens |
| **Total Input** | **~500-780 tokens** |

#### Output Tokens (JSON Response)

| Scenario | Estimated Tokens |
|----------|-----------------|
| Typical response | ~150-200 tokens |
| Complex response | ~250-300 tokens |
| **Typical Output** | **~200 tokens** |

**Note**: Max tokens set to 1000, but actual usage is much lower due to structured JSON output.

## Cost Calculations

### Per-Entry Cost

#### Typical Coffee Entry
- Input: 500 tokens
- Output: 200 tokens

```
Cost = (500 / 1,000,000 × $0.05) + (200 / 1,000,000 × $0.08)
     = $0.000025 + $0.000016
     = $0.000041 per entry
```

**Cost: ~$0.00004 per entry (0.004 cents)**

#### Complex Coffee Label
- Input: 780 tokens
- Output: 300 tokens

```
Cost = (780 / 1,000,000 × $0.05) + (300 / 1,000,000 × $0.08)
     = $0.000039 + $0.000024
     = $0.000063 per entry
```

**Cost: ~$0.00006 per entry (0.006 cents)**

### Volume Pricing

| Volume | Typical Cost | Complex Cost |
|--------|-------------|--------------|
| 1 entry | $0.00004 | $0.00006 |
| 10 entries | $0.0004 | $0.0006 |
| 100 entries | $0.004 | $0.006 |
| 1,000 entries | $0.04 | $0.06 |
| 10,000 entries | $0.40 | $0.60 |
| 100,000 entries | $4.00 | $6.00 |
| 1,000,000 entries | $40.00 | $60.00 |

## Cost Efficiency

### Why This Is Extremely Cheap

1. **Small model**: 8B parameters optimized for speed and efficiency
2. **Structured output**: JSON mode prevents verbose responses
3. **Simple task**: Extraction requires less computation than reasoning
4. **Groq's LPU architecture**: Hardware-optimized inference

### Comparison to Alternatives

| Service | Model | Cost per Entry | Notes |
|---------|-------|----------------|-------|
| **Groq** | Llama 3.1 8B | $0.00004 | Ultra-fast, current choice |
| OpenAI | GPT-4o-mini | $0.00015 | 4x more expensive |
| OpenAI | GPT-3.5-turbo | $0.00050 | 12x more expensive |
| Anthropic | Claude Haiku | $0.00025 | 6x more expensive |

## Additional Features

### Batch API (50% Cheaper)

Groq offers a Batch API for asynchronous workloads:
- **Cost**: 50% discount (would be ~$0.00002 per entry)
- **Trade-off**: Not real-time (processes in background)
- **Recommendation**: Not suitable for The Bean Keeper since users expect instant results

## Real-World Scenarios

### Individual User
- Average: 50 coffees per year
- Annual cost: $0.002 to $0.003 (less than 1 cent)

### Coffee Enthusiast
- Average: 200 coffees per year
- Annual cost: $0.008 to $0.012 (about 1 cent)

### Coffee Shop/Roaster
- Average: 1,000 coffees per year
- Annual cost: $0.04 to $0.06 (about 5 cents)

### Large-Scale App (10,000 users × 50 entries each)
- Total: 500,000 entries
- Total cost: $20 to $30 per year

## Cost in Context of Notion-Native Architecture

### Total Infrastructure Costs

| Component | Cost | Notes |
|-----------|------|-------|
| **Database** | $0 | Users' own Notion workspaces |
| **Photo storage** | $0 | Stored in users' Notion |
| **Groq AI** | ~$0.00005/entry | Only operational cost |
| **Hosting** | Variable | Vercel/Railway free tier possible |

**Key Insight**: Groq AI is the ONLY per-user cost, and it's negligible.

## Token Usage Breakdown

### Example OCR Input (Front + Back Photos)

```text
COUNTER CULTURE COFFEE
www.counterculturecoffee.com
Durham, NC

HOLOGRAM
Ethiopia · Gedeb
Washed Process
Heirloom Varieties

TASTING NOTES
Peach, Jasmine, Black Tea

ROASTED: 12/08/2024
NET WT 12 OZ (340g)
```

**Estimated tokens**: ~150-200 (typical)

### Example JSON Output

```json
{
  "roasterName": "Counter Culture Coffee",
  "roasterWebsite": "www.counterculturecoffee.com",
  "roasterLocation": "Durham, NC",
  "origin": "Ethiopia",
  "variety": "Heirloom",
  "processMethod": "Washed",
  "roastDate": "12/08/2024",
  "flavorNotes": ["Peach", "Jasmine", "Black Tea"]
}
```

**Estimated tokens**: ~100-150 (typical)

## Monitoring and Optimization

### Current Configuration

```typescript
// server/groq.ts
max_tokens: 1000      // Generous limit, actual usage ~200
temperature: 0        // Deterministic (no randomness)
response_format: json // Structured output (reduces tokens)
```

### Potential Optimizations (if needed)

1. **Reduce max_tokens**: Could set to 500 (saves nothing, just prevents waste)
2. **Compress prompt**: Could reduce template size (marginal savings)
3. **Cache system prompts**: Groq doesn't offer prompt caching yet

**Recommendation**: Current setup is already optimal. No changes needed.

## Monthly Cost Projections

### App Growth Scenarios

| Stage | Monthly Entries | Monthly Cost |
|-------|----------------|--------------|
| MVP (10 users) | 50 | $0.002 |
| Early Growth (100 users) | 500 | $0.02 |
| Growing (1,000 users) | 5,000 | $0.20 |
| Established (10,000 users) | 50,000 | $2.00 |
| Scale (100,000 users) | 500,000 | $20.00 |

**Even at 100,000 active users, AI costs are only $20/month.**

## Conclusion

Groq AI pricing is **negligible** for The Bean Keeper's use case:

- ✅ **Per-entry cost**: Less than 0.01 cents
- ✅ **Scalability**: Costs grow linearly, stay low even at scale
- ✅ **No upfront costs**: Pay-as-you-go model
- ✅ **Fast inference**: Sub-second response times
- ✅ **High quality**: Excellent extraction accuracy

Combined with the Notion-native architecture (zero storage costs), **Groq AI represents the only marginal cost per user**, making the app extremely cost-efficient to operate.

## References

### Official Documentation
- [Groq Official Pricing](https://groq.com/pricing)
- [Groq Llama 3.1 Pricing Guide](https://www.byteplus.com/en/topic/448470)
- [Groq llama-3.1-8b-instant Pricing Calculator](https://www.helicone.ai/llm-cost/provider/groq/model/llama-3.1-8b-instant)

### Implementation Files
- `server/groq.ts` - Groq AI client implementation
- `server/routes.ts` - API endpoint for extraction (`/api/extract-coffee-info`)
- `client/src/components/AddCoffeeForm.tsx` - Frontend OCR and AI integration

---

**Last Updated**: December 2024
**Groq SDK Version**: 0.37.0
**Model**: llama-3.1-8b-instant
**API Version**: 2025-09-03
