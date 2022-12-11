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
    name: 'USDC',
    addresses: {
      '80001': '0xE097d6B3100777DC31B34dC2c58fB524C2e76921',
      '43113': '0x5425890298aed601595a70AB815c96711a31Bc65',
    },
    decimals: 6,
    logoURI: 'https://tokens.1inch.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
  },
]

export default tokens
