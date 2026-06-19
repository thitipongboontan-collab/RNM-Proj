"use client";

import { useEffect, useRef } from "react";
import {
  recordFundingView,
  recordNewsView,
  recordResearcherView,
} from "@/lib/analytics/record-view-actions";

type RecordContentViewProps =
  | { type: "researcher"; id: string }
  | { type: "funding"; id: string }
  | { type: "news"; id: string };

export function RecordContentView({ type, id }: RecordContentViewProps) {
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;

    if (type === "researcher") {
      void recordResearcherView(id);
      return;
    }

    if (type === "funding") {
      void recordFundingView(id);
      return;
    }

    void recordNewsView(id);
  }, [id, type]);

  return null;
}
