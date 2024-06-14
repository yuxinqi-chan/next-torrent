"use client";
import { FileUpload } from "primereact/fileupload";
import { Editor } from "primereact/editor";
import { useState } from "react";
import { InputText } from "primereact/inputtext";
import { FloatLabel } from "primereact/floatlabel";
import { Button } from "primereact/button";

interface TorrentFormProps {
  upload: (data: FormData) => Promise<{ success: boolean }>;
}
export default function TorrentForm({ upload }: TorrentFormProps) {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  return (
    <form action={upload} className="flex flex-column row-gap-4">
      <FileUpload
        mode="basic"
        multiple={false}
        pt={{
          input: {
            name: "file",
          },
        }}
        accept=".torrent"
        maxFileSize={1000000}
        chooseLabel="选择种子文件"
        customUpload
      />
      <FloatLabel>
        <InputText
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full"
        />
        <label htmlFor="content">标题</label>
      </FloatLabel>
      <Editor
        name="content"
        value={content}
        onTextChange={(e) => setContent(e.htmlValue || "")}
        style={{ height: "320px" }}
      />
      <Button type="submit" label="提交" className="align-self-center" />
    </form>
  );
}
