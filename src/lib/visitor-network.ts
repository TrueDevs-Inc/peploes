import "server-only";

import { isIPv4, isIPv6 } from "node:net";

import { IP_ADDRESS } from "@/lib/constants";

function ipv4AsGroups(ipv4: string): string {
  const [a = 0, b = 0, c = 0, d = 0] = ipv4.split(".").map(Number);
  const { byteValues } = IP_ADDRESS;
  return `${(a * byteValues + b).toString(16)}:${(c * byteValues + d).toString(16)}`;
}

function ipv6Groups(ip: string): number[] {
  const [address = ""] = ip.split("%", 1);
  const lastColon = address.lastIndexOf(":");
  const ipv4Tail = address.slice(lastColon + 1);
  const hex = isIPv4(ipv4Tail)
    ? `${address.slice(0, lastColon + 1)}${ipv4AsGroups(ipv4Tail)}`
    : address;
  const [head = "", tail] = hex.split("::");
  const left = head.split(":").filter(Boolean);
  const right = tail?.split(":").filter(Boolean) ?? [];
  const zeros = Array.from(
    { length: IP_ADDRESS.ipv6Groups - left.length - right.length },
    () => "0",
  );
  return [...left, ...zeros, ...right].map((group) =>
    Number.parseInt(group, 16),
  );
}

export function visitorNetwork(ip: string): string {
  if (!isIPv6(ip)) {
    return ip;
  }
  const groups = ipv6Groups(ip);
  const { mappedIpv4Marker, mappedIpv4MarkerIndex, byteValues } = IP_ADDRESS;
  const isIpv4 =
    groups.slice(0, mappedIpv4MarkerIndex).every((group) => group === 0) &&
    groups[mappedIpv4MarkerIndex] === mappedIpv4Marker;
  if (isIpv4) {
    return groups
      .slice(mappedIpv4MarkerIndex + 1)
      .flatMap((group) => [Math.trunc(group / byteValues), group % byteValues])
      .join(".");
  }
  return groups
    .slice(0, IP_ADDRESS.ipv6NetworkGroups)
    .map((group) => group.toString(16))
    .join(":");
}
