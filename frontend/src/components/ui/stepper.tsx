'use client';

import React, { useState, Children, useRef, useLayoutEffect, useEffect, type HTMLAttributes, type ReactNode } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { cn } from '@/lib/utils';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  initialStep?: number;
  step?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  stepCircleContainerClassName?: string;
  stepContainerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  backButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  nextButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  backButtonText?: string;
  nextButtonText?: string;
  disableStepIndicators?: boolean;
  accentColor?: string;
  completionContent?: ReactNode;
  renderStepIndicator?: (props: {
    step: number;
    currentStep: number;
    onStepClick: (clicked: number) => void;
  }) => ReactNode;
}

export default function Stepper({
  children,
  initialStep = 1,
  step,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  stepCircleContainerClassName = '',
  stepContainerClassName = '',
  contentClassName = '',
  footerClassName = '',
  backButtonProps = {},
  nextButtonProps = {},
  backButtonText = 'Back',
  nextButtonText = 'Continue',
  disableStepIndicators = false,
  accentColor = '#cc785c',
  completionContent,
  renderStepIndicator,
  ...rest
}: StepperProps) {
  const [internalStep, setInternalStep] = useState<number>(initialStep);
  const currentStep = step !== undefined ? step : internalStep;
  const prevStepRef = useRef<number>(currentStep);
  const [direction, setDirection] = useState<number>(0);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  useEffect(() => {
    if (step !== undefined && step !== prevStepRef.current) {
      setDirection(step > prevStepRef.current ? 1 : -1);
      prevStepRef.current = step;
    }
  }, [step]);

  const updateStep = (newStep: number) => {
    setInternalStep(newStep);
    prevStepRef.current = newStep;
    if (newStep > totalSteps) {
      onFinalStepCompleted();
    } else {
      onStepChange(newStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    setDirection(1);
    updateStep(totalSteps + 1);
  };

  return (
    <div
      className={cn('w-full', rest.className)}
      {...rest}
    >
      <div
        className={cn(
          'w-full rounded-2xl shadow-xl bg-aura-secondary border border-[#e6dfd8] transition-all overflow-hidden',
          stepCircleContainerClassName
        )}
      >
        <div className={cn('flex w-full items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-[#e6dfd8]', stepContainerClassName)}>
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1;
            const isNotLastStep = index < totalSteps - 1;
            return (
              <React.Fragment key={stepNumber}>
                {renderStepIndicator ? (
                  renderStepIndicator({
                    step: stepNumber,
                    currentStep,
                    onStepClick: clicked => {
                      setDirection(clicked > currentStep ? 1 : -1);
                      updateStep(clicked);
                    }
                  })
                ) : (
                  <StepIndicator
                    step={stepNumber}
                    disableStepIndicators={disableStepIndicators}
                    currentStep={currentStep}
                    accentColor={accentColor}
                    onClickStep={clicked => {
                      setDirection(clicked > currentStep ? 1 : -1);
                      updateStep(clicked);
                    }}
                  />
                )}
                {isNotLastStep && <StepConnector isComplete={currentStep > stepNumber} accentColor={accentColor} />}
              </React.Fragment>
            );
          })}
        </div>

        <StepContentWrapper
          isCompleted={isCompleted}
          currentStep={currentStep}
          direction={direction}
          className={cn('space-y-4 px-4 sm:px-6 py-5', contentClassName)}
        >
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {isCompleted && (
          <div className="p-8 text-center space-y-5">
            {completionContent || (
              <div className="flex flex-col items-center justify-center space-y-4 py-6">
                <div className="w-14 h-14 rounded-full bg-[#5db8a6]/20 border border-[#5db8a6]/30 text-[#5db8a6] flex items-center justify-center">
                  <CheckIcon className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-serif font-medium text-[#141413]">Pipeline Walkthrough Complete</h3>
                  <p className="text-sm text-[#6c6a64] max-w-md mx-auto">
                    You've seen how AuraScreening screens and ranks candidates autonomously with complete transparency.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDirection(-1);
                      updateStep(1);
                    }}
                    className="px-4 py-2 rounded-md border border-[#e6dfd8] bg-[#efe9de] text-xs font-mono text-[#3d3d3a] hover:text-[#141413] hover:bg-[#e8e0d2] transition-colors cursor-pointer"
                  >
                    ↺ Replay Walkthrough
                  </button>
                  <a
                    href="/screening"
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-[#cc785c] text-xs font-semibold text-white hover:bg-[#a9583e] transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Launch Screening Portal</span>
                    <span aria-hidden="true">&rarr;</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {!isCompleted && (
          <div className={cn('px-5 sm:px-6 py-3.5 sm:py-4 border-t border-[#e6dfd8]', footerClassName)}>
            <div className={`flex items-center ${currentStep !== 1 ? 'justify-between' : 'justify-end'}`}>
              {currentStep !== 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className={cn(
                    'rounded-md px-3.5 py-2 text-xs font-mono text-[#6c6a64] hover:text-[#141413] hover:bg-[#efe9de] transition cursor-pointer',
                    currentStep === 1 && 'pointer-events-none opacity-40',
                    backButtonProps?.className
                  )}
                  {...backButtonProps}
                >
                  {backButtonText}
                </button>
              )}
              <button
                type="button"
                onClick={isLastStep ? handleComplete : handleNext}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-md bg-[#cc785c] hover:bg-[#a9583e] active:scale-95 py-2 px-5 text-xs font-mono font-medium tracking-tight text-white transition shadow-sm cursor-pointer',
                  nextButtonProps?.className
                )}
                {...nextButtonProps}
              >
                <span>{isLastStep ? 'Complete Walkthrough' : nextButtonText}</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StepContentWrapperProps {
  isCompleted: boolean;
  currentStep: number;
  direction: number;
  children: ReactNode;
  className?: string;
}

function StepContentWrapper({
  isCompleted,
  currentStep,
  direction,
  children,
  className = ''
}: StepContentWrapperProps) {
  const [parentHeight, setParentHeight] = useState<number | 'auto'>('auto');

  return (
    <motion.div
      style={{ position: 'relative', overflow: parentHeight === 'auto' ? 'visible' : 'hidden' }}
      animate={{ height: isCompleted ? 0 : parentHeight }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      onAnimationComplete={() => {
        if (!isCompleted) setParentHeight('auto');
      }}
    >
      <AnimatePresence initial={false} mode="wait" custom={direction}>
        {!isCompleted && (
          <SlideTransition
            key={currentStep}
            direction={direction}
            className={className}
            onHeightReady={h => setParentHeight(h)}
          >
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface SlideTransitionProps {
  children: ReactNode;
  direction: number;
  className?: string;
  onHeightReady: (height: number) => void;
}

function SlideTransition({ children, direction, className = '', onHeightReady }: SlideTransitionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      if (containerRef.current) {
        onHeightReady(Math.max(containerRef.current.offsetHeight, containerRef.current.scrollHeight));
      }
    };
    measure();

    const observer = new ResizeObserver(() => {
      measure();
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [children, onHeightReady]);

  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className={cn('w-full', className)}
    >
      {children}
    </motion.div>
  );
}

const stepVariants: Variants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? 30 : -30,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? -30 : 30,
    opacity: 0
  })
};

export interface StepProps {
  children: ReactNode;
  className?: string;
}

export function Step({ children, className = '' }: StepProps) {
  return <div className={cn('w-full', className)}>{children}</div>;
}

export { Stepper };

interface StepIndicatorProps {
  step: number;
  currentStep: number;
  onClickStep: (clicked: number) => void;
  disableStepIndicators?: boolean;
  accentColor?: string;
}

function StepIndicator({
  step,
  currentStep,
  onClickStep,
  disableStepIndicators = false,
  accentColor = '#cc785c'
}: StepIndicatorProps) {
  const status = currentStep === step ? 'active' : currentStep < step ? 'inactive' : 'complete';

  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) {
      onClickStep(step);
    }
  };

  return (
    <motion.div
      onClick={handleClick}
      className={cn(
        'relative outline-none focus:outline-none select-none',
        disableStepIndicators ? 'pointer-events-none opacity-50' : 'cursor-pointer group'
      )}
      animate={status}
      initial={false}
    >
      <motion.div
        variants={{
          inactive: { scale: 1, backgroundColor: '#efe9de', color: '#6c6a64' },
          active: { scale: 1.05, backgroundColor: accentColor, color: '#ffffff' },
          complete: { scale: 1, backgroundColor: '#5db8a6', color: '#ffffff' }
        }}
        transition={{ duration: 0.25 }}
        className="flex h-9 w-9 items-center justify-center rounded-full font-mono text-xs font-semibold border border-[#e6dfd8] shadow-xs"
      >
        {status === 'complete' ? (
          <CheckIcon className="h-4 w-4 text-white stroke-[2.5]" />
        ) : (
          <span>{step}</span>
        )}
      </motion.div>
    </motion.div>
  );
}

interface StepConnectorProps {
  isComplete: boolean;
  accentColor?: string;
}

function StepConnector({ isComplete }: StepConnectorProps) {
  const lineVariants: Variants = {
    incomplete: { width: 0, backgroundColor: 'transparent' },
    complete: { width: '100%', backgroundColor: '#5db8a6' }
  };

  return (
    <div className="relative mx-3 h-0.5 flex-1 overflow-hidden rounded bg-[#e6dfd8]">
      <motion.div
        className="absolute left-0 top-0 h-full"
        variants={lineVariants}
        initial={false}
        animate={isComplete ? 'complete' : 'incomplete'}
        transition={{ duration: 0.35 }}
      />
    </div>
  );
}

interface CheckIconProps extends React.SVGProps<SVGSVGElement> {}

function CheckIcon(props: CheckIconProps) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          delay: 0.05,
          type: 'tween',
          ease: 'easeOut',
          duration: 0.25
        }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
