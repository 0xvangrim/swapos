export function shortenAddress(address: any, digits = 4) {
  return `${address.substring(0, digits + 33)}...`
}
