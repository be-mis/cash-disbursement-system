// Fix: Added full content for constants.ts

import React from 'react';
import { Role, RequestStatus } from './types';

export const ALL_ROLES: Role[] = ['Employee', 'Manager', 'Finance', 'CEO'];

export const STATUS_COLORS: Record<RequestStatus, string> = {
    PENDING_VALIDATION: 'bg-yellow-100 text-yellow-800',
    PENDING_APPROVAL: 'bg-blue-100 text-blue-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    PROCESSING_PAYMENT: 'bg-purple-100 text-purple-800',
    PAID: 'bg-gray-100 text-gray-800',
};

// Fix: Converted JSX to React.createElement calls to be compatible with a .ts file.
export const ICONS = {
    dashboard: React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        React.createElement("path", { d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }),
        React.createElement("polyline", { points: "9 22 9 12 15 12 15 22" })
    ),
    requests: React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        React.createElement("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
        React.createElement("polyline", { points: "14 2 14 8 20 8" }),
        React.createElement("line", { x1: "16", y1: "13", x2: "8", y2: "13" }),
        React.createElement("line", { x1: "16", y1: "17", x2: "8", y2: "17" }),
        React.createElement("polyline", { points: "10 9 9 9 8 9" })
    ),
    inbox: React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        React.createElement("path", { d: "M22 12h-6l-2 3h-4l-2-3H2" }),
        React.createElement("path", { d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" })
    ),
};
