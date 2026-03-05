import { Module } from '@nestjs/common';
import { SearchMemoryTool } from './searchMemory.tool';
import { StoreMemoryTool } from './storeMemory.tool';
import { QueryKnowledgeTool } from './queryKnowledge.tool';

@Module({
  providers: [SearchMemoryTool, StoreMemoryTool, QueryKnowledgeTool],
  exports: [SearchMemoryTool, StoreMemoryTool, QueryKnowledgeTool],
})
export class ToolsModule {}
