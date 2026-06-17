import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { TopBar } from '@/components/TopBar';
import { useAppData } from '@/state/useAppData';
import type { Category } from '@/types/category';

interface PendingAction {
  type: 'delete';
  category: Category;
  usageCount: number;
}

/**
 * CRUD UI for the calculator category list.  Renames cascade into existing
 * stock records via the context, and deletions are blocked while a category
 * is still referenced anywhere.
 */
export function ManageCategoriesPage(): JSX.Element {
  const navigate = useNavigate();
  const { categories, addCategory, renameCategory, deleteCategory, categoryUsageCount } = useAppData();

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const [addError, setAddError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [blocked, setBlocked] = useState<{ category: Category; usageCount: number } | null>(null);

  const handleAdd = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setAddError(null);
    const trimmed = newName.trim();
    if (trimmed === '') {
      setAddError('Please enter a category name.');
      return;
    }
    const result = addCategory(trimmed);
    if (!result.ok) {
      setAddError(result.reason === 'duplicate' ? 'That category already exists.' : 'Please enter a category name.');
      return;
    }
    setNewName('');
  };

  const startEdit = (category: Category): void => {
    setEditingId(category.id);
    setEditingName(category.name);
    setEditError(null);
  };

  const cancelEdit = (): void => {
    setEditingId(null);
    setEditingName('');
    setEditError(null);
  };

  const saveEdit = (): void => {
    if (!editingId) return;
    setEditError(null);
    const result = renameCategory(editingId, editingName);
    if (!result.ok) {
      setEditError(
        result.reason === 'duplicate'
          ? 'Another category already uses that name.'
          : result.reason === 'empty'
            ? 'Please enter a category name.'
            : 'That category no longer exists.',
      );
      return;
    }
    cancelEdit();
  };

  const requestDelete = (category: Category): void => {
    const usageCount = categoryUsageCount(category.name);
    if (usageCount > 0) {
      setBlocked({ category, usageCount });
      return;
    }
    setPending({ type: 'delete', category, usageCount });
  };

  const confirmDelete = (): void => {
    if (!pending) return;
    deleteCategory(pending.category.id);
    setPending(null);
  };

  return (
    <div className="min-h-screen pb-24">
      <TopBar title="Manage Categories" onBack={() => navigate(-1)} />

      <form className="rounded-2xl bg-white p-4 shadow-card" onSubmit={handleAdd} noValidate>
        <label htmlFor="new-category" className="block text-sm font-medium text-slate-700">
          Add a calculator category
        </label>
        <div className="mt-2 flex items-stretch gap-2">
          <input
            id="new-category"
            type="text"
            value={newName}
            placeholder="e.g. Citizen CT-500"
            onChange={(event) => setNewName(event.target.value)}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            maxLength={40}
          />
          <Button type="submit" variant="primary">
            Add
          </Button>
        </div>
        {addError ? (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700" role="alert">
            {addError}
          </p>
        ) : null}
      </form>

      <div className="mt-4">
        {categories.length === 0 ? (
          <EmptyState
            title="No categories yet"
            description="Add the first calculator model the owner sells."
          />
        ) : (
          <ul className="space-y-2">
            {categories.map((category) => {
              const usage = categoryUsageCount(category.name);
              const isEditing = editingId === category.id;
              return (
                <li
                  key={category.id}
                  className="rounded-2xl bg-white p-3 shadow-card"
                >
                  {isEditing ? (
                    <div>
                      <input
                        autoFocus
                        type="text"
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                        maxLength={40}
                      />
                      {editError ? (
                        <p className="mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700" role="alert">
                          {editError}
                        </p>
                      ) : null}
                      <div className="mt-2 flex gap-2">
                        <Button variant="primary" onClick={saveEdit} fullWidth>
                          Save
                        </Button>
                        <Button variant="secondary" onClick={cancelEdit} fullWidth>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-slate-900">{category.name}</p>
                        <p className="text-xs text-slate-500">
                          {usage === 0
                            ? 'Not yet used in any stock'
                            : `Used in ${usage} ${usage === 1 ? 'item' : 'items'}`}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <IconButton
                          label={`Edit ${category.name}`}
                          onClick={() => startEdit(category)}
                          tone="brand"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M3 21v-3.586l11.793-11.793a1 1 0 0 1 1.414 0l2.172 2.172a1 1 0 0 1 0 1.414L6.586 21H3z" />
                          </svg>
                        </IconButton>
                        <IconButton
                          label={`Delete ${category.name}`}
                          onClick={() => requestDelete(category)}
                          tone="danger"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M3 6h18" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                          </svg>
                        </IconButton>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={pending !== null}
        title="Delete this category?"
        description={pending ? `"${pending.category.name}" will be removed from the dropdown. This cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPending(null)}
      />

      <ConfirmDialog
        open={blocked !== null}
        title="Cannot delete this category"
        description={
          blocked
            ? `"${blocked.category.name}" is used in ${blocked.usageCount} ${blocked.usageCount === 1 ? 'stock item' : 'stock items'}. Remove or change those items first, then try again.`
            : ''
        }
        confirmLabel="Got it"
        cancelLabel="Cancel"
        variant="primary"
        onConfirm={() => setBlocked(null)}
        onCancel={() => setBlocked(null)}
      />
    </div>
  );
}

interface IconButtonProps {
  label: string;
  onClick: () => void;
  tone: 'brand' | 'danger';
  children: React.ReactNode;
}

function IconButton({ label, onClick, tone, children }: IconButtonProps): JSX.Element {
  const toneClasses: Record<IconButtonProps['tone'], string> = {
    brand: 'text-brand-700 hover:bg-brand-50 active:bg-brand-100',
    danger: 'text-red-600 hover:bg-red-50 active:bg-red-100',
  };
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-full ${toneClasses[tone]}`}
    >
      {children}
    </button>
  );
}
