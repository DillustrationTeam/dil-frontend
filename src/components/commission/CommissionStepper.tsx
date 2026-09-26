'use client';

import React from 'react';
import { Pencil, Clock, Folder, CheckCircle2, Check } from 'lucide-react';

export interface StepItem {
  id: number;
  label: string;
  icon: React.ElementType;
}

const STEPS: StepItem[] = [
  { id: 1, label: 'PROJECT DETAILS', icon: Pencil },
  { id: 2, label: 'TIMELINE', icon: Clock },
  { id: 3, label: 'ASSETS', icon: Folder },
  { id: 4, label: 'REVIEW', icon: CheckCircle2 },
];

const STEP_NODE_OFFSETS = ['top-0', 'top-[7px]', '-top-[7px]', 'top-[5px]'];

interface CommissionStepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
}

export default function CommissionStepper({
  currentStep,
  onStepClick,
  className = '',
}: CommissionStepperProps) {
  return (
    <div className={`w-full py-4 ${className}`}>
      <div className="relative flex items-center max-w-3xl mx-auto px-4">
        {/* Connecting Line */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute left-[calc(12.5%+12px)] top-0 z-0 h-10 w-[calc(75%-24px)] overflow-visible"
          viewBox="0 0 100 20"
          preserveAspectRatio="none"
        >
          <path
            d="M0 10 C11 7 22 15 33.33 13.5 C44.44 13.5 55.55 5 66.66 6.5 C77.77 8 88.88 13.5 100 12.5"
            fill="none"
            stroke="#A7ACD9"
            strokeOpacity="0.3"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M0 10 C11 7 22 15 33.33 13.5 C44.44 13.5 55.55 5 66.66 6.5 C77.77 8 88.88 13.5 100 12.5"
            fill="none"
            stroke="#A7ACD9"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            pathLength="100"
            strokeDasharray="10 10"
            strokeDashoffset="100"
            className="wave-path"
          />
        </svg>

        {/* Step Nodes */}
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <button
              type="button"
              aria-label={`Go to ${step.label}`}
              disabled={!onStepClick || !isCompleted}
              key={step.id}
              onClick={() => onStepClick && isCompleted && onStepClick(step.id)}
              className={`relative z-10 flex h-[88px] flex-1 flex-col items-center ${
                onStepClick && isCompleted ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {/* Step Icon Badge */}
              <div
                className={`absolute ${STEP_NODE_OFFSETS[step.id - 1]} w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 ${
                  isActive
                    ? 'step-node-active bg-[#A7ACD9] text-[#1F2335]'
                    : isCompleted
                    ? 'bg-[#A7ACD9]/15 text-[#A7ACD9]'
                    : 'bg-white/[0.04] text-slate-500'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>

              {/* Step Label */}
              <div className="absolute bottom-0 text-center">
                <span
                  className={`text-[11px] font-space-grotesk tracking-wider uppercase font-semibold transition-colors duration-200 block ${
                    isActive
                    ? 'text-[#A7ACD9]'
                    : isCompleted
                    ? 'text-[#A7ACD9]'
                      : 'text-slate-500'
                  }`}
                >
                  STEP {step.id}
                </span>
                <span
                  className={`text-xs font-sora font-medium transition-colors duration-200 block ${
                    isActive
                      ? 'text-white font-bold'
                      : isCompleted
                      ? 'text-slate-300'
                      : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <style jsx global>{`
        .wave-path {
          filter: drop-shadow(0 0 6px rgba(167, 172, 217, 0.65));
          animation: drawWave 3s linear infinite;
        }

        @keyframes drawWave {
          from { stroke-dashoffset: 100; }
          to { stroke-dashoffset: 0; }
        }

        .step-node-active {
          filter: drop-shadow(0 0 12px rgba(167, 172, 217, 0.8));
          animation: stepNodeFloat 1.8s ease-in-out infinite;
        }

        @keyframes stepNodeFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .wave-path, .step-node-active { animation: none; stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
