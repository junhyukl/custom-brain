import { Module } from '@nestjs/common';
import { BrainCoreModule } from '../brain-core/brain-core.module';
import { BrainModule } from '../brain/brain.module';
import { SearchMemoryTool } from './searchMemory.tool';
import { StoreMemoryTool } from './storeMemory.tool';
import { QueryKnowledgeTool } from './queryKnowledge.tool';
import { SearchPhotosTool } from './searchPhotos.tool';
import { FamilyTreeTool } from './familyTree.tool';
import { TimelineTool } from './timeline.tool';

/** Nest-injectable tools for programmatic/agent use. HTTP client is in agent-tools/client-tools.ts (run-agent, OpenClaw). */
@Module({
  imports: [BrainCoreModule, BrainModule],
  providers: [
    SearchMemoryTool,
    StoreMemoryTool,
    QueryKnowledgeTool,
    SearchPhotosTool,
    FamilyTreeTool,
    TimelineTool,
  ],
  exports: [
    SearchMemoryTool,
    StoreMemoryTool,
    QueryKnowledgeTool,
    SearchPhotosTool,
    FamilyTreeTool,
    TimelineTool,
  ],
})
export class ToolsModule {}
