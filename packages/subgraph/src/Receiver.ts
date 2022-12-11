import {
  HTLCERC20WithdrawalInitiated,
  HTLCERC20WithdrawalCompleted,
  HTLCERC20Refunded,
  ERC20MultichainAtomicSwapReceiver,
} from '../generated/ERC20MultichainAtomicSwapReceiver/ERC20MultichainAtomicSwapReceiver'
import { HTLCERC20Receipt } from '../generated/schema'

export function handleHTLCERC20WithdrawalInitiated(event: HTLCERC20WithdrawalInitiated): void {
  let entity = new HTLCERC20Receipt(event.params.htlcId.toHexString())
  let contract = ERC20MultichainAtomicSwapReceiver.bind(event.address)
  let htlc = contract.getHTLC(event.params.htlcId)

  entity.receiver = htlc.getReceiver()
  entity.receiveStatus = 'PENDING'
  entity.save()
}

export function handleHTLCERC20WithdrawalCompleted(event: HTLCERC20WithdrawalCompleted): void {
  let entity = HTLCERC20Receipt.load(event.params.htlcId.toHexString())
  if (entity == null) return

  entity.receiveStatus = 'COMPLETED'
  entity.save()
}

export function handleHTLCERC20Refunded(event: HTLCERC20Refunded): void {
  let entity = HTLCERC20Receipt.load(event.params.htlcId.toHexString())
  if (entity == null) return

  entity.receiveStatus = 'REFUNDED'
  entity.save()
}
