import NoteEditor from "../home/tiptapeditor";
import { Suspense } from "react";

export default function CreateNote(){
    return(
        <Suspense fallback={<main className="min-h-screen bg-[#10172B] text-white">Loading editor...</main>}>
            <NoteEditor/>
        </Suspense>
    )
}
