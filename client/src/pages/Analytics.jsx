import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Card, Loading, Empty, StatCard } from '../components/UI';

function MiniBarChart({ data, color }) {
  if (!data) return null;
  return (
    <div className="flex center" style={{ alignItems: 'flex-end', gap: 8, height: 150 }}>
      {data.map((v, i) => (
        <div key={i} style={{ textAlign: 'center', flex: 1 }}>
          <div title={v} style={{ height: `${Math.max(4, (v / (Math.max(...data, 1)) * 100) * 0.7)}px`, background: color, borderRadius: '6px 6px 0 0' }} />
          <div className="small muted" style={{ fontSize: 10 }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics').then((res) => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (!data) return <Empty message="No analytics yet. Add farm records to see insights." />;

  const s = data.summary;

  return (
    <div>
      <div className="grid grid-4 mb-3">
        <StatCard icon="📥" value={`₹${s.income.toLocaleString()}`} label="Income" color="var(--green-600)" />
        <StatCard icon="📤" value={`₹${s.expense.toLocaleString()}`} label="Expense" color="var(--red-500)" />
        <StatCard icon="💸" value={`₹${s.profit.toLocaleString()}`} label="Profit" />
        <StatCard icon="🧾" value={data.activitySummary?.reduce((a, x) => a + x.count, 0) || 0} label="Activities" />
      </div>

      <div className="grid grid-2 mb-3">
        <Card>
          <h3 className="mb-2">📈 Monthly Income vs Expense</h3>
          {data.monthly.months.length ? (
            <>
              <MaterializedLine months={data.monthly.months} income={data.monthly.income} expense={data.monthly.expense} />
            </>
          ) : <Empty message="No monthly data yet." />}
        </Card>
        <Card>
          <h3 className="mb-2">🧾 Expense by Category</h3>
          {data.expenseByCategory.length ? data.expenseByCategory.map((e, i) => {
            const max = data.expenseByCategory[0].total;
            return (
              <div key={i} className="mb-1">
                <div className="between center"><span className="small">{e.category}</span><span className="small" style={{ fontWeight: 700 }}>₹{e.total}</span></div>
                <div className="confidence-bar"><div style={{ width: `${(e.total / max) * 100}%`, background: '#f59e0b' }} /></div>
              </div>
            );
          }) : <Empty message="No expense data." />}
        </Card>
      </div>

      <Card className="mb-3">
        <h3 className="mb-2">🌾 Crop Performance</h3>
        {data.cropPerformance.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Crop</th><th>Income</th><th>Expense</th><th>Profit</th></tr></thead>
              <tbody>
                {data.cropPerformance.map((c, i) => (
                  <tr key={i}>
                    <td>{c.crop}</td><td>₹{c.income}</td><td>₹{c.expense}</td>
                    <td style={{ color: (c.income - c.expense) >= 0 ? 'var(--green-600)' : 'var(--red-500)', fontWeight: 600 }}>
                      ₹{(c.income - c.expense)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty message="No crop performance data." />}
      </Card>

      <Card>
        <h3 className="mb-2">🌿 Activity Summary</h3>
        {data.activitySummary.length ? (
          <div className="grid grid-3">
            {data.activitySummary.map((a, i) => (
              <div key={i} className="card" style={{ boxShadow: 'none', border: '1px solid #eef2ee' }}>
                <h4 style={{ textTransform: 'capitalize' }}>{a.activity_type}</h4>
                <p className="stat-val" style={{ fontSize: 24 }}>{a.count}</p>
                <p className="small muted">Cost: ₹{a.cost}</p>
              </div>
            ))}
          </div>
        ) : <Empty message="No activity data." />}
      </Card>
    </div>
  );
}

function MaterializedLine({ months, income, expense }) {
  // Simple CSS-based grouped column chart
  return (
    <div>
      <div className="flex" style={{ gap: 12, alignItems: 'flex-end', height: 180 }}>
        {months.map((m, i) => {
          const max = Math.max(...income, ...expense, 1);
          return (
            <div key={m} style={{ flex: 1, textAlign: 'center' }}>
              <div className="flex center" style={{ alignItems: 'flex-end', justifyContent: 'center', gap: 4, height: 160 }}>
                <div title={`Income ${income[i]}`} style={{ width: 14, height: `${(income[i] / max) * 140}px`, background: 'var(--green-600)', borderRadius: '4px 4px 0 0' }} />
                <div title={`Expense ${expense[i]}`} style={{ width: 14, height: `${(expense[i] / max) * 140}px`, background: '#f59e0b', borderRadius: '4px 4px 0 0' }} />
              </div>
              <div className="small muted" style={{ fontSize: 11 }}>{m}</div>
            </div>
          );
        })}
      </div>
      <div className="flex gap mt-1 center">
        <span className="small"><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--green-600)', borderRadius: 2 }} /> Income</span>
        <span className="small"><span style={{ display: 'inline-block', width: 10, height: 10, background: '#f59e0b', borderRadius: 2 }} /> Expense</span>
      </div>
    </div>
  );
}
