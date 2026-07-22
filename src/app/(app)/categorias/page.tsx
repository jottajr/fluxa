"use client";

import { useMemo, useState } from "react";
import { useFinanceData } from "@/lib/finance-data-context";
import { PencilIcon } from "@/components/icons/PencilIcon";
import { EmojiPicker } from "@/components/EmojiPicker";
import type { Category } from "@/types";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const labelClass = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";

function emptyForm() {
  return {
    name: "",
    parentId: "",
    icon: "🏷️",
  };
}

export default function CategoriasPage() {
  const { categories, addCategory, updateCategory, deleteCategory } =
    useFinanceData();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const parentCategories = useMemo(
    () => categories.filter((c) => c.parentId === null),
    [categories],
  );

  function childrenOf(parentId: string) {
    return categories.filter((c) => c.parentId === parentId);
  }

  const editingHasChildren = useMemo(
    () => (editingId ? categories.some((c) => c.parentId === editingId) : false),
    [categories, editingId],
  );

  const editingCategory = useMemo(
    () => (editingId ? (categories.find((c) => c.id === editingId) ?? null) : null),
    [categories, editingId],
  );
  const isEditingSubcategory = editingCategory !== null && editingCategory.parentId !== null;

  function openNewForm() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  }

  function closeForm() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(category: Category) {
    setForm({
      name: category.name,
      parentId: category.parentId ?? "",
      icon: category.icon,
    });
    setEditingId(category.id);
    setShowForm(true);
  }

  async function handleDelete(category: Category): Promise<boolean> {
    if (!window.confirm(`Excluir a categoria "${category.name}"?`)) return false;

    const result = await deleteCategory(category.id);
    if (!result.success) {
      window.alert(result.reason);
      return false;
    }
    return true;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name) return;

    if (editingId) {
      await updateCategory(editingId, {
        name: form.name,
        parentId: editingHasChildren ? null : form.parentId || null,
        icon: form.icon || "🏷️",
      });
      closeForm();
      return;
    }

    const newCategory: Category = {
      id: "",
      name: form.name,
      parentId: form.parentId || null,
      icon: form.icon || "🏷️",
    };

    await addCategory(newCategory);
    closeForm();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--accent)] sm:text-xl dark:text-slate-100">
            Categorias
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Organize categorias e subcategorias de gastos.
          </p>
        </div>
        <button
          onClick={() => (showForm ? closeForm() : openNewForm())}
          className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
        >
          {showForm ? "Cancelar" : "+ Nova categoria"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="tech-card grid grid-cols-1 gap-6 rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-6 sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-900"
        >
          {editingId && (
            <div className="sm:col-span-2">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                Editando categoria
              </span>
            </div>
          )}

          <div>
            <label className={labelClass}>Nome</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              className={inputClass}
              placeholder="Ex: Saúde"
            />
          </div>

          <div>
            <label className={labelClass}>Ícone</label>
            <EmojiPicker
              value={form.icon}
              onChange={(icon) => setForm((f) => ({ ...f, icon }))}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Categoria pai (opcional)</label>
            <select
              value={editingHasChildren ? "" : form.parentId}
              disabled={editingHasChildren}
              onChange={(e) =>
                setForm((f) => ({ ...f, parentId: e.target.value }))
              }
              className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <option value="">Nenhuma (categoria principal)</option>
              {parentCategories
                .filter((category) => category.id !== editingId)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
            {editingHasChildren && (
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Esta categoria possui subcategorias, por isso continua como
                categoria principal.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 sm:col-span-2">
            <div className="flex gap-2">
              <button
                type="submit"
                className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
              >
                {editingId ? "Salvar alterações" : "Salvar categoria"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancelar edição
                </button>
              )}
            </div>
            {isEditingSubcategory && editingCategory && (
              <button
                type="button"
                onClick={async () => {
                  if (await handleDelete(editingCategory)) closeForm();
                }}
                className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Excluir
              </button>
            )}
          </div>
        </form>
      )}

      <div className="space-y-4">
        {parentCategories.map((category) => (
          <div
            key={category.id}
            className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEdit(category)}
                  aria-label="Editar categoria"
                  className="text-slate-300 hover:text-slate-700 dark:text-slate-600 dark:hover:text-slate-200"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <h2 className="flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
                  <span className="text-lg">{category.icon}</span>
                  {category.name}
                </h2>
              </div>
              <button
                onClick={() => handleDelete(category)}
                className="text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                Excluir
              </button>
            </div>
            {childrenOf(category.id).length > 0 && (
              <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                {childrenOf(category.id).map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center gap-2 pl-2"
                  >
                    <button
                      onClick={() => startEdit(child)}
                      aria-label="Editar subcategoria"
                      className="text-slate-300 hover:text-slate-700 dark:text-slate-600 dark:hover:text-slate-200"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {child.icon} {child.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
