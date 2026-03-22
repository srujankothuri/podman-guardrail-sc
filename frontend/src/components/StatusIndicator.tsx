import React from 'react';
import { CheckCircleIcon, CircleIcon, LoaderIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { JobStatusValue } from '../lib/api';
interface StatusIndicatorProps {
  currentStatus: JobStatusValue;
}
interface PipelineStep {
  key: JobStatusValue;
  label: string;
}
const STEPS: PipelineStep[] = [
{
  key: 'queued',
  label: 'Queued'
},
{
  key: 'checking_compliance',
  label: 'Checking compliance'
},
{
  key: 'retrieving_knowledge',
  label: 'Retrieving knowledge'
},
{
  key: 'generating',
  label: 'Generating answer'
},
{
  key: 'validating',
  label: 'Validating response'
}];

function getStepIndex(status: JobStatusValue): number {
  return STEPS.findIndex((s) => s.key === status);
}
export function StatusIndicator({ currentStatus }: StatusIndicatorProps) {
  const activeIndex = getStepIndex(currentStatus);
  return (
    <div
      className="flex flex-col gap-0 py-3 px-4"
      role="status"
      aria-label="Processing pipeline status">
      
      {STEPS.map((step, index) => {
        const isCompleted = activeIndex > index;
        const isActive = activeIndex === index;
        const isPending = activeIndex < index;
        return (
          <motion.div
            key={step.key}
            className="flex items-start gap-3"
            initial={{
              opacity: 0,
              x: -8
            }}
            animate={{
              opacity: 1,
              x: 0
            }}
            transition={{
              delay: index * 0.08,
              duration: 0.25
            }}>
            
            {/* Connector line + icon column */}
            <div className="flex flex-col items-center w-5 flex-shrink-0">
              {/* Icon */}
              <div className="flex items-center justify-center w-5 h-5">
                {isCompleted &&
                <CheckCircleIcon
                  className="w-[18px] h-[18px] text-ibm-green-60"
                  aria-hidden="true" />

                }
                {isActive &&
                <LoaderIcon
                  className="w-[18px] h-[18px] text-ibm-blue-60 animate-spin"
                  aria-hidden="true" />

                }
                {isPending &&
                <CircleIcon
                  className="w-[14px] h-[14px] text-ibm-gray-30"
                  aria-hidden="true" />

                }
              </div>
              {/* Connector line */}
              {index < STEPS.length - 1 &&
              <div
                className={`w-px h-4 ${isCompleted ? 'bg-ibm-green-60' : isActive ? 'bg-ibm-blue-60' : 'bg-ibm-gray-20'}`} />

              }
            </div>

            {/* Label */}
            <span
              className={`font-mono text-xs leading-5 ${isCompleted ? 'text-ibm-green-60' : isActive ? 'text-ibm-blue-60 font-medium' : 'text-ibm-gray-50'}`}>
              
              {step.label}
              {isActive && '...'}
              <span className="sr-only">
                {isCompleted ?
                '— complete' :
                isActive ?
                '— in progress' :
                '— pending'}
              </span>
            </span>
          </motion.div>);

      })}
    </div>);

}