import { useState } from 'react';
import { Link } from 'react-router-dom';

function Landing() {
  const [anchorInput, setAnchorInput] = useState('');
  const [anchorResult, setAnchorResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnchor = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://records.anchorvalley.us/anchor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: anchorInput }), // assume payload
      });
      if (!response.ok) throw new Error('Failed to anchor');
      const data = await response.json();
      setAnchorResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Hero */}
      <section className="text-center py-20 bg-blue-600 text-white rounded-lg mb-12">
        <h1 className="text-5xl font-bold mb-4">wyre - Immutable Proofs</h1>
        <p className="text-xl mb-8">Secure your data with blockchain-anchored proofs.</p>
        <Link to="/dashboard" className="bg-white text-blue-600 px-6 py-3 rounded-md font-semibold">Get Started</Link>
      </section>

      {/* How it works */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6">How it Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">1. Input Data</h3>
            <p>Enter the data you want to anchor.</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">2. Anchor</h3>
            <p>We hash and anchor it to the blockchain.</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">3. Verify</h3>
            <p>Verify the proof anytime.</p>
          </div>
        </div>
      </section>

      {/* Anchor Demo Form */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6">Try Anchoring</h2>
        <form onSubmit={handleAnchor} className="max-w-md mx-auto">
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
        {anchorResult && (
          <div className="mt-4 p-4 border rounded">
            <p>TxID: {anchorResult.txid}</p>
            <p>Hash: {anchorResult.hash}</p>
            {/* assume response fields */}
          </div>
        )}
      </section>

      {/* Verify CTA */}
      <section className="text-center">
        <h2 className="text-3xl font-bold mb-6">Verify a Proof</h2>
        <Link to="/dashboard" className="bg-green-600 text-white px-6 py-3 rounded-md font-semibold">Verify Now</Link>
      </section>
    </div>
  );
}

export default Landing;
