import { getOpenAITextResponse } from "./chat-service";
import { AIMessage } from "../types/ai";
import {
  CodeSnippet,
  ChartData,
  Diagram,
  VisualContent,
} from "../state/notesStore";

/**
 * Generate visual content (diagrams, charts, code snippets) from note content
 * @param noteContent - The content of the note
 * @param noteTitle - The title of the note
 * @returns Visual content object with all generated visuals
 */
export const generateVisualContent = async (
  noteContent: string,
  noteTitle: string
): Promise<VisualContent> => {
  const systemPrompt = `You are an expert at creating educational visual content. Your task is to analyze text content and generate helpful visual representations including:
1. Code snippets (with explanations)
2. Charts and graphs (with data)
3. Diagrams (flowcharts, concept maps, etc.)

You must respond with ONLY valid JSON in the exact format specified below. Do not include any markdown formatting, code blocks, or explanatory text.`;

  const userPrompt = `Analyze the following note and generate appropriate visual content to help understand it better.

Title: ${noteTitle}

Content:
${noteContent}

Generate a JSON response with the following structure:
{
  "codeSnippets": [
    {
      "language": "javascript",
      "code": "console.log('example')",
      "title": "Example Code",
      "explanation": "Brief explanation"
    }
  ],
  "charts": [
    {
      "type": "bar",
      "title": "Chart Title",
      "data": [
        {"label": "Item 1", "value": 10, "color": "#0ea5e9"},
        {"label": "Item 2", "value": 20, "color": "#8b5cf6"}
      ],
      "xAxisLabel": "X Axis",
      "yAxisLabel": "Y Axis"
    }
  ],
  "diagrams": [
    {
      "type": "flowchart",
      "title": "Process Flow",
      "description": "Description of the diagram",
      "mermaidCode": "Simple text representation of the flow"
    }
  ]
}

Guidelines:
- Only include visuals that are relevant and add value
- For code snippets: use appropriate language and include explanations
- For charts: choose the right type (bar, line, pie, area) and provide real data points
- For diagrams: use simple text descriptions in mermaidCode field
- If a category has no relevant content, use an empty array []
- Aim for 2-4 total visuals that are most helpful

Return ONLY the JSON object, no other text.`;

  const messages: AIMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  try {
    const response = await getOpenAITextResponse(messages, {
      temperature: 0.7,
      maxTokens: 2000,
      model: "gpt-4o",
    });

    // Clean the response to extract JSON
    let jsonContent = response.content.trim();

    // Remove markdown code blocks if present
    if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    }

    // Try to find JSON object in the response
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    const visualContent: VisualContent = JSON.parse(jsonContent);

    // Validate and clean the data
    return {
      codeSnippets: Array.isArray(visualContent.codeSnippets)
        ? visualContent.codeSnippets
        : [],
      charts: Array.isArray(visualContent.charts) ? visualContent.charts : [],
      diagrams: Array.isArray(visualContent.diagrams)
        ? visualContent.diagrams
        : [],
    };
  } catch (error) {
    console.error("Error generating visual content:", error);

    // Return sample visual content on error
    return {
      codeSnippets: [
        {
          language: "javascript",
          code: "// Unable to generate code snippet\n// Please try again",
          title: "Generation Error",
          explanation: "There was an error generating visual content. Please try again.",
        },
      ],
      charts: [],
      diagrams: [],
    };
  }
};

/**
 * Generate a single type of visual content
 * @param noteContent - The content of the note
 * @param visualType - The type of visual to generate
 * @returns Specific visual content
 */
export const generateSingleVisual = async (
  noteContent: string,
  visualType: "code" | "chart" | "diagram"
): Promise<any> => {
  const prompts = {
    code: "Generate relevant code snippets with explanations",
    chart: "Generate relevant charts or graphs with data",
    diagram: "Generate a relevant diagram (flowchart, concept map, etc.)",
  };

  const systemPrompt = `You are an expert at creating ${visualType} content for educational purposes.`;
  const userPrompt = `${prompts[visualType]} based on this content:\n\n${noteContent}\n\nReturn only valid JSON.`;

  try {
    const response = await getOpenAITextResponse(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.7, maxTokens: 1000 }
    );

    return JSON.parse(response.content);
  } catch (error) {
    console.error(`Error generating ${visualType}:`, error);
    return null;
  }
};
