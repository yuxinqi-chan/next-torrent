-- CreateTable
CREATE TABLE "Torrent" (
    "id" SERIAL NOT NULL,
    "infoHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "leechers" INTEGER NOT NULL,
    "seeders" INTEGER NOT NULL,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "approval" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Torrent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Peer" (
    "id" SERIAL NOT NULL,
    "peerId" TEXT NOT NULL,
    "torrentId" INTEGER NOT NULL,
    "ip" TEXT NOT NULL,
    "ipv4" TEXT,
    "ipv6" TEXT,
    "port" INTEGER NOT NULL,
    "uploaded" INTEGER NOT NULL,
    "downloaded" INTEGER NOT NULL,
    "left" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Peer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Torrent_infoHash_key" ON "Torrent"("infoHash");

-- CreateIndex
CREATE UNIQUE INDEX "Peer_peerId_torrentId_key" ON "Peer"("peerId", "torrentId");

-- AddForeignKey
ALTER TABLE "Peer" ADD CONSTRAINT "Peer_torrentId_fkey" FOREIGN KEY ("torrentId") REFERENCES "Torrent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
