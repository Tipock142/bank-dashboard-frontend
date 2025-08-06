// File: App.jsx
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const BACKEND_URL = "https://bank-dashboard-backend-hmux.onrender.com";

const App = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [linkToken, setLinkToken] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/transactions`);
      const data = await res.json();

      if (!res.ok) {
        console.error("Backend error:", data.error || "Unknown error");
        setTransactions([]);
        return;
      }

      if (!data.transactions) {
        console.error("Unexpected response format:", data);
        setTransactions([]);
        return;
      }

      setTransactions(data.transactions);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const headers = ["Date", "Name", "Amount", "Category"];
    const rows = transactions.map(tx => [tx.date, tx.name, tx.amount, (tx.category || []).join("/")]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
  };

  const createLinkToken = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/create_link_token`, {
        method: "POST",
      });
      const data = await res.json();
      setLinkToken(data.link_token);
      return data.link_token;
    } catch (err) {
      console.error("Failed to create link token:", err);
    }
  };

  const openPlaidLink = async () => {
    const token = await createLinkToken();

    if (!token) return;

    const handler = window.Plaid.create({
      token,
      onSuccess: async (public_token) => {
        await fetch(`${BACKEND_URL}/api/exchange_public_token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_token }),
        });

        fetchTransactions();
      },
      onExit: (err) => {
        if (err) console.error("Plaid exited with error:", err);
      },
    });

    handler.open();
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const groupedTransactions = transactions.reduce((groups, tx) => {
    const account = tx.account_name || "Unknown Account";
    if (!groups[account]) groups[account] = [];
    groups[account].push(tx);
    return groups;
  }, {});

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Bank Dashboard</h1>
      <div className="mb-4 flex gap-2">
        <Button onClick={handleDownload}>Download CSV</Button>
        <Button onClick={openPlaidLink}>Connect Another Bank</Button>
      </div>
      <Card>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : transactions?.length === 0 ? (
            <p>No transactions available.</p>
          ) : (
            Object.entries(groupedTransactions).map(([accountName, txList]) => (
              <div key={accountName} className="mb-8">
                <h2 className="text-xl font-semibold mb-2">{accountName}</h2>
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
                    {txList.map((tx, i) => (
                      <tr key={i} className="border-t">
                        <td>{tx.date}</td>
                        <td>{tx.name}</td>
                        <td>${tx.amount.toFixed(2)}</td>
                        <td>{(tx.category || []).join(" / ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default App;
