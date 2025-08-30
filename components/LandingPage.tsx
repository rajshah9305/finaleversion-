import React from 'react';
import { SparklesIcon, RocketIcon, PlayIcon, BrainIcon, UsersIcon, EyeIcon, ChevronRightIcon } from './icons';

interface LandingPageProps {
  onStartBuilding: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartBuilding }) => {
  return (
    <div className="min-h-screen bg-white text-black animate-fade-in">
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-black">RajAI</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8 font-medium">
              <a href="#features" className="text-gray-700 hover:text-orange-500 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-orange-500 transition-colors">How It Works</a>
            </div>
            
            <div className="flex items-center space-x-4">
                <button 
                onClick={onStartBuilding}
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
                >
                Start Building
                </button>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-36 pb-24 px-6 bg-orange-50/50">
        <div className="max-w-7xl mx-auto animate-slide-in-up">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold mb-8">
              <SparklesIcon className="w-5 h-5" />
              <span>Powered by Gemini 2.5 Flash + CrewAI</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-black mb-6 leading-tight tracking-tighter">
              Build Full-Stack Apps with 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500"> AI Agents</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              Describe your app idea. Watch our specialized CrewAI agents design, code, and deploy a fully functional application with a live preview in minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={onStartBuilding}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 flex items-center space-x-3 shadow-lg hover:shadow-orange-300"
              >
                <RocketIcon className="w-6 h-6" />
                <span>Start Building for Free</span>
              </button>
              
              <button className="bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-black px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 flex items-center space-x-3">
                <PlayIcon className="w-5 h-5" />
                <span>Watch Demo</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-4">Powered by an Advanced AI Crew</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our CrewAI agents collaborate using Gemini to understand your requirements and generate production-ready code.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BrainIcon className="w-7 h-7 text-orange-500" />}
              title="Gemini 2.5 Intelligence"
              description="Advanced natural language processing to understand complex app requirements and translate them into technical specifications."
              linkText="Smart Requirements Analysis"
            />
            <FeatureCard
              icon={<UsersIcon className="w-7 h-7 text-orange-500" />}
              title="CrewAI Agent Orchestra"
              description="UI/UX, Frontend, Backend, and Testing agents collaborate to build comprehensive full-stack applications with best practices."
              linkText="Expert Agent Collaboration"
            />
            <FeatureCard
              icon={<EyeIcon className="w-7 h-7 text-orange-500" />}
              title="Live Execution & Preview"
              description="See your application come to life in real-time with an instant live preview and the ability to view the generated code on the fly."
              linkText="Real-time Development"
            />
          </div>
        </div>
      </section>

      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold text-black mb-6">
            Ready to Build Your Next Application?
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Join thousands of developers building faster with AI agents and live preview.
          </p>
          <button 
            onClick={onStartBuilding}
            className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-orange-400"
          >
            Start Building Now - It's Free
          </button>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-8 px-6 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} RajAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, linkText }: { icon: React.ReactNode, title: string, description: string, linkText: string }) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100 transform hover:-translate-y-2">
    <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
      {icon}
    </div>
    <h3 className="text-2xl font-bold text-black mb-4">{title}</h3>
    <p className="text-gray-600 mb-6 leading-relaxed">
      {description}
    </p>
    <a href="#" className="inline-flex items-center text-orange-500 font-semibold hover:text-orange-600 transition-colors">
      <span>{linkText}</span>
      <ChevronRightIcon className="w-5 h-5 ml-1" />
    </a>
  </div>
);

export default LandingPage;