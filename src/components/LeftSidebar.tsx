import React, { useState } from 'react';
import {  
  ChevronDown, 
  ChevronRight,
  Layout,
  Type,
  Square,
  History,
  Sparkles,
  Layers,
} from 'lucide-react';
import PageLayoutPanel from './panels/PageLayoutPanel';
import ElementsPanel from './panels/ElementsPanel';
import HistoryPanel from './panels/HistoryPanel';
import LayersPanel from './panels/LayersPanel';
import FontManagerPanel from './panels/FontManagerPanel';
import AIGenerationPanel from './AIGenerationPanel';

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  component: React.ComponentType;
}

const sections: Section[] = [
  {
    id: 'ai-generator',
    title: 'AI Design Generator',
    icon: <Sparkles className="h-4 w-4" />,
    component: AIGenerationPanel,
  },
  {
    id: 'layout',
    title: 'Page Layout',
    icon: <Layout className="h-4 w-4" />,
    component: PageLayoutPanel,
  },
  {
    id: 'elements',
    title: 'Elements',
    icon: <Square className="h-4 w-4" />,
    component: ElementsPanel,
  },
  {
    id: 'layers',
    title: 'Layers',
    icon: <Layers className="h-4 w-4" />,
    component: LayersPanel,
  },
  {
    id: 'fonts',
    title: 'Font Manager',
    icon: <Type className="h-4 w-4" />,
    component: FontManagerPanel,
  },
  {
    id: 'history',
    title: 'History',
    icon: <History className="h-4 w-4" />,
    component: HistoryPanel,
  },
];

const LeftSidebar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSection, setExpandedSection] = useState<string>('ai-generator');

  const toggleSection = (sectionId: string) => {
    if (expandedSection === sectionId) {
      setExpandedSection('');
    } else {
      setExpandedSection(sectionId);
    }
  };

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Search */}
      {/* <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div> */}

      {/* Sections */}
      <div className="flex-1 overflow-y-auto">
        {filteredSections.map((section) => {
          const isExpanded = expandedSection === section.id;
          const Component = section.component;

          return (
            <div key={section.id} className="border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className={`${
                    section.id === 'ai-generator' 
                      ? 'text-purple-600 dark:text-purple-400' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {section.icon}
                  </span>
                  <span className={`font-medium ${
                    section.id === 'ai-generator'
                      ? 'text-purple-900 dark:text-purple-100'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {section.title}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4">
                  <Component />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeftSidebar;
