import React from 'react';
import { TimelineEvent } from '../types/types';
import { formatDateTime } from '../utils/formatters';

interface RequestTimelineProps {
  timeline: TimelineEvent[];
}

const getIconForDecision = (decision: string, type: string) => {
    if (type === 'system') {
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-500"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
    }
    
    switch(decision) {
        case 'approved': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-500"><path d="M20 6 9 17l-5-5"/></svg>;
        case 'rejected': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-red-500"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
        case 'validated': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-purple-500"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
        case 'released': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-500"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg>;
        default: return <div className="w-5 h-5 bg-gray-300 rounded-full" />;
    }
}

const RequestTimeline: React.FC<RequestTimelineProps> = ({ timeline }) => {
  if (timeline.length === 0) {
    return <p className="text-sm text-muted-foreground">No actions have been taken yet.</p>;
  }

  return (
    <div className="space-y-6">
      {timeline.map((action, index) => (
        <div key={index} className="flex space-x-4">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-8 h-8 bg-secondary rounded-full">
                {getIconForDecision(action.decision, action.type)}
            </div>
            {index < timeline.length - 1 && <div className="w-px h-full bg-border"></div>}
          </div>
          <div className={`pb-6 ${action.type === 'system' ? 'opacity-80' : ''}`}>
            <p className="font-semibold text-primary">{action.stage}</p>
            <p className="text-sm text-muted-foreground">
              By {action.actor.name} ({action.actor.role})
            </p>
            <p className="text-xs text-muted-foreground">{formatDateTime(action.timestamp)}</p>
            {action.comment && (
                <p className={`mt-2 text-sm italic p-2 rounded-md ${action.type === 'system' ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                    "{action.comment}"
                </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RequestTimeline;