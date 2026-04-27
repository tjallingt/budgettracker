import { useState } from "react";

export default function Home() {
  const [handle, setHandle] = useState<FileSystemFileHandle | null>(null);
  const [content, setContent] = useState("");

  function handleOpen() {
    openFile()
      .then(({ handle, content }) => {
        setHandle(handle);
        setContent(content);
      })
      .catch((error) => console.error(error));
  }

  function handleSave() {
    if (handle === null) return;
    saveFile(handle, '{"test": 123}').catch((error) => console.error(error));
  }

  return (
    <>
      <div>Test</div>

      {handle === null ? (
        <button onClick={handleOpen}>Open file</button>
      ) : (
        <button onClick={handleSave}>Save file</button>
      )}
    </>
  );
}

const OPEN_FILE_OPTIONS: OpenFilePickerOptions = {
  multiple: false,
  types: [
    {
      description: "Json Files",
      accept: { "application/json": [".json"] },
    },
  ],
};

async function openFile(): Promise<{
  handle: FileSystemFileHandle;
  content: string;
}> {
  const [handle] = await window.showOpenFilePicker(OPEN_FILE_OPTIONS);
  const file = await handle.getFile();
  const content = await file.text();
  return { handle, content };
}

async function saveFile(handle: FileSystemFileHandle, content: string) {
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}
