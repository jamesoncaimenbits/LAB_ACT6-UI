import { useEffect, useState } from 'react';
import { api } from './api';

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
const EMPTY = { product_name: '', description: '', price: '', quantity: '' };

export default function Products({ onLogout }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api('/api/products');
      setProducts(Array.isArray(data) ? data : data.data || data.products || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    const body = {
      product_name: form.product_name,
      description: form.description,
      price: Number(form.price),
      quantity: Number(form.quantity),
    };
    try {
      if (form.id) await api(`/api/products/${form.id}`, { method: 'PUT', body });
      else await api('/api/products', { method: 'POST', body });
      setForm(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.product_name}"?`)) return;
    try {
      await api(`/api/products/${p.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const visible = products.filter((p) =>
    p.product_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <header className="topbar">
        <strong>Jameson Caimen</strong>
        <button className="btn" onClick={onLogout}>Log out</button>
      </header>

      <main className="container">
        {error && <div className="error">{error}</div>}

        <div className="toolbar">
          <input
            placeholder="Search products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search products"
          />
          <button className="btn primary" onClick={() => setForm(EMPTY)}>Add product</button>
        </div>

        <p className="count">{visible.length} {visible.length === 1 ? 'product' : 'products'}</p>

        <div className="table-wrap">
          {loading ? (
            <div className="empty">Loading products...</div>
          ) : visible.length === 0 ? (
            <div className="empty">
              {search ? 'No products match your search.' : 'No products yet. Add your first one.'}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th className="num">Price</th>
                  <th className="num">Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id}>
                    <td>
                    <div>{p.product_name}</div>
                   {p.description && <div className="sub">{p.description}</div>}
                    </td>
                    <td className="num">{peso.format(p.price)}</td>
                    <td className={`num ${Number(p.quantity) <= 5 ? 'low' : ''}`}>{p.quantity}</td>
                    <td className="actions">
                      <button className="btn small" onClick={() => setForm(p)}>Edit</button>
                      <button className="btn small danger" onClick={() => remove(p)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {form && (
        <div className="overlay" onClick={() => setForm(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <h2>{form.id ? 'Edit product' : 'Add product'}</h2>

            <div className="field">
              <label htmlFor="product_name">Name</label>
              <input id="product_name" name="product_name" value={form.product_name} onChange={change} required />
            </div>

            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" rows="3" value={form.description || ''} onChange={change} />
            </div>

            <div className="row">
              <div className="field">
                <label htmlFor="price">Price (PHP)</label>
                <input id="price" name="price" type="number" min="0" step="0.01" value={form.price} onChange={change} required />
              </div>
              <div className="field">
                <label htmlFor="quantity">Quantity</label>
                <input id="quantity" name="quantity" type="number" min="0" value={form.quantity} onChange={change} required />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn primary">{form.id ? 'Save changes' : 'Add product'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}