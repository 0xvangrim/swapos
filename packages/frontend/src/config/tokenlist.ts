interface Token {
  name: string
  symbol: string
  addresses: { [chainId: number]: string }
  decimals: number
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
  },
  {
    symbol: 'BUSD',
    name: 'BUSD',
    addresses: {
      '80001': '0x8FF61D7466752700dA43184Aa0c06F6e558B543b',
    },
    decimals: 18,
  },
]

export default tokens
