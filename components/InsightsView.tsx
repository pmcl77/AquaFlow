
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, BrainCircuit, RefreshCw, Send, AlertCircle, Info, ThumbsUp, Activity } from 'lucide-react';
import { LogEntry, UserSettings, EntryType } from '../types';
import { format } from 'date-fns';

// Fix: parseISO might not be exported from some versions of date-fns
const parseISO = (s: string) => new Date(s);

interface InsightsViewProps {
  entries: LogEntry[];
  settings: UserSettings;
}

const InsightsView: React.FC<InsightsViewProps> = ({ entries, settings }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([]);

  const generateInsights = async (userPrompt?: string) => {
    if (entries.length < 3) {
      setInsight("I need at least 3 logs to start detecting patterns!");
      return;
    }

    setLoading(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Format data for AI
    const logsJson = JSON.stringify(entries.map(e => ({
      t: e.type,
      a: e.amount,
      ts: e.timestamp,
      n: e.notes
    })).slice(0, 100)); // Limit to last 100 entries for context window safety

    const systemInstruction = `You are AquaFlow AI, a health data analyst specializing in urological and hydration tracking.
    User Metadata: Age ${settings.age}, Sex ${settings.sex}.
    Data: ${logsJson}
    
    Tasks:
    1. Identify 'Latency': usual time between drinking and urinating. Does it change by time of day?
    2. Identify 'Trigger Volume': Total intake volume that typically precedes a void.
    3. Normality: Check if flows/net balances are within medical ranges for age/sex.
    4. Provide actionable recommendations.
    
    Format output with clear headings, bullet points, and use Markdown. Keep it encouraging but clinically informed.
    Current Date: ${format(new Date(), 'yyyy-MM-dd')}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: userPrompt 
          ? [
              ...chatHistory.map(c => ({ role: c.role === 'user' ? 'user' : 'model', parts: [{ text: c.text }] })),
              { role: 'user', parts: [{ text: userPrompt }] }
            ]
          : { parts: [{ text: "Analyze my hydration and voiding data and provide a summary report." }] },
        config: {
          systemInstruction: systemInstruction,
        }
      });

      const text = response.text || "I couldn't generate insights at this moment.";
      if (userPrompt) {
        setChatHistory(prev => [...prev, {role: 'user', text: userPrompt}, {role: 'model', text}]);
        setCustomPrompt('');
      } else {
        setInsight(text);
      }
    } catch (error) {
      console.error("Gemini Error:", error);
      setInsight("Oops! Something went wrong while talking to the AI. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-6 rounded-3xl text-white shadow-lg overflow-hidden relative">
        <Sparkles className="absolute -right-2 -top-2 opacity-20 rotate-12" size={80} />
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <BrainCircuit size={24} /> AI Health Insights
        </h2>
        <p className="text-sm opacity-90 leading-relaxed">
          Gemini analyzes your patterns to find hidden trends in your hydration and voiding habits.
        </p>
        <button
          onClick={() => generateInsights()}
          disabled={loading}
          className="mt-4 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
          {insight ? 'Refresh Analysis' : 'Generate Full Report'}
        </button>
      </div>

      {/* Main Insight Display */}
      {insight && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Analysis Results</span>
            <Activity size={16} className="text-purple-500" />
          </div>
          <div className="p-6 prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed">
            <div dangerouslySetInnerHTML={{ __html: formatMarkdown(insight) }} />
          </div>
          <div className="px-6 py-4 bg-purple-50 dark:bg-purple-900/10 flex gap-2 items-start">
            <Info size={16} className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-purple-700 dark:text-purple-300 italic font-medium leading-tight">
              AI Insights are for informational purposes only. Consult a healthcare professional for clinical diagnosis.
            </p>
          </div>
        </div>
      )}

      {/* Chat Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Ask a Question</h3>
        
        {chatHistory.length > 0 && (
          <div className="space-y-4 mb-4">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-4 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-tl-none text-slate-800 dark:text-slate-200 shadow-sm'
                }`}>
                   <div dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.text) }} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="relative group">
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g. 'How does my intake yesterday compare to my weekly average?'"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-4 pr-12 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all min-h-[100px] shadow-sm group-hover:shadow-md dark:text-white"
          />
          <button
            onClick={() => generateInsights(customPrompt)}
            disabled={loading || !customPrompt.trim()}
            className="absolute bottom-4 right-4 p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 active:scale-90 transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
          </button>
        </div>
      </div>

      {!insight && !loading && (
        <div className="py-12 flex flex-col items-center text-center text-slate-400 px-6">
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
             <AlertCircle size={32} />
          </div>
          <p className="text-sm">Click the generate button above to start your health analysis.</p>
        </div>
      )}

      {loading && !insight && (
        <div className="space-y-4 animate-pulse">
           <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl w-full"></div>
           <p className="text-center text-xs text-slate-400 italic">Gemini is looking for patterns in your records...</p>
        </div>
      )}
    </div>
  );
};

// Simple helper to format Markdown basics (Headings, Bullets, Bold)
function formatMarkdown(text: string) {
  return text
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2 text-slate-800 dark:text-slate-100">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-3 text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
    .replace(/^\* (.*$)/gim, '<li class="ml-4 mb-1 text-slate-600 dark:text-slate-300">$1</li>')
    .replace(/^\- (.*$)/gim, '<li class="ml-4 mb-1 text-slate-600 dark:text-slate-300">$1</li>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-slate-900 dark:text-slate-100">$1</strong>')
    .replace(/\n/g, '<br />');
}

export default InsightsView;
