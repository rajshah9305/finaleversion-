import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateAppWithStreaming } from '../services/geminiService';
import type { Message, AgentProgress, AgentStatus, Project, ChatSession } from '../types';
import { AGENT_NAMES } from '../constants';
import { SparklesIcon, ChevronLeftIcon, EyeIcon, CodeIcon, SendIcon, CheckCircleIcon, AlertCircleIcon, HistoryIcon, ClipboardIcon, Loader2Icon, FilePlusIcon } from './icons';

const SESSION_KEY = 'rajai-chat-session';

// --- Helper & Sub-components ---

const AgentStatusIcon: React.FC<{ status: AgentStatus }> = ({ status }) => {
    switch (status) {
        case 'working': return <Loader2Icon className="w-5 h-5 text-orange-500 animate-spin" />;
        case 'complete': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
        case 'error': return <AlertCircleIcon className="w-5 h-5 text-red-500" />;
        default: return <div className="w-5 h-5 flex items-center justify-center"><div className="w-2 h-2 bg-gray-300 rounded-full"></div></div>;
    }
};

const AgentProgressTracker: React.FC<{ progress: AgentProgress[] }> = ({ progress }) => (
    <div className="p-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">CrewAI Agents</h3>
        <div className="space-y-4">
            {AGENT_NAMES.map(name => {
                const agentState = progress.find(p => p.agentName === name) || { agentName: name, status: 'pending', message: 'Waiting...' };
                return (
                    <div key={name} className="flex items-start space-x-3 animate-fade-in">
                        <AgentStatusIcon status={agentState.status} />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-black">{agentState.agentName}</p>
                            <p className="text-xs text-gray-500">{agentState.message}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

const ProjectHistory: React.FC<{ projects: Project[], onSelect: (prompt: string) => void }> = ({ projects, onSelect }) => (
    <div className="p-6 flex-1 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider flex items-center">
            <HistoryIcon className="w-4 h-4 mr-2" />
            History
        </h3>
        {projects.length === 0 ? (
            <p className="text-xs text-gray-400">Your generated apps will appear here.</p>
        ) : (
            <div className="space-y-2">
                {projects.map(p => (
                    <button
                        key={p.id}
                        onClick={() => onSelect(p.prompt)}
                        className="w-full text-left p-2.5 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                        <p className="text-sm font-medium text-black truncate">{p.prompt}</p>
                        <p className="text-xs text-gray-500">{new Date(p.timestamp).toLocaleString()}</p>
                    </button>
                ))}
            </div>
        )}
    </div>
);

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
    const isUser = message.type === 'user';
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-in-up`}>
            <div className={`max-w-3xl rounded-2xl p-5 shadow-sm ${isUser ? 'bg-orange-500 text-white' : 'bg-white text-black border border-gray-200'}`}>
                {!isUser && (
                    <div className="flex items-center space-x-2 mb-3">
                        <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                            <SparklesIcon className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-orange-600">RajAI</span>
                    </div>
                )}
                <div className="whitespace-pre-wrap text-base leading-relaxed">{message.content}</div>
            </div>
        </div>
    );
};

// --- Main Chat Interface Component ---

interface ChatInterfaceProps {
  onNavigateHome: () => void;
}

type PreviewTab = 'preview' | 'code';

const getInitialState = () => {
    const initialMessage: Message = {
        id: 'initial-greeting',
        type: 'ai',
        content: "👋 Hi! I'm RajAI, your AI application builder.\n\nDescribe the app you want to build, and my team of AI agents will create it for you.",
        timestamp: new Date()
    };
    return {
        messages: [initialMessage],
        agentProgress: [],
        previewHtml: '',
        currentPrompt: '',
        isGenerating: false,
    };
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onNavigateHome }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [agentProgress, setAgentProgress] = useState<AgentProgress[]>([]);
    const [previewHtml, setPreviewHtml] = useState('');
    const [currentPrompt, setCurrentPrompt] = useState('');
    const [activeTab, setActiveTab] = useState<PreviewTab>('preview');
    const [apiKeyError, setApiKeyError] = useState<string | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [copied, setCopied] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    useEffect(scrollToBottom, [messages, agentProgress]);
    
    // Load session from localStorage on initial mount
    useEffect(() => {
        try {
            const savedSession = localStorage.getItem(SESSION_KEY);
            if (savedSession) {
                const session: ChatSession = JSON.parse(savedSession);
                setMessages(session.messages);
                setAgentProgress(session.agentProgress);
                setPreviewHtml(session.previewHtml);
                setCurrentPrompt(session.currentPrompt);
            } else {
                setMessages(getInitialState().messages);
            }
            
            const savedProjects = localStorage.getItem('rajai_projects');
            if (savedProjects) {
                setProjects(JSON.parse(savedProjects));
            }
        } catch (e) {
            console.error("Failed to load session from localStorage", e);
            setMessages(getInitialState().messages);
        }

        if(!process.env.API_KEY) {
            setApiKeyError("Gemini API key is not configured. Please set the API_KEY environment variable.");
        }
    }, []);

    // Auto-save session to localStorage
    useEffect(() => {
        if (messages.length > 1 || currentPrompt) { // Avoid saving the initial state
            const session: ChatSession = { messages, agentProgress, previewHtml, currentPrompt };
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        }
    }, [messages, agentProgress, previewHtml, currentPrompt]);


    const handleNewChat = useCallback(() => {
        localStorage.removeItem(SESSION_KEY);
        const initialState = getInitialState();
        setMessages(initialState.messages);
        setAgentProgress(initialState.agentProgress);
        setPreviewHtml(initialState.previewHtml);
        setCurrentPrompt(initialState.currentPrompt);
        setIsGenerating(initialState.isGenerating);
        setInputMessage('');
    }, []);

    const handleSendMessage = useCallback(async () => {
        if (!inputMessage.trim() || isGenerating) return;

        const currentRequest = inputMessage;
        const userMessage: Message = { id: `user-${Date.now()}`, type: 'user', content: currentRequest, timestamp: new Date() };
        
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsGenerating(true);
        setAgentProgress([]);
        setPreviewHtml('');
        setCurrentPrompt(currentRequest);

        const aiResponse: Message = { id: `ai-${Date.now()}`, type: 'ai', content: `Roger that! Orchestrating my CrewAI team to build: "${currentRequest}". Stand by...`, timestamp: new Date() };
        setMessages(prev => [...prev, aiResponse]);

        try {
            let fullCode = '';
            await generateAppWithStreaming(currentRequest, (update) => {
                if (update.agent) {
                    setAgentProgress(prev => {
                        const existing = prev.find(p => p.agentName === update.agent!.agentName);
                        if (existing) {
                            return prev.map(p => p.agentName === update.agent!.agentName ? update.agent! : p);
                        }
                        return [...prev, update.agent];
                    });
                }
                if (update.code) {
                    fullCode += update.code;
                    setPreviewHtml(fullCode);
                }
            });

            const newProject: Project = { id: `proj-${Date.now()}`, prompt: currentRequest, timestamp: Date.now() };
            setProjects(prev => {
                const updatedProjects = [newProject, ...prev].slice(0, 10); // Keep last 10
                localStorage.setItem('rajai_projects', JSON.stringify(updatedProjects));
                return updatedProjects;
            });

            setMessages(prev => [...prev, { id: `ai-complete-${Date.now()}`, type: 'ai', content: "✅ **Application Generated Successfully!**\n\nCheck out the live preview and code on the right. What would you like to build next?", timestamp: new Date() }]);
        } catch (error) {
            const err = error as Error;
            setMessages(prev => [...prev, { id: `ai-error-${Date.now()}`, type: 'ai', content: `❌ **Error**: ${err.message}`, timestamp: new Date() }]);
            setAgentProgress(prev => prev.map(p => p.status === 'working' ? {...p, status: 'error', message: 'Failed'} : p));
        } finally {
            setIsGenerating(false);
        }
    }, [inputMessage, isGenerating]);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(previewHtml);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row font-sans">
            <aside className="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                                <SparklesIcon className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-black">RajAI</span>
                        </div>
                        <div className="flex items-center space-x-2">
                             <button 
                                onClick={handleNewChat}
                                className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                                aria-label="New Chat"
                                title="New Chat"
                                >
                                <FilePlusIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <button onClick={onNavigateHome} className="flex items-center text-sm text-gray-500 hover:text-orange-500 transition-colors">
                        <ChevronLeftIcon className="w-4 h-4 mr-1" /> Back to Home
                    </button>
                </div>
                <AgentProgressTracker progress={agentProgress} />
                <ProjectHistory projects={projects} onSelect={(prompt) => setInputMessage(prompt)} />
            </aside>

            <main className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 flex flex-col md:flex-row min-h-0">
                    <div className="flex-1 flex flex-col">
                         {apiKeyError && (
                            <div className="p-4 bg-red-100 text-red-800 border-b border-red-200 flex items-center space-x-3">
                                <AlertCircleIcon className="w-5 h-5" /><span className="text-sm font-medium">{apiKeyError}</span>
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
                             <div ref={messagesEndRef} />
                        </div>

                        <div className="border-t border-gray-200 p-6 bg-white">
                            <div className="flex space-x-4 items-center">
                                <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Describe the app you want to build..." disabled={isGenerating || !!apiKeyError} className="flex-1 px-5 py-3 border border-gray-300 bg-white text-black rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100" />
                                <button onClick={handleSendMessage} disabled={!inputMessage.trim() || isGenerating || !!apiKeyError} className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl transition-colors flex items-center space-x-2 font-semibold">
                                    <SendIcon className="w-5 h-5" /><span>{isGenerating ? 'Building...' : 'Send'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {(isGenerating || previewHtml) && (
                        <div className="w-full md:w-1/2 border-l border-gray-200 bg-white flex flex-col">
                            <div className="p-2 border-b border-gray-200 flex items-center justify-between">
                                <div className="flex space-x-1">
                                    <button onClick={() => setActiveTab('preview')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 ${activeTab === 'preview' ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:bg-gray-100'}`}><EyeIcon className="w-5 h-5" /><span>Preview</span></button>
                                    <button onClick={() => setActiveTab('code')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 ${activeTab === 'code' ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:bg-gray-100'}`}><CodeIcon className="w-5 h-5" /><span>Code</span></button>
                                </div>
                                {activeTab === 'code' && <button onClick={handleCopyCode} className="px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg flex items-center space-x-2"><ClipboardIcon className="w-4 h-4" /><span>{copied ? 'Copied!' : 'Copy'}</span></button>}
                            </div>

                            <div className="flex-1 relative bg-gray-100">
                                {isGenerating && !previewHtml && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10"><Loader2Icon className="w-10 h-10 text-orange-500 animate-spin mb-4" /><p className="text-sm text-gray-700 font-medium">CrewAI agents are building your app...</p></div>
                                )}
                                <div className={`${activeTab === 'preview' ? 'block' : 'hidden'} w-full h-full`}>
                                  <iframe srcDoc={previewHtml} className="w-full h-full border-0 bg-white" sandbox="allow-scripts allow-same-origin" title="Live Application Preview" />
                                </div>
                                <div className={`${activeTab === 'code' ? 'block' : 'hidden'} w-full h-full`}>
                                    <div className="h-full overflow-auto bg-gray-900"><pre className="p-4 text-sm text-green-300 whitespace-pre-wrap break-all"><code>{previewHtml}</code></pre></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ChatInterface;