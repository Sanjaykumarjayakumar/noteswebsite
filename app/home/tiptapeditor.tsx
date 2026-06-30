"use client";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { FaShare } from "react-icons/fa";
import { FaTrash } from "react-icons/fa";
import { FaArrowLeft, FaBold, FaItalic, FaHighlighter, FaListUl, FaListOl, FaUndo, FaRedo } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";
type Note = {
  _id: string,
  title: string,
  content: string,
  createdAt: string,
  updatedAt: string
};
type Attachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
};
export default function NoteEditor() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const searchParams = useSearchParams();
  const queryNoteId = searchParams.get("noteId");
  const [noteId, setNoteId] = useState<string | null>(queryNoteId);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: "",
  });
  const [, setTick] = useState(0);
  const [shared, setShared] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [includeFilesInShare, setIncludeFilesInShare] = useState(true);
  const [shareLoading, setShareLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const convertFileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const nextAttachments = await Promise.all(
      files.map(async (file) => ({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: await convertFileToDataUrl(file),
      }))
    );
    setAttachments((prev) => [...prev, ...nextAttachments]);
    event.target.value = "";
  };
  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  };
  const openAttachment = async (attachment: Attachment) => {
    try {
      if (!attachment.dataUrl) {
        alert("File not found");
        return;
      }
      const response = await fetch(attachment.dataUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 10000);
    }
    catch (err) {
      toast.error("Unable to open file");
    }
  };
  useEffect(() => {
    if (!editor) return;
    const update = () => setTick((t) => t + 1);
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    editor.on("focus", update);
    editor.on("blur", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
      editor.off("focus", update);
      editor.off("blur", update);
    };
  }, [editor]);
  useEffect(() => {
    if (!editor) return;
    const scheduleSave = () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
      setSaved(false);
      saveTimer.current = setTimeout(() => {
        autoSave();
      }, 1000);
    };
    editor.on("update", scheduleSave);
    return () => {
      editor.off("update", scheduleSave);
    };
  }, [editor, title, noteId, attachments]);
  useEffect(() => {
    if (!editor || !queryNoteId) return;
    if (noteId && noteId !== queryNoteId) return;
    const loadNote = async () => {
      try {
        const userdata = JSON.parse(localStorage.getItem("user") || "{}");
        if (!userdata?.token) {
          router.replace("/login");
          return;
        }
        const res = await axios.get(
          `http://localhost:5000/api/notes/${queryNoteId}`,
          {
            headers: { Authorization: `Bearer ${userdata.token}` },
          }
        );
        const note = res.data;
        setTitle(note.title || "");
        editor.commands.setContent(note.content || "");
        setShared(Boolean(note.shared));
        setAttachments(
          (note.attachments || []).map((item: any, index: number) => ({
            id: item._id || `${item.name}-${index}`,
            name: item.name,
            size: item.size,
            type: item.type,
            dataUrl:
              item.data
                ? `data:${item.type};base64,${item.data}`
                : "",
          }))
        );
        setNoteId(note._id);
      }
      catch (err) {
        console.log(err);
      }
    };
    loadNote();
  }, [editor, queryNoteId, noteId, router]);
  useEffect(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }
    setSaved(false);
    saveTimer.current = setTimeout(() => {
      autoSave();
    }, 1000);
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, [title, attachments]);
  const autoSave = async () => {
    if (!editor) return;
    const content = editor.getHTML();
    const effectiveTitle = title.trim() || "Untitled Note";
    const hasContent =
      content !== "<p></p>" && content.replace(/<[^>]*>/g, "").trim() !== "";
    if (!hasContent && attachments.length === 0) {
      return;
    }
    try {
      setSaving(true);
      const userdata = JSON.parse(
        localStorage.getItem("user") || "{}"
      );
      if (!userdata?.token) {
        router.replace("/login");
        return;
      }
      if (!noteId) {
        const res = await axios.post("http://localhost:5000/api/notes",
          {
            title: effectiveTitle,
            content,
            attachments: attachments.map(({ name, size, type, dataUrl }) => ({
              name,
              size,
              type,
              data: dataUrl.split(",")[1]
            })),
          },
          {
            headers: {
              Authorization: `Bearer ${userdata.token}`,
            },
          }
        );
        setNoteId(res.data._id);
      }
      else {
        await axios.put(`http://localhost:5000/api/notes/${noteId}`,
          {
            title: effectiveTitle,
            content,
            attachments: attachments.map(({ name, size, type, dataUrl }) => ({
              name,
              size,
              type,
              data: dataUrl.split(",")[1]
            })),
          },
          {
            headers: {
              Authorization: `Bearer ${userdata.token}`,
            },
          }
        );
      }
      setSaved(true);
    }
    catch (err) {
      console.log(err);
    }
    finally {
      setSaving(false);
    }
  };
  const handleBack = () => {
    router.push("/home");
  };
  const handleDelete = async () => {
    try {
      if (!noteId) {
        alert("Save note first");
        return;
      }
      const userdata = JSON.parse(localStorage.getItem("user") || "{}");
      if (!userdata?.token) {
        router.replace("/login");
        return;
      }
      await axios.delete(`http://localhost:5000/api/notes/${noteId}`,
        {
          headers: {
            Authorization: `Bearer ${userdata.token}`
          }
        }
      );
      alert("Deleted");
      router.push("/home");
    }
    catch (err) {
      alert("Failed to delete");
    }
  };
  const handleShare = async (
includeFiles:boolean
)=>{

try{

if(!noteId){

toast.error(
"Save note first"
);

return;

}

const user=
JSON.parse(
localStorage.getItem(
"user"
)||"{}"
);

setShareLoading(true);

const res=
await axios.put(

`http://localhost:5000/api/notes/share/${noteId}`,

{
includeFiles
},

{
headers:{
Authorization:
`Bearer ${user.token}`
}
}

);

await navigator
.clipboard
.writeText(
res.data.link
);

setShared(true);

setShowShareModal(false);

toast.success(
"Link copied"
);

}
catch{

toast.error(
"Share failed"
);

}
finally{

setShareLoading(false);

}

};
  const removeAccess = async () => {
    try {
      if (!noteId) {
        toast.error("Save note first");
        return;
      }
      const userdata = JSON.parse(localStorage.getItem("user") || "{}");
      if (!userdata?.token) {
        router.replace("/login");
        return;
      }
      setShareLoading(true);
      await axios.put(`http://localhost:5000/api/notes/unshare/${noteId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${userdata.token}`,
          },
        }
      );
      setShared(false);
      setShowShareModal(false);
      toast.success("Access removed");
    }
    catch (err) {
      toast.error("Failed to remove access");
    }
    finally {
      setShareLoading(false);
    }
  };
  const btn =
    "h-10 min-w-[40px] rounded-xl border border-slate-700 bg-[#10172B] px-3 text-slate-300 hover:border-cyan-500 hover:text-white transition";

  const active =
    "border-cyan-500 bg-cyan-600 text-white";

  const normal =
    btn;
  if (!editor) return null;
  return (
    <div className="min-h-screen bg-[#10172B] p-6">

      <div className="mx-auto max-w-7xl px-4">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">

          <button
            onClick={handleBack}
            className="
flex
h-11
w-11
items-center
justify-center
rounded-full
border
border-slate-700
bg-[#16213E]
text-white
hover:border-cyan-500
"
          >
            <FaArrowLeft />
          </button>

          <div className="flex items-center gap-3">

            <span
              className={`text-sm ${saving
                  ? "text-yellow-400"
                  : saved
                    ? "text-cyan-400"
                    : "text-slate-500"
                }`}
            >
              {saving
                ? "Saving..."
                : saved
                  ? "Saved"
                  : ""}
            </span>

            <button
              onClick={() => {
                setIncludeFilesInShare(attachments.length > 0)
                setShowShareModal(true)
              }}
              className="
flex
h-10
w-10
items-center
justify-center
rounded-xl
bg-[#16213E]
text-green-400
hover:bg-green-500
hover:text-white
"
            >
              <FaShare />
            </button>

            <button
              onClick={handleDelete}
              className="
flex
h-10
w-10
items-center
justify-center
rounded-xl
bg-[#16213E]
text-red-400
hover:bg-red-500
hover:text-white
"
            >
              <FaTrash />
            </button>

          </div>

        </div>

        {/* Title */}

        {/* Title */}

        <div className="mb-8 px-4 lg:px-8">

          {isEditingTitle ? (

            <input
              autoFocus
              type="text"
              value={title}
              placeholder="Untitled Note"
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              className="
w-[80%]
bg-transparent
text-[32px]
font-bold
leading-tight
text-white
outline-none
truncate
"
            />

          ) : (

            <h1
              onClick={() => setIsEditingTitle(true)}
              className="
cursor-text
w-[80%]
truncate
text-[32px]
font-bold
leading-tight
text-white
"
            >
              {title || "Untitled Note"}
            </h1>

          )}

        </div>

        <div className="flex flex-col gap-6 lg:flex-row">

          {/* Editor */}

          <div
            className="
flex-1
overflow-hidden
rounded-[30px]
border
border-slate-800
bg-[#16213E]
"
          >

            {/* Toolbar */}

            <div
              className="
flex
gap-2
overflow-x-auto
border-b
border-slate-700
p-3
"
            >

              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor.chain().focus().toggleBold().run()
                }}
                className={`${btn} ${editor.isActive("bold") ? active : normal}`}
              >
                <FaBold />
              </button>

              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor.chain().focus().toggleItalic().run()
                }}
                className={`${btn} ${editor.isActive("italic") ? active : normal}`}
              >
                <FaItalic />
              </button>

              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor.chain().focus().toggleUnderline().run()
                }}
                className={normal}
              >
                U
              </button>

              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor.chain().focus().toggleHighlight().run()
                }}
                className={normal}
              >
                <FaHighlighter />
              </button>

              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor.chain().focus().toggleBulletList().run()
                }}
                className={normal}
              >
                <FaListUl />
              </button>

              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor.chain().focus().toggleOrderedList().run()
                }}
                className={normal}
              >
                <FaListOl />
              </button>

              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor.chain().focus().undo().run()
                }}
                className={normal}
              >
                <FaUndo />
              </button>

              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor.chain().focus().redo().run()
                }}
                className={normal}
              >
                <FaRedo />
              </button>

            </div>

            {/* Content */}

            <div
              className="
