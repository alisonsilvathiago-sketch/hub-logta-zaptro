import React from 'react';
import { Check } from 'lucide-react';

export type WizardStepDef = {
  id: string;
  label: string;
  optional?: boolean;
};

type Props = {
  steps: WizardStepDef[];
  currentIndex: number;
  completedThrough: number;
  onStepClick?: (index: number) => void;
};

const ProductWizardStepper: React.FC<Props> = ({ steps, currentIndex, completedThrough, onStepClick }) => (
  <nav className="ls-product-wizard__steps" aria-label="Etapas do cadastro">
    <p className="ls-product-wizard__steps-title">Etapas do cadastro</p>
    <p className="ls-product-wizard__steps-hint">SKU, EAN e estoque mínimo liberam scanner e alertas</p>
    <ol className="ls-product-wizard__steps-list">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isDone = index < currentIndex || index <= completedThrough;
        const canClick = onStepClick && (isDone || index <= completedThrough + 1);

        return (
          <li key={step.id}>
            <button
              type="button"
              className={`ls-product-wizard__step${isActive ? ' ls-product-wizard__step--active' : ''}${isDone && !isActive ? ' ls-product-wizard__step--done' : ''}`}
              disabled={!canClick}
              onClick={() => canClick && onStepClick?.(index)}
            >
              <span className="ls-product-wizard__pip" aria-hidden>
                {isDone && !isActive ? <Check size={14} strokeWidth={2.5} /> : index + 1}
              </span>
              <span className="ls-product-wizard__step-label">
                {step.label}
                {step.optional ? <em> (opcional)</em> : null}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  </nav>
);

export default ProductWizardStepper;
