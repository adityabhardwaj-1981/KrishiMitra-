import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, Field, Loading, Empty, ErrorBanner } from '../components/UI';

export default function Community() {
  const { show } = useToast();
  const { user } = useAuth();
  const [posts, setPosts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [reload, setReload] = useState(0);
  const [form, setForm] = useState({ title: '', content: '', category: '', tags: '' });
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    api.get('/community').then((res) => { setPosts(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, [reload]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError('');
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map((t) => t.trim()) : [] };
      await api.post('/community', payload);
      show('Post published', 'success');
      setShowForm(false);
      setForm({ title: '', content: '', category: '', tags: '' });
      setReload((r) => r + 1);
    } catch (e) {
      setError(e.message);
    }
  };

  const openPost = async (id) => {
    if (expanded === id) { setExpanded(null); return; }
    try {
      const res = await api.get(`/community/${id}`);
      setExpanded({ ...res.data, postId: id });
    } catch (e) { show(e.message, 'error'); }
  };

  const like = async (id) => {
    try { await api.post(`/community/${id}/like`); setReload((r) => r + 1); } catch (e) {}
  };

  const addComment = async (postId) => {
    if (!comment.trim()) return;
    try {
      await api.post(`/community/${postId}/comment`, { content: comment });
      setComment('');
      openPost(postId);
    } catch (e) { show(e.message, 'error'); }
  };

  return (
    <div>
      <div className="section-head">
        <h2>Community</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Close' : '+ Start Discussion'}</button>
      </div>

      {showForm && (
        <Card className="mb-3">
          <h3 className="mb-2">New Post</h3>
          <ErrorBanner message={error} />
          <Field label="Title" required><input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} /></Field>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Category"><select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}><option value="">Select</option><option>Question</option><option>Tips</option><option>Disease Help</option><option>Success Story</option><option>Market Info</option><option>Other</option></select></Field>
            <Field label="Tags (comma separated)"><input className="input" value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="wheat, rabi" /></Field>
          </div>
          <Field label="Content" required><textarea className="input" value={form.content} onChange={(e) => set('content', e.target.value)} /></Field>
          <button className="btn btn-primary" onClick={submit}>Publish</button>
        </Card>
      )}

      {loading ? <Loading /> : (
        <>
          {posts?.length === 0 && <Empty message="No posts yet. Start a discussion!" />}
          <div className="grid">
            {posts?.map((p) => (
              <Card key={p.id}>
                <div className="between center">
                  <h3>{p.title}</h3>
                  <span className="badge badge-green">{p.category}</span>
                </div>
                <p className="small muted">{p.author_name} • {new Date(p.created_at).toLocaleDateString()}</p>
                <p className="small mt-1">{p.content}</p>
                <div className="mt-2 flex gap center">
                  <button className="btn btn-ghost btn-sm" onClick={() => like(p.id)}>👍 {p.likes}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => openPost(p.id)}>💬 {p.comment_count} comments</button>
                </div>
                {expanded && expanded.postId === p.id && (
                  <div className="mt-2" style={{ borderTop: '1px solid #eef2ee', paddingTop: 12 }}>
                    {expanded.comments?.map((c) => (
                      <div key={c.id} className="small mb-1" style={{ background: 'var(--soil-100)', padding: 8, borderRadius: 8 }}>
                        <strong>{c.user_name}:</strong> {c.content}
                      </div>
                    ))}
                    <div className="flex gap mt-2">
                      <input className="input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a comment…" />
                      <button className="btn btn-primary btn-sm" onClick={() => addComment(p.id)}>Post</button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
