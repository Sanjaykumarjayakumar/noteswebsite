"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import { FiFile, FiFileText, FiLock, FiPaperclip } from "react-icons/fi";

type SharedAttachment = {
  name: string;
  type: string;
  size: number;
  accessToken: string;
};

type SharedNoteData = {
  title: string;
  content: string;
  attachments: SharedAttachment[];
};

const formatFileSize = (size = 0) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export default function SharedNote() {
  const params = useParams();
  const token = typeof params?.id === "string" ? params.id : "";
  const [note, setNote] = useState<SharedNoteData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    const fetchNote = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/notes/public/${token}`);
        setNote(res.data);
        setError("");
      }
      catch {
        setError("Access removed or note not found");
      }
    };

    fetchNote();
  }, [token]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#10172B] px-5 py-10 text-white">
        <section className="w-full max-w-[420px] rounded-2xl border border-red-500/30 bg-[#111A31] p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-300">
            <FiLock size={24} />
          </div>
          <h1 className="mt-5 text-2xl font-semibold">No access</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">{error}</p>
        </section>
      </main>
    );
  }

  if (!note) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#10172B] px-5 py-10 text-white">
        <div className="rounded-2xl border border-slate-700 bg-[#111A31] px-6 py-4 text-sm text-slate-300 shadow-2xl">
          Loading shared note...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#10172B] px-5 py-8 text-white sm:px-10">
      <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-800 bg-[#111A31] p-6 shadow-2xl sm:p-8">
        <div className="mb-8 flex items-center gap-2 text-lg font-semibold text-cyan-300">
          <FiFileText />
          <span>Shared note</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="min-w-0 space-y-8">
            <div>
              <p className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">Note title</p>
              <h1 className="break-words text-4xl font-bold leading-tight text-white sm:text-5xl">
                {note.title || "Untitled Note"}
              </h1>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">Note content</p>
              <article
                className="prose prose-invert max-w-none break-words text-slate-200 prose-p:text-slate-200 prose-li:text-slate-200 prose-strong:text-white prose-headings:text-white"
                dangerouslySetInnerHTML={{
                  __html: note.content || "<p>No content</p>",
                }}
              />
            </div>
          </section>

          <aside className="rounded-2xl border border-slate-800 bg-[#0D1528] p-5">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <FiPaperclip className="text-cyan-300" />
              <h2>Attachments</h2>
            </div>

            {note.attachments.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                No files included with this share.
              </p>
            ) : (
              <div className="space-y-3">
                {note.attachments.slice(0, 5).map((attachment, index) => (
                  <a
                    key={`${attachment.name}-${attachment.accessToken}`}
                    href={`http://localhost:5000/api/notes/public/${token}/attachment/${index}/${attachment.accessToken}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#10172B] p-3 transition hover:border-cyan-400 hover:bg-[#14213D]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                      <FiFile />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-white">
                        {attachment.name || "File"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatFileSize(attachment.size)}
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
