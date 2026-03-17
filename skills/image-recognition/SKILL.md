---
name: image-recognition
description: Use when user provides an image file or asks to analyze, describe, or extract information from images
---

# Image Recognition

## Overview

Use built-in vision capabilities to analyze images and extract meaningful information. This skill guides you in providing accurate, comprehensive image descriptions.

## When to Use

- User uploads or references an image file
- User asks "what's in this picture" or similar questions
- User needs text extracted from an image (OCR)
- User wants analysis of charts, diagrams, or screenshots
- User asks about colors, objects, or visual elements

## Core Pattern

### 1. Load the Image

Use the `read` tool to load the image file:

```
read filePath="path/to/image.png"
```

The image will be returned as a file attachment that you can analyze.

### 2. Analyze Systematically

Follow this observation order:

1. **Overall impression** - Type of image (photo, screenshot, diagram, etc.)
2. **Main subjects** - Primary objects, people, or focal points
3. **Context/setting** - Background, environment, location
4. **Details** - Text, colors, patterns, notable features
5. **Purpose** - What the image seems to communicate or show

### 3. Respond Appropriately

Match your response to the user's request:

| User Request | Response Focus |
|--------------|----------------|
| "What's this?" | Comprehensive description |
| "Extract text" | OCR output, preserve formatting |
| "Is there X in this?" | Confirm presence/absence with evidence |
| "Describe for accessibility" | Alt-text style, concise but complete |
| "Analyze this chart" | Data trends, labels, key insights |

## Quick Reference

### Image Types and What to Look For

| Type | Key Elements |
|------|--------------|
| **Screenshot** | UI elements, text, error messages, app names |
| **Photo** | Objects, people, setting, lighting, mood |
| **Document** | Text content, formatting, headers, signatures |
| **Chart/Graph** | Title, axes, data trends, legend, conclusions |
| **Diagram** | Components, connections, flow, labels |
| **Code screenshot** | Language, functions, errors, line numbers |

### Description Length Guidelines

- **Alt-text**: 1-2 sentences, focus on function
- **Quick answer**: 3-5 key observations
- **Detailed analysis**: Structured breakdown by sections

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Only listing objects | Add context and relationships |
| Ignoring text in images | Always mention visible text |
| Over-interpreting | Stick to what's visible, not assumptions |
| Too verbose | Match detail level to user's question |
| Missing image type | First identify what kind of image it is |

## Examples

### Example 1: General Description

**User**: "What's in this image?"

**You**: [After reading image]

"This is a screenshot of a terminal window showing a npm install command running. The output shows 5 packages being installed with a total size of 2.3MB. At the bottom there's a success message 'found 0 vulnerabilities' in green text."

### Example 2: Text Extraction

**User**: "Extract the text from this image"

**You**: [After reading image]

"The image contains the following text:

```
Error: Connection timeout
    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1141:16)
```

This appears to be a Node.js network error stack trace."

### Example 3: Chart Analysis

**User**: "What does this chart show?"

**You**: [After reading image]

"This is a line chart titled 'Monthly Revenue 2024'. The x-axis shows months Jan-Dec, y-axis shows revenue in thousands ($0-500K). Key observations:

- Revenue starts at ~$200K in January
- Peaks at ~$450K in June
- Declines to ~$300K by December
- There's a notable dip in September

The overall trend shows strong first half, weaker second half performance."

## Red Flags

- **Don't** claim to see things not visible in the image
- **Don't** guess at information that's unclear or blurry
- **Don't** ignore the user's specific question in favor of generic description
- **DO** acknowledge limitations if image quality is poor
- **DO** ask for clarification if the request is ambiguous

## Technical Notes

- Supported formats: PNG, JPG, GIF, WebP, PDF
- Large images may be automatically resized for analysis
- For OCR tasks, mention if text quality affects accuracy
- If image cannot be read, explain why and suggest alternatives
