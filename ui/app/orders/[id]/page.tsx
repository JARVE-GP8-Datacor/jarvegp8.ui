"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/po/Breadcrumb";
import { PoPageHeader } from "@/components/po/PoPageHeader";
import { EtaStrip } from "@/components/po/EtaStrip";
import { StageTracker } from "@/components/po/StageTracker";
import { PO_RECORDS } from "@/lib/po-data";
export default function PoTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const po = PO_RECORDS[id];
  if (!po) notFound();

  const doneCount = po.stages.filter((s) => s.state === "done").length;
  const progressPct = Math.round((doneCount / po.stages.length) * 100);

  return (
    <div className="portal">
      <Header />

      <div className="portal__body">
        <Breadcrumb current={po.id} />
        <PoPageHeader po={po} />

        <div className="po-layout">
          <div className="po-main">
            <EtaStrip eta={po.eta} />
            <StageTracker
              stages={po.stages}
              callout={po.callout}
              progressPct={progressPct}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
