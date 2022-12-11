import { newMockEvent } from "matchstick-as"
import { ethereum, Address, Bytes, BigInt } from "@graphprotocol/graph-ts"
import {
  AbacusConnectionManagerSet,
  HTLCERC20Created,
  HTLCERC20Refunded,
  HTLCERC20Withdrawn,
  Initialized,
  InterchainGasPaymasterSet,
  OwnershipTransferred,
  RemoteRouterEnrolled
} from "../generated/ERC20MultichainAtomicSwapSender/ERC20MultichainAtomicSwapSender"

export function createAbacusConnectionManagerSetEvent(
  abacusConnectionManager: Address
): AbacusConnectionManagerSet {
  let abacusConnectionManagerSetEvent = changetype<AbacusConnectionManagerSet>(
    newMockEvent()
  )

  abacusConnectionManagerSetEvent.parameters = new Array()

  abacusConnectionManagerSetEvent.parameters.push(
    new ethereum.EventParam(
      "abacusConnectionManager",
      ethereum.Value.fromAddress(abacusConnectionManager)
    )
  )

  return abacusConnectionManagerSetEvent
}

export function createHTLCERC20CreatedEvent(
  htlcId: Bytes,
  sender: Address,
  senderToken: Address,
  receiverToken: Address,
  receiverDomain: BigInt
): HTLCERC20Created {
  let htlcerc20CreatedEvent = changetype<HTLCERC20Created>(newMockEvent())

  htlcerc20CreatedEvent.parameters = new Array()

  htlcerc20CreatedEvent.parameters.push(
    new ethereum.EventParam("htlcId", ethereum.Value.fromFixedBytes(htlcId))
  )
  htlcerc20CreatedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )
  htlcerc20CreatedEvent.parameters.push(
    new ethereum.EventParam(
      "senderToken",
      ethereum.Value.fromAddress(senderToken)
    )
  )
  htlcerc20CreatedEvent.parameters.push(
    new ethereum.EventParam(
      "receiverToken",
      ethereum.Value.fromAddress(receiverToken)
    )
  )
  htlcerc20CreatedEvent.parameters.push(
    new ethereum.EventParam(
      "receiverDomain",
      ethereum.Value.fromUnsignedBigInt(receiverDomain)
    )
  )

  return htlcerc20CreatedEvent
}

export function createHTLCERC20RefundedEvent(htlcId: Bytes): HTLCERC20Refunded {
  let htlcerc20RefundedEvent = changetype<HTLCERC20Refunded>(newMockEvent())

  htlcerc20RefundedEvent.parameters = new Array()

  htlcerc20RefundedEvent.parameters.push(
    new ethereum.EventParam("htlcId", ethereum.Value.fromFixedBytes(htlcId))
  )

  return htlcerc20RefundedEvent
}

export function createHTLCERC20WithdrawnEvent(
  htlcId: Bytes
): HTLCERC20Withdrawn {
  let htlcerc20WithdrawnEvent = changetype<HTLCERC20Withdrawn>(newMockEvent())

  htlcerc20WithdrawnEvent.parameters = new Array()

  htlcerc20WithdrawnEvent.parameters.push(
    new ethereum.EventParam("htlcId", ethereum.Value.fromFixedBytes(htlcId))
  )

  return htlcerc20WithdrawnEvent
}

export function createInitializedEvent(version: i32): Initialized {
  let initializedEvent = changetype<Initialized>(newMockEvent())

  initializedEvent.parameters = new Array()

  initializedEvent.parameters.push(
    new ethereum.EventParam(
      "version",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(version))
    )
  )

  return initializedEvent
}

export function createInterchainGasPaymasterSetEvent(
  interchainGasPaymaster: Address
): InterchainGasPaymasterSet {
  let interchainGasPaymasterSetEvent = changetype<InterchainGasPaymasterSet>(
    newMockEvent()
  )

  interchainGasPaymasterSetEvent.parameters = new Array()

  interchainGasPaymasterSetEvent.parameters.push(
    new ethereum.EventParam(
      "interchainGasPaymaster",
      ethereum.Value.fromAddress(interchainGasPaymaster)
    )
  )

  return interchainGasPaymasterSetEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent = changetype<OwnershipTransferred>(
    newMockEvent()
  )

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createRemoteRouterEnrolledEvent(
  domain: BigInt,
  router: Bytes
): RemoteRouterEnrolled {
  let remoteRouterEnrolledEvent = changetype<RemoteRouterEnrolled>(
    newMockEvent()
  )

  remoteRouterEnrolledEvent.parameters = new Array()

  remoteRouterEnrolledEvent.parameters.push(
    new ethereum.EventParam("domain", ethereum.Value.fromUnsignedBigInt(domain))
  )
  remoteRouterEnrolledEvent.parameters.push(
    new ethereum.EventParam("router", ethereum.Value.fromFixedBytes(router))
  )

  return remoteRouterEnrolledEvent
}
