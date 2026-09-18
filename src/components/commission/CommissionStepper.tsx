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
      <div className="relative flex items-center justify-between max-w-3xl mx-auto px-4">
        {/* Connecting Line */}
        <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-[2px] bg-white/10 -z-0">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-500"
            style={{
              width: `${((Math.min(currentStep, STEPS.length) - 1) / (STEPS.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Step Nodes */}
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const isPending = currentStep < step.id;

          return (
            <div
              key={step.id}
              onClick={() => onStepClick && isCompleted && onStepClick(step.id)}
              className={`relative z-10 flex flex-col items-center group ${
                onStepClick && isCompleted ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {/* Step Icon Badge */}
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white ring-4 ring-indigo-500/30 shadow-[0_0_25px_rgba(99,102,241,0.6)] scale-110'
                    : isCompleted
                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-[#1a1d2e] border border-white/10 text-slate-500'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                )}
              </div>

              {/* Step Label */}
              <div className="mt-2.5 text-center">
                <span
                  className={`text-[11px] font-space-grotesk tracking-wider uppercase font-semibold transition-colors duration-200 block ${
                    isActive
                      ? 'text-indigo-300 drop-shadow-[0_0_10px_rgba(197,201,248,0.5)]'
                      : isCompleted
                      ? 'text-emerald-400/90'
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
