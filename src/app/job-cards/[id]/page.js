"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import JobCardDetail from "@/components/JobCardDetail";
import { useJobCards } from "@/hooks/useData";

export default function JobCardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const { jobCards, updateJobCard } = useJobCards();
  const [jobCard, setJobCard] = useState(null);

  useEffect(() => {
    if (jobCards.length > 0) {
      const found = jobCards.find((jc) => jc.id === id);
      if (found) setJobCard(found);
    }
  }, [jobCards, id]);

  const handleUpdate = async (id, updates) => {
    const updated = await updateJobCard(id, updates);
    setJobCard(updated);
  };

  const handleBack = () => {
    router.push("/job-cards");
  };

  if (!jobCard) {
    return <div className="p-8 text-text-muted">Loading Job Card...</div>;
  }

  return <JobCardDetail jobCard={jobCard} onUpdate={handleUpdate} onBack={handleBack} />;
}
