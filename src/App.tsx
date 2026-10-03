import { useState, useEffect, useMemo } from "react";

type ReadingStatus = "want" | "reading" | "finished";

interface Book {
  id: string;
  title: string;
  status: ReadingStatus;
}

const STATUS_LABELS: Record<ReadingStatus, string> = {
  want: "Want to Read",
  reading: "Reading",
  finished: "Finished",
};

const STATUS_ORDER: ReadingStatus[] = ["want", "reading", "finished"];

const STATUS_COLORS: Record<ReadingStatus, { fg: string; bg: string }> = {
  want: { fg: "var(--status-want)", bg: "var(--status-want-bg)" },
  reading: { fg: "var(--status-reading)", bg: "var(--status-reading-bg)" },
  finished: { fg: "var(--status-finished)", bg: "var(--status-finished-bg)" },
};

type FilterOption = "all" | ReadingStatus;

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: "all", label: "All" },
  { value: "want", label: "Want to Read" },
  { value: "reading", label: "Reading" },
  { value: "finished", label: "Finished" },
];

const STORAGE_KEY = "reading-list-books";

function loadBooks(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function saveBooks(books: Book[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  } catch {
    // ignore
  }
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function App() {
  const [books, setBooks] = useState<Book[]>(() => loadBooks());
  const [titleInput, setTitleInput] = useState("");
  const [filter, setFilter] = useState<FilterOption>("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    saveBooks(books);
  }, [books]);

  const filteredBooks = useMemo(() => {
    if (filter === "all") return books;
    return books.filter((b) => b.status === filter);
  }, [books, filter]);

  const counts = useMemo(() => {
    const c = { want: 0, reading: 0, finished: 0 } as Record<ReadingStatus, number>;
    for (const b of books) c[b.status]++;
    return c;
  }, [books]);

  function addBook(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = titleInput.trim();
    if (!trimmed) {
      setError("Please enter a book title.");
      return;
    }
    if (trimmed.length > 60) {
      setError("Book title must be 60 characters or fewer.");
      return;
    }
    const normalized = trimmed.toLowerCase();
    const exists = books.some(
      (b) => b.title.trim().toLowerCase() === normalized
    );
    if (exists) {
      setError("This book is already in your reading list.");
      return;
    }
    setError("");
    setBooks((prev) => [
      { id: uid(), title: trimmed, status: "want" },
      ...prev,
    ]);
    setTitleInput("");
  }

  function changeStatus(id: string, status: ReadingStatus) {
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b))
    );
    setOpenMenuId(null);
  }

  function deleteBook(id: string) {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    setOpenMenuId(null);
  }

  function nextStatus(status: ReadingStatus): ReadingStatus {
    const idx = STATUS_ORDER.indexOf(status);
    return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerBadge}>BookMark</div>
          <h1 style={styles.title}>Reading List</h1>
          <p style={styles.subtitle}>
            Keep track of books you want to read, are reading, and have finished.
          </p>
        </header>

        {/* Add Book */}
        <form style={styles.addForm} onSubmit={addBook}>
          <input
            type="text"
            value={titleInput}
            onChange={(e) => {
              setTitleInput(e.target.value);
              if (error) setError("");
            }}
            placeholder="Enter a book title..."
            style={styles.input}
            aria-label="Book title"
          />
          <button type="submit" style={styles.addButton}>
            Add Book
          </button>
        </form>
        {error && <p style={styles.error}>{error}</p>}

        {/* Filters */}
        <div style={styles.filterBar}>
          {FILTER_OPTIONS.map((opt) => {
            const active = filter === opt.value;
            const count =
              opt.value === "all"
                ? books.length
                : counts[opt.value as ReadingStatus];
            return (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                style={{
                  ...styles.filterBtn,
                  ...(active ? styles.filterBtnActive : {}),
                }}
              >
                {opt.label}
                <span
                  style={{
                    ...styles.filterCount,
                    color: active ? "#fff" : "var(--neutral-500)",
                    background: active
                      ? "rgba(255,255,255,0.25)"
                      : "var(--neutral-200)",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Summary */}
        {books.length > 0 && (
          <div style={styles.summary}>
            <div style={styles.summaryItem}>
              <span style={styles.summaryValue}>{books.length}</span>
              <span style={styles.summaryLabel}>Total Books</span>
            </div>
            <div style={styles.summaryDivider} />
            <div style={styles.summaryItem}>
              <span style={{ ...styles.summaryValue, color: "var(--status-reading)" }}>{counts.reading}</span>
              <span style={styles.summaryLabel}>Currently Reading</span>
            </div>
            <div style={styles.summaryDivider} />
            <div style={styles.summaryItem}>
              <span style={{ ...styles.summaryValue, color: "var(--status-finished)" }}>{counts.finished}</span>
              <span style={styles.summaryLabel}>Finished</span>
            </div>
          </div>
        )}

        {/* Book List / Empty State */}
        {books.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <BookIcon size={40} />
            </div>
            <p style={styles.emptyText}>
              Your reading list is empty. Add your first book.
            </p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>
              No books in this category yet.
            </p>
          </div>
        ) : (
          <div style={styles.cardGrid}>
            {filteredBooks.map((book) => {
              const colors = STATUS_COLORS[book.status];
              const menuOpen = openMenuId === book.id;
              return (
                <div key={book.id} style={styles.card}>
                  <div style={styles.cardBody}>
                    <h3 style={styles.cardTitle}>{book.title}</h3>
                    <span
                      style={{
                        ...styles.statusBadge,
                        color: colors.fg,
                        background: colors.bg,
                      }}
                    >
                      <span style={statusDot(colors.fg)} />
                      {STATUS_LABELS[book.status]}
                    </span>
                  </div>
                  <div style={styles.cardActions}>
                    <button
                      onClick={() =>
                        changeStatus(book.id, nextStatus(book.status))
                      }
                      style={styles.quickBtn}
                    >
                      Mark as {STATUS_LABELS[nextStatus(book.status)]}
                    </button>
                    <div style={styles.cardActionsRight}>
                      <button
                        onClick={() => deleteBook(book.id)}
                        style={styles.deleteBtn}
                        aria-label="Delete book"
                      >
                        <TrashIcon size={16} />
                        Delete
                      </button>
                      <div style={styles.menuWrap}>
                      <button
                        onClick={() =>
                          setOpenMenuId(menuOpen ? null : book.id)
                        }
                        style={styles.menuBtn}
                        aria-label="More options"
                      >
                        <DotsIcon />
                      </button>
                      {menuOpen && (
                        <>
                          <div
                            style={styles.menuBackdrop}
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div style={styles.dropdown}>
                            {STATUS_ORDER.map((s) => (
                              <button
                                key={s}
                                onClick={() => changeStatus(book.id, s)}
                                style={{
                                  ...styles.dropdownItem,
                                  ...(book.status === s
                                    ? styles.dropdownItemActive
                                    : {}),
                                }}
                              >
                                <span style={statusDot(STATUS_COLORS[s].fg)} />
                                {STATUS_LABELS[s]}
                                {book.status === s && <CheckIcon />}
                              </button>
                            ))}
                            <div style={styles.dropdownDivider} />
                            <button
                              onClick={() => deleteBook(book.id)}
                              style={styles.dropdownItemDelete}
                            >
                              <TrashIcon />
                              Remove
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Icons ---

function BookIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function TrashIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function statusDot(color: string): React.CSSProperties {
  return {
    display: "inline-block",
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
  };
}

// --- Styles ---

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "24px 16px",
    display: "flex",
    justifyContent: "center",
  },
  container: {
    width: "100%",
    maxWidth: "720px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  header: {
    textAlign: "center",
    paddingTop: "24px",
    paddingBottom: "8px",
  },
  headerBadge: {
    display: "inline-block",
    fontSize: "13px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--primary-600)",
    background: "var(--primary-50)",
    padding: "6px 14px",
    borderRadius: "var(--radius-full)",
    marginBottom: "16px",
  },
  title: {
    fontSize: "clamp(28px, 6vw, 38px)",
    fontWeight: 800,
    color: "var(--neutral-900)",
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: "15px",
    color: "var(--neutral-500)",
    marginTop: "8px",
    lineHeight: 1.5,
  },
  addForm: {
    display: "flex",
    gap: "8px",
    background: "#fff",
    padding: "8px",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-md)",
  },
  input: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "15px",
    padding: "12px 16px",
    background: "transparent",
    color: "var(--neutral-900)",
  },
  addButton: {
    background: "var(--primary-600)",
    color: "#fff",
    fontWeight: 600,
    fontSize: "14px",
    padding: "12px 22px",
    borderRadius: "var(--radius-md)",
    transition: "background 0.2s, transform 0.1s",
    whiteSpace: "nowrap",
  },
  error: {
    color: "#dc2626",
    fontSize: "13px",
    marginTop: "-12px",
    marginLeft: "4px",
  },
  filterBar: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    overflowX: "auto",
  },
  filterBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 14px",
    borderRadius: "var(--radius-full)",
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--neutral-600)",
    background: "#fff",
    border: "1px solid var(--neutral-200)",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },
  filterBtnActive: {
    background: "var(--primary-600)",
    color: "#fff",
    borderColor: "var(--primary-600)",
  },
  filterCount: {
    fontSize: "11px",
    fontWeight: 700,
    minWidth: "20px",
    height: "20px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius-full)",
    padding: "0 6px",
  },
  emptyState: {
    textAlign: "center",
    padding: "48px 24px",
    background: "#fff",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-sm)",
    border: "1px solid var(--neutral-200)",
    animation: "fadeIn 0.3s ease",
  },
  emptyIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "72px",
    height: "72px",
    borderRadius: "var(--radius-full)",
    background: "var(--primary-50)",
    color: "var(--primary-500)",
    marginBottom: "20px",
  },
  emptyText: {
    fontSize: "16px",
    color: "var(--neutral-500)",
    lineHeight: 1.5,
  },
  cardGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  card: {
    background: "#fff",
    borderRadius: "var(--radius-lg)",
    padding: "18px 20px",
    boxShadow: "var(--shadow-sm)",
    border: "1px solid var(--neutral-200)",
    transition: "box-shadow 0.2s, transform 0.2s",
    animation: "fadeInUp 0.3s ease",
  },
  cardBody: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  cardTitle: {
    fontSize: "17px",
    fontWeight: 700,
    color: "var(--neutral-900)",
    lineHeight: 1.3,
    wordBreak: "break-word",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    alignSelf: "flex-start",
    fontSize: "12px",
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: "var(--radius-full)",
  },
  cardActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "14px",
    paddingTop: "14px",
    borderTop: "1px solid var(--neutral-200)",
  },
  quickBtn: {
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--primary-600)",
    padding: "6px 4px",
    transition: "color 0.2s",
  },
  menuWrap: {
    position: "relative",
  },
  menuBtn: {
    color: "var(--neutral-500)",
    padding: "6px",
    borderRadius: "var(--radius-sm)",
    transition: "background 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  menuBackdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: "6px",
    background: "#fff",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-lg)",
    border: "1px solid var(--neutral-200)",
    padding: "6px",
    minWidth: "180px",
    zIndex: 20,
    animation: "fadeInUp 0.15s ease",
  },
  dropdownItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    padding: "9px 12px",
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--neutral-700)",
    borderRadius: "var(--radius-sm)",
    transition: "background 0.15s",
    textAlign: "left",
  },
  dropdownItemActive: {
    color: "var(--primary-700)",
    fontWeight: 600,
  },
  dropdownDivider: {
    height: "1px",
    background: "var(--neutral-200)",
    margin: "6px 0",
  },
  dropdownItemDelete: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    padding: "9px 12px",
    fontSize: "13px",
    fontWeight: 500,
    color: "#dc2626",
    borderRadius: "var(--radius-sm)",
    transition: "background 0.15s",
    textAlign: "left",
  },
  summary: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    background: "#fff",
    borderRadius: "var(--radius-lg)",
    padding: "20px 24px",
    boxShadow: "var(--shadow-sm)",
    border: "1px solid var(--neutral-200)",
  },
  summaryItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    flex: 1,
  },
  summaryValue: {
    fontSize: "28px",
    fontWeight: 800,
    color: "var(--neutral-900)",
    lineHeight: 1,
  },
  summaryLabel: {
    fontSize: "12px",
    fontWeight: 500,
    color: "var(--neutral-500)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  summaryDivider: {
    width: "1px",
    height: "40px",
    background: "var(--neutral-200)",
    flexShrink: 0,
  },
  cardActionsRight: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  deleteBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#dc2626",
    padding: "6px 12px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid #fecaca",
    background: "#fef2f2",
    transition: "background 0.2s, border-color 0.2s",
  },
};

export default App;
