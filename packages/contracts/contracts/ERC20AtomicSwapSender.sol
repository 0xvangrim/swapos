// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.8;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import 'hardhat/console.sol';

/**
 * Splits the ERC20AtomicSwap to be able to communicate with another instance of itself.
 */
contract ERC20AtomicSwapSender {
  event HTLCERC20Created(
    bytes32 indexed contractId,
    address indexed sender,
    address senderToken,
    address receiverToken,
    address receiverContract
  );
  event HTLCERC20Withdrawn(bytes32 indexed contractId);
  event HTLCERC20Refunded(bytes32 indexed contractId);

  struct LockContract {
    address sender;
    address senderToken;
    uint256 senderAmount;
    address receiverToken;
    uint256 receiverAmount;
    address receiverContract;
    // locked UNTIL this time. Unit depends on consensus algorithm.
    // PoA, PoA and IBFT all use seconds. But Quorum Raft uses nano-seconds
    uint256 timelock;
    bool withdrawn;
    bool refunded;
    address receiver;
  }

  modifier tokensTransferable(
    address _token,
    address _sender,
    uint256 _amount
  ) {
    require(_amount > 0, 'tokensTransferable: token amount must be > 0');
    require(
      ERC20(_token).allowance(_sender, address(this)) >= _amount,
      'tokensTransferable: token allowance must be >= amount'
    );
    _;
  }

  modifier futureTimelock(uint256 _timelock) {
    // only requirement is the timelock time is after the last blocktime (now).
    // probably want something a bit further in the future then this.
    // but this is still a useful sanity check:
    require(_timelock > block.timestamp, 'futureTimelock: timelock time must be in the future');
    _;
  }

  modifier contractExists(bytes32 _contractId) {
    require(haveContract(_contractId), 'contractExists: contractId does not exist');
    _;
  }

  modifier withdrawable(bytes32 _contractId) {
    require(contracts[_contractId].withdrawn == false, 'withdrawable: already withdrawn');
    // This check needs to be added if claims are allowed after timeout. That is, if the following timelock check is commented out
    // require(contracts[_contractId].refunded == false, 'withdrawable: already refunded');
    // if we want to disallow claim to be made after the timeout, uncomment the following line
    require(contracts[_contractId].timelock > block.timestamp, "withdrawable: timelock expired");
    _;
  }

  modifier refundable(bytes32 _contractId) {
    require(contracts[_contractId].sender == msg.sender, 'refundable: not sender');
    require(contracts[_contractId].refunded == false, 'refundable: already refunded');
    require(contracts[_contractId].withdrawn == false, 'refundable: already withdrawn');
    require(
      contracts[_contractId].timelock <= block.timestamp,
      'refundable: timelock not yet passed'
    );
    _;
  }

  mapping(bytes32 => LockContract) contracts;

  /**
   * @dev Sender / Payer sets up a new hash time lock contract depositing the
   * funds and providing the reciever and terms.
   *
   * NOTE: _receiver must first call approve() on the token contract.
   *       See allowance check in tokensTransferable modifier.
   * @param _timelock UNIX epoch seconds time that the lock expires at.
   *                  Refunds can be made after this time.
   * @param _senderToken ERC20 Token contract address the sender wants to swap.
   * @param _senderAmount Amount of the token to lock up by the sender.
   * @return contractId Id of the new HTLC. This is needed for subsequent
   *                    calls.
   * @param _receiverToken ERC20 Token contract address the receiver should send.
   * @param _senderAmount rAmount of the token to lock up by the receiver.
   */
  function newContract(
    uint256 _timelock,
    address _senderToken,
    uint256 _senderAmount,
    address _receiverToken,
    uint256 _receiverAmount,
    address _receiverContract
  )
    external
    tokensTransferable(_senderToken, msg.sender, _senderAmount)
    futureTimelock(_timelock)
    returns (bytes32 contractId)
  {
    require(_receiverAmount > 0, 'newContract: token amount must be > 0');

    contractId = sha256(
      abi.encodePacked(msg.sender, _timelock, _senderToken, _senderAmount, _receiverToken, _receiverAmount, _receiverContract)
    );

    // Reject if a contract already exists with the same parameters. The
    // sender must change one of these parameters.
    if (haveContract(contractId)) revert('newContract: Contract already exists');

    // This contract becomes the temporary owner of the tokens
    if (!ERC20(_senderToken).transferFrom(msg.sender, address(this), _senderAmount))
      revert('transferFrom sender to this failed');

    contracts[contractId] = LockContract(
      msg.sender,
      _senderToken,
      _senderAmount,
      _receiverToken,
      _receiverAmount,
      _receiverContract,
      _timelock,
      false,
      false,
      address(0x0)
    );

    emit HTLCERC20Created(
      contractId,
      msg.sender,
      _senderToken,
      _receiverToken,
      _receiverContract
    );
  }

  /**
   * @dev Called by the receiver with the tokens they want to swap.
   * This will transfer ownership of the locked tokens to their address.
   *
   * @param _contractId Id of the HTLC.
   */
  function withdraw(
    bytes32 _contractId,
    address receiver
  )
    external
    contractExists(_contractId)
    withdrawable(_contractId)
    returns (bool)
  {
    LockContract storage c = contracts[_contractId];

    require(c.receiverContract == msg.sender, 'withdraw: must be called by the receiver contract');

    c.receiver = receiver;
    c.withdrawn = true;
    ERC20(c.senderToken).transfer(receiver, c.senderAmount);
    
    emit HTLCERC20Withdrawn(_contractId);
    return true;
  }

  /**
   * @dev Called by the sender if there was no withdraw AND the time lock has
   * expired. This will restore ownership of the tokens to the sender.
   *
   * @param _contractId Id of HTLC to refund from.
   * @return bool true on success
   */
  function refund(bytes32 _contractId)
    external
    contractExists(_contractId)
    refundable(_contractId)
    returns (bool)
  {
    LockContract storage c = contracts[_contractId];
    c.refunded = true;
    ERC20(c.senderToken).transfer(c.sender, c.senderAmount);
    emit HTLCERC20Refunded(_contractId);
    return true;
  }

  /**
   * @dev Get contract details.
   * @param _contractId HTLC contract id
   * @return sender
   * @return senderToken
   * @return senderAmount
   * @return receiverToken
   * @return receiverAmount
   * @return receiverContract
   * @return timelock
   * @return withdrawn
   * @return refunded
   * @return receiver
   */
  function getContract(bytes32 _contractId)
    public
    view
    returns (
      address sender,
      address senderToken,
      uint256 senderAmount,
      address receiverToken,
      uint256 receiverAmount,
      address receiverContract,
      uint256 timelock,
      bool withdrawn,
      bool refunded,
      address receiver
    )
  {
    if (haveContract(_contractId) == false)
      return (address(0), address(0), 0, address(0), 0, address(0), 0, false, false, address(0));
    LockContract storage c = contracts[_contractId];
    return (
      c.sender,
      c.senderToken,
      c.senderAmount,
      c.receiverToken,
      c.receiverAmount,
      c.receiverContract,
      c.timelock,
      c.withdrawn,
      c.refunded,
      c.receiver
    );
  }

  /**
   * @dev Is there a contract with id _contractId.
   * @param _contractId Id into contracts mapping.
   */
  function haveContract(bytes32 _contractId) internal view returns (bool exists) {
    exists = (contracts[_contractId].sender != address(0));
  }
}
