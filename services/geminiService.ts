import { GoogleGenAI } from "@google/genai";
import { CREW_AGENTS } from '../constants';
import type { AgentProgress, AgentName } from '../types';

interface StreamUpdate {
  agent?: AgentProgress;
  code?: string;
  error?: string;
}

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });
const model = 'gemini-2.5-flash';

const generateSystemPrompt = () => {
  const agentDescriptions = Object.values(CREW_AGENTS).map(agent => 
    `- **${agent.name} (${agent.role})**: ${agent.goal}`
  ).join('\n');

  return `You are an elite AI application builder, leading a team of specialized AI agents. Your mission is to generate a complete, production-ready, single-file full-stack application based on a user's request. The final product must be visually stunning, modern, and highly functional.

Follow this exact process:
1.  **Orchestration Phase**: Acknowledge the user's request and simulate the CrewAI agent orchestration process. For each agent, output a status update on a new line.
    -   The format for agent updates MUST be: \`[AGENT_UPDATE]{"agentName": "AGENT_NAME", "status": "STATUS", "message": "MESSAGE"}\`
    -   STATUS must be 'working' or 'complete'.
    -   **Provide descriptive, engaging messages.** For example: "UI/UX Agent: Crafting a stunning visual blueprint and intuitive user journey..." or "Frontend Agent: Assembling responsive UI components with clean, modern code."
    -   The agent execution order is strict: UI/UX Agent -> Frontend Agent -> Backend Agent -> Testing Agent.
    
2.  **Code Generation Phase**: After all agents report 'complete', you will generate the code.
    -   Start the code block with \`[CODE_START]\`.
    -   Generate a single, self-contained HTML file.
    -   Use vanilla HTML, CSS, and JavaScript. Embed CSS in a \`<style>\` tag and JS in a \`<script>\` tag.
    -   **Crucially, use Tailwind CSS via CDN for styling.** You must create a premium, modern, and visually appealing design. Be creative! Use gradients, subtle animations, excellent typography, and responsive layouts. The app must look and feel like a top-tier product.
    -   The application must be fully functional and interactive.
    -   Do NOT use any external JavaScript libraries or frameworks (like React, Vue, etc.) in the generated code itself.
    -   End the code block with \`[CODE_END]\`.

Do not add any other text, conversational filler, or explanations outside of the specified format. The output must be a clean stream of agent updates followed by the code block.

Here is your expert team:
${agentDescriptions}
`;
};

export const generateAppWithStreaming = async (
  prompt: string,
  onUpdate: (update: StreamUpdate) => void
): Promise<void> => {
  if (!API_KEY) {
    throw new Error("API key is not configured. Please set the API_KEY environment variable.");
  }

  try {
    const stream = await ai.models.generateContentStream({
        model: model,
        contents: prompt,
        config: {
            systemInstruction: generateSystemPrompt(),
        }
    });

    let buffer = '';
    let inCodeBlock = false;

    for await (const chunk of stream) {
      buffer += chunk.text;
      
      // Heuristic to check if we might have a complete JSON object for agent updates
      // This is to handle cases where the JSON string might be split across chunks.
      if (buffer.includes('[AGENT_UPDATE]')) {
          const updateEnd = buffer.indexOf('}\n');
          if (updateEnd !== -1) {
              const potentialJsonLine = buffer.substring(0, updateEnd + 2);
              const line = potentialJsonLine.trim();
              if (line.startsWith('[AGENT_UPDATE]')) {
                  try {
                      const jsonStr = line.replace('[AGENT_UPDATE]', '');
                      const agentUpdate: { agentName: AgentName, status: 'working' | 'complete', message: string } = JSON.parse(jsonStr);
                      onUpdate({ agent: agentUpdate });
                      buffer = buffer.substring(potentialJsonLine.length);
                      continue; 
                  } catch (e) {
                      // Incomplete JSON, wait for more chunks
                  }
              }
          }
      }

      if (buffer.includes('[CODE_START]')) {
          const startIndex = buffer.indexOf('[CODE_START]');
          inCodeBlock = true;
          const codePart = buffer.substring(startIndex + '[CODE_START]'.length);
          if (codePart) onUpdate({ code: codePart });
          buffer = ''; 
      } else if (buffer.includes('[CODE_END]')) {
          const endIndex = buffer.indexOf('[CODE_END]');
          const codePart = buffer.substring(0, endIndex);
          if (codePart) onUpdate({ code: codePart });
          inCodeBlock = false;
          buffer = buffer.substring(endIndex + '[CODE_END]'.length);
      } else if (inCodeBlock) {
          onUpdate({ code: buffer });
          buffer = '';
      }
    }
    
    // Process any remaining buffer content
    if (inCodeBlock && buffer.length > 0) {
        onUpdate({ code: buffer.replace('[CODE_END]', '') });
    }

  } catch (error) {
    console.error('Error generating content:', error);
    const errorMessage = (error instanceof Error && error.message.includes('API key not valid'))
      ? 'Your Gemini API key is invalid. Please check your configuration.'
      : 'Failed to communicate with the AI model. Please check your connection and try again.';
    onUpdate({ error: errorMessage });
    throw new Error(errorMessage);
  }
};
