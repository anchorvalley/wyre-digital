import { useState, useEffect } from 'react';

function Dashboard() {
  const [anchors, setAnchors] = useState([]);
  const [anchorInput, setAnchorInput] = useState('');
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnchors();
    fetchHealth();
  }, []);

  const fetchAnchors = async () => {
    try {
      const response = await fetch('https://records.anchorvalley.us/anchor');
      const data = await response.json();
      setAnchors(data); // assume array of anchors
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHealth = async () => {
    try {
      const response = await fetch('https://records.anchorvalley.us/health');
      const data = await response.json();
      setHealth(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnchor = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://records.anchorvalley.us/anchor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: anchorInput }),
      });
      if (!response.ok) throw new Error('Failed to anchor');
      await response.json();
      setAnchorInput('');
      fetchAnchors(); // refresh list
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://records.anchorvalley.us/verify?hash=${verifyInput}`);
      if (!response.ok) throw new Error('Failed to verify');
      const data = await response.json();
      setVerifyResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Anchors List */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Your Anchors</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700">
              <th className="p-2">TxID</th>
              <th className="p-2">Hash</th>
              <th className="p-2">Type</th>
              <th className="p-2">Explorer</th>
            </tr>
          </thead>
          <tbody>
            {anchors.map((anchor, index) => (
              <tr key={index} className="border-b">
                <td className="p-2">{anchor.txid}</td>
                <td className="p-2">{anchor.hash}</td>
                <td className="p-2">{anchor.type}</td>
                <td className="p-2"><a href={anchor.explorer} target="_blank" rel="noopener noreferrer">View</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Anchor Form */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Anchor New Data</h2>
        <form onSubmit={handleAnchor} className="max-w-md">
          <input 
            type="text" 
            value={anchorInput} 
            onChange={(e) => setAnchorInput(e.target.value)} 
            placeholder="Enter data to anchor" 
            className="w-full p-2 mb-4 border rounded dark:bg-gray-800" 
          />
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded">
            {loading ? 'Anchoring...' : 'Anchor'}
          </button>
        </form>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </section>

      {/* Verify Form */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Verify Proof</h2>
        <form onSubmit={handleVerify} className="max-w-md">
          <input 
            type="text" 
            value={verifyInput} 
            onChange={(e) => setVerifyInput(e.target.value)} 
            placeholder="Enter hash to verify" 
            className="w-full p-2 mb-4 border rounded dark:bg-gray-800" 
          />
          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2 rounded">
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
        {error && <p className="text-red-500 mt-4">{error}</p>}
        {verifyResult && (
          <div className="mt-4 p-4 border rounded">
            <p>Status: {verifyResult.status}</p>
            {/* assume fields */}
          </div>
        )}
      </section>

      {/* Health */}
      {health && (
        <section>
          <h2 className="text-2xl font-bold mb-4">Service Health</h2>
          <pre>{JSON.stringify(health, null, 2)}</pre>
        </section>
      )}
    </div>
  );
}

export default Dashboard;
