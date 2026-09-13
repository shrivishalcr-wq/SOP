import { useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../api/categories.js';
import { LoadingState } from '../components/common/LoadingState.jsx';
import { ErrorState } from '../components/common/ErrorState.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx';
import { extractErrorMessage } from '../api/client.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('categories-page');

const EMPTY_FORM = { _id: null, name: '', iconKey: '' };

export function CategoriesPage() {
  const { data: categories, loading, error, reload } = useApi(listCategories, []);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  function openCreateForm() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  }

  function openEditForm(category) {
    setForm({ _id: category._id, name: category.Name, iconKey: category.IconKey || '' });
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      if (form._id) {
        await updateCategory(form._id, { name: form.name, iconKey: form.iconKey });
      } else {
        await createCategory({ name: form.name, iconKey: form.iconKey });
      }
      setFormOpen(false);
      reload();
    } catch (err) {
      logger.error('Failed to save category', err);
      setFormError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    setDeleteError(null);
    try {
      await deleteCategory(pendingDelete._id);
      setPendingDelete(null);
      reload();
    } catch (err) {
      logger.error('Failed to delete category', err);
      setDeleteError(extractErrorMessage(err));
      setPendingDelete(null);
    }
  }

  const columns = [
    { key: 'Name', header: 'Name' },
    { key: 'IconKey', header: 'Icon Key', render: (row) => row.IconKey || '—' },
    { key: 'vendorCount', header: 'Vendors Using' },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" className="vc-btn" onClick={() => openEditForm(row)}>
            Edit
          </button>
          <button type="button" className="vc-btn vc-btn-danger" onClick={() => setPendingDelete(row)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="vc-btn vc-btn-primary" onClick={openCreateForm}>
          Add category
        </button>
      </div>

      {deleteError ? <ErrorState message={deleteError} /> : null}

      <div className="vc-card">
        {loading ? (
          <LoadingState label="Loading categories…" />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <DataTable
            columns={columns}
            rows={categories}
            rowKey="_id"
            emptyTitle="No categories yet"
            emptyDescription="Add the first vendor category to get onboarding started."
          />
        )}
      </div>

      {formOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 12, 16, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setFormOpen(false)}
        >
          <form
            className="vc-card"
            style={{ padding: 20, width: 360 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <h3 style={{ marginBottom: 16 }}>{form._id ? 'Edit category' : 'Add category'}</h3>

            <div className="vc-field">
              <label className="vc-label" htmlFor="category-name">
                Name
              </label>
              <input
                id="category-name"
                className="vc-input"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="vc-field">
              <label className="vc-label" htmlFor="category-icon">
                Icon Key (optional)
              </label>
              <input
                id="category-icon"
                className="vc-input"
                value={form.iconKey}
                onChange={(e) => setForm((prev) => ({ ...prev, iconKey: e.target.value }))}
              />
            </div>

            {formError ? (
              <p style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12 }}>{formError}</p>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="vc-btn" onClick={() => setFormOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="vc-btn vc-btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={pendingDelete ? `Delete category "${pendingDelete.Name}"?` : ''}
        description="This cannot be undone. Categories still assigned to vendors cannot be deleted."
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
