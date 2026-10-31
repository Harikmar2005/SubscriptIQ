import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Play,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Award,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const DemoWorkflowBar: React.FC = () => {
  const {
    runHackathonDemoStep,
    isDemoRunning,
    runRevenueGuardAcceptanceStep,
    isRevenueGuardDemoRunning,
  } = useApp();

  const [workflowMode, setWorkflowMode] = useState<'revenueguard' | 'saas'>('revenueguard');
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  // Section 17: Complete 16-Step RevenueGuard Acceptance Workflow
  const revenueGuardSteps = [
    { num: 1, title: '1. Create Product', desc: 'Create product in catalog' },
    { num: 2, title: '2. Add Variant', desc: 'Configure variant & price adjustment' },
    { num: 3, title: '3. Create Plan', desc: 'Create annual subscription plan' },
    { num: 4, title: '4. Discount Rule', desc: 'Configure 25% discount voucher' },
    { num: 5, title: '5. Create Quote', desc: 'Sales rep issues commercial quotation' },
    { num: 6, title: '6. Confirm Quote', desc: 'Customer confirms & signs quotation' },
    { num: 7, title: '7. Sub Active', desc: 'Subscription transitions to ACTIVE' },
    { num: 8, title: '8. Batch Due', desc: 'Billing run identifies renewals due' },
    { num: 9, title: '9. Validate All', desc: 'RevenueGuard validates pricing & tax' },
    { num: 10, title: '10. Catch Error', desc: 'Identifies & blocks billing exception' },
    { num: 11, title: '11. Resolve Error', desc: 'Admin resolves/overrides exception' },
    { num: 12, title: '12. Issue Invoice', desc: 'System generates valid 18% GST invoice' },
    { num: 13, title: '13. Record Payment', desc: 'Customer settles charge via Razorpay' },
    { num: 14, title: '14. Reconcile', desc: 'Reconcile payment to balanced invoice' },
    { num: 15, title: '15. Health Updates', desc: 'Finance dashboard health score refreshed' },
    { num: 16, title: '16. Evidence Ledger', desc: 'Displays full cryptographic audit trail' },
  ];

  const saasSteps = [
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

  const handleRgStepClick = async (stepNum: number) => {
    setActiveStep(stepNum);
    await runRevenueGuardAcceptanceStep(stepNum);
  };

  const handleSaasStepClick = async (stepNum: number) => {
    setActiveStep(stepNum);
    await runHackathonDemoStep(stepNum);
  };

  const runAllRgSteps = async () => {
    for (let s = 1; s <= 16; s++) {
      setActiveStep(s);
      await runRevenueGuardAcceptanceStep(s);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    setActiveStep(null);
  };

  const isRunning = isDemoRunning || isRevenueGuardDemoRunning;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white text-xs border-b border-indigo-900/40 select-none">
      <div className="px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg border border-white/10">
            <button
              onClick={() => setWorkflowMode('revenueguard')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                workflowMode === 'revenueguard'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              16-Step RevenueGuard Acceptance Flow
            </button>
            <button
              onClick={() => setWorkflowMode('saas')}
              className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                workflowMode === 'saas'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              SaaS Flow
            </button>
          </div>

          <span className="text-slate-300 hidden xl:inline text-[11px]">
            {workflowMode === 'revenueguard'
              ? 'Complete Section 17 Financial Assurance Lifecycle:'
              : 'End-to-End Recurring Billing Workflow:'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick buttons */}
          {workflowMode === 'revenueguard' ? (
            <div className="hidden lg:flex items-center gap-1">
              {revenueGuardSteps.slice(0, 6).map((s) => (
                <button
                  key={s.num}
                  onClick={() => handleRgStepClick(s.num)}
                  disabled={isRunning}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                    activeStep === s.num
                      ? 'bg-indigo-500 text-white ring-1 ring-white/40 font-bold'
                      : 'bg-white/10 hover:bg-white/20 text-slate-200'
                  }`}
                  title={s.desc}
                >
                  Step {s.num}
                </button>
              ))}
            </div>
          ) : (
            <div className="hidden xl:flex items-center gap-1.5">
              {saasSteps.slice(0, 6).map((s) => (
                <button
                  key={s.num}
                  onClick={() => handleSaasStepClick(s.num)}
                  disabled={isRunning}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                    activeStep === s.num
                      ? 'bg-indigo-500 text-white ring-1 ring-white/40'
                      : 'bg-white/10 hover:bg-white/20 text-slate-200'
                  }`}
                  title={s.desc}
                >
                  Step {s.num}
                </button>
              ))}
            </div>
          )}

          {/* Auto-Play Button */}
          {workflowMode === 'revenueguard' ? (
            <button
              onClick={runAllRgSteps}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50 text-[11px]"
            >
              <Play className={`w-3 h-3 fill-current ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Executing Steps...' : 'Play 16-Step Acceptance Flow'}
            </button>
          ) : (
            <button
              onClick={async () => {
                for (const s of [1, 2, 3, 4, 5, 7, 9, 10, 12, 14, 15]) {
                  setActiveStep(s);
                  await runHackathonDemoStep(s);
                  await new Promise((r) => setTimeout(r, 850));
                }
                setActiveStep(null);
              }}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50 text-[11px]"
            >
              <Play className={`w-3 h-3 fill-current ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Executing Steps...' : 'Play SaaS Flow'}
            </button>
          )}

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

      {/* Expanded Accordion with All 16 Steps */}
      {isExpanded && (
        <div className="px-6 py-4 bg-slate-950/90 border-t border-indigo-900/40">
          <div className="flex items-center justify-between mb-3 text-slate-400 text-xs">
            <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
              {workflowMode === 'revenueguard'
                ? 'Section 17: Official 16-Step End-to-End Acceptance Test Matrix'
                : '15-Step SaaS Workflow'}
            </span>
            <span>Click any step to execute live with state persistence</span>
          </div>

          {workflowMode === 'revenueguard' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
              {revenueGuardSteps.map((s) => (
                <button
                  key={s.num}
                  onClick={() => handleRgStepClick(s.num)}
                  disabled={isRunning}
                  className={`p-2.5 rounded-xl text-left border transition-all text-xs ${
                    activeStep === s.num
                      ? 'border-indigo-400 bg-indigo-900/60 ring-1 ring-indigo-400'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="font-bold text-indigo-300 text-[11px] truncate">{s.title}</div>
                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                    {s.desc}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {saasSteps.map((s) => (
                <button
                  key={s.num}
                  onClick={() => handleSaasStepClick(s.num)}
                  disabled={isRunning}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    activeStep === s.num
                      ? 'border-indigo-400 bg-indigo-900/60 ring-1 ring-indigo-400'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="font-bold text-slate-200 text-xs">{s.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
