import React, { useEffect, useMemo, useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import type { FavoriteShortcut } from '@/components/layout/inicioNavCatalog';
import { favoriteShortcutIcon } from '@/lib/favoriteShortcutIcons';
import './favoriteShortcutsCustomizeModal.css';

type Props = {
  open: boolean;
  catalog: FavoriteShortcut[];
  current: FavoriteShortcut[];
  onClose: () => void;
  onSave: (shortcuts: FavoriteShortcut[]) => void;
};

const FavoriteShortcutsCustomizeModal: React.FC<Props> = ({
  open,
  catalog,
  current,
  onClose,
  onSave,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedIds(current.map((item) => item.id));
    setDragIndex(null);
  }, [open, current]);

  const selectedItems = useMemo(
    () =>
      selectedIds
        .map((id) => catalog.find((item) => item.id === id))
        .filter(Boolean) as FavoriteShortcut[],
    [selectedIds, catalog],
  );

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((entry) => entry !== id);
      return [...prev, id];
    });
  };

  const reorderItems = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    setSelectedIds((prev) => {
      if (from >= prev.length || to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      if (!moved) return prev;
      next.splice(to, 0, moved);
      return next;
    });
  };

  const handleSave = () => {
    onSave(selectedItems);
    toast.success(
      selectedItems.length > 0
        ? `Menu lateral atualizado · ${selectedItems.length} atalho(s)`
        : 'Menu lateral limpo',
    );
    onClose();
  };

  return (
    <Modal
      open={open}
      size="landscape"
      paddingVariant="balanced"
      panelClassName="ls-fav-shortcuts-modal-panel"
      title="Menu lateral"
      subtitle="Escolha a ordem dos ícones do seu menu."
      icon={<LayoutGrid size={20} strokeWidth={2.25} />}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="ls-btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="ls-btn-primary" onClick={handleSave}>
            Salvar
          </button>
        </>
      }
    >
      <div className="ls-fav-shortcuts-modal">
        <div className="ls-fav-shortcuts-modal__layout">
          <section className="ls-fav-shortcuts-modal__col ls-fav-shortcuts-modal__col--pick">
            <p className="ls-fav-shortcuts-modal__col-label">Funções</p>
            <div className="ls-fav-shortcuts-modal__catalog">
              {catalog.map((item) => {
                const Icon = favoriteShortcutIcon(item.id);
                const checked = selectedIds.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className={`ls-fav-shortcuts-modal__option${checked ? ' ls-fav-shortcuts-modal__option--checked' : ''}`}
                  >
                    <input type="checkbox" checked={checked} onChange={() => toggleItem(item.id)} />
                    <span className="ls-fav-shortcuts-modal__option-icon">
                      <Icon size={16} strokeWidth={1.75} />
                    </span>
                    <span className="ls-fav-shortcuts-modal__option-label">{item.label}</span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="ls-fav-shortcuts-modal__col ls-fav-shortcuts-modal__col--preview">
            <p className="ls-fav-shortcuts-modal__col-label">Ordem e prévia</p>
            <p className="ls-fav-shortcuts-modal__preview-hint">Arraste os ícones para mudar a ordem</p>
            <aside className="ls-fav-shortcuts-modal__preview" aria-label="Prévia do menu lateral">
              <div className="ls-fav-shortcuts-modal__preview-rail">
                {selectedItems.length === 0 ? (
                  <span className="ls-fav-shortcuts-modal__preview-empty" aria-hidden />
                ) : (
                  selectedItems.map((item, index) => {
                    const Icon = favoriteShortcutIcon(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        draggable
                        className={`ls-fav-shortcuts-modal__preview-icon${dragIndex === index ? ' ls-fav-shortcuts-modal__preview-icon--dragging' : ''}`}
                        title={item.label}
                        aria-label={item.label}
                        onDragStart={() => setDragIndex(index)}
                        onDragEnd={() => setDragIndex(null)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (dragIndex !== null) reorderItems(dragIndex, index);
                          setDragIndex(null);
                        }}
                      >
                        <Icon size={16} strokeWidth={1.65} />
                      </button>
                    );
                  })
                )}
                <span className="ls-fav-shortcuts-modal__preview-plus" aria-hidden>
                  +
                </span>
              </div>
            </aside>
          </section>
        </div>
      </div>
    </Modal>
  );
};

export default FavoriteShortcutsCustomizeModal;
