import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { toErrorMessage } from '../common/error.util';
import { MemoryService } from '../brain-core/memory.service';
import { EmbeddingService } from '../brain-core/embedding.service';
import { TimelineService } from '../brain-core/timeline.service';
import { AiServiceClient } from '../ai-service/ai-service.client';
import { KnowledgeGraphService } from '../neo4j/knowledge-graph.service';
import { DEFAULT_RECALL_LIMIT } from '../common/constants';

/**
 * v3 Self-Learning: AI가 메모리를 클러스터링·타임라인·지식 그래프·요약으로 정리.
 */
@Injectable()
export class BrainOrganizeService {
  constructor(
    private readonly memory: MemoryService,
    private readonly embedding: EmbeddingService,
    private readonly timeline: TimelineService,
    private readonly aiService: AiServiceClient,
    private readonly knowledgeGraph: KnowledgeGraphService,
  ) {}

  /** 메모리 벡터 KMeans 클러스터링 후 clusterId 메타데이터 저장. */
  async clusterMemories(limit = 500): Promise<{ clustered: number }> {
    const list = await this.memory.recall(limit);
    if (list.length < 2) return { clustered: 0 };

    if (!this.aiService.isAvailable()) {
      return { clustered: 0 };
    }

    const contents = list.map((m) => m.content?.slice(0, 1000) || '');
    const vectors = await this.embedding.embedMany(contents);
    const validIndices: number[] = [];
    const validVectors: number[][] = [];
    vectors.forEach((v, i) => {
      if (v?.length > 0) {
        validIndices.push(i);
        validVectors.push(v);
      }
    });
    if (validVectors.length === 0) return { clustered: 0 };

    const labels = await this.aiService.cluster(validVectors);
    let clustered = 0;
    for (let j = 0; j < validIndices.length && j < labels.length; j++) {
      const id = list[validIndices[j]].id;
      const updated = await this.memory.updateMetadata(id, { clusterId: labels[j] });
      if (updated) clustered++;
    }
    return { clustered };
  }

  /** AI로 메모리 목록에서 시간순 타임라인 텍스트 생성 후 이벤트로 저장. */
  async generateTimeline(limit = 200): Promise<{ saved: boolean }> {
    const list = await this.memory.recall(limit);
    const texts = list.map((m) => m.content?.slice(0, 300) || '').filter(Boolean);
    if (!texts.length) return { saved: false };

    if (this.aiService.isAvailable()) {
      const timelineText = await this.aiService.timeline(texts);
      if (timelineText) {
        await this.timeline.addEvent(`[AI Timeline]\n${timelineText}`, 'personal');
        return { saved: true };
      }
    }
    return { saved: false };
  }

  /** 메모리 메타데이터의 people로 Neo4j 지식 그래프 링크 (Person 쌍). */
  async updateKnowledgeGraph(limit = 300): Promise<{ linked: number }> {
    const list = await this.memory.recall(limit);
    let linked = 0;
    for (const m of list) {
      const people = m.metadata?.people;
      if (!people?.length) continue;
      await this.knowledgeGraph.linkEntities(people);
      linked += Math.max(0, people.length - 1);
    }
    return { linked };
  }

  /** 메모리 목록을 AI로 요약 후 이벤트로 저장. */
  async generateSummaries(limit = 100): Promise<{ saved: boolean }> {
    const list = await this.memory.recall(limit);
    const texts = list.map((m) => m.content?.slice(0, 400) || '').filter(Boolean);
    if (!texts.length) return { saved: false };

    if (this.aiService.isAvailable()) {
      const summary = await this.aiService.summarize(texts);
      if (summary) {
        await this.timeline.addEvent(`[AI Summary]\n${summary}`, 'personal');
        return { saved: true };
      }
    }
    return { saved: false };
  }

  /** v3 organize 전체: cluster → timeline → graph → summaries. */
  async organize(): Promise<{
    clustered: number;
    timelineSaved: boolean;
    linked: number;
    summarySaved: boolean;
  }> {
    const limit = DEFAULT_RECALL_LIMIT;
    const { clustered } = await this.clusterMemories(limit);
    const { saved: timelineSaved } = await this.generateTimeline(limit);
    const { linked } = await this.updateKnowledgeGraph(limit);
    const { saved: summarySaved } = await this.generateSummaries(limit);
    return { clustered, timelineSaved, linked, summarySaved };
  }

  /** v3: 매일 새벽 3시 Self-Learning 실행 (클러스터·요약·지식그래프). */
  @Cron('0 3 * * *')
  async nightlyBrainUpdate(): Promise<void> {
    try {
      await this.clusterMemories();
      await this.generateSummaries();
      await this.updateKnowledgeGraph();
    } catch (err) {
      console.error('[BrainOrganizeService] nightlyBrainUpdate failed:', toErrorMessage(err));
    }
  }
}
