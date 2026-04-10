"use client";

import { useState, useEffect, useCallback } from "react";

// Helper function to handle standard JSON fetch responses
async function fetchApi(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ---- VEP ----
export function useVEPs() {
  const [veps, setVeps] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVeps = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApi("/api/vep");
      setVeps(data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchVeps(); }, [fetchVeps]);

  const addVEP = async (vep) => {
    const data = await fetchApi("/api/vep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vep),
    });
    setVeps((prev) => [data, ...prev]);
    return data;
  };

  const updateVEP = async (id, updates) => {
    const data = await fetchApi(`/api/vep/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setVeps((prev) => prev.map((v) => (v.id === id ? data : v)));
    return data;
  };

  const deleteVEP = async (id) => {
    await fetchApi(`/api/vep/${id}`, { method: "DELETE" });
    setVeps((prev) => prev.filter((v) => v.id !== id));
  };

  return { veps, loading, refetch: fetchVeps, addVEP, updateVEP, deleteVEP };
}

// ---- Work Orders ----
export function useWorkOrders() {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWOs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApi("/api/work-orders");
      setWorkOrders(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchWOs(); }, [fetchWOs]);

  const addWorkOrder = async (wo) => {
    const data = await fetchApi("/api/work-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(wo),
    });
    setWorkOrders((prev) => [data, ...prev]);
    return data;
  };

  const updateWorkOrder = async (id, updates) => {
    const data = await fetchApi(`/api/work-orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setWorkOrders((prev) => prev.map((w) => (w.id === id ? data : w)));
    return data;
  };

  return { workOrders, loading, refetch: fetchWOs, addWorkOrder, updateWorkOrder };
}

// ---- Job Cards ----
export function useJobCards() {
  const [jobCards, setJobCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJCs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApi("/api/job-cards");
      setJobCards(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchJCs(); }, [fetchJCs]);

  const addJobCard = async (jc) => {
    const data = await fetchApi("/api/job-cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jc),
    });
    setJobCards((prev) => [data, ...prev]);
    return data;
  };

  const updateJobCard = async (id, updates) => {
    const data = await fetchApi(`/api/job-cards/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setJobCards((prev) => prev.map((j) => (j.id === id ? data : j)));
    return data;
  };

  return { jobCards, loading, refetch: fetchJCs, addJobCard, updateJobCard };
}

// ---- IONs ----
export function useIONs(jobCardId) {
  const [ions, setIons] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchIons = useCallback(async () => {
    if (!jobCardId) { setIons([]); setLoading(false); return; }
    setLoading(true);
    try {
      const data = await fetchApi(`/api/ions?jobCardId=${jobCardId}`);
      setIons(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [jobCardId]);

  useEffect(() => { fetchIons(); }, [fetchIons]);

  const addION = async (ion) => {
    const data = await fetchApi("/api/ions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...ion, jobCardId }),
    });
    setIons((prev) => [data, ...prev]);
    return data;
  };

  return { ions, loading, refetch: fetchIons, addION };
}

// ---- Requested Spares ----
export function useRequestedSpares(jobCardId) {
  const [spares, setSpares] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSpares = useCallback(async () => {
    if (!jobCardId) { setSpares([]); setLoading(false); return; }
    setLoading(true);
    try {
      const data = await fetchApi(`/api/spares?jobCardId=${jobCardId}`);
      setSpares(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [jobCardId]);

  useEffect(() => { fetchSpares(); }, [fetchSpares]);

  const addSpare = async (spare) => {
    const data = await fetchApi("/api/spares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...spare, jobCardId }),
    });
    setSpares((prev) => [...prev, data]);
    return data;
  };

  const updateSpare = async (id, updates) => {
    const data = await fetchApi(`/api/spares/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setSpares((prev) => prev.map((s) => (s.id === id ? data : s)));
    return data;
  };

  return { spares, loading, refetch: fetchSpares, addSpare, updateSpare };
}

