import queryString from "query-string";
import z from "zod";
import bencode from "bencode";
import prisma from "../db";
import dayjs from "dayjs";
import ip from "ip";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const searchParams = queryString.parse(url.search, { decode: false });
  const params = z
    .object({
      passkey: z.string(),
      info_hash: z.string().transform(decodeInfohash),
      peer_id: z.string(),
      event: z.enum(["started", "completed", "stopped"]).optional(),
      port: z.coerce.number().int().min(1).max(65535),
      downloaded: z.coerce.number().default(0),
      uploaded: z.coerce.number().default(0),
      left: z.coerce.number(),
      compact: z.coerce.number().int().default(0),
      no_peer_id: z.coerce.number().default(0),
      ip: z.string().optional(),
      ipv4: z.string().optional(),
      ipv6: z
        .string()
        .transform((v) => decodeURIComponent(v))
        .optional(),
      num_want: z.coerce.number().default(50),
    })
    .parse(searchParams);
  const realIp = request.headers.get("x-forwarded-for");
  console.log(realIp, params);
  if (!realIp) {
    return err("no ip");
  }
  if (z.string().ip({ version: "v4" }).safeParse(realIp).success) {
    params.ipv4 = realIp;
  }
  if (z.string().ip({ version: "v6" }).safeParse(realIp).success) {
    params.ipv6 = realIp;
  }
  // check is reannounce
  //   check passkey
  // check torrent
  const torrent = await prisma.torrent.findFirst({
    where: { infoHash: params.info_hash },
  });
  if (!torrent) {
    return err("torrent not registered with this tracker");
  }
  if (torrent.banned) {
    return err("torrent banned");
  }
  if (torrent.approval === false) {
    return err("torrent not approved");
  }
  // get peer list
  const isSeeder = params.left === 0;
  const peerList = await prisma.peer.findMany({
    where: {
      torrentId: torrent.id,
      left: isSeeder ? { not: 0 } : undefined,
      peerId: { not: params.peer_id },
    },
    take: params.num_want,
  });
  let announceInterval = 1800;
  if (dayjs(torrent.createdAt).isBefore(dayjs().subtract(30, "day"))) {
    announceInterval = 3600;
  }
  if (dayjs(torrent.createdAt).isBefore(dayjs().subtract(7, "day"))) {
    announceInterval = 2700;
  }
  const repDict: Record<string, any> = {
    interval: announceInterval,
    "min interval": 300,
    complete: torrent.seeders,
    incomplete: torrent.leechers,
  };
  if (params.compact === 0) {
    repDict.peers = peerList
      .filter(params.ipv6 ? (peer) => peer.ipv6 : (peer) => peer.ipv4)
      .map((peer) => {
        return {
          ip: peer.ip,
          port: peer.port,
          peerId: params.no_peer_id === 0 ? peer.peerId : undefined,
        };
      });
  } else {
    const peers = peerList
      .filter((peer) => peer.ipv4)
      .map((peer) => {
        return Buffer.concat([
          ip.toBuffer(peer.ipv4!),
          portToBuffer(peer.port),
        ]);
      });
    const peers6 = peerList
      .filter((peer) => peer.ipv6)
      .map((peer) => {
        return Buffer.concat([
          ip.toBuffer(peer.ipv6!),
          portToBuffer(peer.port),
        ]);
      });
    repDict.peers = Buffer.concat(peers);
    repDict.peers6 = Buffer.concat(peers6);
  }
  if (params.event === "stopped") {
    await prisma.peer.deleteMany({
      where: {
        peerId: params.peer_id,
        torrentId: torrent.id,
      },
    });
  }
  const currentPeer = await prisma.peer.findFirst({
    where: {
      peerId: params.peer_id,
      torrentId: torrent.id,
    },
  });
  if (!currentPeer) {
    await prisma.peer.create({
      data: {
        peerId: params.peer_id,
        torrentId: torrent.id,
        ip: realIp,
        ipv4: params.ipv4,
        ipv6: params.ipv6,
        port: params.port,
        uploaded: params.uploaded,
        downloaded: params.downloaded,
        left: params.left,
      },
    });
  } else {
    await prisma.peer.update({
      where: {
        id: currentPeer.id,
      },
      data: {
        ip: realIp,
        ipv4: params.ipv4,
        ipv6: params.ipv6,
        port: params.port,
        uploaded: params.uploaded,
        downloaded: params.downloaded,
        left: params.left,
      },
    });
  }
  return new Response(bencode.encode(repDict), {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
function decodeInfohash(infohash: string) {
  // 将百分号编码的字符串转换为十六进制字符串
  let hexString = "";
  for (let i = 0; i < infohash.length; i++) {
    if (infohash[i] === "%") {
      // 获取百分号后面的两个字符
      const hex = infohash.substring(i + 1, i + 3);
      hexString += hex;
      // 跳过这两个字符
      i += 2;
    } else {
      // 将非百分号编码字符转换为十六进制
      const hex = infohash.charCodeAt(i).toString(16);
      hexString += hex.padStart(2, "0"); // 确保每个字符用两个十六进制数字表示
    }
  }
  return hexString;
}
function err(msg: string) {
  const body = bencode.encode({ "failure reason": msg });
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

function portToBuffer(port: number) {
  // 创建一个长度为2的Buffer
  const buffer = Buffer.alloc(2);
  // 将端口号写入Buffer
  buffer.writeUInt16BE(port, 0);
  return buffer;
}
