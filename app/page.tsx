import { PrimeReactProvider } from "primereact/api";
import parseTorrent from "parse-torrent";
import prisma from "./db";
import TorrentForm from "./torrentForm";

export default function Home() {
  async function upload(data: FormData) {
    "use server";

    const file: File | null = data.get("file") as unknown as File;
    if (!file) {
      throw new Error("No file uploaded");
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const torrent = await parseTorrent(buffer);
    console.log(`torrent info hash: ${torrent.infoHash}`);
    if (!torrent.infoHash) {
      throw new Error("Invalid torrent file");
    }
    await prisma.torrent.create({
      data: {
        infoHash: torrent.infoHash,
        name: file.name,
      },
    });
    return { success: true };
  }
  return (
    <PrimeReactProvider>
      <main>
        <TorrentForm upload={upload} />
      </main>
    </PrimeReactProvider>
  );
}
