import React, { useState, useEffect } from 'react';
import {
  Code2,
  Cpu,
  Database,
  Layers,
  Sparkles,
  Workflow,
  CheckCircle,
  ExternalLink,
  BookOpen,
  Binary,
  HelpCircle,
  ArrowRight,
  Maximize2,
  Terminal,
  BrainCircuit,
} from 'lucide-react';
import { NotebookCellExplanation } from '../types';

export const ArchitectureExplainer: React.FC = () => {
  const [walkthrough, setWalkthrough] = useState<NotebookCellExplanation[]>([]);
  const [activeCellIndex, setActiveCellIndex] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'notebook' | 'math'>('pipeline');
  const [architectureData, setArchitectureData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/notebook')
      .then((res) => res.json())
      .then((data) => {
        if (data.walkthrough) {
          setWalkthrough(data.walkthrough);
        }
        if (data.architectureOverview) {
          setArchitectureData(data.architectureOverview);
        }
      })
      .catch((err) => console.error('Failed to load notebook walkthrough:', err));
  }, []);

  const activeCell = walkthrough.find((c) => c.cellIndex === activeCellIndex) || walkthrough[0];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-mono">
            <Terminal className="w-3.5 h-3.5" />
            <span>NathanCordeiro / book-recommender-with-llm-and-vectorstore</span>
          </div>
          <h2 className="text-2xl font-bold text-white font-display">
            System Architecture & Technical Guide
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            A comprehensive breakdown of how vector stores, high-dimensional embeddings, and Large Language Models integrate to provide semantic recommendations.
          </p>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-neutral-800">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'pipeline'
                ? 'bg-amber-500 text-neutral-950 font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            End-to-End Pipeline
          </button>
          <button
            onClick={() => setActiveTab('notebook')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'notebook'
                ? 'bg-amber-500 text-neutral-950 font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            Notebook Code Walkthrough (main.ipynb)
          </button>
          <button
            onClick={() => setActiveTab('math')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'math'
                ? 'bg-amber-500 text-neutral-950 font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            Vector Math & Distance Metrics
          </button>
        </div>
      </div>

      {/* Tab 1: Pipeline Architecture */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          {/* Architecture Flow Diagram */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-base font-bold text-white font-display flex items-center space-x-2">
              <Workflow className="w-5 h-5 text-amber-400" />
              <span>Data & Inference Pipeline Flow</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="w-6 h-6 rounded bg-amber-500/10 text-amber-400 text-xs font-mono font-bold flex items-center justify-center">
                    01
                  </div>
                  <h4 className="text-xs font-bold text-neutral-200">Raw Corpus</h4>
                  <p className="text-[11px] text-neutral-400 leading-normal">
                    6,810 book records loaded from <code className="text-amber-300 font-mono">books.csv</code> with titles, ratings, synopses.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">Pandas DataFrame</span>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="w-6 h-6 rounded bg-amber-500/10 text-amber-400 text-xs font-mono font-bold flex items-center justify-center">
                    02
                  </div>
                  <h4 className="text-xs font-bold text-neutral-200">Text Synthesis</h4>
                  <p className="text-[11px] text-neutral-400 leading-normal">
                    Merges tabular fields into a structured <code className="text-amber-300 font-mono">textual_representation</code> document.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">main.ipynb Cell 3</span>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="w-6 h-6 rounded bg-amber-500/10 text-amber-400 text-xs font-mono font-bold flex items-center justify-center">
                    03
                  </div>
                  <h4 className="text-xs font-bold text-neutral-200">Embedding Model</h4>
                  <p className="text-[11px] text-neutral-400 leading-normal">
                    LLM / Transformer projects documents into a 4096-dimensional latent space.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">Llama 2 / Gemini</span>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="w-6 h-6 rounded bg-amber-500/10 text-amber-400 text-xs font-mono font-bold flex items-center justify-center">
                    04
                  </div>
                  <h4 className="text-xs font-bold text-neutral-200">Vector Store</h4>
                  <p className="text-[11px] text-neutral-400 leading-normal">
                    Stores dense floating-point matrices in FAISS IndexFlatL2 for sub-ms lookup.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">FAISS / Memory Store</span>
              </div>

              {/* Step 5 */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="w-6 h-6 rounded bg-amber-500/10 text-amber-400 text-xs font-mono font-bold flex items-center justify-center">
                    05
                  </div>
                  <h4 className="text-xs font-bold text-neutral-200">Distance Search</h4>
                  <p className="text-[11px] text-neutral-400 leading-normal">
                    Computes nearest neighbors via Cosine or Euclidean L2 distance for query vector.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">Top-K Nearest Neighbors</span>
              </div>

              {/* Step 6 */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="w-6 h-6 rounded bg-amber-500/10 text-amber-400 text-xs font-mono font-bold flex items-center justify-center">
                    06
                  </div>
                  <h4 className="text-xs font-bold text-neutral-200">LLM Explainer</h4>
                  <p className="text-[11px] text-neutral-400 leading-normal">
                    Gemini 3.8 Flash synthesizes personalized rationale comparing themes & motifs.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">Gemini 3.8 Flash</span>
              </div>
            </div>
          </div>

          {/* Original Repo vs Production Web Comparison */}
          {architectureData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
                <div className="flex items-center space-x-2 text-neutral-300">
                  <Code2 className="w-5 h-5 text-neutral-400" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Original Nathan Cordeiro Repo
                  </h4>
                </div>
                <div className="space-y-2.5 text-xs text-neutral-300">
                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-500 block">Runtime & Environment</span>
                    <span className="font-semibold text-neutral-200">Python 3 + Jupyter Notebook (`main.ipynb`)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-500 block">Vector Indexing</span>
                    <span className="font-semibold text-neutral-200">FAISS-CPU (`IndexFlatL2`) with local file persistence</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-500 block">Embedding Source</span>
                    <span className="font-semibold text-neutral-200">Local Ollama instance (`http://localhost:11434/api/embeddings`) running Llama 2</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-500 block">User Interface</span>
                    <span className="font-semibold text-neutral-200">Jupyter cell outputs and terminal print statements</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-neutral-900 border border-amber-500/30 rounded-2xl space-y-4 shadow-lg shadow-amber-500/5">
                <div className="flex items-center space-x-2 text-amber-400">
                  <Sparkles className="w-5 h-5" />
                  <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider font-mono">
                    Production Full-Stack Application
                  </h4>
                </div>
                <div className="space-y-2.5 text-xs text-neutral-300">
                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-500 block">Runtime & Stack</span>
                    <span className="font-semibold text-white">Node.js 22 + Express + React 19 + TypeScript + Vite</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-500 block">Vector Engine</span>
                    <span className="font-semibold text-white">Full-Corpus In-Memory Vector Store (Cosine & FAISS L2 Euclidean distance)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-500 block">LLM Reasoning</span>
                    <span className="font-semibold text-white">Google Gemini 3.8 Flash for real-time contextual reading rationales</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-500 block">Latency</span>
                    <span className="font-semibold text-amber-300">Sub-10 millisecond similarity search across all 6,810 books</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Notebook Code Walkthrough (main.ipynb) */}
      {activeTab === 'notebook' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cell Selector Sidebar */}
          <div className="lg:col-span-4 space-y-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 max-h-[700px] overflow-y-auto">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 px-2 block mb-2">
              Jupyter Notebook Cells (main.ipynb)
            </span>
            {walkthrough.map((cell) => (
              <button
                key={cell.cellIndex}
                onClick={() => setActiveCellIndex(cell.cellIndex)}
                className={`w-full text-left p-3 rounded-xl transition-all text-xs flex flex-col space-y-1 ${
                  activeCellIndex === cell.cellIndex
                    ? 'bg-amber-500 text-neutral-950 shadow-md font-semibold'
                    : 'text-neutral-300 hover:bg-neutral-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-[11px] ${activeCellIndex === cell.cellIndex ? 'text-neutral-900 font-bold' : 'text-amber-400'}`}>
                    Cell {cell.cellIndex}
                  </span>
                  {activeCellIndex === cell.cellIndex && (
                    <span className="text-[10px] bg-neutral-950/20 px-1.5 py-0.5 rounded font-bold">
                      Active
                    </span>
                  )}
                </div>
                <div className="font-medium truncate">{cell.title.split(': ')[1] || cell.title}</div>
              </button>
            ))}
          </div>

          {/* Cell Detail View */}
          <div className="lg:col-span-8 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6">
            {activeCell && (
              <>
                <div className="space-y-1 pb-4 border-b border-neutral-800">
                  <span className="text-xs font-mono text-amber-400">
                    Nathan Cordeiro’s main.ipynb &bull; Cell {activeCell.cellIndex}
                  </span>
                  <h3 className="text-xl font-bold text-white font-display">
                    {activeCell.title}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {activeCell.purpose}
                  </p>
                </div>

                {/* Code Block */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span className="font-mono flex items-center space-x-1.5">
                      <Code2 className="w-4 h-4 text-amber-400" />
                      <span>Python Source Code</span>
                    </span>
                    <span className="font-mono text-[10px] text-neutral-500">In [ {activeCell.cellIndex} ]</span>
                  </div>
                  <pre className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-mono text-amber-200/90 whitespace-pre-wrap leading-relaxed overflow-x-auto shadow-inner">
                    {activeCell.originalCode}
                  </pre>
                </div>

                {/* Deep Dive Explanation */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono flex items-center space-x-1.5">
                    <BrainCircuit className="w-4 h-4 text-amber-400" />
                    <span>How It Works Under the Hood</span>
                  </h4>
                  <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-950/60 p-4 rounded-xl border border-neutral-800/80">
                    {activeCell.deepDive}
                  </p>
                </div>

                {/* Key Takeaways */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
                    Key Architectural Takeaways
                  </h4>
                  <ul className="space-y-1.5">
                    {activeCell.keyTakeaways.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-xs text-neutral-300">
                        <CheckCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Vector Math & Distance Metrics */}
      {activeTab === 'math' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cosine Similarity Card */}
          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
            <div className="flex items-center space-x-2">
              <Binary className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white font-display">
                Cosine Similarity (Directional Angle)
              </h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Measures the cosine of the angle $\theta$ between two vectors in 4096-dimensional space. It evaluates thematic orientation regardless of document length:
            </p>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-amber-300 text-center shadow-inner">
              Similarity(u, v) = (u &bull; v) / ( ||u|| * ||v|| )
            </div>

            <div className="space-y-2 text-xs text-neutral-300">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-amber-400 font-bold">1.0:</span>
                <span>Exact identical semantic direction</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-amber-400 font-bold">0.0:</span>
                <span>Orthogonal (completely unrelated themes)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-amber-400 font-bold">-1.0:</span>
                <span>Diametrically opposed concepts</span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-500 pt-2 border-t border-neutral-800">
              Best suited for text queries because short search prompts have much smaller vector magnitudes than full-length book descriptions, but share the same directional angle!
            </p>
          </div>

          {/* Euclidean Distance Card (FAISS IndexFlatL2) */}
          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white font-display">
                FAISS IndexFlatL2 (Euclidean Distance)
              </h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Nathan Cordeiro’s project uses Meta’s FAISS with <code className="text-amber-300 font-mono">IndexFlatL2</code>, which measures the straight-line geometric distance:
            </p>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-amber-300 text-center shadow-inner">
              D(u, v) = &radic; [ &Sigma; (u_i - v_i)&sup2; ]
            </div>

            <div className="space-y-2 text-xs text-neutral-300">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-amber-400 font-bold">0.0:</span>
                <span>Zero distance (identical items)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-amber-400 font-bold">Small D:</span>
                <span>Extremely close semantic neighbors</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-amber-400 font-bold">Large D:</span>
                <span>Far apart in literary feature space</span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-500 pt-2 border-t border-neutral-800">
              When vectors are unit-normalized (length = 1.0), Euclidean distance and Cosine similarity are mathematically linked: <span className="font-mono text-amber-400">D&sup2; = 2 - 2 * CosineSimilarity</span>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
