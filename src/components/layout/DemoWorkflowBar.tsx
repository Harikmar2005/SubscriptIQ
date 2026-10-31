import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Play, CheckCircle, ChevronDown, ChevronUp, Sparkles, Award } from 'lucide-react';

export const DemoWorkflowBar: React.FC = () => {
  const { runHackathonDemoStep, isDemoRunning } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const steps = [
    { num: 1, title: 'Admin Login', desc: 'Auth with Super Admin role' },
    { num: 2, title: 'Dashboard', desc: 'Review real-time ARR/MRR' },
    { num: 3, title: 'New Customer', desc: 'Create business customer' },
    { num: 4, title: 'Select Plan', desc: 'Inspect tiers (₹299/₹799/₹1999)' },
    { num: 5, title: 'Assign Subscription', desc: 'Attach Pro plan to customer' },
    { num: 7, title: 'Simulate Payment', desc: 'Razorpay test checkout' },
    { num: 9, title: 'Generate Invoice', desc: '18% GST tax invoice' },
    { num: 10, title: 'MRR Updates', desc: 'Financial metrics refresh' },
    { num: 12, title: 'Trigger Renewal', desc: 'Batch scheduled dunning run' },
    { num: 14, title: 'Audit History', desc: 'Verify lifecycle timeline' },
    { num: 15, title: 'AI Churn Engine', desc: 'Detect high-risk accounts' },
  ];

  const handleStepClick = async (stepNum: number) => {
    setActiveStep(stepNum);
    await runHackathonDemoStep(stepNum);
  };

  const runAllSteps = async () => {
    for (const s of [1, 2, 3, 4, 5, 7, 9, 10, 12, 14, 15]) {
      setActiveStep(s);
      await runHackathonDemoStep(s);
      await new Promise((resolve) => setTimeout(resolve, 850));
    }
    setActiveStep(null);
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white text-xs border-b border-indigo-900/40">
      <div className="px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-semibold text-[11px]">
            <Award className="w-3.5 h-3.5 text-indigo-400" />
            Hackathon Live Evaluation Mode
          </div>
          <span className="text-slate-300 hidden md:inline text-[11px]">
            15-Step End-to-End Enterprise SaaS Workflow:
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Step Buttons */}
          <div className="hidden xl:flex items-center gap-1.5">
            {steps.slice(0, 7).map((s) => (
              <button
                key={s.num}
                onClick={() => handleStepClick(s.num)}
                disabled={isDemoRunning}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                  activeStep === s.num
                    ? 'bg-indigo-500 text-white ring-1 ring-white/40'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200'
                }`}
                title={s.desc}
              >
                Step {s.num}: {s.title}
              </button>
            ))}
          </div>

          {/* Run All Button */}
          <button
            onClick={runAllSteps}
            disabled={isDemoRunning}
            className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50 text-[11px]"
          >
            <Play className={`w-3 h-3 fill-current ${isDemoRunning ? 'animate-spin' : ''}`} />
            {isDemoRunning ? 'Executing Steps...' : 'Play 15-Step Flow'}
          </button>

          {/* Expand Details Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Toggle step guide"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Accordion with full 15 step mapping */}
      {isExpanded && (
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-indigo-900/30 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 animate-in slide-in-from-top-1 duration-200">
          {steps.map((s) => (
            <button
              key={s.num}
              onClick={() => handleStepClick(s.num)}
              disabled={isDemoRunning}
              className={`p-2.5 rounded-xl text-left border transition-all ${
                activeStep === s.num
                  ? 'border-indigo-400 bg-indigo-900/40 text-white shadow-sm'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-indigo-300 mb-0.5">
                <span>Step {s.num}</span>
                <CheckCircle className="w-3 h-3 opacity-60" />
              </div>
              <div className="text-xs font-semibold text-white">{s.title}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-snug line-clamp-1">
                {s.desc}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
