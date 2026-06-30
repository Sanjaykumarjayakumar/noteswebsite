"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { FiBookOpen, FiMail, FiPlus, FiSearch, FiX } from "react-icons/fi";
import { FaKey, FaShare, FaSignOutAlt, FaTrash, FaUserCircle } from "react-icons/fa";
import { API_BASE_URL } from "@/lib/api";
import { isStrongPassword, passwordRulesMessage } from "@/lib/passwordRules";

type Note = {
    _id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    shared?: boolean;
    attachments?: Array<{
        name?: string;
        size?: number;
        type?: string;
    }>;
};

type StoredUser = {
    _id?: string;
    name?: string;
    email?: string;
    token?: string;
    needsPasswordSetup?: boolean;
};

export default function Home() {
    const router = useRouter();
    const searchRef = useRef<HTMLDivElement>(null);
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [userName, setUserName] = useState("User");
    const [userEmail, setUserEmail] = useState("");
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [shareNote, setShareNote] = useState<Note | null>(null);
    const [includeFilesInShare, setIncludeFilesInShare] = useState(true);
    const [shareLoading, setShareLoading] = useState(false);

    const getStoredUser = (): StoredUser => JSON.parse(localStorage.getItem("user") || "{}");

    useEffect(() => {
        fetchNotes();
    }, []);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowSearch(false);
            }
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    const fetchNotes = async () => {
        try {
            const userdata = getStoredUser();
            setUserName(userdata?.name || "User");
            setUserEmail(userdata?.email || "");
            if (!userdata?.token) {
                router.replace("/login");
                return;
            }
            if (userdata.needsPasswordSetup) {
                router.replace("/login");
                return;
            }
            const res = await axios.get(`${API_BASE_URL}/api/notes`, {
                headers: { Authorization: `Bearer ${userdata.token}` },
            });
            setNotes(res.data);
        }
        catch {
            toast.error("Failed to fetch notes");
        }
        finally {
            setLoading(false);
        }
    };

    const handleCreate = () => router.push("/createnote");

    const handleDelete = async (id: string) => {
        try {
            const userdata = getStoredUser();
            await axios.delete(`${API_BASE_URL}/api/notes/${id}`, {
                headers: { Authorization: `Bearer ${userdata.token}` },
            });
            setNotes((prev) => prev.filter((note) => note._id !== id));
            toast.success("Deleted");
        }
        catch {
            toast.error("Delete failed");
        }
    };

    const openShareModal = (note: Note) => {
        setShareNote(note);
        setIncludeFilesInShare((note.attachments?.length || 0) > 0);
    };

    const closeShareModal = () => {
        if (shareLoading) return;
        setShareNote(null);
    };

    const handleShare = async () => {
        if (!shareNote) return;
        try {
            setShareLoading(true);
            const userdata = getStoredUser();
            const res = await axios.put(
                `${API_BASE_URL}/api/notes/share/${shareNote._id}`,
                { includeFiles: includeFilesInShare },
                { headers: { Authorization: `Bearer ${userdata.token}` } }
            );
            await navigator.clipboard.writeText(res.data.link);
            setNotes((prev) =>
                prev.map((note) =>
                    note._id === shareNote._id ? { ...note, shared: true } : note
                )
            );
            setShareNote((prev) => prev ? { ...prev, shared: true } : prev);
            toast.success("Link copied");
        }
        catch {
            toast.error("Share failed");
        }
        finally {
            setShareLoading(false);
        }
    };

    const removeAccess = async () => {
        if (!shareNote) return;
        try {
            setShareLoading(true);
            const userdata = getStoredUser();
            await axios.put(
                `${API_BASE_URL}/api/notes/unshare/${shareNote._id}`,
                {},
                { headers: { Authorization: `Bearer ${userdata.token}` } }
            );
            setNotes((prev) =>
                prev.map((note) =>
                    note._id === shareNote._id ? { ...note, shared: false } : note
                )
            );
            setShareNote((prev) => prev ? { ...prev, shared: false } : prev);
            toast.success("Access removed");
        }
        catch {
            toast.error("Failed to remove access");
        }
        finally {
            setShareLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        toast.success("Logged out");
        router.replace("/login");
    };

    const closePasswordModal = () => {
        setShowPasswordModal(false);
        setOldPassword("");
        setNewPassword("");
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!oldPassword || !newPassword) {
            toast.error("Fill all fields");
            return;
        }
        if (!isStrongPassword(newPassword)) {
            toast.error(passwordRulesMessage);
            return;
        }
        setPasswordLoading(true);
        try {
            const userdata = getStoredUser();
            await axios.put(
                `${API_BASE_URL}/api/auth/change-password`,
                { oldPassword, newPassword },
                { headers: { Authorization: `Bearer ${userdata.token}` } }
            );
            toast.success("Password changed");
            closePasswordModal();
        }
        catch (err: unknown) {
            toast.error(axios.isAxiosError(err) ? err.response?.data?.msg || "Password change failed" : "Password change failed");
        }
        finally {
            setPasswordLoading(false);
        }
    };

    const getTimeAgo = (date: string) => {
        const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (diff < 60) return `${diff} sec ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? "s" : ""} ago`;
        return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? "s" : ""} ago`;
    };

    const searchResults = useMemo(() => {
        if (!search.trim()) return [];
        return notes
            .filter((note) => note.title?.toLowerCase().includes(search.toLowerCase()))
            .slice(0, 5);
    }, [search, notes]);

    const passwordChecks = [
        { label: "Minimum 8 characters", valid: newPassword.length >= 8 },
        { label: "1 capital letter", valid: /[A-Z]/.test(newPassword) },
        { label: "1 special character", valid: /[^A-Za-z0-9]/.test(newPassword) },
    ];

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#10172B] text-white">
                Loading notes...
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#10172B] px-5 py-8 text-white sm:px-10">
            <div className="relative mb-10">
                <button
                    onClick={() => setShowProfileMenu(true)}
                    className="absolute right-0 top-0 z-50 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-[#16213E] text-cyan-300 transition hover:border-cyan-400 hover:bg-[#1B2A50]"
                    aria-label="Open account menu"
                >
                    <FaUserCircle size={24} />
                </button>

                <div ref={searchRef} className={`flex justify-center transition-all duration-300 ${isScrolled ? "fixed left-0 right-0 top-4 z-50 px-5 sm:px-10" : ""}`}>
                    <div className={`relative transition-all duration-300 ${isScrolled ? "w-[220px]" : "w-full max-w-[360px]"}`}>
                        <FiSearch size={isScrolled ? 14 : 20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            placeholder="Search notes..."
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setShowSearch(true);
                            }}
                            onFocus={() => setShowSearch(true)}
                            onClick={() => isScrolled && setIsScrolled(false)}
                            className={`w-full rounded-xl border border-slate-700 bg-[#16213E] pl-10 pr-4 text-sm text-white outline-none transition-all duration-300 focus:border-cyan-500 ${isScrolled ? "h-9" : "h-11"}`}
                        />
                        {showSearch && search && (
                            <div className={`absolute left-0 right-0 z-50 mt-2 max-h-[220px] overflow-y-auto rounded-xl border border-slate-700 bg-[#16213E] shadow-2xl`}>
                                {searchResults.length === 0 ? (
                                    <div className="p-4 text-slate-400">No notes found</div>
                                ) : (
                                    searchResults.map((note) => (
                                        <button
                                            key={note._id}
                                            onClick={() => {
                                                router.push(`/createnote?noteId=${note._id}`);
                                                setSearch("");
                                                setShowSearch(false);
                                            }}
                                            className="w-full border-b border-slate-800 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-800/60"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="min-w-0 flex-1 truncate font-semibold text-white">
                                                    {note.title || "Untitled"}
                                                </span>
                                                <span className="shrink-0 text-xs text-slate-500">
                                                    {getTimeAgo(note.updatedAt)}
                                                </span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {notes.length === 0 ? (
                <div className="flex min-h-[70vh] items-center justify-center">
                    <div className="text-center">
                        <FiBookOpen size={50} className="mx-auto text-blue-200" />
                        <h1 className="mt-4 text-xl font-bold">No Notes found</h1>
                    </div>
                </div>
            ) : (
                <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 ${isScrolled ? "pt-12" : ""}`}>
                    {notes.map((note) => (
                        <div
                            key={note._id}
                            onClick={() => router.push(`/createnote?noteId=${note._id}`)}
                            className="h-[190px] w-full cursor-pointer rounded-xl border border-slate-800 bg-[#16213E] p-4 transition hover:-translate-y-1 hover:border-cyan-500"
                        >
                            <div className="flex h-full flex-col">
                                <div className="flex justify-between gap-3">
                                    <h2 className="min-w-0 flex-1 truncate text-lg font-semibold text-white">
                                        {note.title || "Untitled"}
                                    </h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openShareModal(note);
                                            }}
                                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-green-400 transition hover:bg-green-500 hover:text-white"
                                            aria-label="Share note"
                                        >
                                            <FaShare className="text-sm" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(note._id);
                                            }}
                                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-red-400 transition hover:bg-red-500 hover:text-white"
                                            aria-label="Delete note"
                                        >
                                            <FaTrash className="text-sm" />
                                        </button>
                                    </div>
                                </div>
                                <p className="mt-3 line-clamp-3 break-words text-sm leading-5 text-slate-300">
                                    {note.content?.replace(/<[^>]+>/g, "")?.trim() || "No content"}
                                </p>
                                <p className="mt-auto text-right text-[11px] text-slate-500">
                                    {getTimeAgo(note.updatedAt)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button
                onClick={handleCreate}
                className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-400 text-black shadow-xl transition hover:scale-105 hover:bg-cyan-300"
                aria-label="Create note"
            >
                <FiPlus size={24} />
            </button>

            {showProfileMenu && (
                <>
                    <div onClick={() => setShowProfileMenu(false)} className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-[2px]" />
                    <aside className="fixed right-0 top-0 z-[100] flex h-screen w-[340px] max-w-[92vw] flex-col border-l border-slate-700/70 bg-[#111A31] shadow-2xl">
                        <div className="border-b border-slate-800 p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
                                    <FaUserCircle size={32} />
                                </div>
                                <button
                                    onClick={() => setShowProfileMenu(false)}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
                                    aria-label="Close account menu"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>
                            <div className="mt-5 space-y-3">
                                <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0D1528] p-3">
                                    <FaUserCircle className="shrink-0 text-cyan-300" />
                                    <p className="min-w-0 truncate text-sm font-medium text-white">{userName}</p>
                                </div>
                                <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-[#0D1528] p-3">
                                    <FiMail className="mt-0.5 shrink-0 text-cyan-300" />
                                    <p className="break-all text-sm leading-5 text-slate-300">{userEmail}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 p-6">
                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        setShowPasswordModal(true);
                                        setShowProfileMenu(false);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-[#0D1528] p-3 text-left transition hover:border-cyan-400/70 hover:bg-[#14213D]"
                                >
                                    <FaKey className="shrink-0 text-cyan-300" />
                                    <span className="text-sm font-medium text-white">Change password</span>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-left text-red-300 transition hover:bg-red-500 hover:text-white"
                                >
                                    <FaSignOutAlt className="shrink-0" />
                                    <span className="text-sm font-medium">Logout</span>
                                </button>
                            </div>
                        </div>
                    </aside>
                </>
            )}

            {shareNote && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm">
                    <div className="w-full max-w-[420px] rounded-2xl border border-slate-700 bg-[#111A31] p-6 text-white shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <h2 className="text-xl font-semibold">Share note</h2>
                                <p className="mt-1 truncate text-sm text-slate-400">{shareNote.title || "Untitled"}</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeShareModal}
                                disabled={shareLoading}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-60"
                                aria-label="Close share modal"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        <label className="mt-6 flex items-center gap-3 rounded-xl border border-slate-700 bg-[#0D1528] p-3 text-sm">
                            <input
                                type="checkbox"
                                checked={includeFilesInShare}
                                disabled={(shareNote.attachments?.length || 0) === 0 || shareLoading}
                                onChange={(e) => setIncludeFilesInShare(e.target.checked)}
                            />
                            <span>Include files</span>
                        </label>

                        <div className="mt-6 flex flex-wrap justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeShareModal}
                                disabled={shareLoading}
                                className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-60"
                            >
                                Cancel
                            </button>
                            {shareNote.shared && (
                                <button
                                    type="button"
                                    onClick={removeAccess}
                                    disabled={shareLoading}
                                    className="rounded-xl border border-red-500/40 px-4 py-2 text-red-300 transition hover:bg-red-500 hover:text-white disabled:opacity-60"
                                >
                                    Remove access
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleShare}
                                disabled={shareLoading}
                                className="rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-60"
                            >
                                {shareLoading ? "Working..." : "Copy link"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPasswordModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm">
                    <form onSubmit={handleChangePassword} className="w-full max-w-[420px] rounded-2xl border border-slate-700 bg-[#111A31] p-6 shadow-2xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-white">Change password</h2>
                            </div>
                            <button
                                type="button"
                                onClick={closePasswordModal}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
                                aria-label="Close password modal"
                            >
                                <FiX size={20} />
                            </button>
                        </div>
                        <div className="mt-6 space-y-4">
                            <input
                                type="password"
                                value={oldPassword}
                                placeholder="Old password"
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="w-full rounded-xl border border-slate-700 bg-[#0D1528] p-3 text-white outline-none focus:border-cyan-400"
                            />
                            <input
                                type="password"
                                value={newPassword}
                                placeholder="New password"
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full rounded-xl border border-slate-700 bg-[#0D1528] p-3 text-white outline-none focus:border-cyan-400"
                            />
                            <div className="space-y-1 text-xs leading-5">
                                {passwordChecks.map((check) => (
                                    <p key={check.label} className={check.valid ? "text-green-400" : "text-slate-500"}>
                                        {check.label}
                                    </p>
                                ))}
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={closePasswordModal}
                                className="flex-1 rounded-xl border border-slate-700 p-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={passwordLoading}
                                className="flex-1 rounded-xl bg-cyan-400 p-3 font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-60"
                            >
                                {passwordLoading ? "Updating..." : "Update"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    );
}
