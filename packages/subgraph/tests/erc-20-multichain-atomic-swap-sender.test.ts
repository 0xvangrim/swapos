import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, Bytes, BigInt } from "@graphprotocol/graph-ts"
import { AbacusConnectionManagerSet } from "../generated/schema"
import { AbacusConnectionManagerSet as AbacusConnectionManagerSetEvent } from "../generated/ERC20MultichainAtomicSwapSender/ERC20MultichainAtomicSwapSender"
import { handleAbacusConnectionManagerSet } from "../src/erc-20-multichain-atomic-swap-sender"
import { createAbacusConnectionManagerSetEvent } from "./erc-20-multichain-atomic-swap-sender-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let abacusConnectionManager = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let newAbacusConnectionManagerSetEvent = createAbacusConnectionManagerSetEvent(
      abacusConnectionManager
    )
    handleAbacusConnectionManagerSet(newAbacusConnectionManagerSetEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("AbacusConnectionManagerSet created and stored", () => {
    assert.entityCount("AbacusConnectionManagerSet", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "AbacusConnectionManagerSet",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "abacusConnectionManager",
      "0x0000000000000000000000000000000000000001"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
