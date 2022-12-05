// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.8;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import 'hardhat/console.sol';
import './ERC20AtomicSwapSender.sol';

/**
 * Changes the ERC20AtomicSwap contract to define sent and received senderAmounts of token.
 * Checks the senderAmounts before approving the swap.
 */
contract ERC20AtomicSwapReceiver {
  event HTLCERC20WithdrawalInitiated(bytes32 indexed contractId);
  event HTLCERC20WithdrawalCompleted(bytes32 indexed contractId);
  event HTLCERC20Refunded(bytes32 indexed contractId);

  struct CounterContract {
    address senderContract;
    bool confirmed;
    bool refunded;
    address receiver;
  }

  modifier contractExists(bytes32 _contractId) {
    require(haveContract(_contractId), 'contractExists: contractId does not exist');
    _;
  }

  modifier contractNonExistent(bytes32 _contractId) {
    require(!haveContract(_contractId), 'contractNonExistent: contract fulfilled already');
    _;
  }

  mapping(bytes32 => CounterContract) contracts;

  /**
   * @dev Called by the receiver with the tokens they want to swap.
   * This will transfer ownership of the locked tokens to their address.
   * @param _senderContract ERC20AtomicSwapSender contract address
   * @param _counterContractId Id of the HTLC.
   */
  function startWithdrawal(
    address _senderContract,
    bytes32 _counterContractId
  )
    external
    contractNonExistent(_counterContractId)
    returns (bool)
  {
    (
      , , , address receiverToken,
      uint256 receiverAmount,
      address receiverContract,
      uint256 timelock,
      bool withdrawn, ,
    ) = ERC20AtomicSwapSender(_senderContract).getContract(_counterContractId);

    require(receiverContract == address(this), 'startWithdrawal: cannot perform swap from this receiver contract');
    require(withdrawn == false, 'startWithdrawal: already withdrawn');
    require(timelock > block.timestamp, "startWithdrawal: timelock expired");

    require(
      ERC20(receiverToken).allowance(msg.sender, address(this)) >= receiverAmount,
      'startWithdrawal: token allowance must be >= amount'
    );
    
    if (!ERC20(receiverToken).transferFrom(msg.sender, address(this), receiverAmount)) {
      revert('withdraw: transferFrom sender to this failed');
    }

    contracts[_counterContractId] = CounterContract(
      _senderContract,
      false,
      false,
      msg.sender
    );

    ERC20AtomicSwapSender(_senderContract).withdraw(_counterContractId, msg.sender);

    emit HTLCERC20WithdrawalInitiated(_counterContractId);
    return true;
  }

  /**
   * @dev Called by the receiver with the tokens they want to swap.
   * This will transfer ownership of the locked tokens to their address.
   * @param _counterContractId Id of the HTLC.
   */
  function finishWithdrawal(
    bytes32 _counterContractId
  )
    external
    contractExists(_counterContractId)
    returns (bool)
  {
    CounterContract storage c = contracts[_counterContractId];
    require(c.confirmed == false, 'finishWithdrawal: already withdrawn');
    require(c.refunded == false, 'finishWithdrawal: already refunded');

    (
      address sender, , , address receiverToken, uint256 receiverAmount, , , bool withdrawn, ,
    ) = ERC20AtomicSwapSender(c.senderContract).getContract(_counterContractId);

    require(
      sender == msg.sender || c.receiver == msg.sender,
      'finishWithdrawal: can only be called from receiver address');
    require(withdrawn == true, 'finishWithdrawal: withdrawal not finalized');

    ERC20(receiverToken).transfer(sender, receiverAmount);

    c.confirmed = true;

    emit HTLCERC20WithdrawalCompleted(_counterContractId);
    return true;
  }

  /**
   * @dev Called by the sender if there was no withdraw AND the time lock has
   * expired. This will restore ownership of the tokens to the sender.
   *
   * @param _contractId Id of HTLC to refund from.
   * @return bool true on success
   */
  function refund(
    bytes32 _contractId
  )
    external
    contractExists(_contractId)
    returns (bool)
  {
    CounterContract storage c = contracts[_contractId];

    require(c.confirmed == false, 'refundable: already withdrawn');
    require(c.refunded == false, 'refundable: already refunded');
    

    (
      , , , address receiverToken, uint256 receiverAmount,, uint256 timelock, bool withdrawn, ,
    ) = ERC20AtomicSwapSender(c.senderContract).getContract(_contractId);

    require(withdrawn == false, 'refundable: already withdrawn');
    require(timelock <= block.timestamp, 'refundable: timelock not yet passed');

    c.refunded = true;
    ERC20(receiverToken).transfer(c.receiver, receiverAmount);
    emit HTLCERC20Refunded(_contractId);
    return true;
  }

  /**
   * @dev Get contract details.
   * @param _contractId HTLC contract id
   * @return senderContract
   * @return confirmed
   * @return refunded
   * @return receiver
   */
  function getCounterContract(bytes32 _contractId)
    public
    view
    returns (
      address senderContract,
      bool confirmed,
      bool refunded,
      address receiver
    )
  {
    if (haveContract(_contractId) == false) return (address(0), false, false, address(0));
    
    CounterContract storage c = contracts[_contractId];
    return (
      c.senderContract,
      c.confirmed,
      c.refunded,
      c.receiver
    );
  }

  /**
   * @dev Is there a contract with id _contractId.
   * @param _contractId Id into contracts mapping.
   */
  function haveContract(bytes32 _contractId) internal view returns (bool exists) {
    exists = (contracts[_contractId].senderContract != address(0));
  }
}
