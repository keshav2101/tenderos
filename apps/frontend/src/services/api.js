const API_BASE = 'http://localhost:8000/api/v1';

export async function fetchTenders(page = 1, filters = {}) {
  const params = new URLSearchParams({ page, page_size: 25 });
  
  if (filters.q) params.append('q', filters.q);
  if (filters.status) params.append('status', filters.status);
  if (filters.category) params.append('category', filters.category);
  if (filters.msme_eligible) params.append('msme_eligible', 'true');
  
  const res = await fetch(`${API_BASE}/tenders?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch tenders');
  return res.json();
}

export async function fetchMarketTrends() {
  const res = await fetch(`${API_BASE}/tenders/intelligence/market-trends`);
  if (!res.ok) throw new Error('Failed to fetch market trends');
  return res.json();
}

export async function fetchBuyerProfiles(limit = 10) {
  const res = await fetch(`${API_BASE}/tenders/intelligence/buyers?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch buyer profiles');
  return res.json();
}

export async function fetchChat(tenderId, message) {
  const res = await fetch(`${API_BASE}/chat/${tenderId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  if (!res.ok) throw new Error('Failed to chat');
  return res.json();
}
