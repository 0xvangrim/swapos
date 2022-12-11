interface Token {
  name: string
  symbol: string
  addresses: { [chainId: number]: string }
  decimals: number
  logoURI: string
}

const tokens: Token[] = [
  {
    symbol: 'USDC',
    name: ' USDC',
    addresses: { '80001': '0xE097d6B3100777DC31B34dC2c58fB524C2e76921' },
    decimals: 6,
    logoURI: 'https://tokens.1inch.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
  },
  {
    symbol: 'JUP',
    name: 'Jupyter',
    addresses: { '1287': '0x9Aac6FB41773af877a2Be73c99897F3DdFACf576' },
    decimals: 18,
    logoURI: 'https://moonbase.moonscan.io/images/main/empty-token.png',
  },
]

export default tokens
