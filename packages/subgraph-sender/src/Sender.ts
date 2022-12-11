import {
  ERC20MultichainAtomicSwapSender,
  HTLCERC20Created as HTLCERC20CreatedEvent,
  HTLCERC20Refunded as HTLCERC20RefundedEvent,
  HTLCERC20Withdrawn as HTLCERC20WithdrawnEvent,
} from '../generated/ERC20MultichainAtomicSwapSender/ERC20MultichainAtomicSwapSender'
import { HTLCERC20 } from '../generated/schema'

export function handleHTLCERC20Created(event: HTLCERC20CreatedEvent): void {
  let entity = new HTLCERC20(event.params.htlcId.toHexString())
  let contract = ERC20MultichainAtomicSwapSender.bind(event.address);
  let htlc = contract.getHTLC(event.params.htlcId);

  entity.sender = htlc.getSender()
  entity.senderAmount = htlc.getSenderAmount();
  entity.senderDomain = contract.getDomain();
  entity.senderToken = htlc.getSenderToken();

  entity.receiver = null;
  entity.receiverDomain = htlc.getReceiverDomain()
  entity.receiverToken = htlc.getReceiverToken()
  entity.receiverAmount = htlc.getReceiverAmount()

  entity.createdAt = event.block.timestamp
  entity.timelock = htlc.getTimelock()

  entity.sendStatus = "PENDING";
  entity.save()
}

export function handleHTLCERC20Refunded(event: HTLCERC20RefundedEvent): void {
  let entity = HTLCERC20.load(event.params.htlcId.toHexString())
  if (entity == null) return;

  entity.sendStatus = "REFUNDED";
  entity.save()
}

export function handleHTLCERC20Withdrawn(event: HTLCERC20WithdrawnEvent): void {
  let entity = HTLCERC20.load(event.params.htlcId.toHexString())
  if (entity == null) return;

  let contract = ERC20MultichainAtomicSwapSender.bind(event.address);
  let htlc = contract.getHTLC(event.params.htlcId);

  entity.receiver = htlc.getReceiver()
  entity.sendStatus = "COMPLETED"
  entity.save()
}
