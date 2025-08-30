import React, { useState, useCallback } from 'react';
import LandingPage from './components/LandingPage';
import ChatInterface from './components/ChatInterface';

export type View = 'landing' | 'chat';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('landing');

  const navigateToChat = useCallback(() => {
    setCurrentView('chat');
  }, []);

  const navigateToHome = useCallback(() => {
    setCurrentView('landing');
  }, []);
  
  return (
    <div className="bg-white font-sans">
      {currentView === 'landing' && <LandingPage onStartBuilding={navigateToChat} />}
      {currentView === 'chat' && <ChatInterface onNavigateHome={navigateToHome} />}
    </div>
  );
};

export default App;