// ---- NACs ----
export function useNACs(jobCardId) {
  const [nacs, setNacs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNacs = useCallback(async () => {
    if (!jobCardId) { setNacs([]); setLoading(false); return; }
    setLoading(true);
    try {
      const data = await fetchApi(`/api/nacs?jobCardId=${jobCardId}`);
      setNacs(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [jobCardId]);

  useEffect(() => { fetchNacs(); }, [fetchNacs]);

  const addNAC = async (nac) => {
    const data = await fetchApi("/api/nacs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...nac, jobCardId }),
    });
    setNacs((prev) => [data, ...prev]);
    return data;
  };

  const updateNAC = async (id, updates) => {
    const data = await fetchApi(`/api/nacs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setNacs((prev) => prev.map((n) => (n.id === id ? data : n)));
    return data;
  };

  return { nacs, loading, refetch: fetchNacs, addNAC, updateNAC };
}

// ---- Procurements ----
export function useProcurements(jobCardId) {
  const [procurements, setProcurements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProc = useCallback(async () => {
    if (!jobCardId) { setProcurements([]); setLoading(false); return; }
    setLoading(true);
    try {
      const data = await fetchApi(`/api/procurements?jobCardId=${jobCardId}`);
      setProcurements(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [jobCardId]);

  useEffect(() => { fetchProc(); }, [fetchProc]);

  const addProcurement = async (p) => {
    const data = await fetchApi("/api/procurements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, jobCardId }),
    });
    setProcurements((prev) => [data, ...prev]);
    return data;
  };

  return { procurements, loading, refetch: fetchProc, addProcurement };
}

// ---- CRVs ----
export function useCRVs(jobCardId) {
  const [crvs, setCrvs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCrvs = useCallback(async () => {
    if (!jobCardId) { setCrvs([]); setLoading(false); return; }
    setLoading(true);
    try {
      const data = await fetchApi(`/api/crvs?jobCardId=${jobCardId}`);
      setCrvs(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [jobCardId]);

  useEffect(() => { fetchCrvs(); }, [fetchCrvs]);

  const addCRV = async (crv, items) => {
    const data = await fetchApi("/api/crvs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...crv, jobCardId, items }),
    });
    await fetchCrvs();
    return data;
  };

  return { crvs, loading, refetch: fetchCrvs, addCRV };
}

// ---- CIVs ----
export function useCIVs(jobCardId) {
  const [civs, setCivs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCivs = useCallback(async () => {
    if (!jobCardId) { setCivs([]); setLoading(false); return; }
    setLoading(true);
    try {
      const data = await fetchApi(`/api/civs?jobCardId=${jobCardId}`);
      setCivs(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [jobCardId]);

  useEffect(() => { fetchCivs(); }, [fetchCivs]);

  const addCIV = async (civ) => {
    const data = await fetchApi("/api/civs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...civ, jobCardId }),
    });
    setCivs((prev) => [data, ...prev]);
    return data;
  };

  return { civs, loading, refetch: fetchCivs, addCIV };
}

// ---- Global Search ----
export function useSearch() {
  const [results, setResults] = useState({
    veps: [],
    workOrders: [],
    jobCards: [],
  });
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setResults({ veps: [], workOrders: [], jobCards: [] });
      return;
    }
    setLoading(true);
    try {
      const data = await fetchApi(`/api/search?q=${encodeURIComponent(query.trim())}`);
      setResults({
        veps: data.veps || [],
        workOrders: data.workOrders || [],
        jobCards: data.jobCards || [],
      });
    } catch (e) {
      console.error(e);
      setResults({ veps: [], workOrders: [], jobCards: [] });
    }
    setLoading(false);
  }, []);

  return { results, loading, search };
}

// ---- Dashboard Stats ----
export function useDashboardStats() {
  const [stats, setStats] = useState({
    totalVEPs: 0,
    activeWorkOrders: 0,
    openJobCards: 0,
    closedJobCards: 0,
    recentJobCards: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApi("/api/dashboard-stats");
      setStats(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}
