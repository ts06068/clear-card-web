"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { EChartsOption } from "echarts";
import type { TopArticleDatum } from "@/types/bibliometric";
import { EChartCard } from "./EChartCard";

export function CoCitationGraph({
  articleId,
  articleTitle,
  coCitedArticles
}: {
  articleId: string;
  articleTitle: string;
  coCitedArticles: TopArticleDatum[];
}) {
  const router = useRouter();
  const option = useMemo<EChartsOption>(
    () => ({
      tooltip: {
        trigger: "item"
      },
      series: [
        {
          type: "graph",
          layout: "force",
          roam: true,
          force: {
            repulsion: 180,
            edgeLength: [70, 150]
          },
          data: [
            {
              id: articleId,
              name: "Selected article",
              title: articleTitle,
              symbolSize: 56,
              itemStyle: { color: "#A22A2F" }
            },
            ...coCitedArticles.map((article) => ({
              id: article.id,
              name: article.publicationYear.toString(),
              title: article.title,
              symbolSize: Math.max(18, Math.min(42, 12 + Math.sqrt(article.twoYearCitationCount) * 2)),
              itemStyle: { color: "#1F5D8C" }
            }))
          ],
          links: coCitedArticles.map((article) => ({
            source: articleId,
            target: article.id,
            value: 1
          })),
          label: {
            show: true,
            formatter: "{b}",
            color: "#425466"
          },
          lineStyle: {
            color: "#D8DEE8",
            width: 1.4,
            curveness: 0.08
          }
        }
      ]
    }),
    [articleId, articleTitle, coCitedArticles]
  );

  return (
    <EChartCard
      title="Co-citation Graph"
      subtitle="Articles connected by shared references."
      option={option}
      height={360}
      onEvents={{
        click: (params: { data?: { id?: string } }) => {
          if (params.data?.id && params.data.id !== articleId) {
            router.push(`/articles/${params.data.id}`);
          }
        }
      }}
    />
  );
}
