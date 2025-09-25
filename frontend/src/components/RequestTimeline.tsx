import React from 'react';
import { TimelineEvent } from '../types/types';
import { formatDateTime } from '../utils/formatters';

interface RequestTimelineProps {
  timeline: TimelineEvent[];
}

const getIconForDecision = (decision: string, type: string, stage: string) => {
    if (type === 'system') {
        // Different system icons based on stage
        if (stage.includes('Submitted') || stage.includes('created')) {
            return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
        }
        if (stage.includes('Paid') || stage.includes('Completed')) {
            return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-500"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>;
        }
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-500"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>;
    }
    
    switch(decision) {
        case 'approved': 
            // Different icons for different approval stages
            if (stage.includes('Manager') || stage.includes('Validation')) {
                return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-purple-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m22 9-3 3L16 9"/></svg>;
            }
            if (stage.includes('Finance')) {
                return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-orange-500"><path d="M12 2v20m9-9H3"/><circle cx="12" cy="12" r="3"/></svg>;
            }
            if (stage.includes('CEO')) {
                return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-indigo-500"><path d="M6 3h12l4 6-10 13L2 9l4-6z"/><path d="M11 3 8 9l4 13 4-13-3-6"/></svg>;
            }
            return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-500"><path d="M20 6 9 17l-5-5"/></svg>;
            
        case 'rejected': 
            return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-red-500"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>;
            
        case 'validated': 
            return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-purple-500"><path d="M9 12l2 2 4-4"/><path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/><path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/></svg>;
            
        case 'released': 
            if (stage.includes('Payment')) {
                return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-600"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>;
            }
            return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-500"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg>;
            
        case 'submitted':
            return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-500"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="M20 8h-5"/><path d="M15 10V6.5a2.5 2.5 0 0 1 5 0V10"/><path d="M15 14h5l-5-4"/></svg>;
            
        case 'liquidated':
            return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-amber-500"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>;
            
        default: 
            return <div className="w-5 h-5 bg-gray-300 rounded-full" />;
    }
}

const getStageColor = (decision: string, type: string) => {
    if (type === 'system') return 'text-gray-600';
    
    switch(decision) {
        case 'approved': return 'text-green-700';
        case 'rejected': return 'text-red-700';
        case 'validated': return 'text-purple-700';
        case 'released': return 'text-blue-700';
        case 'submitted': return 'text-blue-700';
        case 'liquidated': return 'text-amber-700';
        default: return 'text-gray-700';
    }
}

const RequestTimeline: React.FC<RequestTimelineProps> = ({ timeline }) => {
  if (timeline.length === 0) {
    return <p className="text-sm text-muted-foreground">No actions have been taken yet.</p>;
  }

  return (
    <div className="space-y-6">
      {timeline.map((action, index) => (
        <div key={action.id || index} className="flex space-x-4">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-8 h-8 bg-white border-2 border-gray-200 rounded-full shadow-sm">
                {getIconForDecision(action.decision, action.type, action.stage)}
            </div>
            {index < timeline.length - 1 && (
                <div className="w-px h-12 bg-gradient-to-b from-gray-300 to-gray-200 mt-2"></div>
            )}
          </div>
          <div className={`pb-6 flex-1 ${action.type === 'system' ? 'opacity-90' : ''}`}>
            <div className="flex items-center justify-between">
                <p className={`font-semibold ${getStageColor(action.decision, action.type)}`}>
                    {action.stage}
                </p>
                <p className="text-xs text-muted-foreground">{formatDateTime(action.timestamp)}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              By {action.actor.name} 
              {action.actor.role && (
                <span className="inline-block px-1.5 py-0.5 ml-2 text-xs bg-gray-100 text-gray-600 rounded">
                  {action.actor.role}
                </span>
              )}
            </p>
            {action.comment && (
                <div className={`mt-3 text-sm p-3 rounded-lg border-l-4 ${
                    action.type === 'system' 
                        ? 'bg-blue-50 border-blue-200 text-blue-800' 
                        : action.decision === 'rejected'
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : action.decision === 'approved'
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}>
                    <p className="italic">"{action.comment}"</p>
                </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RequestTimeline;