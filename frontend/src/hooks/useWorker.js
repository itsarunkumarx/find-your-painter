import { useContext } from 'react';
import { WorkerContext } from '../context/WorkerContextDefinition';

export const useWorker = () => {
  const context = useContext(WorkerContext);
  if (!context) {
    if (import.meta.env.DEV) {
      console.warn('useWorker: WorkerContext is not available. Make sure component is wrapped in WorkerProvider.');
    }
    return {};
  }
  return context;
};
