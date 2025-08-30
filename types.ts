import type { ReactNode } from 'react';

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string | ReactNode;
  timestamp: Date;
}

export type AgentName = 'UI/UX Agent' | 'Frontend Agent' | 'Backend Agent' | 'Testing Agent';

export type AgentStatus = 'pending' | 'working' | 'complete' | 'error';

export interface Agent {
    name: AgentName;
    role: string;
    goal: string;
    backstory: string;
}

export interface AgentProgress {
  agentName: AgentName;
  status: AgentStatus;
  message: string;
}

export interface Project {
  id: string;
  prompt: string;
  timestamp: number;
}

export interface ChatSession {
  messages: Message[];
  agentProgress: AgentProgress[];
  previewHtml: string;
  currentPrompt: string;
}