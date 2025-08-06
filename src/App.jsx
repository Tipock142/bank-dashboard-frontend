// File: App.jsx
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const BACKEND_URL = "https://bank-dashboard-backend-hmux.onrender.com";

const App = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Bank Dashboard</h1>
      <Button onClick={handleDownload} className="mb-4">Download CSV</Button>
      <Card>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : transactions?.length === 0 ? (
            <p>No transactions available.</p>
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
                    <td>{(tx.category || []).join(" / ")}</td>
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
