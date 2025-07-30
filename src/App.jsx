// File: src/App.jsx
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlaidLink } from "react-plaid-link";

const BACKEND_URL = "https://bank-dashboard-backend-hmux.onrender.com"; // ← Replace this with your real Render backend URL

const App = () => {
  const [transactions, setTransactions] = useState([]);
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch Plaid link token from backend
  const fetchLinkToken = async () => {
    const res = await fetch(`${BACKEND_URL}/api/create_link_token`, {
      method: "POST",
    });
    const data = await res.json();
    setLinkToken(data.link_token);
  };

  // Exchange public token on success
  const onSuccess = async (public_token) => {
    await fetch(`${BACKEND_URL}/api/exchange_public_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_token }),
    });
    fetchTransactions();
  };

  // Fetch transactions from backend
  const fetchTransactions = async () => {
    setLoading(true);
    const res = await fetch(`${BACKEND_URL}/api/transactions`);
    const data = await res.json();
    setTransactions(data.transactions);
    setLoading(false);
  };

  // Download CSV file
  const handleDownload = () => {
    const headers = ["Date", "Name", "Amount", "Category"];
    const rows = transactions.map(tx => [
      tx.date,
      tx.name,
      tx.amount,
      tx.category.join("/")
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
  };

  useEffect(() => {
    fetchLinkToken();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Bank Dashboard</h1>

      {linkToken && (
        <PlaidLink token={linkToken} onSuccess={(public_token) => onSuccess(public_token)}>
          <Button className="mb-4">Connect Bank</Button>
        </PlaidLink>
      )}

      <Button onClick={handleDownload} className="mb-4 ml-2">
        Download CSV
      </Button>

      <Card>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Amount</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr key={i} className="border-t">
                    <td>{tx.date}</td>
                    <td>{tx.name}</td>
                    <td>${tx.amount.toFixed(2)}</td>
                    <td>{tx.category.join(" / ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default App;
