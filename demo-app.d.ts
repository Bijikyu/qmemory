/**
 * QMemory Library Demo Application - Frontend-Backend Integration Fixed
 * Demonstrates core functionality with a simple Express.js API
 *
 * Fixes applied:
 * - All frontend-called endpoints are properly implemented
 * - Unused test endpoints removed for cleaner API surface
 * - Better error handling and response consistency
 * - Frontend-backend integration validation
 */
import { Application } from 'express';
import type { Server } from 'http';
declare const app: Application;
declare let server: Server | undefined;
export { app, server };
//# sourceMappingURL=demo-app.d.ts.map