min-h-[700px]
px-4
py-4
text-white
break-words
whitespace-pre-wrap
"
            >
              <EditorContent editor={editor} />
            </div>

          </div>

          {/* Attachments */}

          <aside
            className="
w-full
lg:w-[350px]
rounded-[30px]
border
border-slate-800
bg-[#16213E]
p-6
text-white
flex
flex-col
"
          >

            <div className="mb-6 flex items-center justify-between flex-shrink-0">

              <h2 className="text-lg font-semibold">
                Attachments
              </h2>

              <button
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="
rounded-xl
border
border-slate-700
bg-transparent
text-slate-400
hover:text-cyan-500
hover:border-cyan-500
transition
p-2
flex
items-center
justify-center
"
              >
                <FiPlus size={20} />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="application/pdf,image/*"
                className="hidden"
                onChange={handleFileUpload}
              />

            </div>

            {attachments.length === 0 ? (

              <div className="text-center py-6 border-2 border-dashed border-slate-700 rounded-xl flex-shrink-0">

                <div className="mb-2 flex justify-center">

                  <svg
                    className="w-10 h-10 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />

                  </svg>

                </div>

                <p className="text-slate-300 font-medium text-sm">
                  No files attached yet
                </p>

              </div>

            ) : (

              <div className="flex-1 min-h-0 max-h-[320px] overflow-y-auto mb-6">

                <ul className="space-y-2">

                  {attachments.map((attachment) => (

                    <li
                      key={attachment.id}
                      className="
rounded-xl
border
border-slate-700
bg-[#10172B]
p-2
flex
items-center
justify-between
gap-2
flex-shrink-0
"
                    >

                      <button
                        onClick={() =>
                          openAttachment(
                            attachment
                          )
                        }
                        className="flex-1 text-left hover:text-cyan-400 transition min-w-0"
                      >

                        <div className="truncate text-white font-medium text-sm">
                          {attachment.name}
                        </div>

                        <div className="text-xs text-slate-400">
                          {(attachment.size / 1024).toFixed(1)} KB
                        </div>

                      </button>

                      <button
                        onClick={() =>
                          handleRemoveAttachment(
                            attachment.id
                          )
                        }
                        className="
text-red-400
hover:text-red-300
transition
flex-shrink-0
p-1
"
                      >
                        <FaTrash size={14} />
                      </button>

                    </li>

                  ))}

                </ul>

              </div>

            )}

            {/* Tip Section */}

            <div className="mt-4 border-t border-slate-700 pt-4">

              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">

                <div className="flex gap-2 items-start">

                  <svg
                    className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >

                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />

                  </svg>

                  <div>

                    <p className="text-xs font-medium text-cyan-400 mb-1">Tip</p>

                    <p className="text-xs text-slate-400">
                      You can upload PDF and image files to keep them with your note.
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </aside>

        </div>

      </div>

      {/* Share Modal */}

      {showShareModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70">

          <div
            className="
w-[380px]
rounded-[30px]
border
border-slate-800
bg-[#16213E]
p-6
text-white
"
          >

            <h3 className="mb-4 text-xl">
              Share note
            </h3>

            <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#10172B] p-3">

              <input
                type="checkbox"
                checked={includeFilesInShare}
                disabled={attachments.length === 0 || shareLoading}
                onChange={(e) =>
                  setIncludeFilesInShare(
                    e.target.checked
                  )
                }
              />

              <span>
                Include files
              </span>

            </label>

            <div className="mt-6 flex flex-wrap justify-end gap-3">

              <button
                disabled={shareLoading}
                onClick={() =>
                  setShowShareModal(false)
                }
                className="
rounded-xl
bg-slate-700
px-4
py-2
"
              >
                Cancel
              </button>

              {shared && (
                <button
                  disabled={shareLoading}
                  onClick={removeAccess}
                  className="
rounded-xl
border
border-red-500/40
px-4
py-2
text-red-300
hover:bg-red-500
hover:text-white
disabled:opacity-60
"
                >
                  Remove access
                </button>
              )}

              <button
                disabled={shareLoading}
                onClick={() =>
                  handleShare(
                    includeFilesInShare
                  )
                }
                className="
rounded-xl
bg-cyan-500
px-4
py-2
text-black
disabled:opacity-60
"
              >
                {shareLoading ? "Working..." : "Copy link"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}
