// Replace THE_ID with the actual _id from your `skilltests` collection
(async () => {
  const testId = '683cd5b4b4d9cc04d3f74279';  // your test’s ObjectId
  const res = await fetch(`/api/skilltests/${testId}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
    // session cookie is auto-attached
  });
  if (!res.ok) {
    console.error('Error starting test:', await res.text());
    return;
  }
  const { url } = await res.json();
  console.log('Opening LS URL:', url);
  window.open(url, '_blank');
})();
