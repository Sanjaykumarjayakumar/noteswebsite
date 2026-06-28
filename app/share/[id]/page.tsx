"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useSearchParams } from "next/navigation";

export default function SharedNote() {

  const params =
    useParams();
  const searchParams = useSearchParams();

  const [note, setNote] =
    useState<any>(null);

  useEffect(() => {

    if (!params?.id)
      return;

    fetchNote();

  }, [params, searchParams]);

  const fetchNote =
    async () => {

      try {
        const includeFiles = searchParams.get("includeFiles") === "true";

        const res =
          await axios.get(
            `http://localhost:5000/api/notes/share/${params.id}?includeFiles=${includeFiles}`
          );

        setNote(
          res.data
        );

      }

      catch {

        alert(
          "Note not found"
        );

      }

    };

  if (!note) {

    return (
      <div className="text-white p-10">
        Loading...
      </div>
    );

  }

  return (

    <main className="bg-black min-h-screen p-8 text-white">

      <h1 className="text-4xl mb-5">

        {note.title}

      </h1>

      <div
        dangerouslySetInnerHTML={{
          __html:
            note.content,
        }}
      />

      {note.attachments?.length > 0 && (
        <div className="mt-8 rounded-lg border border-gray-700 bg-gray-900 p-4">
          <h2 className="mb-3 text-lg font-semibold">Shared attachments</h2>
          <ul className="space-y-2">
            {note.attachments.map((attachment: any, index: number) => (
              <li key={`${attachment.name}-${index}`}>
                <a
                  href={`http://localhost:5000/api/notes/share/${params.id}/attachment/${index}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 underline"
                >
                  {attachment.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

    </main>

  );

}