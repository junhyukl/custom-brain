/**
 * Agent tools for OpenClaw / run-agent.
 * - Nest injectable tools: SearchMemoryTool, SearchPhotosTool, TimelineTool, FamilyTreeTool (from ./searchMemory.tool etc.)
 * - HTTP client tools: searchMemory, searchPhotos, searchDocuments, timeline, familyTree (for standalone agent)
 */

export {
  SearchMemoryTool,
  type SearchMemoryToolInput,
} from './searchMemory.tool';
export {
  SearchPhotosTool,
  type SearchPhotosToolInput,
} from './searchPhotos.tool';
export { TimelineTool, type TimelineToolInput } from './timeline.tool';
export { FamilyTreeTool } from './familyTree.tool';

import {
  searchMemory,
  searchPhotos,
  searchDocuments,
  timeline,
  familyTree,
} from './client-tools';

export {
  searchMemory,
  searchPhotos,
  searchDocuments,
  timeline,
  familyTree,
  type MemoryHit,
  type TimelineEntry,
  type FamilyTreeEntry,
} from './client-tools';

export const agentTools = {
  searchMemory,
  searchPhotos,
  searchDocuments,
  timeline,
  familyTree,
};
